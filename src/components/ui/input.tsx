import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className = '', ...props }: InputProps) {
  const inputClasses = `w-full px-4 py-3 rounded-[14px] border border-[#EDE8F0] bg-[#FDFBFE] text-[#2A1F2D] placeholder:text-[#B5A8BE] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white transition-all duration-200 text-sm ${className}`

  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold text-[#2A1F2D] mb-2 tracking-wide">
          {label}
        </label>
      )}
      <input className={inputClasses} {...props} />
    </div>
  )
}
