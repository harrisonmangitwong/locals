import os
import pandas as pd

LABELS_TEMPLATE_PATH = "data/labels_template.csv"


def main():
    restaurants = pd.read_csv("data/restaurants.csv")
    out = restaurants[["restaurant_id", "name", "neighborhood", "cuisine"]].copy()
    out["label_safe_pick"] = ""
    out["notes"] = ""

    os.makedirs("data", exist_ok=True)
    out.to_csv(LABELS_TEMPLATE_PATH, index=False)
    print(f"✅ Wrote {LABELS_TEMPLATE_PATH}")
    print("Fill label_safe_pick with 1 (local gem) or 0 (tourist trap), then save as data/labels.csv")


if __name__ == "__main__":
    main()
