import Button from '../components/Button.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { aboutStats, brandName, images, membershipDocuments, services, welfareSchemes, workBanners } from '../data/siteContent.js'
import { applicationForms } from '../data/applicationForms.js'

function DocumentList({ documents }) {
  return (
    <ol className="grid gap-2.5">
      {documents.map((document, index) => (
        <li className="flex items-start gap-3 text-sm leading-6 text-neutral-700" key={index}>
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#eef8ff] text-xs font-black text-[#007cba]">
            {index + 1}
          </span>
          <span>{document}</span>
        </li>
      ))}
    </ol>
  )
}

export default function StaticPage({ type }) {
  if (type === 'services') {
    const posterBanner = workBanners.find((banner) => banner.layout === 'poster')
    const wideBanners = workBanners.filter((banner) => banner.layout !== 'poster')

    return (
      <section className="mx-auto max-w-7xl px-3 py-10 sm:px-5 sm:py-20">
        <SectionHeader eyebrow="எங்கள் சேவைகள்" title="தொழிலாளர்களுக்கான நல சேவைகள்" />

        <div className="mt-8 rounded-2xl border border-[#d7e5f1] bg-gradient-to-br from-[#f7fbff] via-white to-[#fff8ef] p-3 shadow-sm sm:mt-10 sm:rounded-3xl sm:p-5 lg:p-6">
          <div className="flex flex-col gap-2 border-b border-[#dbe7f0] pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-[#007cba]">பணிகள் / Work Banners</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
                நலத்திட்டங்கள் மற்றும் சேவை தகவல்கள் / Welfare and Service Information
              </h2>
            </div>
            <p className="max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              தொழிலாளர்கள் எளிதாக புரிந்து கொள்ளும் வகையில் முக்கிய சேவை, ஆவணங்கள் மற்றும் தொழில் வகை தகவல்கள்.
            </p>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
            <div className="grid gap-5">
              {wideBanners.map((banner) => (
                <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" key={banner.id}>
                  <div className="border-b border-slate-100 p-4">
                    <h3 className="text-lg font-black text-slate-950">{banner.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{banner.description}</p>
                  </div>
                  <img
                    className="w-full bg-white object-contain"
                    src={banner.image}
                    alt={banner.title}
                    decoding="async"
                    loading="lazy"
                  />
                </article>
              ))}
            </div>

            {posterBanner && (
              <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-4">
                  <h3 className="text-lg font-black text-slate-950">{posterBanner.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{posterBanner.description}</p>
                </div>
                <div className="flex justify-center bg-white p-2 sm:p-4">
                  <img
                    className="max-h-[920px] w-full max-w-[520px] object-contain"
                    src={posterBanner.image}
                    alt={posterBanner.title}
                    decoding="async"
                    loading="lazy"
                  />
                </div>
              </article>
            )}
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:mt-12 lg:gap-8">
          {services.map((service) => (
            <article className="grid gap-5 border border-neutral-200 p-4 sm:p-5" key={service.id}>
              <img className="h-44 w-full object-cover sm:h-72" src={service.image} alt="" decoding="async" loading="lazy" />
              <div>
                <p className="text-3xl font-bold text-[#007cba] sm:text-4xl">{service.number}</p>
                <h3 className="mt-4 text-xl font-bold sm:text-2xl">{service.title}</h3>
                <p className="mt-3 leading-7 text-neutral-700">{service.description}</p>
              </div>
            </article>
          ))}
        </div>

        {/* Membership documents */}
        <div className="mt-12 sm:mt-16">
          <SectionHeader
            eyebrow="உறுப்பினர் ஆவணங்கள் / Membership Documents"
            title="உறுப்பினராக இணைய தேவையான ஆவணங்கள் / Documents Required for Membership"
          />
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
              <h3 className="text-lg font-bold text-slate-950">புதியதாக இணைய தேவையான ஆவணங்கள் / Documents to Join</h3>
              <div className="mt-5">
                <DocumentList documents={membershipDocuments.join} />
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
              <h3 className="text-lg font-bold text-slate-950">புதுப்பிக்க தேவையான ஆவணங்கள் / Documents to Renew</h3>
              <div className="mt-5">
                <DocumentList documents={membershipDocuments.renew} />
              </div>
            </div>
          </div>
        </div>

        {/* Welfare schemes */}
        <div className="mt-12 sm:mt-16">
          <SectionHeader
            eyebrow="நலத்திட்டங்கள் / Welfare Schemes"
            title="அனைத்து நல உதவித் திட்டங்களுக்கு தேவையான ஆவணங்கள் / Documents Required for All Welfare Schemes"
          />
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {welfareSchemes.map((scheme) => (
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6" key={scheme.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-slate-950">{scheme.title}</h3>
                  {scheme.note && (
                    <span className="rounded-full bg-[#f0ad4e] px-3 py-1 text-[11px] font-bold text-slate-950">{scheme.note}</span>
                  )}
                </div>
                <div className="mt-5">
                  <DocumentList documents={scheme.documents} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-neutral-200 bg-[#f7fbff] p-4 sm:mt-12 sm:rounded-3xl sm:p-6">
          <h2 className="text-xl font-bold sm:text-2xl">ஆன்லைன் விண்ணப்பங்கள் / Available Online Applications</h2>
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
            <p className="text-sm font-bold uppercase text-[#f0ad4e]">இணைந்து செயல்படுங்கள் / Get Involved</p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">தொழிலாளர்களின் உரிமைக்கான ஆதரவு / Support Our Cause for Workers’ Rights</h2>
            <p className="mt-4 leading-7 text-white/70">
              தமிழ்நாடு முழுவதும் கட்டுமான தொழிலாளர்களின் உரிமை மற்றும் நலனை பாதுகாக்க எங்களுடன் இணையுங்கள். / Join us to protect workers’ rights and welfare.
            </p>
          </div>
          <Button to="/contact">உதவி பெற / Get Support</Button>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-3 py-10 sm:px-5 sm:py-20">
      <SectionHeader eyebrow="வரவேற்கிறோம் / Welcome to" title="கட்டுமான தொழிலாளர்களின் குரல் / The Voice of Construction Workers" />
      <div className="grid gap-8 md:grid-cols-2 md:items-center lg:gap-12">
        <div>
          <SectionHeader eyebrow="எங்கள் உறுதி / Our Commitment" title="தமிழ்நாடு தொழிலாளர்களின் நலனுக்கான அர்ப்பணிப்பு / Dedicated to Labor Welfare" />
          <p className="mt-6 text-base leading-7 text-neutral-700 sm:text-lg sm:leading-8">
            15 ஆண்டுகளுக்கும் மேலாக கட்டுமான தொழிலாளர்களின் குரலாக செயல்பட்டு, நலத்திட்டங்கள் மற்றும் ஆதரவை வழங்கி வருகிறோம். / For over 15 years, we have worked for construction workers’ welfare across Tamil Nadu.
          </p>
        </div>
        <img className="h-56 w-full rounded-xl object-cover sm:h-80 sm:rounded-2xl lg:h-[520px] lg:rounded-3xl" src={images.about} alt="" decoding="async" loading="lazy" />
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
        <img className="h-56 w-full rounded-xl object-cover sm:h-80 sm:rounded-2xl lg:h-[420px] lg:rounded-3xl" src={images.story} alt="" decoding="async" loading="lazy" />
        <div>
          <SectionHeader eyebrow="எங்கள் பயணம் / Our Journey" title="தொடக்கத்திலிருந்து தாக்கமுள்ள சேவை வரை / From Inception to Impact" />
          <p className="mt-6 text-base leading-7 text-neutral-700 sm:text-lg sm:leading-8">
            நவம்பர் 24, 2011 அன்று தொடங்கப்பட்ட ‘{brandName}’ கட்டுமான தொழிலாளர்களின் உரிமை மற்றும் சமூக பாதுகாப்புக்காக செயல்படுகிறது. / Founded on November 24, 2011, this association supports workers’ rights and welfare.
          </p>
        </div>
      </div>

      <div className="mt-12 rounded-2xl bg-neutral-50 p-4 sm:mt-16 sm:rounded-3xl sm:p-8">
        <SectionHeader eyebrow="எங்கள் அடிப்படை நம்பிக்கைகள் / Our Core Beliefs" title="தொழிலாளர் நலனுக்கான பணி மற்றும் மதிப்புகள் / Mission and Values" />
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <article className="rounded-xl bg-white p-5 shadow-sm">
            <h3 className="text-xl font-bold">எங்கள் பணி / Our Mission</h3>
            <p className="mt-4 leading-7 text-neutral-700">
              கட்டுமான தொழிலாளர்களின் உரிமை, சமூக பாதுகாப்பு, கல்வி, மருத்துவம் மற்றும் குடும்ப நலனுக்கான ஆதரவை வழங்குவது எங்கள் பணி. / Our mission is to protect rights and improve worker welfare.
            </p>
          </article>
          <article className="rounded-xl bg-white p-5 shadow-sm">
            <h3 className="text-xl font-bold">எங்கள் மதிப்புகள் / Our Values</h3>
            <p className="mt-4 leading-7 text-neutral-700">
              நேர்மை, கருணை, பொறுப்பு மற்றும் அதிகாரமளித்தல் என்ற மதிப்புகளை பின்பற்றி தொழிலாளர்களுக்கான ஆதரவு சமூகத்தை உருவாக்குகிறோம். / We value integrity, compassion, accountability and empowerment.
            </p>
          </article>
        </div>
      </div>

      <div className="mt-12 grid gap-8 rounded-2xl bg-neutral-950 p-5 text-white sm:p-8 md:grid-cols-[1fr_0.8fr] md:items-center">
        <div>
          <p className="text-sm font-bold uppercase text-[#f0ad4e]">இணைந்து செயல்படுங்கள் / Get Involved</p>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">தொழிலாளர்களின் உரிமைக்கான ஆதரவு / Support Our Cause for Workers’ Rights</h2>
          <p className="mt-4 leading-7 text-white/70">
            தமிழ்நாடு முழுவதும் தொழிலாளர்களின் உரிமை மற்றும் நலனை பாதுகாக்க எங்களுடன் இணையுங்கள். / Join us to protect workers’ rights and welfare.
          </p>
        </div>
        <Button to="/contact">உதவி பெற / Get Support</Button>
      </div>
    </section>
  )
}
