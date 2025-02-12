import React, { useEffect, useState } from 'react'

let isMapLoaded = false // Flag to prevent multiple script injections

const MapLoader = ({ onMapLoad }) => {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isMapLoaded || window.google) {
      // Google Maps API already loaded, call the onMapLoad callback
      if (window.google) onMapLoad()
      return
    }

    isMapLoaded = true

    // Define initMap in the global scope
    window.initMap = () => {
      if (window.google && window.google.maps) {
        console.log('Google Maps API loaded successfully')
        setIsLoading(false)
        onMapLoad()
      } else {
        console.error('Google Maps API failed to load')
      }
    }

    // Create the script element for Google Maps API
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&callback=initMap`
    script.async = true
    script.defer = true
    script.onerror = () => {
      console.error('Error loading Google Maps API script')
      isMapLoaded = false
    }

    // Append the script to the document body
    document.body.appendChild(script)

    return () => {
      if (!window.google) {
        document.body.removeChild(script)
        isMapLoaded = false
      }
    }
  }, [onMapLoad])

  return null
}

export default MapLoader
