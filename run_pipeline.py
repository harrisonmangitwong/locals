import os
import pandas as pd
from pipeline import (
    compute_reviewer_metrics,
    compute_restaurant_metrics,
    train_logistic_model,
    score_with_model,
)

LABELS_PATH = "data/labels.csv"
MIN_LABELS_PER_CLASS = 10


def load_labels(restaurants_df: pd.DataFrame) -> pd.DataFrame | None:
    """
    Load supervised labels for training.

    Priority:
    1) data/labels.csv (restaurant_id + label_safe_pick)
    2) restaurants_df["restaurant_type"] (for mock/demo data)
    """
    if os.path.exists(LABELS_PATH):
        labels = pd.read_csv(LABELS_PATH)
        if "restaurant_id" not in labels.columns:
            if "name" in labels.columns:
                labels = labels.merge(
                    restaurants_df[["restaurant_id", "name"]],
                    on="name",
                    how="left",
                )
            else:
                raise ValueError("labels.csv must include restaurant_id or name.")
        if "label_safe_pick" not in labels.columns:
            raise ValueError("labels.csv must include label_safe_pick (0 or 1).")
        labels = labels.dropna(subset=["restaurant_id", "label_safe_pick"]).copy()
        labels["label_safe_pick"] = labels["label_safe_pick"].astype(int)
        return labels[["restaurant_id", "label_safe_pick"]]

    if "restaurant_type" in restaurants_df.columns:
        mapping = {"hidden_gem": 1, "popular_good": 1, "tourist_trap": 0}
        labels = restaurants_df[["restaurant_id", "restaurant_type"]].copy()
        labels["label_safe_pick"] = labels["restaurant_type"].map(mapping)
        labels = labels.dropna(subset=["label_safe_pick"]).copy()
        labels["label_safe_pick"] = labels["label_safe_pick"].astype(int)
        return labels[["restaurant_id", "label_safe_pick"]]

    return None

def main():
    restaurants = pd.read_csv("data/restaurants.csv")
    reviews = pd.read_csv("data/reviews.csv")

    reviewer_metrics = compute_reviewer_metrics(reviews)

    reviews_enriched = reviews.merge(
        reviewer_metrics[["reviewer_id", "localness", "tourist_score"]],
        on="reviewer_id",
        how="left"
    )

    restaurant_scores = compute_restaurant_metrics(reviews_enriched, restaurants)
    restaurant_scores = restaurant_scores[restaurant_scores["num_reviews"] >= 20].copy()

    # --- Logistic Regression setup ---
    feature_cols = [
        "local_weighted_rating",
        "tourist_weighted_rating",
        "tourist_penalty",
        "avg_localness",
        "pct_local_reviews",
        "pct_tourist_reviews",
        "num_reviews",
    ]

    # A) Load real labels (from data/labels.csv or mock restaurant_type)
    labels = load_labels(restaurants)
    if labels is None:
        print("\n❌ No labels found for supervised training.")
        print("   Create data/labels.csv with columns:")
        print("   restaurant_id,label_safe_pick")
        print("   Then re-run this pipeline.")
        return

    labeled = restaurant_scores.merge(labels, on="restaurant_id", how="inner")
    counts = labeled["label_safe_pick"].value_counts()
    if counts.min() < MIN_LABELS_PER_CLASS or counts.size < 2:
        print("\n❌ Not enough labeled examples to train a real model.")
        print(f"   Need at least {MIN_LABELS_PER_CLASS} per class.")
        print("   Current label counts:")
        print(counts.to_string())
        return

    # B) Train model
    model, auc, report = train_logistic_model(labeled, feature_cols)
    print("\nModel AUC:", round(auc, 3))
    print("\nClassification report:\n", report)

    # C) Score each restaurant
    scored = score_with_model(restaurant_scores, model, feature_cols)

    # D) Recommend by probability threshold
    P_THRESHOLD = 0.70
    recs = scored[scored["p_safe_pick"] >= P_THRESHOLD].copy()
    recs = recs.sort_values(["p_safe_pick", "adjusted_score"], ascending=False)

    print(f"\nLocals recommendations (P(safe_pick) >= {P_THRESHOLD}):")
    print(
        recs.head(15)[
            ["name", "neighborhood", "cuisine", "num_reviews", "p_safe_pick", "adjusted_score"]
        ].to_string(index=False)
    )

    # Save outputs
    os.makedirs("outputs", exist_ok=True)
    scored.to_csv("outputs/locals_restaurant_scores_with_probs.csv", index=False)
    recs.to_csv("outputs/locals_recommendations.csv", index=False)
    print("\n✅ Saved outputs/locals_restaurant_scores_with_probs.csv")
    print("✅ Saved outputs/locals_recommendations.csv")

if __name__ == "__main__":
    main()
