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

export async function fetchOverpassPOI(lat: number, lon: number, radius = 50): Promise<Partial<RichLocation> | null> {
  const query = `
    [out:json][timeout:5];
    (
      node["name"]["amenity"](around:${radius},${lat},${lon});
      node["name"]["shop"](around:${radius},${lat},${lon});
      node["name"]["leisure"](around:${radius},${lat},${lon});
      node["name"]["tourism"](around:${radius},${lat},${lon});
      node["name"]["office"](around:${radius},${lat},${lon});
      way["name"]["amenity"](around:${radius},${lat},${lon});
      way["name"]["shop"](around:${radius},${lat},${lon});
    );
    out center 1;
  `;

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
    });
    
    if (!res.ok) return null;
    const data = await res.json();
    
    if (data.elements && data.elements.length > 0) {
      const el = data.elements[0];
      const name = el.tags?.name;
      if (name) {
        return {
          display: name,
          lat: el.lat || el.center?.lat || lat,
          lon: el.lon || el.center?.lon || lon,
          source: "overpass"
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Overpass API error:", error);
    return null;
  }
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
  // 1. Try Overpass first for exact POI
  const overpassResult = await fetchOverpassPOI(lat, lon);
  if (overpassResult?.display) {
    return overpassResult;
  }
  
  // 2. Fallback to generic Nominatim
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
      displayName = displayName.split('/')[0];
      
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
