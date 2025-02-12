import React, { useEffect, useState } from 'react'
import '../Styling/ProfilePage.css'
import NavBar from '../../src/Components/NavBar.tsx'
import ChangePasswordPopup from '../Components/ChangePasswordPopup.tsx'
import { useParams } from 'react-router-dom'
const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [username, setUsername] = useState<string>('')
  const [assignedGroup, setAssignedGroup] = useState<string>('N/A')
  const [rating, setRating] = useState<number>(3)
  const [showNavBar, setShowNavBar] = useState(false)
  const [showChangePasswordPopup, setShowChangePasswordPopup] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] =
    useState<boolean>(false)

  const handleProfileImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('profileImage', file)

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/User/updateprofileimage`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        }
      )

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to upload profile image.')
      }

      const data = await response.json()
      setProfileImage(data.profileImageUrl) // Update the profile image
      alert('Profile image updated successfully!')
    } catch (err: any) {
      setError(err.message)
    }
  }
  const fetchUserProfile = async () => {
    const userId = id || parseInt(localStorage.getItem('UserId') || '0')
    console.log('Fetching profile for user ID:', userId)

    if (!userId) {
      setError('User ID is missing.')
      return
    }

    try {
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
      setUsername(data.name || 'Unknown User')
      setAssignedGroup(data.groupName || 'N/A')
      setRating(data.ratingCalc || 0)
      setProfileImage(data.profileImage || null)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleRatingChange = (newRating: number) => {
    setRating(newRating)
  }

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled)
  }

  useEffect(() => {
    fetchUserProfile()
  }, [])

  return (
    <div className='profile-page-container'>
      <button onClick={() => setShowNavBar(true)} className='hamburger-icon'>
        ☰
      </button>
      {showNavBar && <NavBar onClose={() => setShowNavBar(false)} />}
      <h2 style={{ marginTop: '80px' }} className='profile-title'>
        {username}
      </h2>
      <div className='profile-picture-container'>
        <div
          className='profile-picture'
          style={{ marginRight: '30px', marginLeft: '80px' }}
        >
          {profileImage ? (
            <img src={profileImage} alt='Profile' />
          ) : (
            <i className='fas fa-user'></i>
          )}
        </div>
      </div>
      <div className='upload-container'>
        <label
          style={{
            marginBottom: '20px',
            fontSize: '0.9rem',
            padding: '8px',
            borderRadius: '10px',
            fontWeight: 'bold',
          }}
          htmlFor='upload-input'
          className='custom-upload-label'
        >
          Change Profile Picture
        </label>
        <input
          id='upload-input'
          type='file'
          accept='image/*'
          onChange={handleProfileImageChange}
          className='upload-input'
        />
      </div>
      <div className='input-group'>
        <label>Assigned Group:</label>
        <input type='text' value={assignedGroup} readOnly placeholder='N/A' />
      </div>
      <div className='input-group rating-group'>
        <label>Rating:</label>
        <div className='stars'>
          {[1, 2, 3, 4, 5].map((star) => (
            <i
              key={star}
              className={`fas fa-star ${star <= rating ? 'selected' : ''}`}
            ></i>
          ))}
        </div>
      </div>
      {error && <p className='error-message'>{error}</p>}
      <button
        className='password-button'
        onClick={() => setShowChangePasswordPopup(true)}
      >
        Change Password
      </button>
      {showChangePasswordPopup && (
        <ChangePasswordPopup
          onClose={() => setShowChangePasswordPopup(false)}
        />
      )}
    </div>
  )
}

export default ProfilePage
