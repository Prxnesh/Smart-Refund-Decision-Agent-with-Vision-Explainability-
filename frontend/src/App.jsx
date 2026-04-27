import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import StatusBar from './components/StatusBar'
import { useAuth } from './hooks/useAuth'
import AdminDashboard from './pages/AdminDashboard'
import Analytics from './pages/Analytics'
import CaseViewer from './pages/CaseViewer'
import ChatUI from './pages/ChatUI'
import Inventory from './pages/Inventory'
import Login from './pages/Login'
import PolicyConfig from './pages/PolicyConfig'

function Protected({ authed, children }) {
  if (!authed) return <Navigate to="/login" replace />
  return children
}

function App() {
  const auth = useAuth()

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-grid">
        <Header authed={auth.isAuthed} onLogout={auth.logout} />
        <StatusBar />
        <Routes>
          <Route path="/" element={<ChatUI />} />
          <Route path="/login" element={<Login onLogin={auth.login} loading={auth.loading} />} />
          <Route path="/admin" element={<Protected authed={auth.isAuthed}><AdminDashboard /></Protected>} />
          <Route path="/admin/case/:id" element={<Protected authed={auth.isAuthed}><CaseViewer /></Protected>} />
          <Route path="/admin/analytics" element={<Protected authed={auth.isAuthed}><Analytics /></Protected>} />
          <Route path="/admin/policy" element={<Protected authed={auth.isAuthed}><PolicyConfig /></Protected>} />
          <Route path="/admin/inventory" element={<Protected authed={auth.isAuthed}><Inventory /></Protected>} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
