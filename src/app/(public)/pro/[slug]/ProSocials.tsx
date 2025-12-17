'use client'

interface ProSocialsProps {
  socials: {
    instagram?: string
    tiktok?: string
  } | null
}

export function ProSocials({ socials }: ProSocialsProps) {
  if (!socials || (!socials.instagram && !socials.tiktok)) {
    return null
  }

  return (
    <div className="flex gap-3 mb-4">
      {socials.instagram && (
        <a
          href={socials.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-[24px] bg-gradient-to-r from-[#E4405F] to-[#C13584] text-white hover:shadow-lg transition-all"
        >
          <span className="text-lg">📷</span>
          <span className="text-sm font-medium">Instagram</span>
        </a>
      )}
      {socials.tiktok && (
        <a
          href={socials.tiktok}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-[24px] bg-black text-white hover:shadow-lg transition-all"
        >
          <span className="text-lg">🎵</span>
          <span className="text-sm font-medium">TikTok</span>
        </a>
      )}
    </div>
  )
}

