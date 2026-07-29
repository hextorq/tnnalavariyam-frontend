import Button from '../components/Button.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import {
  contactDetails,
  homeStats,
  images,
  services,
  testimonials,
  whyChooseUs,
} from '../data/siteContent.js'

export default function HomePage() {
  return (
    <>
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-5 sm:py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12 lg:py-20">
        <div className="min-w-0">
          <p className="mb-3 text-sm font-bold uppercase text-[#007cba]">Protecting Workers</p>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight text-black sm:text-4xl md:text-6xl">
            Your Rights, Our Mission
          </h1>
          <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-neutral-700 sm:text-lg sm:leading-8">
            Empowering construction workers with essential services and support for a secure future.
          </p>
          <div className="mt-8 grid gap-3 sm:flex sm:gap-4">
            <Button to="/contact">Get Support</Button>
            <Button to="/login" variant="outline">Login</Button>
          </div>
        </div>
        <img className="h-72 w-full rounded-2xl object-cover sm:h-[460px] sm:rounded-3xl" src={images.heroOne} alt="" decoding="async" fetchPriority="high" />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-5 sm:py-20 md:grid-cols-2 md:items-center md:gap-12">
        <div>
          <SectionHeader eyebrow="About Us" title="The Journey of Supporting Construction Workers in Tamil Nadu" />
          <p className="mt-6 text-base leading-7 text-neutral-700 sm:text-lg sm:leading-8">
            Our organization has been a voice for laborers in the construction sector since 2011, ensuring their rights and welfare are prioritized.
          </p>
          <div className="mt-8">
            <Button to="/about">Read More</Button>
          </div>
        </div>
        <img className="h-64 w-full rounded-2xl object-cover sm:h-[420px] sm:rounded-3xl" src={images.about} alt="" decoding="async" loading="lazy" />
      </section>

      <section className="bg-white py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-5">
          <SectionHeader eyebrow="Our Services" title="Comprehensive Support for Workers" centered />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-6" key={service.id}>
                <p className="text-3xl font-bold text-[#007cba] sm:text-4xl">{service.number}</p>
                <h3 className="mt-5 text-xl font-bold sm:mt-6 sm:text-2xl">{service.title}</h3>
                <p className="mt-4 text-sm leading-6 text-neutral-700">{service.short}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-neutral-950 py-12 text-white sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-5 md:grid-cols-[0.8fr_1.2fr] md:items-center md:gap-12">
          <div>
            <p className="text-sm font-bold uppercase text-[#f0ad4e]">Join Us</p>
            <h2 className="mt-3 text-2xl font-bold sm:text-4xl">Take a Step Towards Secure Future</h2>
            <p className="mt-5 leading-7 text-white/70">Empower yourself with the assistance and benefits we provide.</p>
            <div className="mt-8">
              <Button to="/contact">Get Support</Button>
            </div>
          </div>
          <div className="grid gap-3 text-center sm:grid-cols-3">
            {homeStats.map(([value, label]) => (
              <div className="border border-white/10 bg-white/5 p-5" key={label}>
                <p className="text-3xl font-bold text-white">{value}</p>
                <p className="mt-2 text-sm font-semibold text-white/70">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-5 sm:py-20">
        <SectionHeader eyebrow="Why Choose Us" title="Dedicated Support for Every Need" centered />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {whyChooseUs.map((item) => (
            <article className="rounded-2xl border border-neutral-200 p-5 sm:p-6" key={item.number}>
              <p className="text-3xl font-bold text-[#007cba]">{item.number}</p>
              <h3 className="mt-5 text-xl font-bold">{item.title}</h3>
              <p className="mt-4 text-sm leading-6 text-neutral-700">{item.text}</p>
            </article>
          ))}
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {[images.heroOne, images.heroTwo, images.heroThree, images.heroFour].map((image) => (
            <img className="h-48 w-full rounded-xl object-cover" key={image} src={image} alt="" decoding="async" loading="lazy" />
          ))}
        </div>
      </section>

      <section className="bg-neutral-50 py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-5">
          <SectionHeader eyebrow="What They Say" title="Hear from Our Members" centered />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {testimonials.map((testimonial) => (
              <article className="rounded-2xl bg-white p-5 shadow-sm sm:p-6" key={testimonial.name}>
                <p className="text-[#f0ad4e]">★★★★★</p>
                <p className="mt-4 leading-7 text-neutral-700">{testimonial.text}</p>
                <div className="mt-6 flex items-center gap-3">
                  <img className="h-12 w-12 rounded-full object-cover" src={testimonial.image} alt="" decoding="async" loading="lazy" />
                  <p className="font-bold">{testimonial.name}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-5 sm:py-20 md:grid-cols-2 md:items-center md:gap-10">
        <div className="rounded-2xl bg-[#f7f9fb] p-5 sm:rounded-3xl sm:p-8">
          <SectionHeader eyebrow="Get Involved" title="Support Our Cause for Workers’ Rights" />
          <p className="mt-5 text-base leading-7 text-neutral-700 sm:text-lg sm:leading-8">
            Join our movement to protect the rights and welfare of construction workers across Tamil Nadu. Your support can make a difference.
          </p>
          <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap sm:gap-4">
            <Button to="/contact">Get Support</Button>
            <a className="inline-flex items-center justify-center border border-black px-6 py-3 text-sm font-bold" href={`tel:${contactDetails.phone}`}>
              Call {contactDetails.phone}
            </a>
          </div>
        </div>
        <img className="h-64 w-full rounded-2xl object-cover sm:h-[420px] sm:rounded-3xl" src={images.cta} alt="" decoding="async" loading="lazy" />
      </section>
    </>
  )
}
