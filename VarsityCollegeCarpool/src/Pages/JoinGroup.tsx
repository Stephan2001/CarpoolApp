import React, { useState, useEffect } from 'react'
import '../Styling/JoinGroup.css'
import NavBar from '../../src/Components/NavBar.tsx'

interface Group {
  groupId: number
  groupName: string
  varsity: string
  radius: string
  size: number
  groupImage?: string
  admin: string
}

const JoinGroup: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showNavBar, setShowNavBar] = useState(false)
  const [selectedVarsity, setSelectedVarsity] = useState<string>('') // State for filtering
  const userId = parseInt(localStorage.getItem('UserId') || '0')
  const token = localStorage.getItem('token') || '0'

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/Group/groups`
        )
        const data = await response.json()
        setGroups(data)
      } catch (error) {
        console.error('Error fetching groups:', error)
      }
    }
    fetchGroups()
  }, [])

  const handleJoinClick = (group: Group) => {
    setSelectedGroup(group)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedGroup(null)
  }

  const handleRequestToJoin = async () => {
    if (selectedGroup && selectedGroup.admin) {
      try {
        const payload = new FormData()
        payload.append('RecieverUserId', selectedGroup.admin)
        payload.append('GroupId', `${selectedGroup.groupId}`)

        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/JoinRequest/joinrequest`,
          {
            method: 'POST',
            body: payload,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (response.ok) {
          console.log('Join request sent successfully!')
          closeModal()
          alert('Join Request Sent!')
        } else {
          console.error('Failed to send join request')
        }
      } catch (error) {
        console.error('Error sending join request:', error)
      }
    } else {
      console.error('AdminId is missing or invalid.')
    }
  }

  // Filter groups based on the selected varsity
  const filteredGroups = selectedVarsity
    ? groups.filter((group) => group.varsity === selectedVarsity)
    : groups

  return (
    <div className='join-groups-container'>
      <button onClick={() => setShowNavBar(true)} className='hamburger-icon'>
        ☰
      </button>
      {showNavBar && <NavBar onClose={() => setShowNavBar(false)} />}
      <h2 style={{ marginTop: '80px' }} className='join-groups-title'>
        Groups
      </h2>

      {/* Dropdown for filtering */}
      <div style={{ marginBottom: '20px' }}>
        <label
          htmlFor='varsity-filter'
          style={{ color: 'white', marginRight: '10px' }}
        >
          Filter by Varsity:
        </label>
        <select
          id='varsity-filter'
          value={selectedVarsity}
          onChange={(e) => setSelectedVarsity(e.target.value)}
          style={{
            padding: '5px',
            borderRadius: '25px',
            border: '1px solid #ccc',
            backgroundColor: '#fffff',
          }}
        >
          <option value=''>All</option>
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

      <div className='groups-table'>
        {filteredGroups.map((group) => (
          <div
            key={group.groupId}
            className='table-row'
            style={{
              textAlign: 'center',
              position: 'relative',
              marginBottom: '20px',
            }}
          >
            {group.groupImage ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '10px',
                }}
              >
                <img
                  src={group.groupImage}
                  alt={`${group.groupName} Group`}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    border: '2px solid #ccc',
                    objectFit: 'cover',
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                  border: '2px solid #ccc',
                }}
              >
                No Image
              </div>
            )}

            {/* Group Details */}
            <div style={{ display: 'inline-block', width: '100%' }}>
              <span>
                <b>{group.groupName}</b>
              </span>
              <br />
              <span>Varsity: {group.varsity}</span>
              <br />
              <span>Location: {group.radius}</span>
              <br />
              <span>Seats Left: {group.size}</span>
              <br />
              <button
                style={{
                  alignItems: 'center',
                  marginTop: '10px',
                  backgroundColor: '#42c0bc',
                  paddingLeft: '30px',
                  paddingRight: '30px',
                  paddingTop: '5px',
                  paddingBottom: '5px',
                }}
                onClick={() => handleJoinClick(group)}
              >
                Join
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && selectedGroup && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <span className='close-icon' onClick={closeModal}>
              &times;
            </span>
            <h3>Join {selectedGroup.groupName}</h3>
            <p>Varsity: {selectedGroup.varsity}</p>
            <p>Radius: {selectedGroup.radius}</p>
            <p>Seats Available: {selectedGroup.size}</p>
            {selectedGroup.groupImage ? (
              <img
                src={selectedGroup.groupImage}
                alt={`${selectedGroup.groupName} Group`}
                style={{
                  maxWidth: '50%',
                  height: '50%',
                  display: 'grid',
                  marginLeft: '25%',
                  paddingBottom: '5%',
                }}
              />
            ) : (
              <p>No image available</p>
            )}
            <button onClick={handleRequestToJoin}>Request to Join</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default JoinGroup
