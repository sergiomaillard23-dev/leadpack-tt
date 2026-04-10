#!/usr/bin/env python3
"""
import_excel_leads.py
Idempotent script to import Excel leads into the Railway Postgres leads table.

Usage:
    python3 src/import_excel_leads.py --file path/to/leads.xlsx --dry-run
    python3 src/import_excel_leads.py --file path/to/leads.xlsx

Requirements:
    pip install openpyxl psycopg2-binary python-dotenv

Input Excel columns expected (case-insensitive):
    First Name, Last Name, Phone, Parish, Monthly Income, Employer Type, Age, Source

Each lead is scored using the OVR engine rules and inserted with calculated_ovr.
Idempotent: skips rows where phone already exists in the DB.

DO NOT RUN until:
  1. Migration 010 is applied on Railway (adds lead_stats + calculated_ovr columns)
  2. A lead_batch_id exists to associate these leads with (create a batch first)
"""

import argparse
import os
import re
import sys
from datetime import datetime, timezone

try:
    import openpyxl
    import psycopg2
    from dotenv import load_dotenv
except ImportError:
    print("Missing dependencies. Run: pip install openpyxl psycopg2-binary python-dotenv")
    sys.exit(1)

load_dotenv()

# ── OVR scoring (mirrors web/lib/utils/scoring.ts) ────────────────────────────

LEGENDARY_OVR_THRESHOLD = 90
GOLD_OVR_THRESHOLD      = 80
SILVER_OVR_THRESHOLD    = 70

PHONE_RE = re.compile(r'^1-868-\d{3}-\d{4}$')

def calc_frh(hours: float) -> int:
    if hours < 2:   return 100
    if hours < 4:   return 90
    if hours < 12:  return 75
    if hours < 24:  return 60
    if hours < 48:  return 45
    return 30

def calc_int(source: str) -> int:
    s = source.lower()
    if s == 'quote_request':    return 95
    if s == 'eligibility_quiz': return 80
    if s == 'fb_ad':            return 65
    if s == 'pdf_download':     return 55
    return 50

def calc_loc(parish: str) -> int:
    tier1 = ['westmoorings', 'valsayn', 'fairways', 'palmiste', 'glencoe', 'moka', 'long circular']
    tier2 = ['chaguanas', 'san fernando', 'diego martin', 'maraval', 'st clair', 'newtown']
    p = parish.lower()
    if any(t in p for t in tier1): return 100
    if any(t in p for t in tier2): return 85
    return 60

def calc_fin(income: int) -> int:
    if income >= 25000: return 100
    if income >= 15000: return 85
    if income >= 8000:  return 70
    return 50

def calc_sta(employer_type: str) -> int:
    e = employer_type.lower()
    if 'government' in e or 'public sector' in e: return 95
    if 'medical' in e or 'legal' in e or 'doctor' in e: return 90
    if 'private' in e: return 80
    if 'self' in e:    return 75
    return 55

def calc_fit(age: int) -> int:
    if 30 <= age <= 45: return 100
    if 46 <= age <= 60: return 85
    if 21 <= age <= 29: return 80
    return 55

def calculate_ovr(parish: str, source: str, income: int, employer_type: str, age: int) -> tuple[int, dict]:
    # Historical leads are at least 48h old
    frh = calc_frh(48)
    int_ = calc_int(source)
    loc  = calc_loc(parish)
    fin  = calc_fin(income)
    sta  = calc_sta(employer_type)
    fit  = calc_fit(age)

    stats = {'frh': frh, 'int': int_, 'loc': loc, 'fin': fin, 'sta': sta, 'fit': fit}
    avg   = round(sum(stats.values()) / 6)

    # Apply legendary gate
    if avg >= LEGENDARY_OVR_THRESHOLD and (fin < 90 or frh < 90):
        avg = LEGENDARY_OVR_THRESHOLD - 1

    return avg, stats

# ── Column normaliser ──────────────────────────────────────────────────────────

COLUMN_MAP = {
    'first name':      'first_name',
    'last name':       'last_name',
    'phone':           'phone',
    'parish':          'parish',
    'monthly income':  'monthly_income',
    'employer type':   'employer_type',
    'age':             'age',
    'source':          'source',
}

def normalise_headers(row) -> dict[str, int]:
    return {
        COLUMN_MAP[str(cell.value).strip().lower()]: i
        for i, cell in enumerate(row)
        if cell.value and str(cell.value).strip().lower() in COLUMN_MAP
    }

# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='Import Excel leads into Railway Postgres')
    parser.add_argument('--file',         required=True, help='Path to the .xlsx file')
    parser.add_argument('--lead-batch-id', required=True, help='UUID of the lead_batch_id to associate leads with')
    parser.add_argument('--dry-run',      action='store_true', help='Print rows without inserting')
    args = parser.parse_args()

    db_url = os.environ.get('DATABASE_URL')
    if not db_url and not args.dry_run:
        print("ERROR: DATABASE_URL not set in environment.")
        sys.exit(1)

    wb = openpyxl.load_workbook(args.file, read_only=True, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows())

    if not rows:
        print("Spreadsheet is empty.")
        sys.exit(1)

    headers = normalise_headers(rows[0])
    required = {'first_name', 'last_name', 'phone', 'parish', 'monthly_income', 'employer_type', 'age', 'source'}
    missing  = required - set(headers.keys())
    if missing:
        print(f"ERROR: Missing columns: {', '.join(missing)}")
        sys.exit(1)

    conn = psycopg2.connect(db_url) if not args.dry_run else None
    cur  = conn.cursor() if conn else None

    inserted = skipped = errors = 0

    for i, row in enumerate(rows[1:], start=2):
        cells = [c.value for c in row]

        try:
            first_name    = str(cells[headers['first_name']] or '').strip()
            last_name     = str(cells[headers['last_name']]  or '').strip()
            phone         = str(cells[headers['phone']]      or '').strip()
            parish        = str(cells[headers['parish']]     or '').strip()
            monthly_income = int(cells[headers['monthly_income']] or 0)
            employer_type = str(cells[headers['employer_type']] or '').strip()
            age           = int(cells[headers['age']]         or 0)
            source        = str(cells[headers['source']]      or '').strip().upper()
        except (ValueError, TypeError) as e:
            print(f"Row {i}: parse error — {e}")
            errors += 1
            continue

        if not PHONE_RE.match(phone):
            print(f"Row {i}: invalid phone '{phone}' — skipping")
            errors += 1
            continue

        ovr, stats = calculate_ovr(parish, source, monthly_income, employer_type, age)

        if args.dry_run:
            print(f"Row {i}: {first_name} {last_name} | {phone} | OVR {ovr} | {parish}")
            inserted += 1
            continue

        try:
            # Idempotency: check by phone stored in fact_find JSONB
            cur.execute("SELECT id FROM leads WHERE fact_find->>'phone' = %s", (phone,))
            if cur.fetchone():
                skipped += 1
                continue

            import json, uuid
            fact_find = {
                'first_name':    first_name,
                'last_name':     last_name,
                'phone':         phone,
                'parish':        parish,
                'monthly_income': monthly_income,
                'employer_type': employer_type,
                'age':           age,
                'intent_source': source.lower(),
            }
            is_legendary = monthly_income >= 25000 and ovr >= LEGENDARY_OVR_THRESHOLD
            cur.execute("""
                INSERT INTO leads (
                    id, lead_batch_id, source, income_bracket, is_legendary,
                    fact_find, calculated_ovr, lead_stats, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                str(uuid.uuid4()),
                args.lead_batch_id,
                source,
                f"{monthly_income:,}",
                is_legendary,
                json.dumps(fact_find),
                ovr,
                json.dumps(stats),
                datetime.now(timezone.utc),
            ))
            inserted += 1
        except psycopg2.Error as e:
            print(f"Row {i}: DB error — {e}")
            errors += 1

    if conn:
        conn.commit()
        conn.close()

    print(f"\nDone. Inserted: {inserted} | Skipped (duplicate phone): {skipped} | Errors: {errors}")

if __name__ == '__main__':
    main()
