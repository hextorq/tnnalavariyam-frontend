import Button from '../components/Button.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { images, services } from '../data/siteContent.js'

export default function StaticPage({ type }) {
  if (type === 'services') {
    return (
      <section className="mx-auto max-w-7xl px-5 py-20">
        <SectionHeader eyebrow="எங்கள் சேவைகள்" title="தொழிலாளர்களுக்கான நல சேவைகள்" />
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {services.map((service) => (
            <article className="grid gap-5 border border-neutral-200 p-5" key={service.id}>
              <img className="h-72 w-full object-cover" src={service.image} alt="" />
              <div>
                <p className="text-4xl font-bold text-[#007cba]">{service.number}</p>
                <h3 className="mt-4 text-2xl font-bold">{service.title}</h3>
                <p className="mt-3 leading-7 text-neutral-700">{service.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:grid-cols-2 md:items-center">
      <img className="h-[520px] w-full object-cover" src={images.about} alt="" />
      <div>
        <SectionHeader eyebrow="Welcome to" title="The Voice of Construction Workers" />
        <p className="mt-6 text-lg leading-8 text-neutral-700">
          For over 15 years, our organization has tirelessly worked to amplify the voices of construction workers.
          Founded on November 24, 2011, the association advocates for workers' rights, welfare and social security.
        </p>
        <div className="mt-8">
          <Button to="/contact">Get Support</Button>
        </div>
      </div>
    </section>
  )
}
