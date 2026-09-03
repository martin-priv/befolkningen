#!/usr/bin/env python3
"""
update_scb_monthly.py:
Automatisk SCB-uppdaterare för månatlig befolkningsstatistik (TAB6471).

Hämtar senast fastställda månadsdata från SCB:s PxWebApi v2,
sparar i data/scb_latest_monthly.json och beräknar tillväxttakt för realtidsmotorn.
"""

import sys
import json
import calendar
import datetime
import urllib.request
import urllib.error
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"
OUTPUT_FILE = DATA_DIR / "scb_latest_monthly.json"
SCB_API_URL = "https://statistikdatabasen.scb.se/api/v2/tables/TAB6471/data"

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
        SCB_API_URL,
        data=json.dumps(query).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "User-Agent": "Glasburken/1.0 (https://github.com/martin/glasburken)"
        }
    )

    print(f"📡 Anropar SCB PxWebApi v2 ({SCB_API_URL})...")
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))

def process_scb_response(scb_json):
    """Bearbetar JSON-Stat2 svaret från SCB och skapar strukturerad metadata."""
    time_dim = scb_json.get("dimension", {}).get("Tid", {}).get("category", {}).get("index", {})
    values = scb_json.get("value", [])

    if not time_dim or not values:
        raise ValueError("Inget giltigt tids- eller värdeindex returnerades från SCB.")

    # Sortera kronologiskt efter tidsindex
    sorted_months = sorted(time_dim.items(), key=lambda x: x[1])

    monthly_series = {}
    for m_code, idx in sorted_months:
        monthly_series[m_code] = values[idx]

    latest_code, _ = sorted_months[-1]
    latest_pop = monthly_series[latest_code]

    # Dela upp t.ex. "2026M06"
    year_str, month_str = latest_code.split("M")
    year = int(year_str)
    month = int(month_str)

    # Sista sekunden för månaden
    last_day = calendar.monthrange(year, month)[1]
    month_end_date = f"{year:04d}-{month:02d}-{last_day:02d}T23:59:59Z"
    month_display = f"{SV_MONTH_NAMES[month]} {year}"

    # Hämta officiell årsprognos för årsslutet om tillgänglig i glasburken_data.json
    target_year = year
    target_pop = 10626026  # Standard för 2026
    glasburken_data_file = DATA_DIR / "glasburken_data.json"
    if glasburken_data_file.exists():
        try:
            with open(glasburken_data_file, "r", encoding="utf-8") as gf:
                gd = json.load(gf)
                if str(target_year) in gd.get("projections", {}):
                    target_pop = gd["projections"][str(target_year)]["total"]
                elif str(target_year) in gd.get("history", {}):
                    target_pop = gd["history"][str(target_year)]["total"]
        except Exception as e:
            print(f"⚠️ Kunde ej läsa target_pop från glasburken_data.json: {e}")

    target_end_date = f"{target_year:04d}-12-31T23:59:59Z"

    # Beräkna återstående tillväxttakt från basmånad till årsslut
    dt_base = datetime.datetime(year, month, last_day, 23, 59, 59, tzinfo=datetime.timezone.utc)
    dt_target = datetime.datetime(target_year, 12, 31, 23, 59, 59, tzinfo=datetime.timezone.utc)
    total_sec = max(1.0, (dt_target - dt_base).total_seconds())
    delta_pop = target_pop - latest_pop
    growth_per_sec = delta_pop / total_sec

    # Beräkna var vi står exakt nu
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

def main():
    print("=" * 60)
    print("🚀 Glasburken — SCB Månadsuppdaterare (TAB6471)")
    print("=" * 60)

    try:
        scb_json = fetch_scb_monthly_data()
        result = process_scb_response(scb_json)

        DATA_DIR.mkdir(parents=True, exist_ok=True)
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)

        latest = result["latestMonth"]
        target = result["projectionTarget"]
        est = result["estimatedAtFetch"]

        print(f"✅ Klart! Sparade aktuell data i: {OUTPUT_FILE}")
        print("-" * 60)
        print(f"📌 Senaste SCB-utfall:     {latest['name']} ({latest['code']}): {latest['population']:,} invånare".replace(",", " "))
        print(f"🎯 Årsslutsmål {target['year']}:      {target['population']:,} invånare".replace(",", " "))
        print(f"📈 Beräknad tillväxttakt:  +{target['personsPerDay']:.1f} personer/dygn")
        print(f"⏱️  Beräknad befolkning nu: {est['population']:,} invånare".replace(",", " "))
        print("=" * 60)

    except urllib.error.URLError as ue:
        print(f"❌ Nätverksfel vid kontakt med SCB: {ue}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Fel under uppdatering: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
