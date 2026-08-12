import PublicLayout from './layouts/PublicLayout.jsx'
import AccountPage from './pages/AccountPage.jsx'
import ApplicationFormPage from './pages/ApplicationFormPage.jsx'
import AutoLogout from './components/AutoLogout.jsx'
import BlogPage from './pages/BlogPage.jsx'
import ContactPage from './pages/ContactPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import HomePage from './pages/HomePage.jsx'
import StaticPage from './pages/StaticPage.jsx'
import TrackingPage from './pages/TrackingPage.jsx'
import { usePathname } from './lib/router.jsx'

function App() {
  const path = usePathname()

  let content
  if (path === '/app') {
    content = <DashboardPage />
  } else if (path.startsWith('/app/forms/')) {
    content = <ApplicationFormPage formId={path.replace('/app/forms/', '')} />
  } else {
    const publicPages = {
      '/': <HomePage />,
      '/about': <StaticPage type="about" />,
      '/services': <StaticPage type="services" />,
      '/tracking': <TrackingPage />,
      '/blog': <BlogPage />,
      '/contact': <ContactPage />,
      '/login': <AccountPage mode="login" />,
      '/register': <AccountPage mode="register" />,
      '/password-reset': <AccountPage mode="reset" />,
      '/forget': <AccountPage mode="reset" />,
    }
    content = <PublicLayout>{publicPages[path] || <HomePage />}</PublicLayout>
  }

  return (
    <>
      <AutoLogout />
      {content}
    </>
  )
}

export default App
