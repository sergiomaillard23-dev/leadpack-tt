# src/processor.py
# Accepts a JSON payload, validates it, inserts lead into DB
# Run: python src/processor.py
# n8n: Execute Command node → python /app/src/processor.py

import os, json, sys, psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def insert_lead(conn, payload):
    """Idempotent: skips duplicate phone numbers."""
    fact_find = payload.get("fact_find", {})
    
    with conn.cursor() as cur:
        # Check for duplicate by phone in fact_find
        phone = fact_find.get("phone") or payload.get("phone")
        if phone:
            cur.execute(
                "SELECT id FROM leads WHERE fact_find->>'phone' = %s",
                (phone,)
            )
            existing = cur.fetchone()
            if existing:
                return {"status": "duplicate", "lead_id": str(existing[0])}

        cur.execute(
            """INSERT INTO leads
               (source, status, max_purchases, income_bracket, intent_niche, fact_find, is_legendary)
               VALUES (%s, 'pending', %s, %s, %s, %s, %s)
               RETURNING id""",
            (
                payload.get("source", "unknown"),
                1 if payload.get("purchase_type") == "exclusive" else 3,
                payload.get("income_bracket"),
                payload.get("intent_niche"),
                json.dumps(fact_find),
                payload.get("is_legendary", False)
            )
        )
        lead_id = cur.fetchone()[0]
        conn.commit()
        return {"status": "created", "lead_id": str(lead_id)}

def get_pending_count(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM leads WHERE status='pending'")
        return cur.fetchone()[0]

if __name__ == "__main__":
    # Read payload from stdin (n8n pipes JSON in)
    raw = sys.stdin.read()
    payload = json.loads(raw) if raw.strip() else {}

    conn = get_conn()
    result = insert_lead(conn, payload)
    result["pending_count"] = get_pending_count(conn)
    print(json.dumps(result))
    conn.close()