import React, { useState, useEffect } from 'react'
import '../Styling/NotificationsPage.css'
import NavBar from '../../src/Components/NavBar.tsx'

interface JoinRequest {
  joinRequestId: number
  senderUserId: number
  groupId: number
  senderName: string
  recieverUserId: number
}

interface Notification {
  message: string
  senderName: string
  notificationType: string
}

const NotificationsPage: React.FC = () => {
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const userId = parseInt(localStorage.getItem('UserId') || '0')
  const token = localStorage.getItem('token') || '0'
  const [showNavBar, setShowNavBar] = useState(false)

  useEffect(() => {
    // Fetch join requests from API
    const fetchJoinRequests = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/joinrequest/alljoinrequests`
        )
        if (!response.ok) {
          throw new Error('Failed to fetch join requests')
        }
        const data = await response.json()
        setJoinRequests(data)
      } catch (error) {
        console.error('Error fetching join requests:', error)
      }
    }
    fetchJoinRequests()

    // Load initial notifications from localStorage
    const loadNotifications = () => {
      const storedNotifications = JSON.parse(
        localStorage.getItem('ReceivedNotification') || '[]'
      )
      setNotifications(storedNotifications)
    }
    loadNotifications()

    // Periodically check localStorage for notification updates
    const intervalId = setInterval(() => {
      loadNotifications()
    }, 1000) // Adjust the interval as needed

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId)
  }, [])

  const handleClearNotification = (index: number) => {
    const actualIndex = notifications.length - 1 - index
    const updatedNotifications = notifications.filter(
      (_, i) => i !== actualIndex
    )
    setNotifications(updatedNotifications)
    localStorage.setItem(
      'ReceivedNotification',
      JSON.stringify(updatedNotifications)
    )
  }

  const handleAccept = async (joinRequestId: number) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/joinrequest/acceptrequest/${joinRequestId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (!response.ok) {
        throw new Error('Failed to accept join request')
      }
      setJoinRequests((prevRequests) =>
        prevRequests.filter(
          (request) => request.joinRequestId !== joinRequestId
        )
      )
      alert('Join request accepted')
    } catch (error) {
      console.error('Error accepting join request:', error)
      alert('Failed to accept join request')
    }
  }

  const handleDecline = async (joinRequestId: number) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/joinrequest/declinerequest/${joinRequestId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (!response.ok) {
        throw new Error('Failed to decline join request')
      }
      setJoinRequests((prevRequests) =>
        prevRequests.filter(
          (request) => request.joinRequestId !== joinRequestId
        )
      )
      alert('Join request declined')
    } catch (error) {
      console.error('Error declining join request:', error)
      alert('Failed to decline join request')
    }
  }

  const filteredRequests = joinRequests.filter(
    (request) => request.recieverUserId === userId
  )

  return (
    <div className='notifications-container'>
      <button onClick={() => setShowNavBar(true)} className='hamburger-icon'>
        ☰
      </button>
      {showNavBar && <NavBar onClose={() => setShowNavBar(false)} />}

      <h1 style={{ marginTop: '80px' }} className='notifications-title'>
        Join Requests
      </h1>
      <div className='notification-table'>
        <div className='notificationList'>
          {filteredRequests.map((request) => (
            <div key={request.joinRequestId} className='notificationCard'>
              <div className='userIcon'></div>
              <div className='notificationContent'>
                <div className='notificationTitle'>
                  <b>{request.senderName}</b> Sent a Group Join Request
                </div>
                <div className='actionButtons'>
                  <button
                    onClick={() => handleAccept(request.joinRequestId)}
                    className='acceptButton'
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(request.joinRequestId)}
                    className='declineButton'
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <h1 className='notifications-title'>Notifications</h1>
      <div className='notification-table'>
        <div className='notificationList'>
          {notifications.length > 0 ? (
            [...notifications].reverse().map((notification, index) => (
              <div key={index} className='notificationCard'>
                <div className='userIcon'></div>
                <div className='notificationContent'>
                  <div>
                    <b className='notificationType'>
                      {notification.notificationType}
                    </b>
                  </div>
                  <div>
                    <b className='senderName'>{notification.senderName}</b>
                  </div>
                  <div className='message'>{notification.message}</div>
                </div>
                <div className='action-buttons'>
                  <button
                    className='declineButton'
                    onClick={() => handleClearNotification(index)}
                  >
                    Clear
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>No notifications available.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage
