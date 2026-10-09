import Breadcrumbs from '../components/Breadcrumbs'

const TEAM = [
  { name: 'Kyle', role: 'DevOps' },
  { name: 'John', role: 'Frontend' },
  { name: 'Angeline', role: 'Database' },
  { name: 'Jan', role: 'Backend' },
  { name: 'Shaira', role: 'QA' },
]

export default function About() {
  return (
    <section className="section">
      <Breadcrumbs items={[{ label: 'Home', href: '#/' }, { label: 'About Us' }]} />
      <h1 className="page-title">Our Story &amp; Holiday Mission</h1>
      <div className="about-text">
        <h2>Who We Are</h2>
        <p>
          QuickCart began as a simple idea: holiday shopping should feel as joyful as the holidays themselves. We are five
          students from Pampanga who built this shop as our System Architecture and Integration final project.
        </p>
        <h2>Our Promise</h2>
        <p>
          Clear prices, free standard holiday shipping, a 30-day return guarantee, and a checkout that takes one minute.
          Behind the scenes, every part of the shop runs in its own container and is tested and deployed automatically.
        </p>
      </div>
      <h2 className="section-title">Meet the Team</h2>
      <ul className="team-grid">
        {TEAM.map((m) => (
          <li key={m.name} className="team-card">
            <span className="avatar" aria-hidden="true">{m.name[0]}</span>
            <strong>{m.name}</strong>
            <span>{m.role}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
