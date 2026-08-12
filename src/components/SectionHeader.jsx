export default function SectionHeader({ eyebrow, title, centered = false }) {
  return (
    <div className={centered ? 'mx-auto max-w-3xl text-center' : 'w-full'}>
      {eyebrow && <p className="mb-3 whitespace-nowrap text-sm font-bold uppercase text-[#007cba]">{eyebrow}</p>}
      <h2 className="break-words text-2xl font-bold leading-tight text-black sm:text-3xl lg:text-4xl">{title}</h2>
    </div>
  )
}
