import Button from '../components/Button.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { contactDetails, images } from '../data/siteContent.js'

export default function ContactPage() {
  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-5 sm:py-20 lg:grid-cols-[1fr_0.8fr] lg:gap-12">
      <div>
        <SectionHeader eyebrow="Contact us" title="தொழிலாளர் சேவை உதவி மையம்" />
        <form className="mt-8 grid gap-4 sm:mt-10 sm:gap-5">
          <input className="border border-neutral-300 px-4 py-3" placeholder="First Name" type="text" />
          <input className="border border-neutral-300 px-4 py-3" placeholder="Email" type="email" />
          <input className="border border-neutral-300 px-4 py-3" placeholder="Phone Number" type="tel" />
          <textarea className="min-h-40 border border-neutral-300 px-4 py-3" placeholder="Message" />
          <div>
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </div>
      <aside className="bg-neutral-50 p-5 sm:p-8">
        <img className="mb-6 h-48 w-full object-cover sm:mb-8 sm:h-64" src={images.cta} alt="" />
        <h2 className="text-xl font-bold sm:text-2xl">We're Here to Assist You</h2>
        <dl className="mt-6 grid gap-5 text-neutral-700">
          <div><dt className="font-bold text-black">Phone</dt><dd>{contactDetails.phone}</dd></div>
          <div><dt className="font-bold text-black">WhatsApp</dt><dd>{contactDetails.whatsapp}</dd></div>
          <div><dt className="font-bold text-black">Email</dt><dd>{contactDetails.email}</dd></div>
          <div><dt className="font-bold text-black">Office Timing</dt><dd>{contactDetails.timing}</dd></div>
          <div><dt className="font-bold text-black">Address</dt><dd>{contactDetails.address}</dd></div>
        </dl>
      </aside>
    </section>
  )
}
