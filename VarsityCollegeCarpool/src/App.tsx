import React, { useEffect } from 'react'
import LoginPage from './Pages/LoginPage.tsx'
import RegisterPage from './Pages/RegisterPage.tsx'
import Dashboard from './Pages/Dashboard.tsx'
import CreateGroup from './Pages/CreateGroup.tsx'
import JoinGroup from './Pages/JoinGroup.tsx'
import listenForMessages from './Services/notificationService.ts'
import listenForPrivateMessages from './Services/privateNotificationService.ts'
import ViewGroup from './Pages/ViewGroup.tsx'
import NotificationsPage from './Pages/NotificationsPage.tsx'
import ProfilePage from './Pages/ProfilePage.tsx'
import { ProtectedRoute, GroupRoute } from './Pages/ProtectedRoute.tsx'
import ViewProfilePage from './Pages/ViewProfilePage.tsx'
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom'

const App: React.FC = () => {
  const groupId = localStorage.getItem('GroupId')
  const userId = localStorage.getItem('UserId')

  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            console.log('Notification permission granted.')
          } else {
            console.log('Notification permission denied.')
          }
        })
      }
    } else {
      console.log('This browser does not support notifications.')
    }

    if (userId) {
      listenForPrivateMessages(parseInt(userId))
    }

    if (groupId && userId) {
      listenForMessages(parseInt(groupId), [parseInt(userId)])
    }
  }, [groupId, userId])

  return (
    <Router>
      <Routes>
        <Route path='/' element={<Navigate to='/login' />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/user-profile/:id' element={<ProfilePage />} />
        <Route path='/profile' element={<ProfilePage />} />

        <Route
          path='/no-group'
          element={<div>You are not part of any group yet.</div>}
        />

        {/* Protecting routes that require authentication */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Dashboard />} path='/dashboard' />
          <Route element={<NotificationsPage />} path='/notifications' />
          <Route element={<ViewGroup />} path='/view-group' />
          <Route element={<ProfilePage />} path='/profile' />
          <Route path='/profile/:userId' element={<ViewProfilePage />} />
        </Route>
        <Route element={<GroupRoute />}>
          <Route path='/create-group' element={<CreateGroup />} />
          <Route path='/join-group' element={<JoinGroup />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
