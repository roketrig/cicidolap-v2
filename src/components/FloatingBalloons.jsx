// src/components/FloatingBalloons.jsx
//
// Anasayfa hero'sunda yukarı doğru süzülen renkli balonlar + parıltılar.
// Saf dekorasyon — tıklanamaz, ekran okuyucudan gizli, "prefers-reduced-motion"
// açık olan kullanıcılarda index.css'teki global kural sayesinde otomatik
// durur (bkz. index.css "ANİMASYONLAR" bölümü).
import React from 'react'

function Balloon({ color, left, size, duration, delay, sway = 16 }) {
  return (
    <span
      className="balloon"
      style={{
        '--left': left,
        '--size': `${size}px`,
        '--duration': `${duration}s`,
        '--delay': `${delay}s`,
        '--sway': `${sway}px`,
      }}
    >
      <svg viewBox="0 0 40 54" width="100%" height="100%" aria-hidden="true">
        <path d="M20 38 L24 43 L16 43 Z" fill={color} />
        <path d="M20 43 Q25 47 20 53" stroke={color} strokeWidth="1.4" fill="none" opacity="0.55" />
        <ellipse cx="20" cy="19" rx="17" ry="19" fill={color} />
        <ellipse cx="13.5" cy="11" rx="4" ry="6.5" fill="#fff" opacity="0.32" />
      </svg>
    </span>
  )
}

function Sparkle({ color, left, size, duration, delay }) {
  return (
    <span
      className="balloon balloon--sparkle"
      style={{
        '--left': left,
        '--size': `${size}px`,
        '--duration': `${duration}s`,
        '--delay': `${delay}s`,
        '--sway': '10px',
      }}
    >
      <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
        <path
          d="M12 0c.6 4.8 2.2 8 6 9.5-3.8 1.5-5.4 4.7-6 9.5-.6-4.8-2.2-8-6-9.5 3.8-1.5 5.4-4.7 6-9.5z"
          fill={color}
        />
      </svg>
    </span>
  )
}

const BALLOONS = [
  { color: 'var(--cd-primary)', left: '6%', size: 46, duration: 15, delay: -2 },
  { color: 'var(--cd-secondary)', left: '87%', size: 38, duration: 18, delay: -8 },
  { color: 'var(--cd-accent)', left: '16%', size: 30, duration: 13, delay: -5.5 },
  { color: '#ffc94d', left: '78%', size: 42, duration: 20, delay: -11 },
  { color: 'var(--cd-secondary)', left: '48%', size: 26, duration: 12, delay: -1 },
  { color: 'var(--cd-primary)', left: '94%', size: 34, duration: 17, delay: -14 },
]

const SPARKLES = [
  { color: '#ffc94d', left: '30%', size: 16, duration: 9, delay: -3 },
  { color: 'var(--cd-accent)', left: '62%', size: 12, duration: 11, delay: -6 },
  { color: 'var(--cd-primary)', left: '38%', size: 14, duration: 10, delay: -1.5 },
  { color: 'var(--cd-secondary)', left: '70%', size: 10, duration: 8, delay: -4 },
]

export default function FloatingBalloons() {
  return (
    <div className="hero-balloons" aria-hidden="true">
      {BALLOONS.map((b, i) => (
        <Balloon key={`b${i}`} {...b} />
      ))}
      {SPARKLES.map((s, i) => (
        <Sparkle key={`s${i}`} {...s} />
      ))}
    </div>
  )
}
