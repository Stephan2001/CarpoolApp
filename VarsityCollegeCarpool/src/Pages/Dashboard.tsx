// Dashboard.tsx
import React, { useEffect, useState } from 'react'
import '../Styling/Dashboard.css'
import { useNavigate } from 'react-router-dom'
import NavBar from '../../src/Components/NavBar.tsx'
import listenForMessages from '../Services/notificationService.ts'
import listenForPrivateMessages from '../Services/privateNotificationService.ts'
import debounce from 'lodash.debounce'

const Dashboard: React.FC = () => {
  const [groupId, setGroupId] = useState<number | null>(null)
  const navigate = useNavigate()
  const [searchName, setSearchName] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showNavBar, setShowNavBar] = useState(false)
  const groupId2 = parseInt(localStorage.getItem('GroupId') || '0')
  const userId = parseInt(localStorage.getItem('UserId') || '0')
  const [loadingGroupId, setLoadingGroupId] = useState(true)

  useEffect(() => {
    const fetchGroupId = async () => {
      const token = localStorage.getItem('token')
      if (!token) return

      setLoadingGroupId(true)
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/User/getusergroup`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (response.ok) {
          const data = await response.json()
          if (data.groupId) {
            localStorage.setItem('GroupId', data.groupId.toString())
            setGroupId(data.groupId)
          }
        }
      } catch (error) {
        console.error('Error fetching group ID:', error)
      } finally {
        setLoadingGroupId(false)
      }
    }

    fetchGroupId()
  }, [])

  const handleCreateGroupClick = () => {
    if (groupId) {
      alert('You Are Already In A Group!')
    } else {
      navigate('/create-group')
    }
  }

  const handleViewGroupClick = () => {
    if (!groupId) {
      alert('Please Join a Group First!')
    } else {
      navigate('/view-group')
    }
  }

  const handleJoinGroupClick = () => {
    if (groupId) {
      alert('You Are Already In A Group!')
    } else {
      navigate('/join-group')
    }
  }

  const fetchUsers = async (name: string) => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/user/search?name=${name}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Error fetching users.')
      }

      const data = await response.json()

      const updatedData = data.map((user: any) => ({
        ...user,

        profileImage: user.profileImage,
      }))

      // Update the users state with the modified data
      setUsers(updatedData)
    } catch (err) {
      setError('Error fetching users. Please try again.')
      console.error('Error searching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const debouncedFetchUsers = debounce(fetchUsers, 100)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    setSearchName(value)

    if (!value.trim()) {
      setUsers([])
      return
    }

    debouncedFetchUsers(value)
  }

  const handleUserClick = (userId: number) => {
    navigate(`/profile/${userId}`)
  }

  return (
    <div className='dashboard-container'>
      <button onClick={() => setShowNavBar(true)} className='hamburger-icon'>
        ☰
      </button>
      {showNavBar && <NavBar onClose={() => setShowNavBar(false)} />}
      <h2 style={{ marginTop: '80px' }} className='dashboard-title'>
        Dashboard
      </h2>
      <div className='button-group'>
        <button
          type='button'
          className='dashboard-button view-group'
          onClick={handleViewGroupClick}
          disabled={loadingGroupId}
        >
          {loadingGroupId ? 'Loading...' : 'View Group'}
        </button>
        <div className='row-buttons'>
          <button
            type='button'
            className='dashboard-button create-group'
            onClick={handleCreateGroupClick}
          >
            Create Group
            <br />
            (Driver)
          </button>
          <button
            type='button'
            className='dashboard-button join-group'
            onClick={handleJoinGroupClick}
          >
            Join Group
            <br />
            (Pax)
          </button>
        </div>
      </div>
      {/* User search section */}
      <div className='search-container'>
        <label htmlFor='search-user' className='search-label'>
          Search User:
        </label>
        <input
          type='text'
          id='search-user'
          className='search-input'
          value={searchName}
          onChange={handleSearchChange}
          placeholder='Enter name to search'
        />

        {loading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {/* Dropdown for user search results */}
        {users.length > 0 && (
          <ul className='search-dropdown'>
            {users.map((user) => (
              <li
                key={user.userId}
                className='dropdown-item'
                onClick={() => handleUserClick(user.userId)}
              >
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={`${user.name}'s Profile`}
                    className='profile-image'
                  />
                ) : (
                  <i className='fas fa-user'></i>
                )}

                <div>
                  <p className='user-name'>{user.name}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default Dashboard
