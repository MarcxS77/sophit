'use client'

import { useState, useEffect } from 'react'
import { SplashScreen } from '@/components/SplashScreen'

export function SplashProvider({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Mostra o splash apenas na primeira visita da sessão
    const seen = sessionStorage.getItem('sophit_splash')
    if (!seen) {
      setShowSplash(true)
      sessionStorage.setItem('sophit_splash', '1')
      // Remove depois que a animação termina (2.3s)
      setTimeout(() => setShowSplash(false), 2400)
    }
  }, [])

  if (!mounted) return <>{children}</>

  return (
    <>
      {showSplash && <SplashScreen />}
      <div style={{
        opacity: showSplash ? 0 : 1,
        transition: 'opacity 0.4s ease-in 0.1s',
      }}>
        {children}
      </div>
    </>
  )
}
