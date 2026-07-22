from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import math
import os
import json
import re
from datetime import datetime
from typing import Optional

try:
    from zoneinfo import ZoneInfo
    _NYC_TZ = ZoneInfo("America/New_York")
except Exception:
    try:
        import pytz
        _NYC_TZ = pytz.timezone("America/New_York")
    except ImportError:
        _NYC_TZ = None

app = FastAPI(title="Locals API")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CSV_PATH = os.path.join(os.path.dirname(__file__), "data.csv")


# ---------------------------------------------------------------------------
# Hours parsing
# ---------------------------------------------------------------------------

def _parse_time_str(s: str) -> Optional[int]:
    s = s.strip().replace("\u202f", " ").replace("\u2009", " ")
    low = s.lower()
    if low == "midnight":
        return 0
    if low == "noon":
        return 720
    m = re.match(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)", low)
    if not m:
        return None
    hour, minute, period = int(m.group(1)), int(m.group(2) or 0), m.group(3)
    if period == "pm" and hour != 12:
        hour += 12
    elif period == "am" and hour == 12:
        hour = 0
    return hour * 60 + minute


def _is_open_now(opening_hours_json: Optional[str]) -> Optional[bool]:
    if not opening_hours_json:
        return None
    try:
        hours = json.loads(opening_hours_json)
    except Exception:
        return None

    now = datetime.now(_NYC_TZ) if _NYC_TZ else datetime.utcnow()
    day_name = now.strftime("%A")
    current_min = now.hour * 60 + now.minute

    for entry in hours:
        if entry.get("day", "").lower() != day_name.lower():
            continue
        h = entry.get("hours", "").strip()
        if not h:
            return None
        low = h.lower()
        if "closed" in low:
            return False
        if "24 hours" in low:
            return True
        parts = re.split(r"\s+to\s+|\u2013|\u2014|-", h, maxsplit=1)
        if len(parts) == 2:
            open_str, close_str = parts[0].strip(), parts[1].strip()
            # Inherit AM/PM from close time if open time lacks it (e.g. "5 to 11:30 PM")
            if not re.search(r"am|pm", open_str, re.IGNORECASE):
                period_m = re.search(r"(am|pm)", close_str, re.IGNORECASE)
                if period_m:
                    open_str = f"{open_str} {period_m.group(1)}"
            open_min = _parse_time_str(open_str)
            close_min = _parse_time_str(close_str)
            if open_min is not None and close_min is not None:
                if close_min <= open_min:
                    return current_min >= open_min or current_min < close_min
                return open_min <= current_min < close_min
        return None
    return None


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

def load_data() -> pd.DataFrame:
    df = pd.read_csv(CSV_PATH)
    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.sort_values("p_safe_pick", ascending=False).reset_index(drop=True)
    df["rank"] = df.index + 1

    p_min = df["p_safe_pick"].min()
    p_max = df["p_safe_pick"].max()
    if p_max == p_min:
        df["signal_score"] = 100.0
    else:
        df["signal_score"] = 80.0 + (df["p_safe_pick"] - p_min) / (p_max - p_min) * 20.0
    df["signal_score"] = df["signal_score"].round(2)

    return df


_df: pd.DataFrame = None


def get_df() -> pd.DataFrame:
    global _df
    if _df is None:
        _df = load_data()
    return _df


def _clean_row(row: dict) -> dict:
    for k, v in row.items():
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            row[k] = None
    return row


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/filters")
def get_filters():
    df = get_df()
    neighborhoods = sorted(df["neighborhood"].dropna().unique().tolist())
    cuisines = sorted(df["cuisine"].dropna().unique().tolist())
    return {"neighborhoods": neighborhoods, "cuisines": cuisines}


@app.get("/api/restaurants/batch")
def get_restaurants_batch(ids: str = Query(..., description="Comma-separated restaurant IDs")):
    df = get_df()
    id_list = [i.strip() for i in ids.split(",") if i.strip()]
    matched = df[df["restaurant_id"].isin(id_list)].copy()
    matched["is_open_now"] = matched["opening_hours"].apply(
        lambda h: _is_open_now(h) if pd.notna(h) else None
    )
    clean = matched.replace([np.inf, -np.inf], np.nan).where(pd.notnull(matched), None)
    results = [_clean_row(r) for r in clean.to_dict(orient="records")]
    return {"results": results}


@app.get("/api/restaurant/{restaurant_id}")
def get_restaurant(restaurant_id: str):
    df = get_df()
    match = df[df["restaurant_id"] == restaurant_id]
    if match.empty:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=404, content={"detail": "Restaurant not found"})
    row = match.iloc[0].where(pd.notnull(match.iloc[0]), None).to_dict()
    row["is_open_now"] = _is_open_now(row.get("opening_hours"))
    return _clean_row(row)


@app.get("/api/recommendations")
def get_recommendations(
    neighborhood: Optional[str] = Query(default=None),
    cuisine: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    price: Optional[str] = Query(default=None),
    open_now: Optional[bool] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    df = get_df()

    neighborhoods = sorted(df["neighborhood"].dropna().unique().tolist())
    cuisines = sorted(df["cuisine"].dropna().unique().tolist())

    filtered = df.copy()
    if search:
        filtered = filtered[filtered["name"].str.contains(search, case=False, na=False, regex=False)]
    if neighborhood:
        filtered = filtered[filtered["neighborhood"] == neighborhood]
    if cuisine:
        filtered = filtered[filtered["cuisine"] == cuisine]
    if price:
        price_ranges = {"$": (0, 15), "$$": (15, 30), "$$$": (30, 60), "$$$$": (60, 500)}
        if price in price_ranges:
            lo, hi = price_ranges[price]
            filtered = filtered[
                (filtered["price_midpoint"].notna()) &
                (filtered["price_midpoint"] > lo) &
                (filtered["price_midpoint"] <= hi)
            ]
    filtered["is_open_now"] = filtered["opening_hours"].apply(
        lambda h: _is_open_now(h) if pd.notna(h) else None
    )

    if open_now is True:
        filtered = filtered[filtered["is_open_now"] == True]  # noqa: E712

    total = len(filtered)
    total_pages = max(1, math.ceil(total / page_size))
    page = min(page, total_pages)

    start = (page - 1) * page_size
    end = start + page_size
    page_df = filtered.iloc[start:end]

    clean = page_df.replace([np.inf, -np.inf], np.nan).where(pd.notnull(page_df), None)
    results = [_clean_row(r) for r in clean.to_dict(orient="records")]

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "neighborhoods": neighborhoods,
        "cuisines": cuisines,
        "results": results,
    }
