import { useState } from 'react'
import Register from './pages/Register'
import { Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Profile from './pages/Profile'
import AppLayout from './components/layout/AppLayout'
import EditProfile from './pages/EditProfile'
import CreatePost from './pages/CreatPost'
import Post from './pages/Post'
import OtherProfile from './pages/OtherProfile'

function App() {

  return (
    <>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>

          
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:username" element={<OtherProfile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/create" element={<CreatePost />} />
          <Route path="/post/:id" element={<Post />} />

          </Route>
        </Route>
        </Routes>

    </>
  )
}

export default App;

// rm -rf node_modules
// npm install
