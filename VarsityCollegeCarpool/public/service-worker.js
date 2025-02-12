//this sends user notification if the app is closed "hopefully"
self.addEventListener('push', function (event) {
  //log data
  console.log('Push event received: ', event)

  //get data
  const data = event.data
    ? event.data.json()
    : { title: 'No title', message: 'No message' }
  console.log('Notification data: ', data) // Add this line

  //set title based on received message
  let title = ''
  if (data.joinRequestId) {
    title = `${data.senderName} Sent a Join Request`
  } else if (data.senderName && data.receiverUserId) {
    // Private message
    title = `${data.senderName} Sent a Private Message`
  } else if (data.name) {
    // Group message
    title = `${data.name} Sent a Group Message`
  } else {
    title = 'New Message!'
  }
  const options = {
    body: data.message || 'You have a new notification',
    icon: '/images/Logo.png',
    data: { url: '/dashboard' },
  }
  console.log('Showing notification: ', title, options)

  //show notification
  event.waitUntil(self.registration.showNotification(title, options))
})

//if user clicks on notificaiton, navigates to data url (dashboard for now)
self.addEventListener('notificationclick', function (event) {
  console.log('Notification clicked')
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i]
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url)
      }
    })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
  console.log('Service worker activated and claimed control of clients')
})

const sentNotifications = new Set()

//this handles notificaitons while in the app
self.addEventListener('message', function (event) {
  console.log('Message received in Service Worker:', event.data)
  //the below shows a notification to the user
  const data = event.data
  const notificationKey = `${
    data.messageId || data.groupMessageId || data.joinRequestId
  }`

  if (sentNotifications.has(notificationKey)) {
    console.log(`Notification ${notificationKey} already sent.`)
    return
  }

  sentNotifications.add(notificationKey)

  if (data.senderUserId && data.receiverUserId) {
    // Notify all open client windows about the private message
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'privateMessage',
          messageId: data.messageId,
          senderUserId: data.senderUserId,
          receiverUserId: data.receiverUserId,
          senderName: data.senderName,
          message: data.message,
          date: data.date,
          time: data.time,
        })
      })
    })
  }

  //set title based on received message
  let title = ''
  if (data.joinRequestId) {
    title = `${data.senderName} Sent a Join Request`
  } else if (data.senderName && data.receiverUserId) {
    // Private message
    title = `${data.senderName} Sent a Private Message`
  } else if (data.name) {
    // Group message
    title = `${data.name} Sent a Group Message`
  } else {
    title = 'New Message!'
  }
  const options = {
    body: data.message,
    icon: '/images/Logo.png',
    data: { url: '/dashboard' },
  }
  self.registration.showNotification(title, options)

  //the below notifies all pages of the notification (so i can use in the live chat)
  const notificationData = {
    groupMessageId: data.groupMessageId,
    groupId: data.groupId,
    title: 'New Group Message',
    message: data.message,
    userId: data.userId,
    name: data.name,
    date: data.date,
    time: data.time,
  }

  //match all the windows that the service worker controls (all of them)
  self.clients.matchAll({ type: 'window' }).then((clients) => {
    //goes through each client window
    clients.forEach((client) => {
      //sends message to client windows
      client.postMessage(notificationData)
    })
  })
})
