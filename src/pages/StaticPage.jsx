import Button from '../components/Button.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { images, services, workerCategories } from '../data/siteContent.js'
import { applicationForms } from '../data/applicationForms.js'

export default function StaticPage({ type }) {
  if (type === 'services') {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-5 sm:py-20">
        <SectionHeader eyebrow="எங்கள் சேவைகள்" title="தொழிலாளர்களுக்கான நல சேவைகள்" />
        <div className="mt-8 rounded-2xl border border-neutral-200 bg-[#f7fbff] p-4 sm:mt-10 sm:rounded-3xl sm:p-6">
          <h2 className="text-xl font-bold sm:text-2xl">Available Online Applications</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {applicationForms.map((form) => (
              <div className="rounded-xl bg-white p-4 shadow-sm" key={form.id}>
                <p className="font-bold">{form.tamilTitle}</p>
                <p className="mt-1 text-sm text-neutral-500">{form.title}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:mt-12 lg:gap-8">
          {services.map((service) => (
            <article className="grid gap-5 border border-neutral-200 p-4 sm:p-5" key={service.id}>
              <img className="h-48 w-full object-cover sm:h-72" src={service.image} alt="" />
              <div>
                <p className="text-3xl font-bold text-[#007cba] sm:text-4xl">{service.number}</p>
                <h3 className="mt-4 text-xl font-bold sm:text-2xl">{service.title}</h3>
                <p className="mt-3 leading-7 text-neutral-700">{service.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-5 sm:py-20">
      <div className="grid gap-8 md:grid-cols-2 md:items-center lg:gap-12">
        <img className="h-64 w-full rounded-2xl object-cover sm:h-[420px] sm:rounded-3xl lg:h-[520px]" src={images.about} alt="" />
        <div>
          <SectionHeader eyebrow="About" title="Tamil Nadu Construction Workers Welfare Board" />
          <p className="mt-6 text-base leading-7 text-neutral-700 sm:text-lg sm:leading-8">
            தமிழ்நாடு கட்டுமானத் தொழிலாளர்கள் நல வாரியம் என்பது தமிழக அரசினால் கட்டுமானத் தொழிலாளர்கள் நலனிற்காக உருவாக்கப்பட்டுள்ள அமைப்பு சாரா தொழிலாளர் நலவாரியங்களில் ஒன்று ஆகும். கல்வி, திருமணம், மகப்பேறு, விபத்து, மரணம், ஓய்வூதியம் போன்ற நலத்திட்ட உதவிகளுக்கான சேவைகளை தொழிலாளர்கள் பெற முடியும்.
          </p>
          <div className="mt-8">
            <Button to="/app">Start Application</Button>
          </div>
        </div>
      </div>
      <div className="mt-12 rounded-2xl bg-neutral-50 p-4 sm:mt-16 sm:rounded-3xl sm:p-8">
        <SectionHeader eyebrow="தொழில் வகைகள்" title="தகுதியுள்ள தொழிலாளர்கள்" />
        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {workerCategories.map((category, index) => (
            <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm font-semibold text-neutral-700" key={category}>
              {index + 1}. {category}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
