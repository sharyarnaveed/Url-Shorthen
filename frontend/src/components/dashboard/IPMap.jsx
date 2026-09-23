import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Globe } from 'lucide-react';

export default function IPMap({ ipList }) {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const [ipLocations, setIpLocations] = useState([]);

  useEffect(() => {
    const fetchLocations = async () => {
      const apiKey = import.meta.env.VITE_IP_API;
      if (!apiKey || ipList.length === 0) return;
      
      const newLocations = [];
      // Limit to top 50 to avoid slow loading / API limits
      for (const item of ipList.slice(0, 50)) {
        if (item.ip === 'Direct / Local IP' || item.ip === '127.0.0.1') continue;
        try {
          const res = await fetch(`https://api.ipapi.is?q=${item.ip}&key=${apiKey}`);
          const data = await res.json();
          if (data.location && data.location.latitude && data.location.longitude) {
            newLocations.push({
              ip: item.ip,
              clicks: item.clicks,
              lat: data.location.latitude,
              lng: data.location.longitude,
              city: data.location.city || 'Unknown',
              country: data.location.country || 'Unknown'
            });
          }
        } catch (e) {
          console.error("Failed to fetch location for", item.ip, e);
        }
      }
      setIpLocations(newLocations);
    };

    fetchLocations();
  }, [ipList]);

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!mapInstance.current) {
      mapInstance.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [0, 20],
        zoom: 1.5,
      });
      mapInstance.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    }

    // Clear old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    if (mapInstance.current && ipLocations.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      let hasValidBounds = false;

      ipLocations.forEach(loc => {
        const popup = new maplibregl.Popup({ offset: 25 })
          .setHTML(`<div style="color: black;"><strong>${loc.ip}</strong><br/>${loc.city}, ${loc.country}<br/>Clicks: ${loc.clicks}</div>`);

        const marker = new maplibregl.Marker()
          .setLngLat([loc.lng, loc.lat])
          .setPopup(popup)
          .addTo(mapInstance.current);
          
        markersRef.current.push(marker);
        bounds.extend([loc.lng, loc.lat]);
        hasValidBounds = true;
      });

      if (hasValidBounds) {
        mapInstance.current.fitBounds(bounds, { padding: 50, maxZoom: 10 });
      }
    }
  }, [ipLocations]);

  return (
    <div className="dash-analytics-card" style={{ marginTop: '24px' }}>
      <div className="dash-analytics-card-header">
        <div>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} /> Geographic Distribution
          </h4>
          <p>Global map of where your clicks are originating from</p>
        </div>
      </div>
      <div 
        ref={mapContainer} 
        style={{ width: '100%', height: '400px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}
      />
    </div>
  );
}
