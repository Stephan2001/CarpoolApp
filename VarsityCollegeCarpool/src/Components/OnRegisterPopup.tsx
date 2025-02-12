import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../Styling/ChangePasswordPopup.css'

interface TermsAndConditionsPopupProps {
  onClose: () => void
}

const TermsAndConditionsPopup: React.FC<TermsAndConditionsPopupProps> = ({
  onClose,
}) => {
  const navigate = useNavigate()

  const handleClose = () => {
    onClose()
    navigate('/login')
  }

  return (
    <div className='group-settings-overlay'>
      <div className='popup-content'>
        <h2 className='header-onregister'>Registration Successful!</h2>
        <img
          style={{ width: 450, height: 150 }}
          src='/images/logo3.png'
          alt='Logo'
          className='responsive-image'
        />
        <label>
          Remember to add the app to your homepage for a better user experience.
          You will be notified when there are updates.
        </label>
        <div className='action-buttons'>
          <button className='create-button' onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default TermsAndConditionsPopup
