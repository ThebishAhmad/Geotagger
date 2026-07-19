export interface GeocodeResult {
  address: string;
  lat: number;
  lng: number;
}

export async function searchLocation(query: string): Promise<GeocodeResult | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.append("q", query);
    url.searchParams.append("format", "json");
    url.searchParams.append("limit", "1");
    url.searchParams.append("addressdetails", "1");

    const response = await fetch(url.toString(), {
      headers: {
        "Accept-Language": "en",
      },
    });
    
    if (!response.ok) return null;

    const data = await response.json();
    if (!data || data.length === 0) return null;

    const result = data[0];
    
    return {
      address: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    };
  } catch (error) {
    console.error("Geocoding failed:", error);
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.append("lat", lat.toString());
    url.searchParams.append("lon", lng.toString());
    url.searchParams.append("format", "json");

    const response = await fetch(url.toString(), {
      headers: {
        "Accept-Language": "en",
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.display_name || null;
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return null;
  }
}
