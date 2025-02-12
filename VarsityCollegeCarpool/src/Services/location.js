/**
 * Retrieves the user's location and sends it through a WebSocket.
 * @param {Object} webSocketRef - A React ref to the WebSocket connection.
 * @returns {Promise<Object>} A promise resolving with the location data.
 */
export async function getUserLocation(webSocketRef) {
  if (!('geolocation' in navigator)) {
    throw new Error('Geolocation is not supported by this browser.')
  }

  try {
    const userId = parseInt(localStorage.getItem('UserId') || '0', 10)
    const token = localStorage.getItem('token')
    const apiUrl = `${process.env.REACT_APP_API_URL}/api/Register/user/${userId}`

    // Fetch user data
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.statusText}`)
    }

    const userData = await response.json()
    console.log('User data fetched:', userData)

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          console.log('Latitude:', latitude, 'Longitude:', longitude)

          // Ensure WebSocket is open before sending
          if (webSocketRef?.current?.readyState === WebSocket.OPEN) {
            const locationData = {
              Name: userData.name,
              Latitude: latitude,
              Longitude: longitude,
            }

            // Send location data through WebSocket
            console.log('Sending location data via WebSocket:', locationData)
            webSocketRef.current.send(JSON.stringify(locationData))

            // Resolve the promise
            resolve(locationData)
          } else {
            reject(new Error('WebSocket is not open.'))
          }
        },
        (error) => {
          reject(new Error('Error retrieving location: ' + error.message))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    })
  } catch (error) {
    console.error('Error in getUserLocation:', error.message)
    throw error // Rethrow to handle this upstream
  }
}
