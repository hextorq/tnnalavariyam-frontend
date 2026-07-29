import Button from '../components/Button.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { contactDetails, images } from '../data/siteContent.js'

export default function ContactPage() {
  return (
    <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[1fr_0.8fr]">
      <div>
        <SectionHeader eyebrow="Get in Touch" title="Contact Us for Worker Support" />
        <form className="mt-10 grid gap-5">
          <input className="border border-neutral-300 px-4 py-3" placeholder="First Name" type="text" />
          <input className="border border-neutral-300 px-4 py-3" placeholder="Email" type="email" />
          <textarea className="min-h-40 border border-neutral-300 px-4 py-3" placeholder="Message" />
          <div>
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </div>
      <aside className="bg-neutral-50 p-8">
        <img className="mb-8 h-64 w-full object-cover" src={images.cta} alt="" />
        <h2 className="text-2xl font-bold">We're Here to Assist You</h2>
        <dl className="mt-6 grid gap-5 text-neutral-700">
          <div><dt className="font-bold text-black">Phone</dt><dd>{contactDetails.phone}</dd></div>
          <div><dt className="font-bold text-black">Email</dt><dd>{contactDetails.email}</dd></div>
          <div><dt className="font-bold text-black">Address</dt><dd>{contactDetails.address}</dd></div>
        </dl>
      </aside>
    </section>
  )
}
