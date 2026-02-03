import os
import pandas as pd
from pipeline import (
    compute_reviewer_metrics,
    compute_restaurant_metrics,
    make_training_labels,
    train_logistic_model,
    score_with_model
)

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

    # A) Make mock labels
    labeled = make_training_labels(restaurant_scores)

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
