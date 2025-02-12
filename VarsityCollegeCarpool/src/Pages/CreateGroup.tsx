import React, { useState } from 'react'
import '../Styling/CreateGroup.css'
import { useNavigate } from 'react-router-dom'
import NavBar from '../../src/Components/NavBar.tsx'

const CreateGroup: React.FC = () => {
  const [groupName, setGroupName] = useState<string>('')
  const [varsity, setVarsity] = useState<string>('Select Varsity')
  const [locationRadius, setLocationRadius] = useState<string>('')
  const [passengerCount, setPassengerCount] = useState<string>('1')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [carRegPhoto, setCarRegPhoto] = useState<File | null>(null)
  const [showNavBar, setShowNavBar] = useState(false)
  const navigate = useNavigate()

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      setFile(file)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!carRegPhoto) {
      setErrorMessage('Please upload all required files.')
      return
    }

    const formData = new FormData()
    formData.append('groupName', groupName)
    formData.append('VarsityLocation', varsity)
    formData.append('LocationRadius', locationRadius)
    formData.append('PassengerCount', passengerCount)
    formData.append('CarRegistrationPhoto', carRegPhoto)

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/group/creategroup`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`, // Add your JWT token here
          },
          body: formData,
        }
      )

      if (response.ok) {
        // Handle successful group creation
        navigate('/dashboard')
      } else {
        const errorData = await response.json()
        console.error('Error Data:', errorData)
        console.error('Full Response:', response)
      }
    } catch (error) {
      console.error('Error creating group:', error)
      setErrorMessage('An error occurred while creating the group.')
    }
  }

  return (
    <div className='create-group-container'>
      <button onClick={() => setShowNavBar(true)} className='hamburger-icon'>
        ☰
      </button>
      {showNavBar && <NavBar onClose={() => setShowNavBar(false)} />}
      <h2 style={{ marginTop: '80px' }} className='create-group-title'>
        Create Group
      </h2>
      {errorMessage && <p className='error-message'>{errorMessage}</p>}
      <form onSubmit={handleSubmit} className='create-group-form'>
        <div className='input-group'>
          <label>Group Name:</label>
          <input
            type='text'
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />
        </div>

        <div className='input-group'>
          <label>Varsity:</label>
          <select
            value={varsity}
            onChange={(e) => setVarsity(e.target.value)}
            required
          >
            <option value='Select Varsity' disabled>
              Select Varsity
            </option>
            <option value='Cape Town'>Cape Town</option>
            <option value='Durban North'>Durban North</option>
            <option value='Durban Westville'>Durban Westville</option>
            <option value='Nelson Mandela Bay'>Nelson Mandela Bay</option>
            <option value='Pietermaritzburg'>Pietermaritzburg</option>
            <option value='Pretoria'>Pretoria</option>
            <option value='Sandton'>Sandton</option>
            <option value='Waterfall Midrand'>Waterfall Midrand</option>
          </select>
        </div>

        <div className='input-group'>
          <label>Location Radius:</label>
          <input
            type='text'
            value={locationRadius}
            onChange={(e) => setLocationRadius(e.target.value)}
            required
          />
        </div>

        <div className='input-group'>
          <label>Passenger Count:</label>
          <select
            value={passengerCount}
            onChange={(e) => setPassengerCount(e.target.value)}
          >
            <option value='1'>1</option>
            <option value='2'>2</option>
            <option value='3'>3</option>
          </select>
        </div>

        <div className='input-group'>
          <label>Upload Photo of Car Registration:</label>
          <input
            type='file'
            accept='image/*'
            onChange={(e) => handleFileChange(e, setCarRegPhoto)}
            required
          />
        </div>

        <div className='action-buttons'>
          <button type='submit' className='create-button'>
            CREATE
          </button>
          <button
            type='button'
            className='cancel-button'
            onClick={() => navigate('/dashboard')}
          >
            CANCEL
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateGroup
