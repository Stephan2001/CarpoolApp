import React, { useState } from 'react'
import '../Styling/LoginPage.css'
import { useNavigate } from 'react-router-dom'
const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState<boolean>(false) // New state for password visibility
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/Login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        }
      )

      if (!response.ok) {
        const errorMessage = await response.text()
        alert(`Login failed: ${errorMessage}`)
        throw new Error(`Login failed! ${errorMessage}`)
      }

      // Get the userID from the login response
      const { userId, groupId } = await response.json()
      console.log('Login successful, User ID:', userId)

      // Prepare the body for the token API
      const customClaimPairs = {
        additionalProp1: 'value1', // Add your actual claim pairs here
        additionalProp2: 'value2',
        additionalProp3: 'value3',
      }

      const tokenResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/api/Login/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, customClaimPairs }), // Use userID to request the token
        }
      )

      if (!tokenResponse.ok) {
        const errorMessage = await tokenResponse.text() // Get the response body for the error
        throw new Error(`Failed to retrieve token! ${errorMessage}`)
      }

      // Get the token from the token API response
      const tokenData = await tokenResponse.json()
      const token = tokenData.token

      localStorage.setItem('GroupId', groupId)
      localStorage.setItem('UserId', userId)
      localStorage.setItem('token', token)
      console.log('Token stored successfully:', token)

      // Navigate to dashboard after successful login
      navigate('/dashboard')
    } catch (error) {
      console.error('Error during login:', error)
    } finally {
      setLoading(false)
    }
  }
  const handleRegisterClick = () => {
    navigate('/register')
  }

  return (
    <div className='login-container'>
      <div>
        <img
          style={{ width: 450, height: 150, marginTop: '80px' }}
          src='/images/Logo.png'
          alt='Logo'
          className='responsive-image'
        />
      </div>
      <h2 className='login-title'>Welcome</h2>
      <form onSubmit={handleSubmit} className='login-form'>
        <div className='input-group'>
          <label>Email:</label>
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className='input-group'>
          <label>Password:</label>
          <div className='password-input'>
            <input
              type={showPassword ? 'text' : 'password'} // Toggle between 'text' and 'password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        </div>
        <button type='submit' className='login-button' disabled={loading}>
          {loading ? 'Logging in...' : 'LOGIN'}{' '}
        </button>
        <button
          type='button'
          className='register-button'
          onClick={handleRegisterClick}
        >
          REGISTER
        </button>
      </form>
    </div>
  )
}

export default LoginPage
