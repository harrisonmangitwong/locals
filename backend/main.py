from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import math
import os
from typing import Optional

app = FastAPI(title="Locals API")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# data.csv is bundled in the backend directory for deployment
CSV_PATH = os.path.join(os.path.dirname(__file__), "data.csv")


def load_data() -> pd.DataFrame:
    df = pd.read_csv(CSV_PATH)
    # Sort by p_safe_pick descending, assign 1-indexed rank
    df = df.sort_values("p_safe_pick", ascending=False).reset_index(drop=True)
    df["rank"] = df.index + 1

    # Min-max scale p_safe_pick to 80-100 range, top item = 100
    p_min = df["p_safe_pick"].min()
    p_max = df["p_safe_pick"].max()
    if p_max == p_min:
        df["signal_score"] = 100.0
    else:
        df["signal_score"] = 80.0 + (df["p_safe_pick"] - p_min) / (p_max - p_min) * 20.0
    df["signal_score"] = df["signal_score"].round(2)

    return df


# Load once at startup
_df: pd.DataFrame = None


def get_df() -> pd.DataFrame:
    global _df
    if _df is None:
        _df = load_data()
    return _df


@app.get("/api/filters")
def get_filters():
    df = get_df()
    neighborhoods = sorted(df["neighborhood"].dropna().unique().tolist())
    cuisines = sorted(df["cuisine"].dropna().unique().tolist())
    return {"neighborhoods": neighborhoods, "cuisines": cuisines}


@app.get("/api/restaurant/{restaurant_id}")
def get_restaurant(restaurant_id: str):
    df = get_df()
    match = df[df["restaurant_id"] == restaurant_id]
    if match.empty:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=404, content={"detail": "Restaurant not found"})
    row = match.iloc[0].where(pd.notnull(match.iloc[0]), None).to_dict()
    return row


@app.get("/api/recommendations")
def get_recommendations(
    neighborhood: Optional[str] = Query(default=None),
    cuisine: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    df = get_df()

    # Get full filter lists before filtering
    neighborhoods = sorted(df["neighborhood"].dropna().unique().tolist())
    cuisines = sorted(df["cuisine"].dropna().unique().tolist())

    # Apply filters
    filtered = df.copy()
    if search:
        filtered = filtered[filtered["name"].str.contains(search, case=False, na=False)]
    if neighborhood:
        filtered = filtered[filtered["neighborhood"] == neighborhood]
    if cuisine:
        filtered = filtered[filtered["cuisine"] == cuisine]

    total = len(filtered)
    total_pages = max(1, math.ceil(total / page_size))
    page = min(page, total_pages)

    start = (page - 1) * page_size
    end = start + page_size
    page_df = filtered.iloc[start:end]

    # Convert to records; replace NaN with None for JSON serialization
    results = page_df.where(pd.notnull(page_df), None).to_dict(orient="records")

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "neighborhoods": neighborhoods,
        "cuisines": cuisines,
        "results": results,
    }
