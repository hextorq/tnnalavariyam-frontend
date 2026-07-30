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
        <div className="mx-auto grid max-w-7xl gap-6 px-3 py-8 sm:px-5 sm:py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12 lg:py-20">
        <div className="min-w-0">
          <p className="mb-3 text-sm font-bold uppercase text-[#007cba]">தொழிலாளர்களை பாதுகாக்கிறோம் / Protecting Workers</p>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight text-black sm:text-4xl lg:text-5xl">
            உங்கள் உரிமை, எங்கள் பணி / Your Rights, Our Mission
          </h1>
          <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-neutral-700 sm:text-lg sm:leading-8">
            கட்டுமான தொழிலாளர்களுக்கு பாதுகாப்பான எதிர்காலத்திற்கான சேவை மற்றும் ஆதரவு. / Empowering construction workers with essential services and support.
          </p>
          <div className="mt-8 grid gap-3 sm:flex sm:gap-4">
            <Button to="/contact">உதவி பெற / Get Support</Button>
            <Button to="/login" variant="outline">உள்நுழைவு / Login</Button>
          </div>
        </div>
        <img className="h-56 w-full rounded-xl object-cover sm:h-80 sm:rounded-2xl lg:h-[460px] lg:rounded-3xl" src={images.heroOne} alt="" decoding="async" fetchPriority="high" />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-3 py-10 sm:px-5 sm:py-20 md:grid-cols-2 md:items-center md:gap-12">
        <div>
          <SectionHeader eyebrow="எங்களை பற்றி / About Us" title="தமிழ்நாடு கட்டுமான தொழிலாளர்களுக்கு ஆதரவான பயணம் / The Journey of Supporting Construction Workers" />
          <p className="mt-6 text-base leading-7 text-neutral-700 sm:text-lg sm:leading-8">
            2011 முதல் கட்டுமான தொழிலாளர்களின் உரிமை மற்றும் நலனை முன்னிலைப்படுத்தும் சேவை அமைப்பாக செயல்படுகிறோம். / Since 2011, our organization has supported labor rights and welfare.
          </p>
          <div className="mt-8">
            <Button to="/about">மேலும் படிக்க / Read More</Button>
          </div>
        </div>
        <img className="h-56 w-full rounded-xl object-cover sm:h-80 sm:rounded-2xl lg:h-[420px] lg:rounded-3xl" src={images.about} alt="" decoding="async" loading="lazy" />
      </section>

      <section className="bg-white py-10 sm:py-20">
        <div className="mx-auto max-w-7xl px-3 sm:px-5">
          <SectionHeader eyebrow="எங்கள் சேவைகள் / Our Services" title="தொழிலாளர்களுக்கான முழுமையான ஆதரவு / Comprehensive Support for Workers" centered />
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

      <section className="bg-neutral-950 py-10 text-white sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-6 px-3 sm:px-5 md:grid-cols-[0.8fr_1.2fr] md:items-center md:gap-12">
          <div>
            <p className="text-sm font-bold uppercase text-[#f0ad4e]">இணையுங்கள் / Join Us</p>
            <h2 className="mt-3 text-2xl font-bold sm:text-4xl">பாதுகாப்பான எதிர்காலத்திற்கான ஒரு படி / Take a Step Towards Secure Future</h2>
            <p className="mt-5 leading-7 text-white/70">நாங்கள் வழங்கும் உதவி மற்றும் நலன்களை பயன்படுத்திக் கொள்ளுங்கள். / Use the assistance and benefits we provide.</p>
            <div className="mt-8">
              <Button to="/contact">உதவி பெற / Get Support</Button>
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

      <section className="mx-auto max-w-7xl px-3 py-10 sm:px-5 sm:py-20">
        <SectionHeader eyebrow="ஏன் எங்களை தேர்வு செய்ய வேண்டும் / Why Choose Us" title="ஒவ்வொரு தேவைக்கும் அர்ப்பணிப்பு ஆதரவு / Dedicated Support for Every Need" centered />
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

      <section className="bg-neutral-50 py-10 sm:py-20">
        <div className="mx-auto max-w-7xl px-3 sm:px-5">
          <SectionHeader eyebrow="உறுப்பினர்கள் கருத்து / What They Say" title="எங்கள் உறுப்பினர்களின் அனுபவம் / Hear from Our Members" centered />
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

      <section className="mx-auto grid max-w-7xl gap-6 px-3 py-10 sm:px-5 sm:py-20 md:grid-cols-2 md:items-center md:gap-10">
        <div className="rounded-2xl bg-[#f7f9fb] p-5 sm:rounded-3xl sm:p-8">
          <SectionHeader eyebrow="இணைந்து செயல்படுங்கள் / Get Involved" title="தொழிலாளர்களின் உரிமைக்கான ஆதரவு / Support Our Cause for Workers’ Rights" />
          <p className="mt-5 text-base leading-7 text-neutral-700 sm:text-lg sm:leading-8">
            தமிழ்நாடு முழுவதும் கட்டுமான தொழிலாளர்களின் உரிமை மற்றும் நலனை பாதுகாக்க எங்களுடன் இணையுங்கள். / Join us to protect workers’ rights and welfare across Tamil Nadu.
          </p>
          <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap sm:gap-4">
            <Button to="/contact">உதவி பெற / Get Support</Button>
            <a className="inline-flex items-center justify-center border border-black px-6 py-3 text-sm font-bold" href={`tel:${contactDetails.phone}`}>
              அழைக்க / Call {contactDetails.phone}
            </a>
          </div>
        </div>
        <img className="h-56 w-full rounded-xl object-cover sm:h-80 sm:rounded-2xl lg:h-[420px] lg:rounded-3xl" src={images.cta} alt="" decoding="async" loading="lazy" />
      </section>
    </>
  )
}
