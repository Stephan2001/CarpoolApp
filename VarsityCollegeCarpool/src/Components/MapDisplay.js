import React, { useState, useEffect } from 'react'
import { GoogleMap, Marker } from '@react-google-maps/api'

export default function MapDisplay({
  locations = [],
  currentUserLocation,
  width,
  height,
}) {
  const [isMapReady, setIsMapReady] = useState(false)
  const [center, setCenter] = useState({
    lat: -29.609988, // Central latitude for South Africa
    lng: 26.015614, // Central longitude for South Africa
  })
  const [mapInstance, setMapInstance] = useState(null) // Store map instance

  useEffect(() => {
    if (window.google) {
      setIsMapReady(true) // Ensure map is ready only after API is loaded
    }
  }, [])

  const validLocations = locations.filter(
    (loc) =>
      loc &&
      !isNaN(parseFloat(loc.Latitude)) &&
      !isNaN(parseFloat(loc.Longitude))
  )

  const handleCenterChanged = () => {
    if (mapInstance) {
      const newCenter = {
        lat: mapInstance.getCenter().lat(),
        lng: mapInstance.getCenter().lng(),
      }
      setCenter(newCenter)
    }
  }

  // Function to handle marker click and open the location in Google Maps
  const handleMarkerClick = (location) => {
    const lat = parseFloat(location.Latitude)
    const lng = parseFloat(location.Longitude)
    // Generate the Google Maps URL
    const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`
    // Open the URL in a new tab
    window.open(googleMapsUrl, '_blank')
  }

  return (
    isMapReady && (
      <GoogleMap
        mapContainerStyle={{
          width: `${width}px`,
          height: `${height}px`,
        }}
        zoom={7}
        center={center} // Controlled center state
        onLoad={(map) => setMapInstance(map)} // Capture map instance
        onDragEnd={handleCenterChanged} // Use the correct map instance
        onIdle={handleCenterChanged} // Use the correct map instance
      >
        {/* Render current user marker */}
        {currentUserLocation && (
          <Marker
            key="currentUser"
            position={{
              lat: parseFloat(currentUserLocation.Latitude),
              lng: parseFloat(currentUserLocation.Longitude),
            }}
            title="You"
            icon={{
              url: 'https://your-icon-url.com/icon.png',
              scaledSize: new window.google.maps.Size(30, 30),
            }}
          />
        )}

        {/* Render other user markers */}
        {validLocations.map((location, index) => (
          <Marker
            key={index}
            position={{
              lat: parseFloat(location.Latitude),
              lng: parseFloat(location.Longitude),
            }}
            title={location.Name || `User ${index + 1}`}
            onClick={() => handleMarkerClick(location)} // Handle click
          />
        ))}
      </GoogleMap>
    )
  )
}
