import { ServiceBusClient } from '@azure/service-bus'

let intervalId: NodeJS.Timeout | null = null

const connectionString = `${process.env.REACT_APP_SERVICE_BUS_CONNECTION_STRING}`
const topicName = 'vccarpoolingtopic'
const subscriptionName = 'privateMessage'

const serviceBusClient = new ServiceBusClient(connectionString)
const receiver = serviceBusClient.createReceiver(topicName, subscriptionName)
let isSubscribed = false

const sendToServiceWorker = (data: any) => {
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(data)
  } else {
    console.log('No active service worker controller; retrying in 1 second...')
    setTimeout(() => sendToServiceWorker(data), 1000)
  }
}

export const unsubscribeFromPrivateMessages = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  isSubscribed = false
  console.log('Unsubscribed from message polling.')
}

const listenForPrivateMessages = async (userId: number) => {
  if (isSubscribed) {
    console.log('Already subscribed to the private message receiver.')
    return
  }

  const storedNotificationIds = new Set(
    JSON.parse(localStorage.getItem('privateReceivedNotificationIds') || '[]')
  )

  const peekMessages = async () => {
    try {
      const messages = await receiver.peekMessages(10)
      for (const message of messages) {
        console.log('Peeked private message:', message)

        const receiverUserId = message.applicationProperties?.['ReceiverUserId']
        const senderUserId = message.applicationProperties?.['SenderUserId']
        const serviceBusMessageId = message.messageId

        if (senderUserId === userId) {
          continue;
        }

        if (
          receiverUserId === userId &&
          !storedNotificationIds.has(serviceBusMessageId)
        ) {
          const messageData = message.body

          sendToServiceWorker({
            type: 'privateMessage',
            messageId: serviceBusMessageId,
            senderUserId,
            receiverUserId,
            senderName: messageData.SenderName,
            message: messageData.Message,
            date: messageData.Date,
            time: messageData.Time,
          })

          storedNotificationIds.add(serviceBusMessageId)
          localStorage.setItem(
            'privateReceivedNotificationIds',
            JSON.stringify(Array.from(storedNotificationIds))
          )
          //fetch existing notifications from local storage
          const existingNotifications = JSON.parse(
            localStorage.getItem('ReceivedNotification') || '[]'
          )

          //add the new message notification
          existingNotifications.push({
            message: messageData.Message,
            senderName: messageData.SenderName,
            notificationType: 'Private Message',
          })

          //save notification
          localStorage.setItem(
            'ReceivedNotification',
            JSON.stringify(existingNotifications)
          )
        }
      }
    } catch (error) {
      console.error('Error peeking private messages:', error)
    }
  }

  setInterval(peekMessages, 5000)
  isSubscribed = true
}

export default listenForPrivateMessages
