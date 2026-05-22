import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { InterviewProvider } from '@/contexts/InterviewContext'
import { I18nProvider } from '@/lib/i18n'
import { router } from './router'
import './index.css'

// Force dark mode
document.documentElement.classList.add('dark')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider>
      <AuthProvider>
        <InterviewProvider>
          <RouterProvider router={router} />
        </InterviewProvider>
      </AuthProvider>
    </I18nProvider>
  </React.StrictMode>,
)