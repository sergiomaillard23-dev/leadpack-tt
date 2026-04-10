# src/pack_engine.py
# Run: python src/pack_engine.py
# n8n: Execute Command node → python /app/src/pack_engine.py
#
# Fires when the pending lead pool reaches TRIGGER_THRESHOLD (20).
# Creates one lead_batch, then 3 sibling packs (A/B/C).
# Pack leads are linked via the pack_leads join table:
#   STANDARD  (A) → first 5 leads  TT$150    up to 3 buyers
#   PREMIUM   (B) → all 20 leads   TT$600    up to 2 buyers
#   LEGENDARY (C) → all 20 leads   TT$2,000  1 buyer, Pro only

import os, json, psycopg2
from dotenv import load_dotenv

load_dotenv()

TRIGGER_THRESHOLD = 20

PACK_TIERS = [
    {
        "label":      "A",
        "pack_name":  "STANDARD",
        "pack_type":  "COMMUNITY",
        "pack_size":  5,
        "price_ttd":  15000,    # TT$150.00
        "max_buyers": 3,
    },
    {
        "label":      "B",
        "pack_name":  "PREMIUM",
        "pack_type":  "COMMUNITY",
        "pack_size":  20,
        "price_ttd":  60000,    # TT$600.00
        "max_buyers": 2,
    },
    {
        "label":      "C",
        "pack_name":  "LEGENDARY",
        "pack_type":  "EXCLUSIVE",
        "pack_size":  20,
        "price_ttd":  200000,   # TT$2,000.00
        "max_buyers": 1,
    },
]

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def generate_packs(conn):
    """
    Idempotent: only fires when pending pool >= TRIGGER_THRESHOLD.

    Creates one lead_batch record, links all 20 leads to it via lead_batch_id,
    then creates 3 sibling packs (A, B, C) and populates pack_leads:
      - STANDARD  gets the first 5 leads (pack_size=5)
      - PREMIUM   gets all 20 leads      (pack_size=20)
      - LEGENDARY gets all 20 leads      (pack_size=20)
    """
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, is_legendary FROM leads WHERE status='pending' ORDER BY created_at LIMIT %s",
            (TRIGGER_THRESHOLD,)
        )
        rows = cur.fetchall()

        if len(rows) < TRIGGER_THRESHOLD:
            return {"status": "insufficient", "count": len(rows)}

        lead_ids    = [str(r[0]) for r in rows]
        income_tier = 'LEGENDARY' if any(r[1] for r in rows) else 'STANDARD'

        # Create the batch record
        cur.execute(
            "INSERT INTO lead_batches (income_tier) VALUES (%s) RETURNING id",
            (income_tier,)
        )
        batch_id = str(cur.fetchone()[0])

        # Link all 20 leads to this batch and move them out of the pending pool
        cur.execute(
            "UPDATE leads SET lead_batch_id = %s, status = 'in_pack' WHERE id = ANY(%s::uuid[])",
            (batch_id, lead_ids)
        )

        # Create 3 sibling packs and populate pack_leads for each
        packs_created = []
        for tier in PACK_TIERS:
            cur.execute(
                """
                INSERT INTO packs
                  (pack_label, pack_name, pack_type, pack_size,
                   price_ttd, max_buyers, lead_batch_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    tier["label"],
                    tier["pack_name"],
                    tier["pack_type"],
                    tier["pack_size"],
                    tier["price_ttd"],
                    tier["max_buyers"],
                    batch_id,
                )
            )
            pack_id = str(cur.fetchone()[0])

            # Link leads to this pack — STANDARD gets first 5, others get all 20
            leads_for_pack = lead_ids[:tier["pack_size"]]
            for position, lead_id in enumerate(leads_for_pack):
                cur.execute(
                    "INSERT INTO pack_leads (pack_id, lead_id, position) VALUES (%s, %s, %s)",
                    (pack_id, lead_id, position)
                )

            packs_created.append({
                "pack_id":    pack_id,
                "label":      tier["label"],
                "pack_name":  tier["pack_name"],
                "lead_count": len(leads_for_pack),
            })

        conn.commit()
        return {
            "status":      "packs_created",
            "batch_id":    batch_id,
            "income_tier": income_tier,
            "packs":       packs_created,
        }

if __name__ == "__main__":
    conn = get_conn()
    result = generate_packs(conn)
    print(json.dumps(result))
    conn.close()
