#!/usr/bin/env python3
"""
update_scb_monthly.py:
Automatisk SCB-uppdaterare för månatlig och årlig befolkningsstatistik.

1. TAB6471: Hämtar senast fastställda månadsdata från SCB:s PxWebApi v2,
   sparar i data/scb_latest_monthly.json och beräknar tillväxttakt för realtidsmotorn.
2. TAB4365: Hämtar årliga befolkningsförändringar (Födda, Döda, Invandring, Utvandring)
   från 1860 till senaste år och sparar i data/scb_events_1860_2025.json samt
   mergar in i data/glasburken_data.json.
"""

import sys
import json
import calendar
import datetime
import urllib.request
import urllib.error
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"
OUTPUT_MONTHLY_FILE = DATA_DIR / "scb_latest_monthly.json"
OUTPUT_EVENTS_FILE = DATA_DIR / "scb_events_1860_2025.json"
GLASBURKEN_DATA_FILE = DATA_DIR / "glasburken_data.json"

SCB_MONTHLY_API_URL = "https://statistikdatabasen.scb.se/api/v2/tables/TAB6471/data"
SCB_EVENTS_API_URL = "https://statistikdatabasen.scb.se/api/v2/tables/TAB4365/data"

SV_MONTH_NAMES = [
    "", "januari", "februari", "mars", "april", "maj", "juni",
    "juli", "augusti", "september", "oktober", "november", "december"
]

def fetch_scb_monthly_data():
    """Hämtar rikstotalen per månad från SCB TAB6471 via PxWebApi v2."""
    query = {
        "selection": [
            {"variableCode": "Region", "valueCodes": ["00"]},         # 00 = Riket
            {"variableCode": "Alder", "valueCodes": ["TotSA"]},       # Totalt alla åldrar
            {"variableCode": "Kon", "valueCodes": ["TotSa"]},         # Totalt samtliga kön
            {"variableCode": "ContentsCode", "valueCodes": ["000007SF"]}, # Folkmängd per månad
            {"variableCode": "Tid", "valueCodes": ["*"]}             # Samtliga månader
        ]
    }
    req = urllib.request.Request(
        SCB_MONTHLY_API_URL,
        data=json.dumps(query).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "User-Agent": "Glasburken/1.0 (https://github.com/martin/glasburken)"
        }
    )

    print(f"📡 Anropar SCB månadstotal TAB6471 ({SCB_MONTHLY_API_URL})...")
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))

def process_scb_monthly_response(scb_json):
    """Bearbetar JSON-Stat2 svaret från SCB för månadstal och skapar strukturerad metadata."""
    time_dim = scb_json.get("dimension", {}).get("Tid", {}).get("category", {}).get("index", {})
    values = scb_json.get("value", [])

    if not time_dim or not values:
        raise ValueError("Inget giltigt tids- eller värdeindex returnerades från SCB TAB6471.")

    sorted_months = sorted(time_dim.items(), key=lambda x: x[1])

    monthly_series = {}
    for m_code, idx in sorted_months:
        monthly_series[m_code] = values[idx]

    latest_code, _ = sorted_months[-1]
    latest_pop = monthly_series[latest_code]

    year_str, month_str = latest_code.split("M")
    year = int(year_str)
    month = int(month_str)

    last_day = calendar.monthrange(year, month)[1]
    month_end_date = f"{year:04d}-{month:02d}-{last_day:02d}T23:59:59Z"
    month_display = f"{SV_MONTH_NAMES[month]} {year}"

    target_year = year
    target_pop = 10626026  # Standard för 2026
    if GLASBURKEN_DATA_FILE.exists():
        try:
            with open(GLASBURKEN_DATA_FILE, "r", encoding="utf-8") as gf:
                gd = json.load(gf)
                if str(target_year) in gd.get("projections", {}):
                    target_pop = gd["projections"][str(target_year)]["total"]
                elif str(target_year) in gd.get("history", {}):
                    target_pop = gd["history"][str(target_year)]["total"]
        except Exception as e:
            print(f"⚠️ Kunde ej läsa target_pop från glasburken_data.json: {e}")

    target_end_date = f"{target_year:04d}-12-31T23:59:59Z"

    dt_base = datetime.datetime(year, month, last_day, 23, 59, 59, tzinfo=datetime.timezone.utc)
    dt_target = datetime.datetime(target_year, 12, 31, 23, 59, 59, tzinfo=datetime.timezone.utc)
    total_sec = max(1.0, (dt_target - dt_base).total_seconds())
    delta_pop = target_pop - latest_pop
    growth_per_sec = delta_pop / total_sec

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    elapsed_sec = max(0.0, (now_utc - dt_base).total_seconds())
    calc_now = round(latest_pop + elapsed_sec * growth_per_sec)

    return {
        "tableId": "TAB6471",
        "tableName": "Folkmängden per månad efter region, ålder och kön",
        "source": "Statistiska centralbyrån (SCB) PxWebApi v2",
        "scbUpdated": scb_json.get("updated"),
        "fetchedAt": now_utc.isoformat(),
        "latestMonth": {
            "code": latest_code,
            "year": year,
            "month": month,
            "name": month_display,
            "endDate": month_end_date,
            "population": latest_pop
        },
        "projectionTarget": {
            "year": target_year,
            "endDate": target_end_date,
            "population": target_pop,
            "growthPerSecond": growth_per_sec,
            "personsPerDay": growth_per_sec * 86400
        },
        "estimatedAtFetch": {
            "timestamp": now_utc.isoformat(),
            "population": calc_now
        },
        "monthlySeries": monthly_series
    }

def fetch_scb_annual_events():
    """Hämtar historiska och aktuella händelser (Födda, Döda, Invandring, Utvandring) från TAB4365."""
    query = {
        "selection": [
            {"variableCode": "Kon", "valueCodes": ["1+2"]},  # Samtliga kön
            {"variableCode": "ContentsCode", "valueCodes": [
                "0000001H",  # Födda
                "0000001F",  # Döda
                "000000LX",  # Invandring
                "0000001G"   # Utvandring
            ]},
            {"variableCode": "Tid", "valueCodes": ["*"]}     # Alla tillgängliga år
        ]
    }
    req = urllib.request.Request(
        SCB_EVENTS_API_URL,
        data=json.dumps(query).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "User-Agent": "Glasburken/1.0 (https://github.com/martin/glasburken)"
        }
    )

    print(f"📡 Anropar SCB årshändelser TAB4365 ({SCB_EVENTS_API_URL})...")
    with urllib.request.urlopen(req, timeout=25) as resp:
        return json.loads(resp.read().decode("utf-8"))

def process_scb_events_response(events_json):
    """Bearbetar JSON-Stat2 svaret från SCB TAB4365 för årliga födda, döda och migration."""
    sizes = events_json.get("size", [])
    if len(sizes) < 3:
        raise ValueError("Oväntad dimensionsstruktur i SCB TAB4365.")

    cc_cat = events_json.get("dimension", {}).get("ContentsCode", {}).get("category", {}).get("index", {})
    tid_cat = events_json.get("dimension", {}).get("Tid", {}).get("category", {}).get("index", {})
    values = events_json.get("value", [])

    len_kon = sizes[0]
    len_cc = sizes[1]
    len_tid = sizes[2]

    code_map = {
        "0000001H": "births",
        "0000001F": "deaths",
        "000000LX": "immigrants",
        "0000001G": "emigrants"
    }

    events = {}
    for y_str, t_idx in tid_cat.items():
        try:
            y = int(y_str)
        except ValueError:
            continue
        if y < 1860:
            continue
        
        ev = {"births": 0, "deaths": 0, "immigrants": 0, "emigrants": 0}
        for code, field in code_map.items():
            if code in cc_cat:
                c_idx = cc_cat[code]
                flat_idx = 0 * (len_cc * len_tid) + c_idx * len_tid + t_idx
                if flat_idx < len(values):
                    val = values[flat_idx]
                    ev[field] = int(val) if val is not None else 0
        
        ev["netMigration"] = ev["immigrants"] - ev["emigrants"]
        ev["naturalGrowth"] = ev["births"] - ev["deaths"]
        ev["totalGrowth"] = ev["naturalGrowth"] + ev["netMigration"]
        events[y_str] = ev

    return events

def update_glasburken_data(annual_events, monthly_result):
    """Mergar in uppdaterade händelser i glasburken_data.json."""
    if not GLASBURKEN_DATA_FILE.exists():
        print(f"⚠️ {GLASBURKEN_DATA_FILE} hittades inte, hoppar över sammanslagning.")
        return

    try:
        with open(GLASBURKEN_DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

        data["annualEvents"] = annual_events

        # Uppdatera events i history för matchande år
        history = data.get("history", {})
        merged_count = 0
        for y_str, ev in annual_events.items():
            if y_str in history:
                history[y_str]["events"] = ev
                merged_count += 1

        # Uppdatera tidsstämpel i metadata
        if "metadata" in data:
            data["metadata"]["lastScbSync"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
            if monthly_result and "latestMonth" in monthly_result:
                data["metadata"]["latestScbMonth"] = monthly_result["latestMonth"]["code"]

        with open(GLASBURKEN_DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)

        print(f"✅ Mergade årliga händelser in i {GLASBURKEN_DATA_FILE} ({merged_count} historiska år).")
    except Exception as e:
        print(f"⚠️ Fel vid uppdatering av glasburken_data.json: {e}")

def main():
    print("=" * 60)
    print("🚀 Glasburken — SCB Befolknings- & Händelseuppdaterare")
    print("=" * 60)

    monthly_result = None
    annual_events = None

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # 1. TAB6471: Månatlig befolkningsmängd
    try:
        scb_monthly_json = fetch_scb_monthly_data()
        monthly_result = process_scb_monthly_response(scb_monthly_json)

        with open(OUTPUT_MONTHLY_FILE, "w", encoding="utf-8") as f:
            json.dump(monthly_result, f, indent=2, ensure_ascii=False)

        latest = monthly_result["latestMonth"]
        target = monthly_result["projectionTarget"]
        est = monthly_result["estimatedAtFetch"]

        print(f"✅ Sparade månadsprofil i: {OUTPUT_MONTHLY_FILE}")
        print(f"📌 Senaste SCB-månad:       {latest['name']} ({latest['code']}): {latest['population']:,} invånare".replace(",", " "))
        print(f"🎯 Årsslutsmål {target['year']}:         {target['population']:,} invånare".replace(",", " "))
        print(f"📈 Beräknad tillväxttakt:     +{target['personsPerDay']:.1f} personer/dygn")
        print(f"⏱️  Beräknad befolkning nu:    {est['population']:,} invånare".replace(",", " "))
        print("-" * 60)
    except Exception as me:
        print(f"❌ Fel vid månadsuppdatering (TAB6471): {me}", file=sys.stderr)

    # 2. TAB4365: Årliga födslar, dödsfall och migration
    try:
        scb_events_json = fetch_scb_annual_events()
        annual_events = process_scb_events_response(scb_events_json)

        with open(OUTPUT_EVENTS_FILE, "w", encoding="utf-8") as f:
            json.dump(annual_events, f, indent=2, ensure_ascii=False)

        latest_year = max(annual_events.keys(), key=lambda x: int(x))
        lev = annual_events[latest_year]
        print(f"✅ Sparade {len(annual_events)} års demografiska händelser i: {OUTPUT_EVENTS_FILE}")
        print(f"📌 Senaste fastställda år {latest_year}:")
        print(f"   👶 Födda:      {lev['births']:,}".replace(",", " "))
        print(f"   🕊️  Döda:       {lev['deaths']:,}".replace(",", " "))
        print(f"   🧳 Invandring: {lev['immigrants']:,}".replace(",", " "))
        print(f"   ⛵ Utvandring: {lev['emigrants']:,}".replace(",", " "))
        print(f"   ⚖️  Nettomigr.: {lev['netMigration']:+,}".replace(",", " "))
        print(f"   📈 Totalökning: {lev['totalGrowth']:+,}".replace(",", " "))
        print("-" * 60)
    except Exception as ee:
        print(f"❌ Fel vid årshändelseuppdatering (TAB4365): {ee}", file=sys.stderr)

    # 3. Merga in i glasburken_data.json
    if annual_events:
        update_glasburken_data(annual_events, monthly_result)

    print("=" * 60)
    print("✨ Alla SCB-källor synkroniserade!")
    print("=" * 60)

if __name__ == "__main__":
    main()
