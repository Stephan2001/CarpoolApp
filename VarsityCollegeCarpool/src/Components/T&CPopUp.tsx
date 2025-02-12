import React from 'react'
import '../Styling/ChangePasswordPopup.css'

interface TermsAndConditionsPopupProps {
  onClose: () => void
  termsAndConditions: string // Pass the T&Cs text as a prop
}

const TermsAndConditionsPopup: React.FC<TermsAndConditionsPopupProps> = ({
  onClose,
  termsAndConditions,
}) => {
  return (
    <div className='group-settings-overlay'>
      <div className='popup-content'>
        <h2>Terms and Conditions</h2>
        <div
          className='terms-content'
          dangerouslySetInnerHTML={{ __html: termsAndConditions }}
        />
        <div className='action-buttons'>
          <button className='create-button' onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default TermsAndConditionsPopup
