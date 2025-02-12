import { ServiceBusClient } from '@azure/service-bus'

const connectionString = `${process.env.REACT_APP_SERVICE_BUS_CONNECTION_STRING}`
const topicName = 'vccarpoolingtopic'
const subscriptionName = 'groupNotifications'
const serviceBusClient = new ServiceBusClient(connectionString)
const receiver = serviceBusClient.createReceiver(topicName, subscriptionName)
let isSubscribed = false
let intervalId: NodeJS.Timeout | null = null

const sendToServiceWorker = (data) => {
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(data)
  } else {
    console.log('No active service worker controller; retrying in 1 second...')
    setTimeout(() => sendToServiceWorker(data), 1000)
  }
}

export const unsubscribeFromMessages = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  isSubscribed = false
  console.log('Unsubscribed from message polling.')
}

const listenForMessages = async (groupId: number, userIds: number[]) => {
  if (isSubscribed) {
    console.log('Already subscribed to the service bus receiver.')
    return
  }

  //get stored notifications
  const storedNotificationIds = new Set(
    JSON.parse(localStorage.getItem('receivedNotificationIds') || '[]')
  )

  const userId = parseInt(localStorage.getItem('UserId') || '0')

  // Peek messages instead of directly receiving them.
  const peekMessages = async () => {
    try {
      const messages = await receiver.peekMessages(10) // Peek up to 10 messages at a time
      for (const message of messages) {
        console.log('Peeked message:', message)

        const messageGroupId = message.applicationProperties?.['GroupId']
        const joinRequestNotification =
          message.applicationProperties?.['RecieverUserId']
        const acceptRequestNotification =
          message.applicationProperties?.['GetMessage']
        const messageData = message.body
        const groupMembers = messageData.GroupMembers || []
        const senderUserId = messageData.UserId
        const groupMessageId = messageData.GroupMessageId
        const serviceBusMessageId = message.messageId
        const joinRequestSender = messageData.SenderUserId

        console.log('Message group ID:', messageGroupId)

        if (
          joinRequestNotification === userId &&
          !storedNotificationIds.has(serviceBusMessageId) &&
          !(joinRequestSender === userId)
        ) {
          console.log('Parsed join request message data:', messageData)

          const joinRequestData = {
            joinRequestId: messageData.JoinRequestId,
            title: 'New Join Request',
            message: messageData.Message || 'You have a new message',
            senderUserId: messageData.SenderUserId,
            receiverUserId: messageData.RecieverUserId,
            senderName: messageData.SenderName,
          }

          console.log('Sending data to service worker:', joinRequestData)
          sendToServiceWorker({
            joinRequestId: messageData.JoinRequestId,
            message: messageData.Message,
            senderUserId: messageData.SenderUserId,
            receiverUserId: messageData.RecieverUserId,
            senderName: messageData.SenderName,
          })

          //store notifications
          storedNotificationIds.add(serviceBusMessageId)
          localStorage.setItem(
            'receivedNotificationIds',
            JSON.stringify(Array.from(storedNotificationIds))
          )
        }

        if (
          acceptRequestNotification === userId &&
          !storedNotificationIds.has(serviceBusMessageId)
        ) {
          console.log('Parsed join request message data:', messageData)

          const joinRequestAcceptData = {
            joinRequestId: messageData.JoinRequestId,
            title: 'New Join Request',
            message: messageData.Message || 'You have a new message',
            senderUserId: messageData.SenderUserId,
            receiverUserId: messageData.RecieverUserId,
            senderName: messageData.SenderName,
          }

          console.log('Sending data to service worker:', joinRequestAcceptData)
          sendToServiceWorker({
            joinRequestId: messageData.JoinRequestId,
            message: messageData.Message,
            senderUserId: messageData.RecieverUserId,
            receiverUserId: messageData.SenderUserId,
            senderName: messageData.SenderName,
          })

          //store notifications
          storedNotificationIds.add(serviceBusMessageId)
          localStorage.setItem(
            'receivedNotificationIds',
            JSON.stringify(Array.from(storedNotificationIds))
          )
        }

        //will only send if IDs match and not stored from previous sent notifications. Does not send notification to message sender
        if (
          messageGroupId === groupId &&
          userIds.some((id) => groupMembers.includes(id)) &&
          !userIds.includes(senderUserId) &&
          !storedNotificationIds.has(serviceBusMessageId)
        ) {
          console.log('Parsed message data:', messageData)

          const notificationData = {
            title: 'New Group Message',
            message: messageData.Message || 'You have a new message',
            userId: messageData.UserId,
            name: messageData.Name,
            date: messageData.Date,
            time: messageData.Time,
            groupMessageId: messageData.GroupMessageId,
          }

          // Send message to service worker
          console.log('Sending data to service worker:', notificationData)
          sendToServiceWorker({
            groupId: messageGroupId,
            message: messageData.Message,
            userId: messageData.UserId,
            name: messageData.Name,
            date: messageData.Date,
            time: messageData.Time,
            groupMessageId: messageData.GroupMessageId,
          })

          //store notifications
          storedNotificationIds.add(serviceBusMessageId)
          localStorage.setItem(
            'receivedNotificationIds',
            JSON.stringify(Array.from(storedNotificationIds))
          )
          // Fetch existing notifications from local storage or initialize as an empty array
          const existingNotifications = JSON.parse(
            localStorage.getItem('ReceivedNotification') || '[]'
          )

          // Add the new notification
          existingNotifications.push({
            message: messageData.Message,
            senderName: messageData.Name,
            notificationType: 'Group Message',
          })

          // Save the updated notifications back to local storage
          localStorage.setItem(
            'ReceivedNotification',
            JSON.stringify(existingNotifications)
          )
        }
      }
    } catch (error) {
      console.error('Error peeking messages:', error)
    }
  }

  // Call the peekMessages function periodically (for example, every 5 seconds)
  setInterval(peekMessages, 5000) // Poll for new messages every 5 seconds

  isSubscribed = true
}

export default listenForMessages
