import React, { useState, useEffect, useRef } from 'react'
import LocationButton from '../Components/LocationButton.js'
import listenForMessages from '../Services/notificationService.ts'
import listenForPrivateMessages from '../Services/privateNotificationService.ts'
import '../Styling/ViewGroup.css'
import NavBar from '../../src/Components/NavBar.tsx'
import '@fortawesome/fontawesome-free/css/all.min.css'
import { useNavigate } from 'react-router-dom'
import GroupSettingsPopup from '../Components/GroupSettingsPopup.tsx'

interface GroupMember {
  userName: string
  chatUserId: string
}

const ViewGroup: React.FC = () => {
  const [group, setGroup] = useState<GroupMember[]>([])
  const [adminId, setAdminId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState<string>('')
  const endOfChat = useRef<HTMLDivElement>(null)
  const [groupName, setGroupName] = useState<string>('')
  const [showNavBar, setShowNavBar] = useState(false)
  const groupId = parseInt(localStorage.getItem('GroupId') || '0')
  const userId = parseInt(localStorage.getItem('UserId') || '0')
  const [personalMessages, setPersonalMessages] = useState<any[]>([])
  const [showPersonalChat, setShowPersonalChat] = useState(false)
  const endOfPersonalChat = useRef<HTMLDivElement>(null)
  const messageIds = useRef<Set<number>>(new Set())
  const personalMessageIds = useRef<Set<number>>(new Set())
  const [newPersonalMessage, setNewPersonalMessage] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [isLoadingGroup, setIsLoadingGroup] = useState(true)
  const navigate = useNavigate()
  const [showPopup, setShowPopup] = useState(false)
  const [groupData, setGroupData] = useState(null)
  const [showGroupSettingsPopup, setShowGroupSettingsPopup] = useState(false)
  const [groupImage, setGroupImage] = useState(null)

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        window.location.reload()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/Group/${groupId}`
        )

        if (!response.ok) throw new Error('Failed to fetch group data')

        const data = await response.json()
        console.log(data)
        const members = data.users.map((user: any) => ({
          userName: user.userName,
          chatUserId: user.userId,
        }))
        setGroupImage(data.groupImage)
        setGroupData(data)
        setGroupName(data.groupName)
        setGroup(members)
        setAdminId(data.adminId)
      } catch (error) {
        console.error('Error fetching group:', error)
      } finally {
        setIsLoadingGroup(false)
      }
    }
    fetchGroup()

    if (showModal) {
      const fetchChatHistory = async () => {
        try {
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/api/GroupMessages/history/${groupId}`
          )

          if (!response.ok) throw new Error('Failed to fetch messages')

          const data = await response.json()
          const messageHistory = data.map((msg: any) => ({
            groupMessageId: msg.groupMessageId,
            userId: msg.userId,
            name: msg.name,
            message: msg.message,
            date: msg.messageDate,
            time: msg.messageTime,
          }))
          setMessages(messageHistory)
          messageHistory.forEach((msg) =>
            messageIds.current.add(msg.groupMessageId)
          )
        } catch (error) {
          console.error('Error fetching chat history:', error)
        }
      }

      fetchChatHistory()

      const handleNewMessage = (event: MessageEvent) => {
        const newMessage = event.data
        if (
          newMessage.groupId === groupId &&
          !messageIds.current.has(newMessage.groupMessageId)
        ) {
          messageIds.current.add(newMessage.groupMessageId)
          setMessages((prevMessages) => [...prevMessages, newMessage])
        }
      }

      navigator.serviceWorker.addEventListener('message', handleNewMessage)
      listenForMessages(groupId, [userId])
      listenForPrivateMessages(userId)

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleNewMessage)
        setMessages([])
      }
    } else {
      setMessages([])
    }
  }, [groupId, userId, showModal])

  const viewProfile = (userId: string) => {
    navigate(`/profile/${userId}`)
  }

  useEffect(() => {
    endOfChat.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    try {
      const timeZoneId = Intl.DateTimeFormat().resolvedOptions().timeZone
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/groupMessages/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupId,
            userId,
            message: newMessage,
            timeZoneId,
          }),
        }
      )

      if (response.ok) {
        const sentMessage = await response.json()
        messageIds.current.add(sentMessage.GroupMessageId)
        setMessages((prevMessages) => [...prevMessages, sentMessage])
        setNewMessage('')
      } else {
        console.error('Error sending message:', response.status)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  useEffect(() => {
    if (showPersonalChat) {
      const fetchPersonalChatHistory = async () => {
        try {
          const receiverUserId = parseInt(
            group.find((member) => member.userName === selectedUser)
              ?.chatUserId || '0'
          )

          console.log(receiverUserId)
          if (!receiverUserId) {
            console.error('Receiver not found!')
            return
          }

          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/api/PrivateMessages/history/${userId}/${receiverUserId}`
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
            ((newMessage.receiverUserId === userId &&
              newMessage.senderUserId ===
                parseInt(
                  group.find((member) => member.userName === selectedUser)
                    ?.chatUserId || '0'
                )) ||
              (newMessage.senderUserId === userId &&
                newMessage.receiverUserId ===
                  parseInt(
                    group.find((member) => member.userName === selectedUser)
                      ?.chatUserId || '0'
                  )))
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
      listenForPrivateMessages(userId)

      return () => {
        navigator.serviceWorker.removeEventListener(
          'message',
          handleNewPersonalMessage
        )
        setPersonalMessages([])
      }
    }
  }, [userId, selectedUser, showPersonalChat])

  const handleOpenPopup = () => {
    setShowPopup(true)
  }

  const handleClosePopup = () => {
    setShowPopup(false)
  }

  const handleSave = () => {
    setShowPopup(false)
  }

  const sendPersonalMessage = async () => {
    try {
      const timeZoneId = Intl.DateTimeFormat().resolvedOptions().timeZone
      const receiverUserId = parseInt(
        group.find((member) => member.userName === selectedUser)?.chatUserId ||
          '0'
      )

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
            senderUserId: userId,
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

  const handleOpenChat = () => {
    setShowModal(true)

    // Clear relevant group notifications
    const notifications = JSON.parse(
      localStorage.getItem('ReceivedNotification') || '[]'
    )
    const updatedNotifications = notifications.filter(
      (notification: any) => notification.notificationType !== 'Group Message'
    )
    localStorage.setItem(
      'ReceivedNotification',
      JSON.stringify(updatedNotifications)
    )
  }

  const closeModal = () => {
    setShowModal(false)
    setMessages([])
  }

  const openPersonalChat = (userName: string) => {
    setSelectedUser(userName)
    setShowPersonalChat(true)

    // Clear relevant notifications
    const notifications = JSON.parse(
      localStorage.getItem('ReceivedNotification') || '[]'
    )
    const updatedNotifications = notifications.filter(
      (notification: any) =>
        notification.senderName !== userName ||
        notification.notificationType !== 'Private Message'
    )
    localStorage.setItem(
      'ReceivedNotification',
      JSON.stringify(updatedNotifications)
    )
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

  const disbandGroup = async () => {
    if (
      !window.confirm(
        'Are you sure you want to disband this group? This action cannot be undone.'
      )
    ) {
      return
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/Group/removegroup/${groupId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )

      if (response.ok) {
        alert('Group has been successfully disbanded.')
        localStorage.removeItem('GroupId')
        // Redirect to another page
        window.location.href = '/dashboard'
      } else {
        const error = await response.text()
        console.error('Error disbanding group:', error)
        alert('Failed to disband the group. Please try again.')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An unexpected error occurred. Please try again.')
    }
  }

  const getUnreadNotificationCount = (senderName: string) => {
    const notifications = JSON.parse(
      localStorage.getItem('ReceivedNotification') || '[]'
    )
    return notifications.filter(
      (notification: any) =>
        notification.senderName === senderName &&
        notification.notificationType === 'Private Message'
    ).length
  }

  const getUnreadGroupNotificationCount = () => {
    const notifications = JSON.parse(
      localStorage.getItem('ReceivedNotification') || '[]'
    )
    return notifications.filter(
      (notification: any) => notification.notificationType === 'Group Message'
    ).length
  }

  //function to leave group
  const leaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) {
      return
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/Group/leavegroup`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )

      if (response.ok) {
        localStorage.removeItem('GroupId')
        window.location.href = '/dashboard' //redirect to dashboard after leaving
      } else {
        const error = await response.text()
        console.error('Error leaving group:', error)
        alert('Failed to leave the group. Please try again.')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An unexpected error occurred. Please try again.')
    }
  }

  return (
    <div className='view-group-container'>
      <button onClick={() => setShowNavBar(true)} className='hamburger-icon'>
        ☰
      </button>
      {showNavBar && <NavBar onClose={() => setShowNavBar(false)} />}
      <div>
        {groupImage ? (
          <img src={groupImage} className='group-image' />
        ) : (
          <i className='fas fa-user' style={{ marginTop: '80px' }}></i>
        )}
      </div>
      <div className='groupName'>
        <h2>{groupName} </h2>
      </div>
      {/* Group Settings Button - Please dont remove me :( */}
      <button
        className='disband-button-settings'
        onClick={() => setShowGroupSettingsPopup(true)}
      >
        Update Group Settings
      </button>
      {showGroupSettingsPopup && (
        <GroupSettingsPopup onClose={() => setShowGroupSettingsPopup(false)} />
      )}
      <div className='members-table'>
        {group.map((member, index) => (
          <div key={index} className='table-row'>
            <span
              className='clickable-username'
              onClick={() => viewProfile(member.chatUserId)}
            >
              {member.userName}
            </span>

            <button
              className='chat-button'
              onClick={() => openPersonalChat(member.userName)}
            >
              <div className='chat-icon-container2'>
                <div className='chat-icon2'>💬</div>
                {getUnreadNotificationCount(member.userName) > 0 && (
                  <span className='badge'>
                    {getUnreadNotificationCount(member.userName)}
                  </span>
                )}
              </div>
            </button>
          </div>
        ))}
      </div>
      {!isLoadingGroup ? (
        <div>
          <LocationButton />
        </div>
      ) : (
        <p>Loading...</p>
      )}
      {!isLoadingGroup && adminId !== userId && (
        <button className='leave-button' onClick={leaveGroup}>
          Leave Group
        </button>
      )}
      {!isLoadingGroup && adminId === userId && (
        <button className='disband-button' onClick={disbandGroup}>
          Disband Group
        </button>
      )}
      <button className='chat-open-button' onClick={handleOpenChat}>
        <div className='chat-icon-container2'>
          💬
          {getUnreadGroupNotificationCount() > 0 && (
            <span className='badge'>{getUnreadGroupNotificationCount()}</span>
          )}
        </div>
      </button>

      {showModal && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <span className='close-icon' onClick={closeModal}>
              &times;
            </span>
            <h3>Group Chat</h3>
            <div className='chat-history'>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`chat-message ${
                    msg.userId === userId ? 'message-right' : 'message-left'
                  }`}
                >
                  <strong>{msg.userId === userId ? 'You' : msg.name}</strong>:{' '}
                  {msg.message}
                  <br />
                  <span className='chat-timestamp'>
                    {msg.date} at {msg.time}
                  </span>
                </div>
              ))}
              <div ref={endOfChat} />
            </div>
            <div className='group-box'>
              <textarea
                value={newMessage}
                onChange={(e) => handleInputChange(e, setNewMessage)}
                placeholder='Type your message'
              />
            </div>
            <i
              className='fas fa-paper-plane enter-icon'
              onClick={sendMessage}
            ></i>
          </div>
        </div>
      )}

      {showPersonalChat && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <span className='close-icon' onClick={closePersonalChat}>
              &times;
            </span>
            <h3>Chat with {selectedUser}</h3>
            <div className='chat-history'>
              {personalMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`chat-message ${
                    msg.userId === userId ? 'message-right' : 'message-left'
                  }`}
                >
                  <strong>
                    {msg.userId === userId ? 'You' : msg.senderName}
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
    </div>
  )
}

export default ViewGroup
