import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Toaster } from './components/ui/sonner'
import { AuthProvider } from './context/AuthContext'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <AuthProvider>
    <App />
    <Toaster />
    </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)


// feat: create reusable card component for UI consistency

// feat: implement explore page to display user posts with interaction options

// feat: create bookmarks page to manage saved posts
