import React, { useState, useEffect } from 'react'
import { Rnd } from 'react-rnd'
import MapDisplay from './MapDisplay'

const PopUp = ({ locations }) => {
  const [minimized, setMinimized] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })
  const [mapSize, setMapSize] = useState({
    width: isMobile ? 300 : 400,
    height: isMobile ? 200 : 300,
  })

  // Handle window resizing to adapt popup dimensions and center it
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768
      setIsMobile(newIsMobile)
      setMapSize({
        width: newIsMobile ? 300 : 400,
        height: newIsMobile ? 200 : 300,
      })

      // Recalculate popup position to stay centered
      setPopupPosition({
        x: (window.innerWidth - mapSize.width) / 2,
        y: (window.innerHeight - mapSize.height) / 2,
      })
    }

    // Set the initial position on component mount
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [isMobile, mapSize.width, mapSize.height])

  // Minimize/restore the popup
  const toggleMinimized = (e) => {
    e.stopPropagation()
    e.preventDefault()
    setMinimized((prev) => !prev)
  }

  return (
    <Rnd
      className="popup-centered"
      default={{
        x: popupPosition.x, // Centered based on calculated position
        y: popupPosition.y, // Centered based on calculated position
        width: mapSize.width,
        height: mapSize.height,
      }}
      size={{
        width: minimized ? (isMobile ? 150 : 200) : mapSize.width,
        height: minimized ? 50 : mapSize.height,
      }}
      onResizeStop={(e, direction, ref) => {
        setMapSize({
          width: parseInt(ref.style.width, 10),
          height: parseInt(ref.style.height, 10),
        })
      }}
      bounds="window"
      dragHandleClassName="popup-header"
      enableResizing={!minimized}
      style={{
        border: '1px solid #ccc',
        borderRadius: '8px',
        backgroundColor: 'white',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Popup Header */}
      <div
        className="popup-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f0f0f0',
          padding: '5px 10px',
          cursor: 'move',
        }}
        onDoubleClick={toggleMinimized}
      >
        <h4 style={{ margin: 0, fontSize: '14px', flex: 1, color: 'black' }}>
          {minimized ? 'Minimized' : 'Live Locations'}
        </h4>
        <button
          style={{
            background: 'none',
            border: 'none',
            fontSize: '14px',
            cursor: 'pointer',
          }}
          onClick={toggleMinimized} // Click event for desktop
          onTouchEnd={toggleMinimized} // Touch event for mobile
        >
          {minimized ? '🔼' : '🔽'}
        </button>
      </div>

      {/* Popup Content */}
      {!minimized && (
        <div
          className="popup-content"
          style={{
            height: 'calc(100% - 40px)', // Deduct header height
            width: '100%',
          }}
        >
          <MapDisplay
            locations={locations}
            width={mapSize.width}
            height={mapSize.height - 40}
          />
        </div>
      )}
    </Rnd>
  )
}

export default PopUp
