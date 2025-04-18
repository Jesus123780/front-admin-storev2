'use client'

import React from 'react'

const NotFount = () => {
  const handleBack = () => {
    window.history.back()
  }
  return (
    <div>
      <h1>404</h1>
      <button onClick={handleBack}>Back</button>
    </div>
  )
}

export default NotFount