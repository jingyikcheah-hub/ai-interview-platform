import { createBrowserRouter, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/layout/Header'
import LandingPage from '@/pages/LandingPage'
import DashboardPage from '@/pages/DashboardPage'
import JDGeneratorPage from '@/pages/JDGeneratorPage'
import PipelinePage from '@/pages/PipelinePage'
import InterviewPage from '@/pages/InterviewPage'
import ReportPage from '@/pages/ReportPage'
import PricingPage from '@/pages/PricingPage'

import CandidateWelcomePage from '@/pages/CandidateWelcomePage'
import CandidateInterviewPage from '@/pages/CandidateInterviewPage'
import CandidateFeedbackPage from '@/pages/CandidateFeedbackPage'

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


import ParticleBackground from '@/components/effects/ParticleBackground'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'

function GlobalBackButton() {
  const location = useLocation()
  const navigate = useNavigate()
  const { lang } = useI18n()

  // Do not show on Landing Page or Interview Room where user is trapped
  if (location.pathname === '/' || location.pathname.startsWith('/interview/') || location.pathname.startsWith('/c-interview/')) {
    return null
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-2 z-20 relative">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="text-muted-foreground hover:text-foreground pl-0 group h-8 ml-[42px]"
      >
        <i className="fa-solid fa-arrow-left mr-2 transition-transform group-hover:-translate-x-1" />
        {lang === 'cn' ? '返回上一页' : 'Go Back'}
      </Button>
    </div>
  )
}

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
        <GlobalBackButton />
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
        element: <LandingPage />,
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
        path: 'generate',
        element: (
          <ProtectedRoute>
            <JDGeneratorPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pipeline',
        element: (
          <ProtectedRoute>
            <PipelinePage />
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
        path: 'invite',
        element: <CandidateWelcomePage />,
      },
      {
        path: 'c-interview/:sessionId',
        element: <CandidateInterviewPage />,
      },
      {
        path: 'candidate-feedback/:reportId',
        element: <CandidateFeedbackPage />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
])
