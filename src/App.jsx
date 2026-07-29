import PublicLayout from './layouts/PublicLayout.jsx'
import AccountPage from './pages/AccountPage.jsx'
import ApplicationFormPage from './pages/ApplicationFormPage.jsx'
import BlogPage from './pages/BlogPage.jsx'
import ContactPage from './pages/ContactPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import HomePage from './pages/HomePage.jsx'
import StaticPage from './pages/StaticPage.jsx'
import { usePathname } from './lib/router.jsx'

function App() {
  const path = usePathname()

  if (path === '/app') return <DashboardPage />
  if (path.startsWith('/app/forms/')) return <ApplicationFormPage formId={path.replace('/app/forms/', '')} />

  const publicPages = {
    '/': <HomePage />,
    '/about': <StaticPage type="about" />,
    '/services': <StaticPage type="services" />,
    '/blog': <BlogPage />,
    '/contact': <ContactPage />,
    '/login': <AccountPage mode="login" />,
    '/register': <AccountPage mode="register" />,
    '/password-reset': <AccountPage mode="reset" />,
    '/forget': <AccountPage mode="reset" />,
  }

  return <PublicLayout>{publicPages[path] || <HomePage />}</PublicLayout>
}

export default App
