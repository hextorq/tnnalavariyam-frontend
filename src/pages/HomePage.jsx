import Button from '../components/Button.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { images, services } from '../data/siteContent.js'

export default function HomePage() {
  return (
    <>
      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-[1fr_1.05fr] md:items-center md:py-24">
        <div>
          <p className="mb-4 text-sm font-bold uppercase text-[#007cba]">Protecting Workers</p>
          <h1 className="max-w-3xl text-5xl font-bold leading-tight text-black md:text-7xl">Your Rights, Our Mission</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-neutral-700">
            Empowering construction workers with essential services and support for a secure future.
          </p>
          <div className="mt-8 flex gap-4">
            <Button to="/contact">Get Support</Button>
            <Button to="/about" variant="outline">About Us</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[images.heroOne, images.heroTwo, images.heroThree, images.heroFour].map((src, index) => (
            <img className="h-64 w-full object-cover" key={src} src={src} alt="" />
          ))}
        </div>
      </section>

      <section className="bg-neutral-50 py-20">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader eyebrow="Our Services" title="Comprehensive Support for Workers" centered />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <article className="border border-neutral-200 bg-white p-6" key={service.id}>
                <p className="text-4xl font-bold text-[#007cba]">{service.number}</p>
                <h3 className="mt-6 text-2xl font-bold">{service.title}</h3>
                <p className="mt-4 text-sm leading-6 text-neutral-700">{service.short}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 md:grid-cols-2 md:items-center">
        <img className="h-[420px] w-full object-cover" src={images.cta} alt="" />
        <div>
          <SectionHeader eyebrow="Get Involved" title="Support Our Cause for Workers' Rights" />
          <p className="mt-5 text-lg leading-8 text-neutral-700">
            Join our movement to protect the rights and welfare of construction workers across Tamil Nadu.
          </p>
          <div className="mt-8">
            <Button to="/contact">Get Support</Button>
          </div>
        </div>
      </section>
    </>
  )
}
