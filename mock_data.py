# mock_data.py
import os
import random
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

random.seed(42)
np.random.seed(42)

DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)

def random_date(start_date: datetime, end_date: datetime) -> str:
    delta = end_date - start_date
    d = start_date + timedelta(days=random.randint(0, delta.days))
    return d.strftime("%Y-%m-%d")

def pick_restaurant_id(restaurants_df, archetype):
    # weights by archetype
    type_weights = {
        "local": {"hidden_gem": 0.55, "popular_good": 0.35, "tourist_trap": 0.10},
        "tourist": {"hidden_gem": 0.10, "popular_good": 0.30, "tourist_trap": 0.60},
        "traveler": {"hidden_gem": 0.20, "popular_good": 0.50, "tourist_trap": 0.30},
    }
    tw = type_weights[archetype]

    types = restaurants_df["restaurant_type"].tolist()
    weights = [tw[t] for t in types]
    return random.choices(restaurants_df["restaurant_id"].tolist(), weights=weights, k=1)[0]

def sample_rating(archetype, restaurant_type):
    # means chosen to create separation (harsher overall)
    means = {
        "tourist_trap": {"local": 3.2, "tourist": 4.4, "traveler": 3.6},
        "popular_good": {"local": 4.2, "tourist": 4.3, "traveler": 4.2},
        "hidden_gem":   {"local": 4.6, "tourist": 3.8, "traveler": 4.1},
    }
    mu = means[restaurant_type][archetype]
    rating = np.clip(np.random.normal(loc=mu, scale=0.55), 1, 5)
    return round(float(rating), 1)



def main():
# --- Restaurants (curated NYC demo set) ---
    curated = [
        # Tourist-leaning / very touristy areas (for demo)
        {"name":"Joe's Pizza (Times Sq)","neighborhood":"Midtown","cuisine":"Pizza","restaurant_type":"tourist_trap",
        "local_word":"If you’re starving near Times Sq, this is a safer slice than the neon nonsense."},
        {"name":"Carmine’s (Times Sq)","neighborhood":"Midtown","cuisine":"Italian","restaurant_type":"tourist_trap",
        "local_word":"Big portions, big crowds — fun once, not the city’s best Italian."},
        {"name":"Ellen’s Stardust Diner","neighborhood":"Midtown","cuisine":"Diner","restaurant_type":"tourist_trap",
        "local_word":"Go for the singing, not the food — treat it like a show ticket."},
        {"name":"The Halal Guys (53rd & 6th)","neighborhood":"Midtown","cuisine":"Halal","restaurant_type":"tourist_trap",
        "local_word":"Iconic cart energy — great at 1am, less magical at peak lunch rush."},
        {"name":"Junior’s (Times Sq)","neighborhood":"Midtown","cuisine":"Bakery","restaurant_type":"tourist_trap",
        "local_word":"Cheesecake is the move. Don’t overthink the rest."},
        {"name":"Lombardi’s Pizza","neighborhood":"Nolita","cuisine":"Pizza","restaurant_type":"tourist_trap",
        "local_word":"Historic, solid, busy — go early or expect a wait."},
        {"name":"Serendipity 3","neighborhood":"Upper East Side","cuisine":"Dessert","restaurant_type":"tourist_trap",
        "local_word":"Order the frozen hot chocolate and commit to the bit."},
        {"name":"The Smith (Lincoln Square)","neighborhood":"Upper West Side","cuisine":"American","restaurant_type":"tourist_trap",
        "local_word":"Reliable crowd-pleaser near theaters — not a hidden gem, but it works."},
        {"name":"Bubby’s (Tribeca)","neighborhood":"Tribeca","cuisine":"Brunch","restaurant_type":"tourist_trap",
        "local_word":"Great pancakes, lots of visitors — weekday mornings are calmer."},
        {"name":"Grimaldi’s Pizzeria","neighborhood":"DUMBO","cuisine":"Pizza","restaurant_type":"tourist_trap",
        "local_word":"Classic Brooklyn tourist stop — go off-peak or it’s a line marathon."},
        {"name":"Time Out Market (DUMBO)","neighborhood":"DUMBO","cuisine":"Food Hall","restaurant_type":"tourist_trap",
        "local_word":"Good variety with views — treat it like a tasting lap."},
        {"name":"Los Tacos No. 1 (Times Sq)","neighborhood":"Midtown","cuisine":"Mexican","restaurant_type":"tourist_trap",
        "local_word":"Even locals admit it: this is legit. Just brace for the line."},
        {"name":"Tom’s Restaurant","neighborhood":"Morningside Heights","cuisine":"Diner","restaurant_type":"tourist_trap",
        "local_word":"Famous façade — decent diner fuel if you’re already nearby."},
        {"name":"Magnolia Bakery (Bleecker)","neighborhood":"West Village","cuisine":"Bakery","restaurant_type":"tourist_trap",
        "local_word":"Banana pudding hits. Keep it moving after you grab it."},
        {"name":"Levain Bakery (Upper West)","neighborhood":"Upper West Side","cuisine":"Bakery","restaurant_type":"tourist_trap",
        "local_word":"Warm cookie = happiness. Split one unless you like food comas."},

        # Popular but actually good (your examples included)
        {"name":"Katz’s Delicatessen","neighborhood":"Lower East Side","cuisine":"Deli","restaurant_type":"popular_good",
        "local_word":"Pricey but consistent — pastrami does the talking."},
        {"name":"Shake Shack (Madison Sq Park)","neighborhood":"Flatiron","cuisine":"Burgers","restaurant_type":"popular_good",
        "local_word":"The original still hits — eat in the park if the weather’s nice."},
        {"name":"Prince Street Pizza","neighborhood":"Nolita","cuisine":"Pizza","restaurant_type":"popular_good",
        "local_word":"Spicy vodka slice is the order. Go early to dodge the crowd."},
        {"name":"Russ & Daughters Cafe","neighborhood":"Lower East Side","cuisine":"Jewish","restaurant_type":"popular_good",
        "local_word":"Classic brunch flex — go for the fish, stay for the vibes."},
        {"name":"L’Industrie Pizza","neighborhood":"Williamsburg","cuisine":"Pizza","restaurant_type":"popular_good",
        "local_word":"One of the best slices in NYC. Worth the trip to Brooklyn."},
        {"name":"Xi’an Famous Foods","neighborhood":"East Village","cuisine":"Chinese","restaurant_type":"popular_good",
        "local_word":"Hand-ripped noodles, loud flavors — order spicy and commit."},
        {"name":"Ichiran Ramen","neighborhood":"Midtown","cuisine":"Ramen","restaurant_type":"popular_good",
        "local_word":"Touristy, yes — but a reliable solo ramen mission."},
        {"name":"Tao Downtown","neighborhood":"Chelsea","cuisine":"Asian","restaurant_type":"popular_good",
        "local_word":"It’s a scene. Go for the spectacle, not a quiet dinner."},
        {"name":"Carbone","neighborhood":"Greenwich Village","cuisine":"Italian","restaurant_type":"popular_good",
        "local_word":"Hard reservation, famous rigatoni — a splurge night classic."},
        {"name":"Lucali","neighborhood":"Carroll Gardens","cuisine":"Pizza","restaurant_type":"popular_good",
        "local_word":"The line is part of the ritual. Bring cash and patience."},
        {"name":"Peter Luger Steak House","neighborhood":"Williamsburg","cuisine":"Steakhouse","restaurant_type":"popular_good",
        "local_word":"Old-school steak institution — go with friends and split everything."},
        {"name":"Los Tacos No. 1 (Chelsea Market)","neighborhood":"Chelsea","cuisine":"Mexican","restaurant_type":"popular_good",
        "local_word":"Even with crowds, it’s one of the best quick bites in the city."},
        {"name":"Gramercy Tavern","neighborhood":"Flatiron","cuisine":"American","restaurant_type":"popular_good",
        "local_word":"A NYC classic — bar room for vibes, dining room for the full moment."},
        {"name":"Via Carota","neighborhood":"West Village","cuisine":"Italian","restaurant_type":"popular_good",
        "local_word":"West Village staple — go off-hours or it’s a wait game."},
        {"name":"Superiority Burger","neighborhood":"East Village","cuisine":"Veggie","restaurant_type":"popular_good",
        "local_word":"Tiny, weird, beloved — perfect quick stop before a walk."},
        {"name":"Joe’s Shanghai","neighborhood":"Chinatown","cuisine":"Chinese","restaurant_type":"popular_good",
        "local_word":"Soup dumplings are the headline. Go with a group and feast."},
        {"name":"Llama San","neighborhood":"West Village","cuisine":"Peruvian","restaurant_type":"popular_good",
        "local_word":"A date-night favorite — order family style and try something new."},

        # Hidden gems / local-favorite pockets (for demo)
        {"name":"Spicy Village","neighborhood":"Chinatown","cuisine":"Chinese","restaurant_type":"hidden_gem",
        "local_word":"No-frills and elite — bring friends and order more than you think."},
        {"name":"Mamoun’s Falafel","neighborhood":"Greenwich Village","cuisine":"Middle Eastern","restaurant_type":"hidden_gem",
        "local_word":"Cheap, fast, classic — perfect late-night pocket meal."},
        {"name":"Tasty Hand-Pulled Noodles","neighborhood":"Chinatown","cuisine":"Chinese","restaurant_type":"hidden_gem",
        "local_word":"Comfort carbs — order something soupy and you’ll be fine."},
        {"name":"Los Mariscos","neighborhood":"Chelsea","cuisine":"Seafood","restaurant_type":"hidden_gem",
        "local_word":"Under-the-radar seafood tacos inside the market chaos."},
        {"name":"Tanoreen","neighborhood":"Bay Ridge","cuisine":"Middle Eastern","restaurant_type":"hidden_gem",
        "local_word":"Worth the train — big flavors, warm hospitality."},
        {"name":"Fuskahouse","neighborhood":"Jackson Heights","cuisine":"Bangladeshi","restaurant_type":"hidden_gem",
        "local_word":"Snack heaven — follow your nose and order boldly."},
        {"name":"Adda Indian Canteen","neighborhood":"Long Island City","cuisine":"Indian","restaurant_type":"hidden_gem",
        "local_word":"LIC detour that pays off — spice levels don’t play."},
        {"name":"Arepa Lady","neighborhood":"Jackson Heights","cuisine":"Colombian","restaurant_type":"hidden_gem",
        "local_word":"Arepas that feel like a secret — go hungry."},
        {"name":"King of Falafel & Shawarma","neighborhood":"Astoria","cuisine":"Middle Eastern","restaurant_type":"hidden_gem",
        "local_word":"Cart legend — shawarma platter is the move."},
        {"name":"Little Neck Dumpling House","neighborhood":"Flushing","cuisine":"Chinese","restaurant_type":"hidden_gem",
        "local_word":"Flushing dumpling mission — come with a plan and share."},
    ]

    # If you want exactly 50, pad with a few more in the same format:
    # (Add ~50 total items; you can copy/paste lines and tweak names/neighborhoods/cuisines.)
    restaurants = []
    for i, r in enumerate(curated, start=1):
        restaurants.append({
            "restaurant_id": f"r{i:03d}",
            "name": r["name"],
            "neighborhood": r["neighborhood"],
            "cuisine": r["cuisine"],
            "city": "NYC",
            # extra fields (fine to keep; pipeline will just carry them through)
            "restaurant_type": r["restaurant_type"],
            "local_word": r["local_word"],
        })
    restaurants_df = pd.DataFrame(restaurants)


    # --- Reviews ---
    other_cities = ["Boston", "LA", "Chicago", "Miami", "SF", "DC", "Philly"]
    today = datetime.today()
    three_years_ago = today - timedelta(days=365*3)

    reviewers = []
    # Create reviewer archetypes
    # 1) local-like: mostly NYC over long span
    for i in range(120):
        reviewers.append(("local", f"uL{i:03d}"))
    # 2) tourist-like: short burst, mostly non-NYC
    for i in range(80):
        reviewers.append(("tourist", f"uT{i:03d}"))
    # 3) traveler: many cities, long span, low NYC
    for i in range(60):
        reviewers.append(("traveler", f"uV{i:03d}"))

    reviews = []
    review_id = 1

    for archetype, uid in reviewers:
        if archetype == "local":
            n = random.randint(5, 18)
            start = three_years_ago
            end = today
            nyc_prob = 0.85
        elif archetype == "tourist":
            n = random.randint(3, 10)
            # burst over 3-10 days
            burst_start = today - timedelta(days=random.randint(30, 900))
            start = burst_start
            end = burst_start + timedelta(days=random.randint(3, 10))
            nyc_prob = 0.20
        else:  # traveler
            n = random.randint(6, 22)
            start = three_years_ago
            end = today
            nyc_prob = 0.25

        for _ in range(n):
            # pick city
            is_nyc = random.random() < nyc_prob
            city = "NYC" if is_nyc else random.choice(other_cities)

            # restaurant_id only meaningful for NYC reviews (for simplicity)
            if city == "NYC":
                # restaurant_id = random.choice(restaurants_df["restaurant_id"].tolist())
                restaurant_id = pick_restaurant_id(restaurants_df, archetype)
            else:
                restaurant_id = None  # not used in our NYC restaurant scoring

            # rating = np.clip(np.random.normal(loc=4.2 if archetype != "tourist" else 4.4, scale=0.4), 1, 5)
            # rating = round(float(rating), 1)
            match = restaurants_df.loc[
                restaurants_df["restaurant_id"] == restaurant_id,
                "restaurant_type"
            ]

            if match.empty:
                continue  # skip invalid restaurant_id

            rtype = match.iloc[0]

            rating = sample_rating(archetype, rtype)


            reviews.append({
                "review_id": f"rev{review_id:05d}",
                "reviewer_id": uid,
                "restaurant_id": restaurant_id,
                "restaurant_city": city,
                "timestamp": random_date(start, end),
                "rating": rating,
            })
            review_id += 1

    reviews_df = pd.DataFrame(reviews)

    # Save
    restaurants_path = os.path.join(DATA_DIR, "restaurants.csv")
    reviews_path = os.path.join(DATA_DIR, "reviews.csv")
    restaurants_df.to_csv(restaurants_path, index=False)
    reviews_df.to_csv(reviews_path, index=False)

    print("✅ Wrote:")
    print(" -", restaurants_path)
    print(" -", reviews_path)
    print("Restaurants:", len(restaurants_df), "Reviews:", len(reviews_df), "Unique reviewers:", reviews_df["reviewer_id"].nunique())

if __name__ == "__main__":
    main()
