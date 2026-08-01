/** Simple "we accept" marks — not the official brand artwork, just a recognizable indicator. */

export function VisaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 30" className={className} role="img" aria-label="Visa">
      <rect width="48" height="30" rx="4" fill="#1A1F71" />
      <text x="24" y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="bold" fontStyle="italic" fill="#fff">
        VISA
      </text>
    </svg>
  )
}

export function MastercardMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 30" className={className} role="img" aria-label="Mastercard">
      <rect width="48" height="30" rx="4" fill="#fff" stroke="#E4E7EC" />
      <circle cx="20" cy="15" r="9" fill="#EB001B" />
      <circle cx="28" cy="15" r="9" fill="#F79E1B" fillOpacity="0.9" />
    </svg>
  )
}

export function CardBrandLogos({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <VisaMark className="h-6 w-10" />
      <MastercardMark className="h-6 w-10" />
    </div>
  )
}
