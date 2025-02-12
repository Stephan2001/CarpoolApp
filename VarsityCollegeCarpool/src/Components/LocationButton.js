import React, { useState, useEffect, useRef } from 'react'
import MapLoader from './MapLoader'
import { getUserLocation } from '../Services/location.js'
import PopUp from '../Components/MapPopup.js'
import MapDisplay from '../Components/MapDisplay.js'

export default function LocationButton() {
  const webSocketRef = useRef(null)
  const intervalRef = useRef(null)
  const [isSharing, setIsSharing] = useState(false)
  const [locations, setLocations] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [currentUserLocation, setCurrentUserLocation] = useState(null)
  const [groupId, setGroupId] = useState(
    parseInt(localStorage.getItem('GroupId') || '0')
  )

  const handleMapLoad = () => {
    console.log('Google Maps API is ready')
  }

  const fetchGroupId = async () => {
    try {
      const token = localStorage.getItem('token') // Adjust as necessary
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/User/getusergroup`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        console.error('Failed to fetch group ID:', response.statusText)
        return
      }

      const data = await response.json()

      if (data.groupId) {
        localStorage.setItem('GroupId', data.groupId.toString())
        setGroupId(data.groupId)
      } else {
        console.warn('No group ID found for the user')
      }
    } catch (error) {
      console.error('Error fetching group ID:', error)
    }
  }

  useEffect(() => {
    if (groupId === 0) {
      fetchGroupId()
    }
  }, [groupId])

  useEffect(() => {
    if (groupId === 0) return // Wait until groupId is set

    console.log(`${groupId} this is my group id`)
    const serverUri = `${process.env.REACT_APP_WEBSOCKET}/ws?groupId=${groupId}`
    let reconnectAttempts = 0

    const connectWebSocket = () => {
      webSocketRef.current = new WebSocket(serverUri)

      webSocketRef.current.onopen = () => {
        console.log('Connected to WebSocket server!')
        setIsConnected(true)
        reconnectAttempts = 0
      }

      webSocketRef.current.onmessage = (event) => {
        try {
          const receivedData = JSON.parse(event.data)
          setLocations(receivedData)
        } catch (error) {
          console.error('Error parsing received data:', error)
        }
      }

      webSocketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setIsConnected(false)
      }

      webSocketRef.current.onclose = () => {
        console.error('WebSocket connection closed.')
        setIsConnected(false)
      }
    }

    connectWebSocket()

    return () => {
      if (webSocketRef.current) webSocketRef.current.close()
      stopLocationSharing()
    }
  }, [groupId])

  const sendUserLocation = () => {
    getUserLocation(webSocketRef)
      .then((location) => {
        setCurrentUserLocation(location) // Set current user's location
        if (
          webSocketRef.current &&
          webSocketRef.current.readyState === WebSocket.OPEN
        ) {
          webSocketRef.current.send(JSON.stringify(location))
          console.log('Location data sent:', location)
        } else {
          console.error('WebSocket is not open. Retrying in 2 seconds...')
          setTimeout(sendUserLocation, 2000)
        }
      })
      .catch((error) => {
        console.error('Error fetching user location:', error)
      })
  }

  const startLocationSharing = () => {
    if (!isSharing && webSocketRef.current?.readyState === WebSocket.OPEN) {
      setIsSharing(true)
      intervalRef.current = setInterval(sendUserLocation, 5000)
    } else {
      console.error('Cannot start location sharing. WebSocket is not open.')
    }
  }

  const stopLocationSharing = () => {
    if (isSharing) {
      setIsSharing(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }

  const toggleLocationSharing = () => {
    if (isSharing) {
      stopLocationSharing()
    } else {
      startLocationSharing()
    }
  }

  return (
    <div>
      <button
        className="location-button"
        onClick={toggleLocationSharing}
        disabled={!isConnected}
        style={{
          backgroundColor: isSharing ? 'red' : '',
          color: isSharing ? 'white' : '',
        }}
      >
        {isSharing ? 'Stop Sharing' : 'Share Location'}
      </button>
      <MapLoader onMapLoad={handleMapLoad} />
      {isSharing && <PopUp locations={locations} />}
      <MapDisplay
        locations={locations}
        currentUserLocation={currentUserLocation}
      />
    </div>
  )
}
