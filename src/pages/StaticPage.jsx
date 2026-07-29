import Button from '../components/Button.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { aboutStats, brandName, images, services } from '../data/siteContent.js'
import { applicationForms } from '../data/applicationForms.js'

export default function StaticPage({ type }) {
  if (type === 'services') {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-5 sm:py-20">
        <SectionHeader eyebrow="எங்கள் சேவைகள்" title="தொழிலாளர்களுக்கான நல சேவைகள்" />
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
        <div className="mt-10 rounded-2xl border border-neutral-200 bg-[#f7fbff] p-4 sm:mt-12 sm:rounded-3xl sm:p-6">
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
        <div className="mt-12 grid gap-8 rounded-2xl bg-neutral-950 p-5 text-white sm:p-8 md:grid-cols-[1fr_0.8fr] md:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-[#f0ad4e]">Get Involved</p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Support Our Cause for Workers’ Rights</h2>
            <p className="mt-4 leading-7 text-white/70">
              Join our movement to protect the rights and welfare of construction workers across Tamil Nadu. Your support can make a difference.
            </p>
          </div>
          <Button to="/contact">Get Support</Button>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-5 sm:py-20">
      <SectionHeader eyebrow="Welcome to" title="The Voice of Construction Workers" />
      <div className="grid gap-8 md:grid-cols-2 md:items-center lg:gap-12">
        <div>
          <SectionHeader eyebrow="Our Commitment" title="Dedicated to the Welfare of Laborers in Tamil Nadu" />
          <p className="mt-6 text-base leading-7 text-neutral-700 sm:text-lg sm:leading-8">
            For over 15 years, our organization has tirelessly worked to amplify the voices of construction workers. Through our extensive network across Tamil Nadu, we have provided essential support and numerous welfare initiatives, improving the quality of life for countless laborers and their families.
          </p>
        </div>
        <img className="h-64 w-full rounded-2xl object-cover sm:h-[420px] sm:rounded-3xl lg:h-[520px]" src={images.about} alt="" />
      </div>

      <div className="mt-10 grid gap-3 text-center sm:grid-cols-4">
        {aboutStats.map(([value, label]) => (
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm" key={label}>
            <p className="text-3xl font-bold text-[#007cba]">{value}</p>
            <p className="mt-2 text-sm font-semibold text-neutral-600">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2 md:items-center lg:gap-12">
        <img className="h-64 w-full rounded-2xl object-cover sm:h-[420px] sm:rounded-3xl" src={images.story} alt="" />
        <div>
          <SectionHeader eyebrow="Our Journey" title="From Inception to Impactful Presence" />
          <p className="mt-6 text-base leading-7 text-neutral-700 sm:text-lg sm:leading-8">
            Founded on November 24, 2011, ‘{brandName}’ has emerged as a significant force in advocating for construction workers’ rights. Over the years, we have launched various initiatives and services, catering to the needs of workers from rural to urban areas, ensuring their welfare and social security.
          </p>
        </div>
      </div>

      <div className="mt-12 rounded-2xl bg-neutral-50 p-4 sm:mt-16 sm:rounded-3xl sm:p-8">
        <SectionHeader eyebrow="Our Core Beliefs" title="Mission and Values for Labor Welfare" />
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <article className="rounded-xl bg-white p-5 shadow-sm">
            <h3 className="text-xl font-bold">Our Mission</h3>
            <p className="mt-4 leading-7 text-neutral-700">
              Our mission is to protect the rights and improve the social security of construction workers. We are dedicated to providing immediate assistance, welfare programs, and financial support for their education, healthcare, and family welfare, ensuring a safer and more secure future for laborers and their families.
            </p>
          </article>
          <article className="rounded-xl bg-white p-5 shadow-sm">
            <h3 className="text-xl font-bold">Our Values</h3>
            <p className="mt-4 leading-7 text-neutral-700">
              We uphold the values of integrity, compassion, and empowerment. We believe in fostering a supportive community for laborers, advocating for their rights, and ensuring accountability in our initiatives, dedicating ourselves to the betterment of every worker’s life.
            </p>
          </article>
        </div>
      </div>

      <div className="mt-12 grid gap-8 rounded-2xl bg-neutral-950 p-5 text-white sm:p-8 md:grid-cols-[1fr_0.8fr] md:items-center">
        <div>
          <p className="text-sm font-bold uppercase text-[#f0ad4e]">Get Involved</p>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Support Our Cause for Workers’ Rights</h2>
          <p className="mt-4 leading-7 text-white/70">
            Join our movement to protect the rights and welfare of construction workers across Tamil Nadu. Your support can make a difference.
          </p>
        </div>
        <Button to="/contact">Get Support</Button>
      </div>
    </section>
  )
}
