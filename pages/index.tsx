import React from 'react'
import MultiStepForm from '../components/MultiStepForm'
import ErrorBoundary from '../components/ErrorBoundary'

export default function Home() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <MultiStepForm />
      </div>
    </ErrorBoundary>
  )
}