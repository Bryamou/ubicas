import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import type { Property } from '@/types/database';

// Fix del ícono por defecto de Leaflet: al empaquetar con Vite las rutas
// relativas a los PNG del paquete se rompen, así que apuntamos a los
// assets servidos por el CDN de unpkg (misma versión que la dependencia).
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapPropertyPin extends Pick<Property, 'id' | 'title' | 'price' | 'currency' | 'operation' | 'district'> {
  lat: number;
  lng: number;
  coverImageUrl: string | null;
}

interface PropertyMapViewProps {
  properties: MapPropertyPin[];
  height?: string;
}

function formatPrice(price: number, currency: string) {
  const symbol = currency === 'USD' ? 'US$' : 'S/';
  return `${symbol} ${price.toLocaleString('es-PE')}`;
}

export function PropertyMapView({ properties, height = '600px' }: PropertyMapViewProps) {
  const center: [number, number] =
    properties.length > 0 ? [properties[0].lat, properties[0].lng] : [-12.0464, -77.0428];

  return (
    <div style={{ height }} className="overflow-hidden rounded-card border border-border">
      <MapContainer center={center} zoom={12} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {properties.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={markerIcon}>
            <Popup>
              <Link to={`/inmuebles/${p.id}`} className="flex flex-col gap-1">
                {p.coverImageUrl && (
                  <img src={p.coverImageUrl} alt="" className="h-20 w-full rounded object-cover" />
                )}
                <span className="text-sm font-bold text-ink">{formatPrice(p.price, p.currency)}</span>
                <span className="text-xs text-ink">{p.title}</span>
                <span className="text-xs text-ink-light">{p.district}</span>
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
