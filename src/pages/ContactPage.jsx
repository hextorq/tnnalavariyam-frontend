import Button from '../components/Button.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { contactDetails, images } from '../data/siteContent.js'

export default function ContactPage() {
  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-3 py-10 sm:px-5 sm:py-20 lg:grid-cols-[1fr_0.8fr] lg:gap-12">
      <div>
        <SectionHeader eyebrow="தொடர்பில் இருங்கள் / Get in Touch" title="தொழிலாளர் ஆதரவுக்கு எங்களை தொடர்பு கொள்ளுங்கள் / Contact Us for Worker Support" />
        <form className="mt-8 grid gap-4 sm:mt-10 sm:gap-5">
          <input className="border border-neutral-300 px-4 py-3" placeholder="முதல் பெயர் / First Name" type="text" />
          <input className="border border-neutral-300 px-4 py-3" placeholder="மின்னஞ்சல் / Email" type="email" />
          <textarea className="min-h-40 border border-neutral-300 px-4 py-3" placeholder="செய்தி / Message" />
          <div>
            <Button type="submit">சமர்ப்பிக்க / Submit</Button>
          </div>
        </form>
      </div>
      <aside className="bg-neutral-50 p-4 sm:p-8">
        <img className="mb-6 h-44 w-full object-cover sm:mb-8 sm:h-64" src={images.cta} alt="" decoding="async" loading="lazy" />
        <p className="text-sm font-bold uppercase text-[#007cba]">தொடர்பு கொள்ள / Reach Out</p>
        <h2 className="mt-2 text-xl font-bold sm:text-2xl">உங்களுக்கு உதவ நாங்கள் இருக்கிறோம் / We’re Here to Assist You</h2>
        <dl className="mt-6 grid gap-5 text-neutral-700">
          <div><dt className="font-bold text-black">தொலைபேசி / Phone</dt><dd>{contactDetails.phone}</dd></div>
          <div><dt className="font-bold text-black">மின்னஞ்சல் / Email</dt><dd>{contactDetails.email}</dd></div>
          <div><dt className="font-bold text-black">முகவரி / Address</dt><dd>{contactDetails.address}</dd></div>
          <div><dt className="font-bold text-black">சமூக ஊடகம் / Social Media</dt><dd>அதிகாரப்பூர்வ தொடர்பு வழிகளில் கிடைக்கும் / Available through official contact channels</dd></div>
        </dl>
      </aside>
    </section>
  )
}
