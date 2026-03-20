# pipeline.py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, classification_report

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
    Trains logistic regression and returns (model, auc, report).
    """
    df = labeled_df.dropna(subset=feature_cols + ["label_safe_pick"]).copy()

    X = df[feature_cols]
    y = df["label_safe_pick"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    model = LogisticRegression(max_iter=2000)
    model.fit(X_train, y_train)

    probs = model.predict_proba(X_test)[:, 1]
    preds = (probs >= 0.5).astype(int)

    auc = roc_auc_score(y_test, probs)
    report = classification_report(y_test, preds, digits=3)

    return model, auc, report


def score_with_model(restaurants_df: pd.DataFrame, model, feature_cols: list[str]) -> pd.DataFrame:
    """
    Adds a p_safe_pick column = probability restaurant is a safe pick.
    """
    df = restaurants_df.copy()
    X = df[feature_cols].fillna(0)
    df["p_safe_pick"] = model.predict_proba(X)[:, 1]
    return df
