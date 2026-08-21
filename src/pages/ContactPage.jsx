import Button from '../components/Button.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { Phone } from 'lucide-react'
import { contactDetails, images, officeContacts, branches } from '../data/siteContent.js'

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-7xl px-3 py-10 sm:px-5 sm:py-20">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:gap-12">
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
            <div>
              <dt className="font-bold text-black">தொலைபேசி / Phone</dt>
              <dd className="flex flex-col gap-1">
                {contactDetails.phone.split(', ').map((num) => (
                  <a className="text-[#007cba] underline" href={`tel:${num}`} key={num}>{num}</a>
                ))}
              </dd>
            </div>
            <div><dt className="font-bold text-black">மின்னஞ்சல் / Email</dt><dd>{contactDetails.email}</dd></div>
            <div><dt className="font-bold text-black">முகவரி / Address</dt><dd>{contactDetails.address}</dd></div>
            <div><dt className="font-bold text-black">சமூக ஊடகம் / Social Media</dt><dd>அதிகாரப்பூர்வ தொடர்பு வழிகளில் கிடைக்கும் / Available through official contact channels</dd></div>
          </dl>
        </aside>
      </div>

      {/* Office contacts */}
      <div className="mt-12 sm:mt-16">
        <SectionHeader
          eyebrow="தொடர்பு முகவரிகள் / Office Contacts"
          title="தலைமை அலுவலகம் மற்றும் கிளை அலுவலகம் / Head Office and Branch Offices"
        />
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-[#f7fbff] p-5 sm:p-6">
            <p className="text-sm font-bold uppercase text-[#f0ad4e]">தலைமை அலுவலகம் / Head Office</p>
            <p className="mt-3 leading-7 text-neutral-800">{officeContacts.headOffice}</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-[#f7fbff] p-5 sm:p-6">
            <p className="text-sm font-bold uppercase text-[#f0ad4e]">கிளை அலுவலகம் / Branch Office</p>
            <p className="mt-3 leading-7 text-neutral-800">{officeContacts.branchOffice}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm" key={branch.name}>
              <p className="text-sm font-bold text-[#007cba]">{branch.name}</p>
              <p className="mt-2 text-sm leading-6 text-neutral-700">{branch.address}</p>
              <a className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#f0ad4e] px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-[#f78a0c]" href={`tel:${branch.mobile}`}>
                <Phone size={16} />
                {branch.mobile}
              </a>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-base font-bold text-slate-950">{officeContacts.president.name}</p>
              <p className="mt-0.5 text-xs font-bold text-[#007cba]">{officeContacts.president.role}</p>
            </div>
            <a className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#f0ad4e] px-5 py-3 text-base font-black tracking-wide text-slate-950 shadow-sm transition hover:bg-[#f78a0c]" href={`tel:${officeContacts.president.phone}`}>
              <Phone size={18} />
              {officeContacts.president.phone}
            </a>
          </div>
          <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-base font-bold text-slate-950">{officeContacts.secretary.name}</p>
              <p className="mt-0.5 text-xs font-bold text-[#007cba]">{officeContacts.secretary.role}</p>
            </div>
            <a className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#f0ad4e] px-5 py-3 text-base font-black tracking-wide text-slate-950 shadow-sm transition hover:bg-[#f78a0c]" href={`tel:${officeContacts.secretary.phone}`}>
              <Phone size={18} />
              {officeContacts.secretary.phone}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
