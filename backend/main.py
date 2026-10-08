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

        # Some venues list split shifts for the same day, e.g.
        # "12 to 3 PM, 5 to 10 PM" (lunch, dinner). Evaluate every
        # comma-separated range and treat "open" as falling inside any of them.
        any_range_parsed = False
        for segment in h.split(","):
            segment = segment.strip()
            if not segment:
                continue
            parts = re.split(r"\s+to\s+|\u2013|\u2014|-", segment, maxsplit=1)
            if len(parts) != 2:
                continue
            open_str, close_str = parts[0].strip(), parts[1].strip()
            # Inherit AM/PM from close time if open time lacks it (e.g. "5 to 11:30 PM")
            if not re.search(r"am|pm", open_str, re.IGNORECASE):
                period_m = re.search(r"(am|pm)", close_str, re.IGNORECASE)
                if period_m:
                    open_str = f"{open_str} {period_m.group(1)}"
            open_min = _parse_time_str(open_str)
            close_min = _parse_time_str(close_str)
            if open_min is None or close_min is None:
                continue
            any_range_parsed = True
            if close_min <= open_min:
                if current_min >= open_min or current_min < close_min:
                    return True
            else:
                if open_min <= current_min < close_min:
                    return True
        return False if any_range_parsed else None
    return None


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

def _is_staten_island_zip(postal_code) -> bool:
    # Every Staten Island ZIP starts with 103 (10301-10314). Neighborhood
    # name is not reliable for this -- "Seaside" is used for both a Staten
    # Island neighborhood and a Rockaway Park (Queens) spot in this data,
    # which a name-based filter would have wrongly excluded.
    try:
        return str(int(postal_code)).startswith("103")
    except (ValueError, TypeError):
        return False


def load_data() -> pd.DataFrame:
    df = pd.read_csv(CSV_PATH)
    df = df.replace([np.inf, -np.inf], np.nan)
    df = df[~df["postal_code"].apply(_is_staten_island_zip)].reset_index(drop=True)
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
    archetype: Optional[str] = Query(default=None),
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
    if archetype:
        filtered = filtered[filtered["archetype"] == archetype]
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


# ---------------------------------------------------------------------------
# Help me pick
# ---------------------------------------------------------------------------

PRICE_RANGES = {"$": (0, 15), "$$": (15, 30), "$$$": (30, 60), "$$$$": (60, 500)}
PICK_SHORTLIST_SIZE = 6


def _miles_from(df: pd.DataFrame, lat: float, lng: float) -> pd.Series:
    """Straight-line (haversine) miles. Free and instant; it ignores subway
    routing, which is fine for a "within X miles" filter."""
    p = np.pi / 180
    a = (0.5 - np.cos((df["lat"] - lat) * p) / 2
         + np.cos(lat * p) * np.cos(df["lat"] * p) * (1 - np.cos((df["lng"] - lng) * p)) / 2)
    return 7918 * np.arcsin(np.sqrt(a))


def _pick_themes(review_themes) -> dict:
    """What the review analysis says to order and what the place is like:
    up to 3 dishes, the top vibe line (for places with no standout dish),
    and any wait-time note."""
    try:
        themes = json.loads(review_themes)
    except (TypeError, ValueError):
        themes = None
    if not isinstance(themes, dict):
        return {"dishes": [], "vibe": None, "wait_note": None}
    vibes = themes.get("vibe_and_service") or []
    return {
        "dishes": (themes.get("standout_dishes") or [])[:3],
        "vibe": vibes[0] if vibes else None,
        "wait_note": themes.get("wait_time_note") or None,
    }


def _csv_param(value: Optional[str]) -> list[str]:
    return [v.strip() for v in (value or "").split(",") if v.strip()]


@app.get("/api/pick")
def get_pick_shortlist(
    lat: Optional[float] = Query(default=None),
    lng: Optional[float] = Query(default=None),
    max_miles: float = Query(default=2.0, gt=0, le=25),
    cuisines: Optional[str] = Query(default=None, description="Comma-separated"),
    prices: Optional[str] = Query(default=None, description="Comma-separated, e.g. '$,$$'"),
    exclude_ids: Optional[str] = Query(default=None, description="Comma-separated restaurant IDs to leave out"),
):
    """Up to PICK_SHORTLIST_SIZE open-now places for the "Help me pick"
    comparison, best-ranked first. If too few match, the radius widens step
    by step, then price is dropped (never open-now -- a closed place is
    useless right now), and `notice` says what was loosened."""
    df = get_df()
    pool = df.copy()
    pool["is_open_now"] = pool["opening_hours"].apply(lambda h: _is_open_now(h) if pd.notna(h) else None)
    pool = pool[pool["is_open_now"] == True]  # noqa: E712

    excluded = set(_csv_param(exclude_ids))
    if excluded:
        pool = pool[~pool["restaurant_id"].isin(excluded)]
    wanted_cuisines = set(_csv_param(cuisines))
    if wanted_cuisines:
        pool = pool[pool["cuisine"].isin(wanted_cuisines)]

    has_location = lat is not None and lng is not None
    pool["distance_mi"] = _miles_from(pool, lat, lng) if has_location else np.nan

    wanted_prices = [p for p in _csv_param(prices) if p in PRICE_RANGES]

    def apply(frame: pd.DataFrame, radius: Optional[float], use_price: bool) -> pd.DataFrame:
        out = frame
        if radius is not None and has_location:
            out = out[out["distance_mi"] <= radius]
        if use_price and wanted_prices:
            mask = pd.Series(False, index=out.index)
            for p in wanted_prices:
                lo, hi = PRICE_RANGES[p]
                mask |= (out["price_midpoint"] > lo) & (out["price_midpoint"] <= hi)
            out = out[mask]
        return out

    radii = [max_miles] + [r for r in (0.5, 1, 2, 3, 5) if r > max_miles]
    attempts = [(r, True) for r in radii] + [(r, False) for r in radii]
    matches, notice = pool.iloc[0:0], None
    for radius, use_price in attempts:
        matches = apply(pool, radius, use_price)
        if len(matches) >= 2:
            if not use_price and wanted_prices:
                notice = f"Not enough open places at that price, so we included other prices within {radius:g} mi."
            elif radius != max_miles and has_location:
                notice = f"Not enough open places within {max_miles:g} mi, so we looked up to {radius:g} mi."
            break

    # Already sorted by p_safe_pick (load_data). Without a cuisine filter,
    # keep the shortlist from being six of the same thing.
    per_cuisine_cap = PICK_SHORTLIST_SIZE if wanted_cuisines else 2
    counts: dict = {}
    picked = []
    for _, row in matches.iterrows():
        counts[row["cuisine"]] = counts.get(row["cuisine"], 0) + 1
        if counts[row["cuisine"]] <= per_cuisine_cap:
            picked.append(row)
        if len(picked) == PICK_SHORTLIST_SIZE:
            break

    fields = ["restaurant_id", "name", "neighborhood", "cuisine", "price_midpoint", "image_url", "url",
              "lat", "lng", "rank", "local_weighted_rating", "tourist_weighted_rating", "distance_mi"]
    shortlist = pd.DataFrame(picked, columns=list(matches.columns)) if picked else matches.iloc[0:0]
    out = shortlist[fields].copy()
    out["distance_mi"] = out["distance_mi"].round(2)
    out = out.replace([np.inf, -np.inf], np.nan).astype(object).where(pd.notnull(out), None)
    themes = shortlist["review_themes"].tolist() if "review_themes" in shortlist else [None] * len(out)
    candidates = [{**_clean_row(r), **_pick_themes(t)} for r, t in zip(out.to_dict(orient="records"), themes)]

    return {
        "total_matches": len(matches),
        "notice": notice if len(matches) else None,
        "candidates": candidates,
    }
