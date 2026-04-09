export function SophitLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Chama externa - laranja */}
      <path
        d="M50 8 C50 8 72 28 72 52 C72 70 62 82 50 88 C38 82 28 70 28 52 C28 28 50 8 50 8Z"
        fill="url(#fireOuter)"
      />
      {/* Chama interna - prata/cinza */}
      <path
        d="M50 28 C50 28 63 42 63 56 C63 68 57 76 50 80 C43 76 37 68 37 56 C37 42 50 28 50 28Z"
        fill="url(#fireInner)"
      />
      {/* Ponta brilhante */}
      <path
        d="M50 38 C50 38 57 48 57 56 C57 63 54 68 50 71 C46 68 43 63 43 56 C43 48 50 38 50 38Z"
        fill="url(#fireTip)"
        opacity="0.9"
      />
      <defs>
        <linearGradient id="fireOuter" x1="50" y1="8" x2="50" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="60%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#9a1515" />
        </linearGradient>
        <linearGradient id="fireInner" x1="50" y1="28" x2="50" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d1d5db" />
          <stop offset="40%" stopColor="#9ca3af" />
          <stop offset="100%" stopColor="#6b7280" />
        </linearGradient>
        <linearGradient id="fireTip" x1="50" y1="38" x2="50" y2="71" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#e5e7eb" stopOpacity="0.6" />
        </linearGradient>
      </defs>
    </svg>
  )
}
