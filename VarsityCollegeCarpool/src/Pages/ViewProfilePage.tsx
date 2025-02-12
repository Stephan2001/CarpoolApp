import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import '../Styling/ViewProfilePage.css'
import NavBar from '../../src/Components/NavBar.tsx'
import listenForPrivateMessages from '../Services/privateNotificationService.ts'

const ViewProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const [username, setUsername] = useState<string>('Unknown User')
  const [profileUserId, setprofileUserId] = useState<number>(0)
  const [groupName, setGroupName] = useState<string>('Unknown Group')
  const [location, setLocation] = useState<string>('No location provided')
  const [rating, setRating] = useState<number>(0)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [groupId, setGroupId] = useState<number | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [submittingRating, setSubmittingRating] = useState<boolean>(false)
  const [showNavBar, setShowNavBar] = useState(false)
  const [newPersonalMessage, setNewPersonalMessage] = useState<string>('')
  const [personalMessages, setPersonalMessages] = useState<any[]>([])
  const [showPersonalChat, setShowPersonalChat] = useState(false)
  const userId2 = parseInt(localStorage.getItem('UserId') || '0')
  const personalMessageIds = useRef<Set<number>>(new Set())
  const endOfPersonalChat = useRef<HTMLDivElement>(null)

  useEffect(() => {
    //fetch user profile detials
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/Register/user/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        )

        if (!response.ok) throw new Error('Failed to fetch user data.')

        const data = await response.json()
        setUsername(data.name || 'Unknown User')
        setLocation(data.location || 'No location provided')
        setRating(data.ratingCalc || 0)
        console.log(data.ratingCalc)
        setProfileImage(data.profileImage || null)
        setGroupId(data.groupId || null)
        setprofileUserId(data.userId || null)
        setError(null)
      } catch (err: any) {
        setError(err.message)
      }
    }

    fetchUserProfile()
  }, [userId])

  useEffect(() => {
    //check if logged in user is the admin of the shared group
    const checkAdminStatus = async () => {
      const storedGroupId = parseInt(localStorage.getItem('GroupId') || '0')
      if (!storedGroupId || !groupId || storedGroupId !== groupId) return

      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/Group/${groupId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        )

        if (!response.ok) throw new Error('Failed to fetch group data.')

        const data = await response.json()
        const adminId = data.adminId
        const storedGroupName = data.groupName
        const currentUserId = parseInt(localStorage.getItem('UserId') || '0')
        setIsAdmin(currentUserId === adminId)
        setGroupName(storedGroupName)
      } catch (err: any) {
        setError(err.message)
      }
    }

    checkAdminStatus()
  }, [groupId])

  const handleRating = async (selectedRating: number) => {
    if (submittingRating) return

    setRating(selectedRating)
    setSubmittingRating(true)

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/Register/rate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            UserRatedId: parseInt(userId || '0', 10), // Ensure userId is parsed correctly
            Rating: selectedRating,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to submit rating.')
      }

      alert('Rating submitted successfully!')
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setSubmittingRating(false)
    }
  }

  const handleKickUser = async () => {
    const confirmation = window.confirm(
      `Are you sure you want to remove ${username} from ${groupName}?`
    )

    if (!confirmation) {
      return //exit if cancel
    }
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/Group/removeuser/${userId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to remove the user.')
      }

      alert(`${username} has been successfully removed from ${groupName}.`)
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  useEffect(() => {
    if (showPersonalChat) {
      const fetchPersonalChatHistory = async () => {
        try {
          const receiverUserId = profileUserId

          console.log(receiverUserId)
          if (!receiverUserId) {
            console.error('Receiver not found!')
            return
          }

          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/api/PrivateMessages/history/${userId2}/${receiverUserId}`
          )

          if (!response.ok) throw new Error('Failed to fetch personal messages')

          const data = await response.json()
          console.log(data)
          const personalMessageHistory = data
            .filter(
              (msg: any) => !personalMessageIds.current.has(msg.messageId)
            )
            .map((msg: any) => ({
              messageId: msg.privateMessageId,
              userId: msg.senderUserId,
              senderName: msg.senderName,
              message: msg.message,
              date: msg.messageDate,
              time: msg.messageTime,
            }))
          personalMessageHistory.forEach((msg) =>
            personalMessageIds.current.add(msg.messageId)
          )
          setPersonalMessages(personalMessageHistory)
        } catch (error) {
          console.error('Error fetching personal chat history:', error)
        }
      }

      fetchPersonalChatHistory()

      const handleNewPersonalMessage = (event: MessageEvent) => {
        const newMessage = event.data

        if (newMessage.type === 'privateMessage') {
          console.log(newMessage)
          if (
            !personalMessageIds.current.has(newMessage.messageId) &&
            ((newMessage.receiverUserId === userId2 &&
              newMessage.senderUserId === profileUserId) ||
              (newMessage.senderUserId === userId2 &&
                newMessage.receiverUserId === profileUserId))
          ) {
            personalMessageIds.current.add(newMessage.messageId)
            setPersonalMessages((prevMessages) => [...prevMessages, newMessage])
          }
        }
      }

      navigator.serviceWorker.addEventListener(
        'message',
        handleNewPersonalMessage
      )
      listenForPrivateMessages(userId2)

      return () => {
        navigator.serviceWorker.removeEventListener(
          'message',
          handleNewPersonalMessage
        )
        setPersonalMessages([])
      }
    }
  }, [userId2, profileUserId, showPersonalChat])

  const sendPersonalMessage = async () => {
    try {
      const timeZoneId = Intl.DateTimeFormat().resolvedOptions().timeZone
      const receiverUserId = profileUserId

      if (!receiverUserId) {
        console.error('Receiver not found!')
        return
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/PrivateMessages/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderUserId: userId2,
            receivingUserId: receiverUserId,
            message: newPersonalMessage,
            timeZoneId,
          }),
        }
      )

      if (response.ok) {
        const sentMessage = await response.json()

        const formattedMessage = {
          messageId: sentMessage.privateMessageId,
          userId: sentMessage.senderUserId,
          name: 'You', // Mark as sent by the current user
          message: sentMessage.message,
          date: sentMessage.date, // Format date
          time: sentMessage.time, // Format time
        }

        setPersonalMessages((prevMessages) => [
          ...prevMessages,
          formattedMessage,
        ])
        setNewPersonalMessage('')
      } else {
        console.error('Error sending personal message:', response.status)
      }
    } catch (error) {
      console.error('Error sending personal message:', error)
    }
  }

  useEffect(() => {
    endOfPersonalChat.current?.scrollIntoView({ behavior: 'smooth' })
  }, [personalMessages])

  const openPersonalChat = () => {
    setShowPersonalChat(true)
  }

  const closePersonalChat = () => setShowPersonalChat(false)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    setMessage: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setMessage(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  return (
    <div className='view-profile-page-container'>
      <button onClick={() => setShowNavBar(true)} className='hamburger-icon'>
        ☰
      </button>
      {showNavBar && <NavBar onClose={() => setShowNavBar(false)} />}
      <h2 style={{ marginTop: '80px' }} className='profile-title'>
        {username}
      </h2>
      <div className='profile-picture-container'>
        <div
          style={{ marginRight: '30px', marginLeft: '80px' }}
          className='profile-picture'
        >
          {profileImage ? (
            <img src={profileImage} alt='Profile' />
          ) : (
            <i className='fas fa-user'></i>
          )}
        </div>
      </div>
      <div className='info-group'>
        <label>Location:</label>
        <div className='info-box'>{location}</div>
      </div>
      <div className='rating-group'>
        <label>Rating:</label>
        <div className='stars'>
          {[1, 2, 3, 4, 5].map((star) => (
            <i
              key={star}
              className={`fas fa-star ${star <= rating ? 'selected' : ''}`}
              onClick={() => handleRating(star)}
              onTouchEnd={() => handleRating(star)}
              style={{ cursor: 'pointer' }}
            ></i>
          ))}
        </div>
      </div>
      {isAdmin && groupId && (
        <button className='kick-user-button' onClick={handleKickUser}>
          Kick User
        </button>
      )}
      {error && <p className='error-message'>{error}</p>}

      {showPersonalChat && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <span className='close-icon' onClick={closePersonalChat}>
              &times;
            </span>
            <h3>Chat with {username}</h3>
            <div className='chat-history'>
              {personalMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`chat-message ${
                    msg.userId === userId2 ? 'message-right' : 'message-left'
                  }`}
                >
                  <strong>
                    {msg.userId === userId2 ? 'You' : msg.senderName}
                  </strong>
                  : {msg.message}
                  <br />
                  <span className='chat-timestamp'>
                    {msg.date} at {msg.time}
                  </span>
                </div>
              ))}
              <div ref={endOfPersonalChat} />
            </div>
            <div className='input-container'>
              <textarea
                value={newPersonalMessage}
                onChange={(e) => handleInputChange(e, setNewPersonalMessage)}
                placeholder='Type your message'
                className='chat-textarea'
              />
              <i
                className='fas fa-paper-plane send-icon'
                onClick={sendPersonalMessage}
              ></i>
            </div>
          </div>
        </div>
        
      )}
       <button className='chat-button' onClick={() => openPersonalChat()}>
          <div className='chat-icon-container'>
            <div className='chat-icon'>💬</div>
          </div>
        </button>
    </div>
  )
}

export default ViewProfilePage
