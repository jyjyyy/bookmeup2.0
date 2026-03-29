export default function PreferencesPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[#9C44AF] text-xs font-semibold mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Préférences
        </div>
        <h1 className="text-2xl font-extrabold text-[#2A1F2D] mb-1">Préférences</h1>
        <p className="text-sm text-[#8a7a92]">Personnalisez votre expérience BookMeUp.</p>
      </div>
      <div className="bg-white rounded-[24px] border border-primary/8 shadow-[0_4px_20px_rgba(20,0,50,0.04)] p-8 text-center">
        <div className="w-14 h-14 rounded-[16px] bg-[#F5F0F7] flex items-center justify-center text-2xl mx-auto mb-4">🎨</div>
        <p className="text-sm text-[#8a7a92] font-medium">Cette section sera disponible prochainement.</p>
      </div>
    </div>
  )
}
