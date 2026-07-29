export default function SectionHeader({ eyebrow, title, centered = false }) {
  return (
    <div className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      {eyebrow && <p className="mb-3 text-sm font-bold uppercase text-[#007cba]">{eyebrow}</p>}
      <h2 className="text-3xl font-bold leading-tight text-black md:text-5xl">{title}</h2>
    </div>
  )
}
