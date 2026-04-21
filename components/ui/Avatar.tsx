'use client'

interface AvatarProps {
  initials: string
  color: string
  size?: number
}

export default function Avatar({ initials, color, size = 30 }: AvatarProps) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.35, fontWeight: 700, color: 'white',
        fontFamily: 'var(--font-plus-jakarta)',
        flexShrink: 0, border: '2px solid white',
        boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
      }}
    >
      {initials}
    </div>
  )
}
