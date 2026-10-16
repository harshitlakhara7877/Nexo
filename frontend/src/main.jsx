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



// feat: add emoji picker and voice message functionality to chat window

// feat: implement chat details and report/delete dialogs



// feat: enhance message service with delete conversation and report user functions
// feat: integrate Socket.IO for real-time communication i

// chore: update package.json to include emoji-picker-react dependency



