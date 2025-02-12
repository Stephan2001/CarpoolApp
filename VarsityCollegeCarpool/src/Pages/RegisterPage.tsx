import React, { useState } from 'react'
import '../Styling/RegisterPage.css'
import { useNavigate } from 'react-router-dom'
import TermsAndConditionsPopup from '../Components/T&CPopUp.tsx'
import OnRegisterPopup from '../Components/OnRegisterPopup.tsx'

const RegisterPage: React.FC = () => {
  const [fullname, setFullName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [emailError, setEmailError] = useState<string | null>(null) // Email-specific error
  const [passwordError, setPasswordError] = useState<string | null>(null) // Password-specific error
  const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false)
  const [isPopupOpen, setPopupOpen] = useState(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const navigate = useNavigate()
  const [isSuccessPopupOpen, setSuccessPopupOpen] = useState(false)

  const termsAndConditions = `
<p>Welcome to Varsity College Carpooling! By using our application, you agree to comply with and be bound by the following terms and conditions. Please read these carefully before using our platform.</p>

<hr />

<h3>1. General Disclaimer</h3>
<p>Varsity College Carpooling is a platform designed to connect individuals seeking to share rides. The platform solely facilitates the connection between users and does not oversee or control interactions, payments, or agreements made between users.</p>

<hr />

<h3>2. Payments</h3>
<p>- Varsity College Carpooling does not provide any in-app payment functionality.<br />
- Users are solely responsible for agreeing upon and processing payments related to carpooling.<br />
- Varsity College Carpooling is not liable for any disputes, delays, or failures related to payments or lack thereof.</p>

<hr />

<h3>3. Public Safety</h3>
<p>- The safety and conduct of users during rides are the sole responsibility of the individuals involved.<br />
- Varsity College Carpooling does not conduct background checks on users or verify the safety of rides.<br />
- Users must exercise personal judgment and take necessary precautions when arranging rides or meeting with other users.</p>

<hr />

<h3>4. Cyberbullying and Messaging</h3>
<p>- The platform provides messaging features, including group and private messaging.<br />
- Varsity College Carpooling does not monitor or moderate messages exchanged between users.<br />
- Users are responsible for ensuring respectful and lawful communication. Any incidents of cyberbullying or harassment are the responsibility of the involved parties.</p>

<hr />

<h3>5. Driver Reliability</h3>
<p>- Varsity College Carpooling does not guarantee that drivers will honor ride agreements or arrive as scheduled.<br />
- Users are encouraged to confirm arrangements directly with their carpool partners.</p>

<hr />

<h3>6. Sharing Personal Information</h3>
<p>- Sharing personal contact details or other sensitive information is done at your own risk.<br />
- Varsity College Carpooling is not liable for any consequences resulting from the sharing or misuse of personal information.</p>

<hr />

<h3>7. Limitation of Liability</h3>
<p>- Varsity College Carpooling shall not be held liable for any direct, indirect, incidental, or consequential damages arising out of or in connection with the use of this platform.<br />
- Users agree to indemnify and hold Varsity College Carpooling harmless from any claims, damages, or losses resulting from their interactions with other users.</p>

<hr />

<h3>8. User Responsibility</h3>
<p>- Users must ensure compliance with local laws and regulations related to carpooling and transportation.<br />
- It is the user's responsibility to verify the credibility, reliability, and suitability of carpool partners.</p>

<hr />

<h3>9. Amendments</h3>
<p>Varsity College Carpooling reserves the right to update these terms and conditions at any time. Continued use of the platform constitutes acceptance of the revised terms.</p>

<hr />

<p>By using Varsity College Carpooling, you acknowledge that you have read, understood, and agreed to these terms and conditions.</p>
  `

  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@vcconnect\.edu\.za$/
    if (!emailRegex.test(email)) {
      setEmailError('Email must follow the format: example@vcconnect.edu.za')
    } else {
      setEmailError(null)
    }
  }

  const validatePassword = (password: string) => {
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(password)) {
      setPasswordError(
        'Password must be at least 8 characters long, include an uppercase letter, a number, and a special character.'
      )
    } else {
      setPasswordError(null) // Clear error if password is valid
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // Check for email error
    if (emailError) {
      return
    }

    // Check for password error
    if (passwordError) {
      return
    }

    if (!agreeToTerms) {
      setPasswordError('You must agree to the Terms and Conditions')
      return
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/Register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: fullname,
            email,
            password,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Registration failed')
      }

      const data = await response.text()
      console.log('Registration successful:', data)
      setSuccessPopupOpen(true)
    } catch (error) {
      console.error('Error during registration:', error)
      setPasswordError((error as Error).message || 'Registration failed')
    }
  }

  return (
    <div className='register-container'>
      <div>
        <img
          style={{ width: '100%', maxWidth: 450, height: 'auto' }}
          src='/images/Logo.png'
          alt='Logo'
          className='responsive-image'
        />
      </div>
      <h2 className='register-title'>Register</h2>
      <form onSubmit={handleSubmit} className='register-form'>
        <div className='input-group'>
          <label>Full name:</label>
          <input
            type='text'
            value={fullname}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div className='input-group'>
          <label>Email:</label>
          <input
            type='email'
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              validateEmail(e.target.value)
            }}
            required
          />
          {emailError && <span className='error-message'>{emailError}</span>}
        </div>
        <div className='input-group'>
          <label>Password:</label>
          <div className='password-input'>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                validatePassword(e.target.value) // Validate password
              }}
              required
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className='eye-icon'
              style={{ cursor: 'pointer' }}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </span>
          </div>
          {passwordError && (
            <span className='error-message'>{passwordError}</span>
          )}{' '}
          {/* Password error */}
        </div>
        <div className='input-group'>
          <label>Confirm Password:</label>
          <div className='password-input'>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <button
            type='button'
            onClick={() => setPopupOpen(true)}
            className='terms-button'
          >
            Terms and Conditions
          </button>
          {isPopupOpen && (
            <TermsAndConditionsPopup
              onClose={() => setPopupOpen(false)}
              termsAndConditions={termsAndConditions}
            />
          )}
        </div>
        <div className='input-groupTC'>
          <label>
            <input
              type='checkbox'
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              required
            />{' '}
            I agree to the Terms and Conditions
          </label>
        </div>
        <button
          type='submit'
          className={`register-button ${
            agreeToTerms ? 'button-checked' : 'button-unchecked'
          }`}
          disabled={!agreeToTerms}
        >
          REGISTER
        </button>
      </form>
      {/* Show success popup */}
      {isSuccessPopupOpen && (
        <OnRegisterPopup onClose={() => setSuccessPopupOpen(false)} />
      )}
    </div>
  )
}

export default RegisterPage
