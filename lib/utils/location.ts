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
    let lat: number | undefined;
    let lon: number | undefined;

    // Pattern 1: @lat,lon in path
    const coordsMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordsMatch) {
      lat = parseFloat(coordsMatch[1]);
      lon = parseFloat(coordsMatch[2]);
    } else {
      // Pattern 2: query params like q=lat,lon or ll=lat,lon
      const queryMatch = url.match(/[\?&](q|query|ll|loc)=([-+]?\d+\.\d+),([-+]?\d+\.\d+)/) ||
                         url.match(/[\?&](q|query|ll|loc)=loc:([-+]?\d+\.\d+),([-+]?\d+\.\d+)/);
      if (queryMatch) {
        const num1 = parseFloat(queryMatch[2]);
        const num2 = parseFloat(queryMatch[3]);
        if (!isNaN(num1) && !isNaN(num2)) {
          lat = num1;
          lon = num2;
        }
      } else {
        // Pattern 3: fallback coordinates match anywhere in url
        const fallbackMatch = url.match(/([-+]?\d+\.\d+),([-+]?\d+\.\d+)/);
        if (fallbackMatch) {
          const num1 = parseFloat(fallbackMatch[1]);
          const num2 = parseFloat(fallbackMatch[2]);
          if (Math.abs(num1) <= 90 && Math.abs(num2) <= 180) {
            lat = num1;
            lon = num2;
          }
        }
      }
    }

    // Extract place name
    const placeMatch = url.match(/\/place\/([^\/]+)\//);
    let displayName: string | undefined;
    if (placeMatch) {
      displayName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      displayName = displayName.split('/')[0].split(',')[0].trim();
    } else {
      const qParamMatch = url.match(/[\?&]q=([^&]+)/);
      if (qParamMatch) {
        const decoded = decodeURIComponent(qParamMatch[1].replace(/\+/g, ' '));
        if (!decoded.match(/^[-+]?\d+\.\d+,[-+]?\d+\.\d+$/) && !decoded.startsWith("loc:")) {
          displayName = decoded;
        }
      }
    }

    if (lat !== undefined && lon !== undefined) {
      return {
        lat,
        lon,
        display: displayName,
        source: "google_link",
        rawUrl: url
      };
    }

    if (displayName) {
      return {
        display: displayName,
        source: "google_link",
        rawUrl: url
      };
    }
  } catch (e) {
    console.error("Error parsing maps URL:", e);
  }
  return null;
}
