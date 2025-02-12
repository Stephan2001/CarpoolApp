import React, { useState } from 'react'
import '../Styling/ChangePasswordPopup.css'

interface ChangePasswordPopupProps {
  onClose: () => void
}

const ChangePasswordPopup: React.FC<ChangePasswordPopupProps> = ({
  onClose,
}) => {
  const [currentPassword, setCurrentPassword] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/Register/changepassword`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        }
      )

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to change password.')
      }

      alert('Password changed successfully.')
      onClose()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className='change-password-popup'>
      <div className='popup-content'>
        <h3>Change Password</h3>
        {error && <p className='error-message'>{error}</p>}
        <div className='input-group'>
          <label>Current Password:</label>
          <input
            type='password'
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className='input-group' style={{ marginBottom: '30px' }}>
          <label>New Password:</label>
          <input
            type='password'
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className='button-group'>
          <button className='button-submit' onClick={handleSubmit}>
            Submit
          </button>
          <button className='button-cancel' onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChangePasswordPopup
