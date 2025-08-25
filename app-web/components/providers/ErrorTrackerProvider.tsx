'use client'

import { createContext, useContext, ReactNode } from 'react'
import ErrorTracker from '@/lib/error-tracking'

const ErrorTrackerContext = createContext<ErrorTracker | null>(null)

export function ErrorTrackerProvider({ children }: { children: ReactNode }) {
  const tracker = ErrorTracker.getInstance()

  return (
    <ErrorTrackerContext.Provider value={tracker}>
      {children}
    </ErrorTrackerContext.Provider>
  )
}

export function useErrorTrackerContext() {
  const tracker = useContext(ErrorTrackerContext)
  if (!tracker) {
    return ErrorTracker.getInstance()
  }
  return tracker
}

export default ErrorTrackerProvider