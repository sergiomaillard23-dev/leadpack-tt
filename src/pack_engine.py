# src/pack_engine.py
# Run: python src/pack_engine.py
# n8n: Execute Command node → python /app/src/pack_engine.py

import os, json, psycopg2
from dotenv import load_dotenv

load_dotenv()

PACK_LABELS       = ['A', 'B', 'C']
LEADS_PER_PACK    = 5
TRIGGER_THRESHOLD = 20

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def generate_packs(conn):
    """Idempotent: only fires when pending pool >= 20."""
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id FROM leads WHERE status='pending' ORDER BY created_at LIMIT %s",
            (TRIGGER_THRESHOLD,)
        )
        pending = [r[0] for r in cur.fetchall()]

        if len(pending) < TRIGGER_THRESHOLD:
            return {"status": "insufficient", "count": len(pending)}

        cur.execute("SELECT COALESCE(MAX(generation_batch), 0) + 1 FROM packs")
        batch = cur.fetchone()[0]
        packs_created = []

        for i, label in enumerate(PACK_LABELS):
            chunk = pending[i * LEADS_PER_PACK : (i + 1) * LEADS_PER_PACK]
            cur.execute(
                "INSERT INTO packs (pack_label, generation_batch) VALUES (%s, %s) RETURNING id",
                (label, batch)
            )
            pack_id = cur.fetchone()[0]
            for pos, lead_id in enumerate(chunk):
                cur.execute(
                    "INSERT INTO pack_leads VALUES (%s, %s, %s)",
                    (pack_id, lead_id, pos)
                )
                cur.execute(
                    "UPDATE leads SET status='in_pack' WHERE id=%s",
                    (lead_id,)
                )
            packs_created.append({"pack_id": str(pack_id), "label": label})

        conn.commit()
        return {"status": "packs_created", "batch": batch, "packs": packs_created}

if __name__ == "__main__":
    conn = get_conn()
    result = generate_packs(conn)
    print(json.dumps(result))
    conn.close()