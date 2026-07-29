import SectionHeader from '../components/SectionHeader.jsx'
import { blogPosts } from '../data/siteContent.js'

export default function BlogPage() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20">
      <SectionHeader title="Empowering Workers Through Support and Rights" centered />
      <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {blogPosts.map((post) => (
          <article className="border border-neutral-200" key={post.title}>
            {post.image ? <img className="h-56 w-full object-cover" src={post.image} alt="" /> : <div className="h-56 bg-neutral-100" />}
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
