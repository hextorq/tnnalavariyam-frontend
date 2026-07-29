import SectionHeader from '../components/SectionHeader.jsx'
import { blogPosts } from '../data/siteContent.js'

export default function BlogPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-5 sm:py-20">
      <SectionHeader title="Empowering Workers Through Support and Rights" centered />
      <div className="mt-8 grid gap-6 sm:mt-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {blogPosts.map((post) => (
          <article className="border border-neutral-200" key={post.title}>
            {post.image ? <img className="h-48 w-full object-cover sm:h-56" src={post.image} alt="" /> : <div className="h-48 bg-neutral-100 sm:h-56" />}
            <div className="p-5">
              <p className="text-sm text-neutral-500">{post.date}</p>
              <h2 className="mt-3 text-xl font-bold leading-snug">{post.title}</h2>
              <p className="mt-4 text-sm font-bold text-[#007cba]">Read Post »</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
