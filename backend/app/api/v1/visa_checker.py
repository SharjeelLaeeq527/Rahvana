# C:\Users\HP\Desktop\arachnie\Arachnie\backend\app\api\v1\visa_checker.py

from fastapi import APIRouter, HTTPException
import json
from datetime import datetime
from typing import Dict, Any
from pathlib import Path
import re

router = APIRouter()

# ----------------------------
# SAFE FILE LOADING
# ----------------------------

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = BASE_DIR / "data"
FILE_PATH = DATA_DIR / "visa-checker-dates.json"

def load_bulletin():
    if not FILE_PATH.exists():
        raise FileNotFoundError(
            f"visa-checker-dates.json not found at {FILE_PATH}"
        )
    with open(FILE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

# Load once safely
BULLETIN = load_bulletin()

# ----------------------------
# HISTORICAL DATA (update this periodically for better estimates)
# Example for F3 Philippines - add new entries as bulletins come
# ----------------------------
HISTORICAL_F3_PH = [
    "2024-11", "2004-08-01",
    "2024-12", "2004-08-15",
    "2025-01", "2004-08-22",
    "2025-02", "2004-09-01",
    "2025-03", "2004-09-08",
    "2025-04", "2004-09-15",
    "2025-05", "2004-09-22",
    "2025-06", "2004-09-22",
    "2025-07", "2004-09-22",
    "2025-08", "2004-09-22",
    "2025-09", "2004-09-22",
    "2025-10", "2004-09-22",
    "2025-11", "2004-09-22",
    # Add March 2026 and future if you track movement
    # "2026-03", "2005-03-01",  # example - update based on actual progress
]

# ----------------------------
# HELPERS
# ----------------------------

def get_cutoff(category: str, country: str, chart: str = "final") -> Dict[str, Any]:
    """
    chart: "final" (default) or "filing"
    Currently code uses Final Action Dates.
    To support Dates for Filing: pass chart="filing" and adjust input logic.
    """
    if chart == "filing":
        table = BULLETIN.get("datesForFiling", {})
    else:
        table = BULLETIN["finalActionDates"]

    if category.startswith("F"):
        data = table.get("family", {}).get(category, {})
    else:
        # Employment categories may have spaces like "EB-3 Other Workers"
        data = table.get("employment", {}).get(category, {})

    key = country if country in ["China", "India", "Mexico", "Philippines"] else "All"
    raw = data.get(key, "U")

    return {"date": raw, "raw": raw}


def parse_visabulletin_date(date_str: str) -> str:
    if date_str in ["C", "U"]:
        return date_str

    date_str = date_str.strip().upper()
    match = re.match(r"(\d{2})([A-Z]{3})(\d{2})", date_str)

    if not match:
        return date_str

    day, month_abbr, year = match.groups()

    month_map = {
        "JAN": "01", "FEB": "02", "MAR": "03", "APR": "04",
        "MAY": "05", "JUN": "06", "JUL": "07", "AUG": "08",
        "SEP": "09", "OCT": "10", "NOV": "11", "DEC": "12"
    }

    month = month_map.get(month_abbr)
    if not month:
        return date_str

    year_int = int(year)
    full_year = f"20{year}" if year_int <= 49 else f"19{year}"

    return f"{full_year}-{month}-{day}"


def calc_days_behind(user_dt: datetime, cutoff_dt: datetime) -> int:
    return (user_dt - cutoff_dt).days


def format_days(days: int) -> str:
    years = days // 365
    months = (days % 365) // 30
    return f"{days:,} days ({years} years, {months} months)"


def estimate_wait_f3_philippines() -> Dict:
    movements = []

    for i in range(1, len(HISTORICAL_F3_PH), 2):
        prev_str = HISTORICAL_F3_PH[i]
        next_idx = i + 2
        if next_idx >= len(HISTORICAL_F3_PH):
            break
        curr_str = HISTORICAL_F3_PH[next_idx]

        prev = datetime.strptime(prev_str, "%Y-%m-%d")
        curr = datetime.strptime(curr_str, "%Y-%m-%d")
        movements.append((curr - prev).days)

    avg = sum(movements) // len(movements) if movements else 7
    return {"avg_movement": avg}


# ----------------------------
# MAIN ROUTE
# ----------------------------

@router.post("/check")
def check_status(input: dict):

    try:
        category = input["category"]
        country = input["country"]
        priority_date = input["priorityDate"]
        app_type = input.get("applicationType", "Consular Processing")
        # Optional: chart = input.get("chart", "final")  # "final" or "filing"
        chart = "final"  # Currently fixed - change to "filing" if USCIS requires it

        cutoff_info = get_cutoff(category, country, chart=chart)
        cutoff_raw = cutoff_info["raw"]

        user_dt = datetime.strptime(priority_date, "%Y-%m-%d")

        bulletin_month = BULLETIN.get("month", "2026-03")
        bulletin_display = datetime.strptime(
            bulletin_month, "%Y-%m"
        ).strftime("%B %Y")

        # CURRENT
        if cutoff_raw == "C":
            status = "current"
            cutoff_display = "Current"
            days_behind = 0
            wait_estimate = None

        # UNAVAILABLE
        elif cutoff_raw == "U":
            status = "unavailable"
            cutoff_display = "Unavailable"
            days_behind = None
            wait_estimate = None

        else:
            cutoff_std = parse_visabulletin_date(cutoff_raw)
            cutoff_dt = datetime.strptime(cutoff_std, "%Y-%m-%d")
            cutoff_display = cutoff_dt.strftime("%B %d, %Y")

            if user_dt <= cutoff_dt:
                status = "current"
                days_behind = 0
                wait_estimate = None
            else:
                status = "waiting"
                days_behind = calc_days_behind(user_dt, cutoff_dt)
                formatted_days = format_days(days_behind)

                wait_estimate = None

                if category == "F3" and country == "Philippines":
                    est = estimate_wait_f3_philippines()

                    if est["avg_movement"] > 0:
                        wait_years = round(
                            days_behind / (est["avg_movement"] * 30), 1
                        )

                        wait_estimate = {
                            "formatted": formatted_days,
                            "avg_movement": f"{est['avg_movement']} days/month",
                            "years": f"≈ {int(wait_years)} years"
                        }

        return {
            "status": status,
            "category": category,
            "categoryFull": {
                "EB-1": "EB-1 (Priority Workers)",
                "EB-2": "EB-2 (Advanced Degree)",
                "EB-3": "EB-3 (Skilled Workers)",
                "EB-3 Other Workers": "EB-3 Other Workers",
                "EB-4": "EB-4 (Special Immigrants)",
                "EB-4 Certain Religious Workers": "EB-4 Certain Religious Workers",
                "EB-5 Unreserved": "EB-5 Unreserved",
                "EB-5 Rural": "EB-5 Rural (Set Aside)",
                "F1": "F1 (Unmarried Sons/Daughters of Citizens)",
                "F2A": "F2A (Spouses & Children of LPR)",
                "F2B": "F2B (Unmarried Sons/Daughters of LPR)",
                "F3": "F3 (Married Sons/Daughters of Citizens)",
                "F4": "F4 (Brothers/Sisters of Citizens)"
            }.get(category, category),
            "priorityDate": user_dt.strftime("%B %d, %Y"),
            "country": country,
            "applicationType": app_type,
            "chartUsed": "Final Action Dates" if chart == "final" else "Dates for Filing",
            "cutoffDate": cutoff_display,
            "currentBulletin": bulletin_display,
            "daysBehind": days_behind if days_behind is not None else None,
            "waitEstimate": wait_estimate
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))