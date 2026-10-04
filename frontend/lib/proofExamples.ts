import type { ProofCardItem } from "@/components/ProofCard";

// Real examples used as the trust proof-point on the homepage (and, for one
// of them, the About page) -- a curated, static pick (not a live fetch),
// same batch-pipeline philosophy as the rest of the product. These are the
// three largest local-vs-tourist rating gaps in backend/data.csv among
// restaurants both sides still rate 4.0+ (so the gap is "locals love it a
// bit more," not "tourists think it's bad") -- checked by looking at each
// actual photo, not just its data row. Revisit if a future data refresh
// changes these numbers.
export const PROOF_EXAMPLES: ProofCardItem[] = [
  {
    name: "Yopcity Restaurant",
    neighborhood: "Belmont",
    cuisine: "American",
    imageUrl: "https://komriwzkkknrsirifgqg.supabase.co/storage/v1/object/public/restaurant-photos/r_243c5d.jpg",
    localRating: 4.5,
    touristRating: 4.1,
  },
  {
    name: "Grandma’s Dumpling House",
    neighborhood: "Tribeca",
    cuisine: "Chinese",
    imageUrl: "https://komriwzkkknrsirifgqg.supabase.co/storage/v1/object/public/restaurant-photos/r_7a662f.jpg",
    localRating: 4.7,
    touristRating: 4.4,
  },
  {
    name: "Veselka Williamsburg",
    neighborhood: "Williamsburg",
    cuisine: "Ukrainian",
    imageUrl: "https://komriwzkkknrsirifgqg.supabase.co/storage/v1/object/public/restaurant-photos/r_742cf1.jpg",
    localRating: 4.6,
    touristRating: 4.3,
  },
];
