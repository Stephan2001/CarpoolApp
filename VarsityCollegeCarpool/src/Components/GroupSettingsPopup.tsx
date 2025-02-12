import React, { useState } from 'react'
import '../Styling/ChangePasswordPopup.css'

interface UpdateGroupPopupProps {
  onClose: () => void
}

const UpdateGroupPopup: React.FC<UpdateGroupPopupProps> = ({ onClose }) => {
  const [groupName, setGroupName] = useState<string>('')
  const [varsity, setVarsity] = useState<string>('Select Varsity')
  const [locationRadius, setLocationRadius] = useState<string>('')
  const [passengerCount, setPassengerCount] = useState<string>('1')
  const [groupImage, setGroupImage] = useState<File | null>(null)
  const [carRegPhoto, setCarRegPhoto] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formData = new FormData()
    formData.append('groupName', groupName)
    formData.append('LocationRadius', locationRadius)
    formData.append('PassengerCount', passengerCount)
    formData.append('VarsityLocation', varsity)

    if (groupImage) formData.append('GroupImage', groupImage)
    if (carRegPhoto) formData.append('CarRegistrationPhoto', carRegPhoto)

    try {
      const groupId = parseInt(localStorage.getItem('GroupId') || '0')
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/Group/updategroup/${groupId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        }
      )

      if (!response.ok) {
        const result = await response
        console.log(response)
      }

      const result = await response.json()
      alert('Group updated successfully!')
      localStorage.setItem('GroupImage', result.groupImageUrl)
      console.log(result.groupImageUrl)
      onClose()
      window.location.reload()
    } catch (err: any) {
      alert('For admin users only')
      setErrorMessage(err.message)
    }
  }

  return (
    <div className='group-settings-overlay'>
      <div className='popup-content'>
        <h2>Update Group Settings</h2>
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
            <label>Upload Group Image:</label>
            <input
              type='file'
              accept='image/*'
              onChange={(e) => handleFileChange(e, setGroupImage)}
            />
          </div>

          <div className='input-group'>
            <label>Upload Photo of Car Registration:</label>
            <input
              type='file'
              accept='image/*'
              onChange={(e) => handleFileChange(e, setCarRegPhoto)}
            />
          </div>

          <div className='action-buttons'>
            <button type='submit' className='create-button'>
              Save Changes
            </button>
            <button type='button' className='cancel-button' onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UpdateGroupPopup
