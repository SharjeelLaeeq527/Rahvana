import { PKMCenter } from "./(data)/punjab-pkm-centers";

/**
 * Calculates the distance between two points in kilometers using the Haversine formula.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Geocodes a search query using Nominatim (OpenStreetMap).
 * Limits search to the specified province in Pakistan.
 */
export async function geocodeAddress(
  query: string,
  province: string = "Punjab"
): Promise<{ lat: number; lng: number } | null> {
  try {
    // Map province codes to full names for better geocoding results
    const provinceMapping: { [key: string]: string } = {
      KPK: "Khyber Pakhtunkhwa",
      Punjab: "Punjab",
      Balochistan: "Balochistan",
      Sindh: "Sindh",
    };

    const fullProvinceName = provinceMapping[province] || province;
    const encodedQuery = encodeURIComponent(`${query}, ${fullProvinceName}, Pakistan`);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1&countrycodes=pk`
    );
    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

/**
 * Finds the nearest PKM centers from a provided list to a given location.
 */
export function findNearestCenters(
  lat: number,
  lng: number,
  centers: PKMCenter[],
  limit: number = 5
): (PKMCenter & { distance: number })[] {
  const centersWithDistance = centers.map((center) => ({
    ...center,
    distance: calculateDistance(lat, lng, center.lat, center.lng),
  }));

  return centersWithDistance.sort((a, b) => a.distance - b.distance).slice(0, limit);
}
