export function getTileCoordinates(lat: number, lng: number, z: number = 15) {
  const x = Math.floor((lng + 180) / 360 * Math.pow(2, z));
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
  return { x, y, z };
}

export function getStaticMapUrl(lat: number, lng: number, apiKey?: string): string {
  // Use Google Satellite Tiles directly (Free, no key required, CORS supported)
  const { x, y, z } = getTileCoordinates(lat, lng, 15);
  return `https://mt1.google.com/vt/lyrs=s&x=${x}&y=${y}&z=${z}`;
}
