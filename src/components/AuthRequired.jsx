import Button from './Button.jsx'

export default function AuthRequired() {
  return (
    <div className="min-h-screen bg-neutral-100 px-4 py-12 sm:px-5 sm:py-20">
      <div className="mx-auto max-w-2xl bg-white p-5 text-center shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-wide text-[#007cba]">Approved Login Required</p>
        <h1 className="mt-2 text-2xl font-bold text-neutral-950 sm:text-3xl">அனுமதி பெற்ற கணக்கு தேவை</h1>
        <p className="mt-4 leading-7 text-neutral-600">
          விண்ணப்ப சேவைகளை பயன்படுத்த, உங்கள் பதிவு கோரிக்கை அனுமதி பெற்றிருக்க வேண்டும்.
          அனுமதி பெற்ற பிறகு உள்நுழைந்து விண்ணப்பத்தை சமர்ப்பிக்கலாம்.
        </p>
        <div className="mt-8 grid gap-3 sm:flex sm:justify-center">
          <Button to="/login">Login</Button>
          <Button to="/register" variant="outline">Register</Button>
        </div>
      </div>
    </div>
  )
}
