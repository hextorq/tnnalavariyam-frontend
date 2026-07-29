import Button from '../components/Button.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { associationName, contactDetails, images, services } from '../data/siteContent.js'

export default function HomePage() {
  return (
    <>
      <section className="border-b border-neutral-200 bg-gradient-to-b from-white to-[#f6fbff]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-20">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-[#007cba]/20 bg-white px-4 py-2 text-sm font-bold text-[#007cba] shadow-sm">
            E-Governance Worker Service Portal
          </div>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-black md:text-6xl">
            தொழிலாளர் நல சேவைகள் இப்போது எளிமையாக
          </h1>
          <p className="mt-5 max-w-xl text-lg font-semibold leading-8 text-neutral-700">{associationName}</p>
          <p className="mt-4 max-w-xl leading-8 text-neutral-600">
            கட்டுமானம் மற்றும் அமைப்பு சாரா தொழிலாளர்களுக்கான பதிவு, புதுப்பித்தல், கல்வி உதவி மற்றும் நலத்திட்ட விண்ணப்பங்களை ஒரே இடத்தில் நிர்வகிக்க வடிவமைக்கப்பட்ட வேகமான சேவை தளம்.
          </p>
          <div className="mt-8 flex gap-4">
            <Button to="/app">Apply Now</Button>
            <Button to="/services" variant="outline">View Schemes</Button>
          </div>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-center">
            {[
              ['6', 'Available Applications'],
              ['24x7', 'Online Access'],
              [contactDetails.timing, 'Office Timing'],
            ].map(([value, label]) => (
              <div className="border border-neutral-200 bg-white p-4 shadow-sm" key={label}>
                <p className="text-lg font-bold text-black">{value}</p>
                <p className="mt-1 text-xs font-semibold text-neutral-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-neutral-200 bg-white p-3 shadow-xl">
          <img className="w-full rounded-2xl object-cover" src={images.labourBenefits} alt="Tamil Nadu labour welfare schemes" />
        </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader eyebrow="நல வாரிய சேவைகள்" title="பொது தொழிலாளர்களுக்கான முக்கிய உதவிகள்" centered />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg" key={service.id}>
                <p className="text-4xl font-bold text-[#007cba]">{service.number}</p>
                <h3 className="mt-6 text-2xl font-bold">{service.title}</h3>
                <p className="mt-4 text-sm leading-6 text-neutral-700">{service.short}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-neutral-950 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-3">
          {[
            ['புதிய பதிவு', 'தொழிலாளர் விவரங்கள், ஆதார், வங்கி, குடும்ப அட்டை, கையொப்பம் மற்றும் நேரடி புகைப்படம்.'],
            ['புதுப்பித்தல்', 'பதிவு அட்டை, கட்டண விவரம் மற்றும் புதுப்பிப்பு ஆவணங்கள்.'],
            ['கல்வி உதவி', '6ஆம் வகுப்பு முதல் உயர்கல்வி வரை பல கல்வி விண்ணப்ப வகைகள்.'],
          ].map(([title, text]) => (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8" key={title}>
              <h3 className="text-2xl font-bold">{title}</h3>
              <p className="mt-4 leading-7 text-white/70">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 md:grid-cols-2 md:items-center">
        <div className="rounded-3xl bg-[#f7f9fb] p-8">
          <SectionHeader eyebrow="Contact us" title="உதவி தேவைப்படுகிறதா?" />
          <p className="mt-5 text-lg leading-8 text-neutral-700">
            விண்ணப்பம், ஆவணங்கள் அல்லது நலத்திட்ட விவரங்களுக்கு எங்களை தொடர்பு கொள்ளுங்கள்.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button to="/contact">Contact</Button>
            <a className="inline-flex items-center justify-center border border-black px-6 py-3 text-sm font-bold" href={`tel:${contactDetails.phone}`}>
              Call {contactDetails.phone}
            </a>
          </div>
        </div>
        <img className="h-[420px] w-full rounded-3xl object-cover" src={images.cta} alt="" />
      </section>
    </>
  )
}
