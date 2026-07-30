// Coordenadas aproximadas (centro del distrito) para los distritos más
// comunes de Lima. Se usan como fallback cuando el inmueble no tiene
// lat/lng propias, para poder mostrar el mapa de listado y el mapa de la
// ficha sin depender de un servicio de geocodificación de pago.
export const LIMA_DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  'miraflores': { lat: -12.1211, lng: -77.0295 },
  'san isidro': { lat: -12.0977, lng: -77.0365 },
  'san borja': { lat: -12.1083, lng: -76.9975 },
  'surco': { lat: -12.1352, lng: -76.9931 },
  'santiago de surco': { lat: -12.1352, lng: -76.9931 },
  'barranco': { lat: -12.1494, lng: -77.0198 },
  'la molina': { lat: -12.0868, lng: -76.9391 },
  'san miguel': { lat: -12.0775, lng: -77.0862 },
  'jesus maria': { lat: -12.0736, lng: -77.0486 },
  'jesús maría': { lat: -12.0736, lng: -77.0486 },
  'lince': { lat: -12.0868, lng: -77.0339 },
  'magdalena del mar': { lat: -12.0928, lng: -77.0722 },
  'magdalena': { lat: -12.0928, lng: -77.0722 },
  'pueblo libre': { lat: -12.0742, lng: -77.0631 },
  'chorrillos': { lat: -12.1747, lng: -77.0181 },
  'cercado de lima': { lat: -12.0464, lng: -77.0428 },
  'lima': { lat: -12.0464, lng: -77.0428 },
  'breña': { lat: -12.0586, lng: -77.0508 },
  'brena': { lat: -12.0586, lng: -77.0508 },
  'la victoria': { lat: -12.0656, lng: -77.0173 },
  'rimac': { lat: -12.0294, lng: -77.0311 },
  'rímac': { lat: -12.0294, lng: -77.0311 },
  'los olivos': { lat: -11.9711, lng: -77.0714 },
  'san martin de porres': { lat: -12.0089, lng: -77.0839 },
  'independencia': { lat: -11.9903, lng: -77.0508 },
  'comas': { lat: -11.9425, lng: -77.0489 },
  'ate': { lat: -12.0261, lng: -76.9178 },
  'santa anita': { lat: -12.0453, lng: -76.9686 },
  'san juan de lurigancho': { lat: -11.9895, lng: -77.0100 },
  'san juan de miraflores': { lat: -12.1553, lng: -76.9683 },
  'villa el salvador': { lat: -12.2117, lng: -76.9367 },
  'villa maria del triunfo': { lat: -12.1614, lng: -76.9358 },
  'callao': { lat: -12.0555, lng: -77.1181 },
  'pucusana': { lat: -12.4808, lng: -76.7947 },
};

const LIMA_CENTER = { lat: -12.0464, lng: -77.0428 };

export function getDistrictCoords(district: string): { lat: number; lng: number } {
  const key = district.trim().toLowerCase();
  return LIMA_DISTRICT_COORDS[key] ?? LIMA_CENTER;
}
