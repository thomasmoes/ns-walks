import { MapContainer, TileLayer, Polyline, Popup } from 'react-leaflet';
import { useState, useEffect } from 'react';
import './Map.css';

export default function Map() {
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    const gpxFiles = [
      '116-kennemerduinen.gpx',
      '125-strabrechtsche-heide.gpx',
      '659-waterlinie-culemborg.gpx',
      '660-uiterwaarden-van-cortenoever.gpx',
      '661-schiedam-jeneverstad.gpx',
      '665-overijsselse-buitenplaatsen.gpx',
      '667-limburgs-plateau.gpx',
      '670-hierdense-poort.gpx',
      '673-eiland-van-dordrecht.gpx',
      '677-blauwe-kamer-rhenen.gpx',
      '1084-krickenbecker-seen.gpx',
      '1085-helderse-duinen.gpx',
      '1086-hart-van-het-groene-woud.gpx',
      '1087-gein-en-vecht.gpx',
      '1329-duinen-van-zoutelande.gpx'];

    const loadGpxFiles = async () => {
      try {
        const loadedTracks = await Promise.all(
          gpxFiles.map(async (filename) => {
            try {
              const response = await fetch(`/${filename}`);
              const gpxText = await response.text();
              
              const parser = new DOMParser();
              const gpxDoc = parser.parseFromString(gpxText, 'text/xml');
              
              const defaultName = filename
                .replace('.gpx', '')
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              
              const name = gpxDoc.querySelector('trk > name')?.textContent || defaultName;
              const description = gpxDoc.querySelector('trk > desc')?.textContent || '';
              const trackPoints = Array.from(gpxDoc.getElementsByTagName('trkpt')).map(point => [
                parseFloat(point.getAttribute('lat')),
                parseFloat(point.getAttribute('lon'))
              ]);

              const distance = calculateDistance(trackPoints);
              const startPoint = trackPoints[0];
              const endPoint = trackPoints[trackPoints.length - 1];

              return {
                name,
                description,
                points: trackPoints,
                distance,
                startPoint,
                endPoint,
                filename
              };
            } catch (error) {
              console.error(`Error loading ${filename}:`, error);
              return null;
            }
          })
        );

        const validTracks = loadedTracks.filter(track => track !== null);
        console.log('Loaded tracks:', validTracks);
        setTracks(validTracks);
      } catch (error) {
        console.error('Error loading GPX files:', error);
      }
    };

    loadGpxFiles();
  }, []);

  const calculateDistance = (points) => {
    let distance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      distance += getDistanceFromLatLonInKm(
        points[i][0], points[i][1],
        points[i + 1][0], points[i + 1][1]
      );
    }
    return Math.round(distance * 10) / 10;
  };

  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <MapContainer
        center={[52.1326, 5.2913]}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {tracks.map((track, index) => (
          <Polyline
            key={track.filename}
            positions={track.points}
            color={`hsl(${(index * 360) / tracks.length}, 70%, 50%)`}
            weight={3}
            eventHandlers={{
              click: (e) => {
                e.target.openPopup(e.latlng);
              }
            }}
          >
            <Popup maxWidth={440}>
              <div className="flex flex-col items-start w-[440px] p-[30px] gap-[10px] bg-[#F1AE8F] shadow-[0_-20px_20px_0_rgba(0,0,0,0.25)]">
                <h3 className="text-lg font-bold m-0">{track.name}</h3>
                {track.description && (
                  <p className="text-sm m-0">{track.description}</p>
                )}
                <div className="text-sm w-full">
                  <p className="m-0 mb-1">
                    <strong>Distance:</strong> {track.distance} km
                  </p>
                  <p className="m-0 mb-1">
                    <strong>Estimated walking toime:</strong> {Math.ceil(track.distance * 12)} minutes
                  </p>
                  <p className="m-0">
                    <strong>Route ID:</strong> {track.filename.split('-')[0]}
                  </p>
                  <p className="m-0">
                    <strong>Start coordinates:</strong> {track.startPoint[0].toFixed(4)}, {track.startPoint[1].toFixed(4)}
                  </p>
                  <p className="m-0">
                    <strong>End coordinates:</strong> {track.endPoint[0].toFixed(4)}, {track.endPoint[1].toFixed(4)}
                  </p>
                </div>
              </div>
            </Popup>
          </Polyline>
        ))}
      </MapContainer>
    </div>
  );
}