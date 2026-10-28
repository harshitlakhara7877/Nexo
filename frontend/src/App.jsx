import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import AppLayout from "./components/layout/AppLayout";
import EditProfile from "./pages/EditProfile";
import CreatePost from "./pages/CreatPost";
import Post from "./pages/Post";
import OtherProfile from "./pages/OtherProfile.jsx";
import Explore from "./pages/Explore";
import Search from "./pages/Search";
import Settings from "./components/profile/Settings";
import Bookmarks from "./components/Settings/Bookmarks";
import Messages from "./pages/Message";
import Notifications from "./pages/Notifications";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Landing initialMode="register" />} />
        <Route path="/login" element={<Landing initialMode="login" />} />

        <Route element={<ProtectedRoute />}>

          <Route element={<AppLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/search" element={<Search />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/profile/:username" element={<OtherProfile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/create" element={<CreatePost />} />
            <Route path="/post/:id" element={<Post />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;

// rm -rf node_modules
// npm install
