import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../Styling/NavBar.css'
import listenForMessages, {
  unsubscribeFromMessages,
} from '../Services/notificationService.ts'
import listenForPrivateMessages, {
  unsubscribeFromPrivateMessages,
} from '../Services/privateNotificationService.ts'

interface NavBarProps {
  onClose: () => void
}

const NavBar: React.FC<NavBarProps> = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [username, setUsername] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)

  const groupId = parseInt(localStorage.getItem('GroupId') || '0')

  const navigate = useNavigate()

  useEffect(() => {
    setIsOpen(true)

    // Fetch user data
    const fetchUserData = async () => {
      try {
        const userId = parseInt(localStorage.getItem('UserId') || '0')
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/Register/user/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        )
        if (!response.ok) {
          throw new Error('Failed to fetch user data.')
        }

        const data = await response.json()
        setProfileImage(data.profileImage || null)
        setUsername(data.name || 'Unknown User')
        setLoading(false)
      } catch (err) {
        console.error('Error fetching user data:', err)
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleLogout = () => {
    unsubscribeFromMessages() // Unsubscribe from notifications
    unsubscribeFromPrivateMessages()
    localStorage.removeItem('GroupId')
    localStorage.removeItem('UserId')
    localStorage.removeItem('token')
    navigate('/login') // Redirect to login
    window.location.reload()
  }

  const handleNavigation = (path: string) => {
    setIsOpen(false)
    setTimeout(() => {
      navigate(path)
      onClose()
    }, 300)
  }

  return (
    <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
      <button
        className='close-nav'
        onClick={() => {
          setIsOpen(false)
          setTimeout(onClose, 300)
        }}
      >
        &times;
      </button>
      <div
        className='profile-section'
        onClick={() => handleNavigation('/profile')}
      >
        <div className='profile-icon'>
          {profileImage ? (
            <img src={profileImage} alt='Profile' />
          ) : (
            <i className='fas fa-user'></i>
          )}
        </div>
        <p className='username'>{loading ? 'Loading...' : username} </p>
      </div>
      <ul className='nav-items'>
        <li>
          <div
            className='nav-link'
            onClick={() => handleNavigation('/dashboard')}
          >
            <img
              className='nav-icon'
              src='/Images/HomeIcon.png'
              alt='Dashboard'
            />{' '}
            Dashboard
          </div>
        </li>
        <li>
          <div
            className='nav-link'
            onClick={() => handleNavigation('/notifications')}
          >
            <img
              className='nav-icon'
              src='/Images/NotificationsIcon.png'
              alt='Notifications'
            />{' '}
            Notifications
          </div>
        </li>
        <li>
          <div
            className='nav-link'
            onClick={() => handleNavigation('/view-group')}
          >
            <img
              className='nav-icon'
              src='/Images/GroupsIcon.png'
              alt='My Group'
            />{' '}
            My Group
          </div>
        </li>
      </ul>
      <div className='logout-container'>
        <button className='logout-button' onClick={handleLogout}>
          <img
            className='logout-icon'
            src='/Images/LogoutIcon.png'
            alt='Logout'
          />{' '}
          Logout
        </button>
      </div>
    </nav>
  )
}

export default NavBar
