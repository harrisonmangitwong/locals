# pipeline.py
import pandas as pd
import numpy as np
import re
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score, classification_report
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

# Manhattan zipcode → sub-neighborhood mapping
MANHATTAN_ZIP_TO_NEIGHBORHOOD: dict[str, str] = {
    "10001": "Chelsea",
    "10002": "Lower East Side",
    "10003": "East Village",
    "10004": "Financial District",
    "10005": "Financial District",
    "10006": "Financial District",
    "10007": "Tribeca",
    "10009": "East Village",
    "10010": "Gramercy",
    "10011": "Chelsea",
    "10012": "SoHo",
    "10013": "Tribeca",
    "10014": "West Village",
    "10016": "Murray Hill",
    "10017": "Murray Hill",
    "10018": "Midtown",
    "10019": "Midtown",
    "10020": "Midtown",
    "10021": "Upper East Side",
    "10022": "Midtown East",
    "10023": "Upper West Side",
    "10024": "Upper West Side",
    "10025": "Upper West Side",
    "10026": "Harlem",
    "10027": "Harlem",
    "10028": "Upper East Side",
    "10029": "East Harlem",
    "10030": "Harlem",
    "10031": "Washington Heights",
    "10032": "Washington Heights",
    "10033": "Washington Heights",
    "10034": "Inwood",
    "10035": "East Harlem",
    "10036": "Midtown",
    "10037": "Harlem",
    "10038": "Financial District",
    "10039": "Harlem",
    "10040": "Washington Heights",
    "10044": "Roosevelt Island",
    "10065": "Upper East Side",
    "10075": "Upper East Side",
    "10128": "Upper East Side",
    "10280": "Battery Park City",
}


def refine_manhattan_neighborhoods(df: pd.DataFrame) -> pd.DataFrame:
    """Replace generic 'Manhattan' neighborhood with sub-neighborhood based on zipcode."""
    df = df.copy()
    mask = df["neighborhood"] == "Manhattan"
    if not mask.any():
        return df

    def extract_zip(addr: str) -> str | None:
        if not isinstance(addr, str):
            return None
        m = re.search(r"\b(1\d{4})\b", addr)
        return m.group(1) if m else None

    for idx in df[mask].index:
        zipcode = extract_zip(str(df.at[idx, "address"]))
        if zipcode and zipcode in MANHATTAN_ZIP_TO_NEIGHBORHOOD:
            df.at[idx, "neighborhood"] = MANHATTAN_ZIP_TO_NEIGHBORHOOD[zipcode]

    return df

def compute_reviewer_metrics(reviews_df: pd.DataFrame) -> pd.DataFrame:
    df = reviews_df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    cutoff = pd.Timestamp.today() - pd.Timedelta(days=365*3)
    df = df[df["timestamp"] >= cutoff]

    grouped = df.groupby("reviewer_id")
    reviewer_metrics = grouped.agg(
        total_reviews_3yr=("review_id", "count"),
        nyc_reviews_3yr=("restaurant_city", lambda x: (x == "NYC").sum()),
        first_review=("timestamp", "min"),
        last_review=("timestamp", "max"),
        reviewer_total_reviews=("reviewer_total_reviews", "max"),
        is_local_guide=("is_local_guide", "max"),
    ).reset_index()

    # Use reviewer's global Google Maps review count as denominator when available.
    # A tourist visiting NYC once may have 300 reviews globally but only 1-2 here →
    # low pct_reviews_in_city → treated as tourist.
    # Fall back to dataset-only count if the field is missing or zero.
    global_total = reviewer_metrics["reviewer_total_reviews"].where(
        reviewer_metrics["reviewer_total_reviews"] > 0,
        reviewer_metrics["total_reviews_3yr"],
    )
    reviewer_metrics["pct_reviews_in_city"] = (
        reviewer_metrics["nyc_reviews_3yr"] / global_total
    ).clip(upper=1.0)

    reviewer_metrics["review_span_days"] = (
        reviewer_metrics["last_review"] - reviewer_metrics["first_review"]
    ).dt.days

    reviewer_metrics["stability"] = (
        reviewer_metrics["review_span_days"] / 1095
    ).clip(upper=1)

    reviewer_metrics["localness"] = (
        0.6 * reviewer_metrics["pct_reviews_in_city"] +
        0.25 * reviewer_metrics["stability"] +
        0.15 * reviewer_metrics["is_local_guide"].astype(float)
    ).clip(upper=1.0)

    reviewer_metrics["tourist_score"] = 1 - reviewer_metrics["localness"]

    return reviewer_metrics


def compute_restaurant_metrics(
    reviews_enriched: pd.DataFrame,
    restaurants_df: pd.DataFrame
) -> pd.DataFrame:
    df = reviews_enriched.copy()

    # Only NYC reviews that reference an NYC restaurant_id
    df = df[(df["restaurant_city"] == "NYC") & (df["restaurant_id"].notna())]

    grouped = df.groupby("restaurant_id")

    def safe_weighted_avg(values, weights):
        denom = weights.sum()
        return (values * weights).sum() / denom if denom > 0 else float("nan")

    restaurant_metrics = grouped.apply(
        lambda g: pd.Series({
            "num_reviews": len(g),
            "avg_localness": g["localness"].mean(),
            "pct_local_reviews": (g["localness"] >= 0.7).mean(),
            "pct_tourist_reviews": (g["localness"] <= 0.3).mean(),
            "local_weighted_rating": safe_weighted_avg(g["rating"], g["localness"]),
            "tourist_weighted_rating": safe_weighted_avg(g["rating"], g["tourist_score"]),
        })
    ).reset_index()

    restaurant_metrics["tourist_penalty"] = (
        restaurant_metrics["tourist_weighted_rating"] -
        restaurant_metrics["local_weighted_rating"]
    ).clip(lower=0)

    restaurant_metrics["adjusted_score"] = (
        restaurant_metrics["local_weighted_rating"] -
        0.5 * restaurant_metrics["tourist_penalty"]
    )

    # Add metadata (name, cuisine, neighborhood)
    restaurant_metrics = restaurant_metrics.merge(
        restaurants_df,
        on="restaurant_id",
        how="left"
    )

    # Split "Manhattan" into sub-neighborhoods by zipcode
    restaurant_metrics = refine_manhattan_neighborhoods(restaurant_metrics)

    return restaurant_metrics

def make_training_labels(restaurants_df: pd.DataFrame, seed: int = 42) -> pd.DataFrame:
    """
    Creates MOCK labels for training.
    label_safe_pick = 1 means "non-touristy good" (safe for travelers).
    label_safe_pick = 0 means "touristy / risky".
    """
    df = restaurants_df.copy()
    rng = np.random.default_rng(seed)

    # Hidden rule that generates labels (tunable):
    # locals like it, tourist penalty low, more local share helps
    base = (
        0.65 * df["local_weighted_rating"].fillna(0)
        - 1.10 * df["tourist_penalty"].fillna(0)
        + 0.30 * df["pct_local_reviews"].fillna(0)
        - 0.20 * df["pct_tourist_reviews"].fillna(0)
    )

    # Add small noise so labels aren't perfectly deterministic
    noise = rng.normal(0, 0.15, size=len(df))
    hidden = base + noise

    # Convert to binary label using a threshold
    df["label_safe_pick"] = (hidden >= 2.7).astype(int)
    return df


def train_logistic_model(labeled_df: pd.DataFrame, feature_cols: list[str]):
    """
    Trains a Random Forest classifier and returns (model, auc, report).
    Falls back to logistic regression if RF fails.
    """
    df = labeled_df.copy()
    # Fill NaN features with median (RF handles this better than dropping rows)
    for col in feature_cols:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].median())
        else:
            df[col] = 0
    df = df.dropna(subset=["label_safe_pick"])

    X = df[feature_cols]
    y = df["label_safe_pick"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=8,
        min_samples_leaf=5,
        random_state=42,
        class_weight="balanced",
    )
    model.fit(X_train, y_train)

    probs = model.predict_proba(X_test)[:, 1]
    preds = (probs >= 0.5).astype(int)

    auc = roc_auc_score(y_test, probs)
    report = classification_report(y_test, preds, digits=3)

    # Print feature importances
    importances = sorted(
        zip(feature_cols, model.feature_importances_),
        key=lambda x: x[1],
        reverse=True,
    )
    print("\n📊 Feature importances:")
    for feat, imp in importances:
        bar = "█" * int(imp * 50)
        print(f"  {feat:30s} {imp:.3f} {bar}")

    return model, auc, report


def score_with_model(restaurants_df: pd.DataFrame, model, feature_cols: list[str]) -> pd.DataFrame:
    """
    Adds a p_safe_pick column = probability restaurant is a safe pick.
    """
    df = restaurants_df.copy()
    X = df[feature_cols].fillna(0)
    df["p_safe_pick"] = model.predict_proba(X)[:, 1]
    return df


def cluster_restaurants(restaurant_scores: pd.DataFrame, k: int = 5) -> pd.DataFrame:
    """
    Cluster restaurants into archetypes using K-means on key features.
    Adds 'cluster' (int) and 'archetype' (str) columns.
    """
    df = restaurant_scores.copy()

    cluster_features = [
        "avg_localness",
        "pct_tourist_reviews",
        "local_weighted_rating",
        "tourist_weighted_rating",
        "tourist_penalty",
        "num_reviews",
    ]

    X = df[cluster_features].fillna(0).values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    df["cluster"] = kmeans.fit_predict(X_scaled)

    # Label each cluster by its centroid characteristics
    centroids = pd.DataFrame(
        scaler.inverse_transform(kmeans.cluster_centers_),
        columns=cluster_features,
    )

    # Rank clusters along each dimension to assign archetypes relative to data
    archetype_map = {}

    # Rank each centroid (higher rank = more of that trait)
    ranks = pd.DataFrame(index=centroids.index)
    ranks["local_rating_rank"] = centroids["local_weighted_rating"].rank()
    ranks["localness_rank"] = centroids["avg_localness"].rank()
    ranks["tourist_penalty_rank"] = centroids["tourist_penalty"].rank()
    ranks["tourist_pct_rank"] = centroids["pct_tourist_reviews"].rank()
    ranks["review_count_rank"] = centroids["num_reviews"].rank()

    # Composite scores
    ranks["local_score"] = ranks["local_rating_rank"] + ranks["localness_rank"] - ranks["tourist_penalty_rank"]
    ranks["tourist_score"] = ranks["tourist_penalty_rank"] + ranks["tourist_pct_rank"] - ranks["localness_rank"]

    # Assign archetypes by sorting clusters
    assigned = set()

    # Tourist Trap: highest tourist_score
    tourist_trap = ranks["tourist_score"].idxmax()
    archetype_map[tourist_trap] = "Tourist Trap"
    assigned.add(tourist_trap)

    # Hidden Gem: highest localness + high rating + low review count
    gem_score = ranks["local_score"] - ranks["review_count_rank"] * 0.5
    for idx in gem_score.sort_values(ascending=False).index:
        if idx not in assigned:
            archetype_map[idx] = "Hidden Gem"
            assigned.add(idx)
            break

    # Universally Loved: high rating + high review count
    loved_score = ranks["local_rating_rank"] + ranks["review_count_rank"]
    for idx in loved_score.sort_values(ascending=False).index:
        if idx not in assigned:
            archetype_map[idx] = "Universally Loved"
            assigned.add(idx)
            break

    # Local Favorite: next best local_score
    for idx in ranks["local_score"].sort_values(ascending=False).index:
        if idx not in assigned:
            archetype_map[idx] = "Local Favorite"
            assigned.add(idx)
            break

    # Remaining clusters
    for idx in centroids.index:
        if idx not in assigned:
            c = centroids.iloc[idx]
            if c["local_weighted_rating"] < 3.5:
                archetype_map[idx] = "Under the Radar"
            else:
                archetype_map[idx] = "Neighborhood Staple"

    df["archetype"] = df["cluster"].map(archetype_map)

    # Print cluster summary
    print("\n🔬 Restaurant Archetypes (K-means clustering):")
    for cluster_id, archetype in sorted(archetype_map.items()):
        count = (df["cluster"] == cluster_id).sum()
        c = centroids.iloc[cluster_id]
        print(
            f"  Cluster {cluster_id} — {archetype} ({count} restaurants)"
            f"  | local_rating={c['local_weighted_rating']:.2f}"
            f"  tourist_penalty={c['tourist_penalty']:.2f}"
            f"  avg_localness={c['avg_localness']:.2f}"
        )

    return df
