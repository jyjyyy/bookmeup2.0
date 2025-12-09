import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className = '', ...props }: InputProps) {
  const inputClasses = `w-full px-5 py-3.5 rounded-[32px] border border-gray-200 bg-white text-[#2A1F2D] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:shadow-[0_0_0_3px_rgba(200,109,215,0.1)] transition-all duration-200 ${className}`

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2.5">
          {label}
        </label>
      )}
      <input className={inputClasses} {...props} />
    </div>
  )
}

