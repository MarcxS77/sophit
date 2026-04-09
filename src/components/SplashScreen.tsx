'use client'

import { useEffect, useState } from 'react'
import { SophitLogo } from '@/components/SophitLogo'

export function SplashScreen() {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit' | 'done'>('enter')

  useEffect(() => {
    // enter: 800ms → hold: 900ms → exit: 600ms → done
    const t1 = setTimeout(() => setPhase('hold'), 800)
    const t2 = setTimeout(() => setPhase('exit'), 1700)
    const t3 = setTimeout(() => setPhase('done'), 2300)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  if (phase === 'done') return null

  const letters = ['S','O','P','H','I','T']

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: 'linear-gradient(160deg,#1a0a00,#3b1200,#7c2d12)',
        opacity: phase === 'exit' ? 0 : 1,
        transition: phase === 'exit' ? 'opacity 0.6s ease-out' : 'none',
        pointerEvents: phase === 'exit' ? 'none' : 'all',
      }}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Logo */}
        <div style={{
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'scale(0.5) translateY(12px)' : 'scale(1) translateY(0)',
          transition: 'opacity 0.5s ease-out, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <SophitLogo size={72} />
        </div>

        {/* Letters */}
        <div className="flex items-center gap-1 sm:gap-2">
          {letters.map((letter, i) => (
            <span
              key={i}
              className="font-black tracking-widest text-white select-none"
              style={{
                fontSize: 'clamp(2.5rem, 8vw, 4rem)',
                opacity: phase === 'enter' ? 0 : 1,
                transform: phase === 'enter' ? 'translateY(20px)' : 'translateY(0)',
                transition: `opacity 0.4s ease-out ${0.1 + i * 0.07}s, transform 0.4s cubic-bezier(0.34,1.56,0.64,1) ${0.1 + i * 0.07}s`,
                background: i < 2
                  ? 'linear-gradient(135deg, #fff 0%, #fdba74 100%)'
                  : i < 4
                  ? 'linear-gradient(135deg, #fdba74 0%, #f97316 100%)'
                  : 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {letter}
            </span>
          ))}
        </div>

        {/* Tagline */}
        <p
          className="text-orange-200 text-sm sm:text-base tracking-widest uppercase"
          style={{
            opacity: phase === 'enter' ? 0 : 0.7,
            transform: phase === 'enter' ? 'translateY(8px)' : 'translateY(0)',
            transition: 'opacity 0.5s ease-out 0.7s, transform 0.5s ease-out 0.7s',
          }}
        >
          Saúde &amp; Performance
        </p>

        {/* Loading bar */}
        <div
          className="rounded-full overflow-hidden"
          style={{
            width: 'clamp(120px, 30vw, 200px)',
            height: 2,
            background: 'rgba(255,255,255,0.15)',
            opacity: phase === 'enter' ? 0 : 1,
            transition: 'opacity 0.3s ease-out 0.5s',
          }}
        >
          <div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #f97316, #fff)',
              borderRadius: '9999px',
              width: phase === 'enter' ? '0%' : phase === 'hold' ? '100%' : '100%',
              transition: phase === 'hold' ? 'width 0.9s cubic-bezier(0.4,0,0.2,1)' : 'none',
            }}
          />
        </div>
      </div>
    </div>
  )
}
