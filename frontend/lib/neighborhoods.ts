// Approximate center coordinates for each neighborhood in the dataset.
// Used to match a device location to a neighborhood ("Near me") and, when
// someone declines location access, to stand in for where they are.
export const NEIGHBORHOOD_COORDS: Record<string, [number, number]> = {
  // Manhattan
  "Battery Park City": [40.7117, -74.0154],
  "Chelsea": [40.7465, -74.0014],
  "East Harlem": [40.7957, -73.9425],
  "East Village": [40.7265, -73.9815],
  "Financial District": [40.7075, -74.0089],
  "Harlem": [40.8116, -73.9465],
  "Lower East Side": [40.7150, -73.9843],
  "Midtown": [40.7549, -73.9840],
  "Midtown East": [40.7550, -73.9680],
  "Murray Hill": [40.7489, -73.9760],
  "Roosevelt Island": [40.7620, -73.9510],
  "SoHo": [40.7233, -74.0030],
  "Tribeca": [40.7163, -74.0086],
  "Upper East Side": [40.7736, -73.9566],
  "Upper West Side": [40.7870, -73.9754],
  "Washington Heights": [40.8417, -73.9394],
  "West Village": [40.7336, -74.0027],
  // Brooklyn
  "Bay Ridge": [40.6264, -74.0310],
  "Bedford-Stuyvesant": [40.6834, -73.9413],
  "Bushwick": [40.6942, -73.9214],
  "Brooklyn Heights": [40.6960, -73.9936],
  "Crown Heights": [40.6694, -73.9422],
  "Downtown Brooklyn": [40.6930, -73.9867],
  "Dumbo": [40.7033, -73.9890],
  "Fort Greene": [40.6885, -73.9770],
  "Greenpoint": [40.7282, -73.9510],
  "Park Slope": [40.6710, -73.9814],
  "Prospect Lefferts Gardens": [40.6595, -73.9525],
  "Sunset Park": [40.6454, -74.0104],
  "Williamsburg": [40.7081, -73.9571],
  // Queens
  "Astoria": [40.7723, -73.9301],
  "Bayside": [40.7686, -73.7714],
  "Corona": [40.7450, -73.8602],
  "Elmhurst": [40.7360, -73.8780],
  "Flushing": [40.7580, -73.8296],
  "Forest Hills": [40.7185, -73.8443],
  "Jackson Heights": [40.7557, -73.8831],
  "Jamaica": [40.7029, -73.7898],
  "Long Island City": [40.7447, -73.9485],
  "Ridgewood": [40.7043, -73.9018],
  "Sunnyside": [40.7433, -73.9196],
  "Woodside": [40.7454, -73.9030],
  // Bronx
  "Belmont": [40.8537, -73.8876],
  "East Bronx": [40.8370, -73.8554],
  "Fordham Heights": [40.8615, -73.8985],
  "Melrose": [40.8246, -73.9127],
  "West Bronx": [40.8540, -73.9090],
};

export function findNearestNeighborhood(lat: number, lng: number, available: string[]): string | null {
  let best: string | null = null;
  let bestDist = Infinity;
  for (const name of available) {
    const coords = NEIGHBORHOOD_COORDS[name];
    if (!coords) continue;
    const dlat = lat - coords[0];
    const dlng = lng - coords[1];
    const dist = dlat * dlat + dlng * dlng;
    if (dist < bestDist) {
      bestDist = dist;
      best = name;
    }
  }
  return best;
}
