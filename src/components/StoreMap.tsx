"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// fix default icon in Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export type MapStore = { id: number; name: string; lat: number; lng: number; city: string };

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export default function StoreMap({
  userLat,
  userLng,
  radiusKm,
  stores,
}: {
  userLat: number;
  userLng: number;
  radiusKm: number;
  stores: MapStore[];
}) {
  if (!isFinite(userLat) || !isFinite(userLng)) return <div className="rounded border p-4 text-sm">Set location to see map.</div>;
  return (
    <MapContainer center={[userLat, userLng]} zoom={11} style={{ height: 320, width: "100%", borderRadius: 12 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
      <Recenter lat={userLat} lng={userLng} />
      <Marker position={[userLat, userLng]}>
        <Popup>You are here</Popup>
      </Marker>
      <Circle center={[userLat, userLng]} radius={radiusKm * 1000} pathOptions={{ color: "green", weight: 1 }} />
      {stores.filter((s) => s.lat !== 0).map((s) => (
        <Marker key={s.id} position={[s.lat, s.lng]}>
          <Popup><b>{s.name}</b><br />{s.city}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
