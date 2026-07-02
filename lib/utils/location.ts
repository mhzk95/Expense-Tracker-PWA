export interface RichLocation {
  lat?: number;
  lon?: number;
  display?: string; // User friendly name / POI name
  place_name?: string; // Suburb/Neighborhood
  city?: string;
  country?: string;
  source?: "overpass" | "google_link" | "nominatim" | "manual";
  rawUrl?: string;
}


export async function reverseGeocodeNominatim(lat: number, lon: number): Promise<Partial<RichLocation> | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { "Accept-Language": "en" } }
    );
    if (!res.ok) return null;
    const geo = await res.json();
    
    const place = geo.address?.suburb || geo.address?.neighbourhood || geo.address?.city_district || "";
    const city = geo.address?.city || geo.address?.town || geo.address?.village || "";
    const country = geo.address?.country || "";
    
    // Some regions might not have a suburb, fallback to city
    const display = [place, city].filter(Boolean).join(", ");
    
    return {
      display: display || "Unknown Location",
      place_name: place,
      city,
      country,
      lat,
      lon,
      source: "nominatim"
    };
  } catch (error) {
    console.error("Nominatim API error:", error);
    return null;
  }
}

export async function resolveLocationFromCoordinates(lat: number, lon: number): Promise<Partial<RichLocation> | null> {
  return await reverseGeocodeNominatim(lat, lon);
}

export function parseGoogleMapsUrl(url: string): Partial<RichLocation> | null {
  try {
    // Standard long URLs: https://www.google.com/maps/place/Starbucks/@37.77,-122.41,15z/...
    const placeMatch = url.match(/\/place\/([^\/]+)\//);
    const coordsMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    
    if (placeMatch) {
      let displayName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      // Remove any trailing coordinates or query strings if accidentally captured
      displayName = displayName.split('/')[0].split(',')[0].trim();
      
      const loc: Partial<RichLocation> = {
        display: displayName,
        source: "google_link",
        rawUrl: url
      };
      
      if (coordsMatch) {
        loc.lat = parseFloat(coordsMatch[1]);
        loc.lon = parseFloat(coordsMatch[2]);
      }
      return loc;
    }
    
    // Just coordinates in URL
    if (coordsMatch) {
      return {
        lat: parseFloat(coordsMatch[1]),
        lon: parseFloat(coordsMatch[2]),
        source: "google_link",
        rawUrl: url
      };
    }
  } catch (e) {
    console.error("Error parsing maps URL:", e);
  }
  return null;
}
