import { createBrowserRouter, Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/layout/Header'
import LandingPage from '@/pages/LandingPage'
import DashboardPage from '@/pages/DashboardPage'
import InterviewPage from '@/pages/InterviewPage'
import ReportPage from '@/pages/ReportPage'
import PricingPage from '@/pages/PricingPage'

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary mb-3" />
          <p className="text-sm text-muted-foreground font-mono">Initializing secure session...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return children
}

// Public-only route (redirect to dashboard if logged in)
function PublicOnlyRoute({ children }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary" />
        </div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

import ParticleBackground from '@/components/effects/ParticleBackground'

// Root layout with header
function RootLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden">
      {/* Global Cyberpunk Ambient Background */}
      <ParticleBackground className="fixed inset-0 z-0 opacity-50 pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-float pointer-events-none z-0" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-[100px] animate-float pointer-events-none z-0" style={{ animationDelay: '3s' }} />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: (
          <PublicOnlyRoute>
            <LandingPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'interview/:sessionId',
        element: (
          <ProtectedRoute>
            <InterviewPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'report/:reportId',
        element: (
          <ProtectedRoute>
            <ReportPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pricing',
        element: <PricingPage />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
])
