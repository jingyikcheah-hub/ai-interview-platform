import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/lib/i18n'

const NAV_LINKS = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: 'fa-solid fa-gauge-high' },
  { to: '/pricing', labelKey: 'nav.pricing', icon: 'fa-solid fa-tags' },
]

function Header() {
  const { user, logout } = useAuth()
  const { t, lang, toggleLang } = useI18n()
  const navigate = useNavigate()

  const handleLogoClick = () => {
    navigate(user ? '/dashboard' : '/')
  }

  const handleSignOut = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header
      id="global-header"
      className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/5 bg-card/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 md:px-6">

        {/* ── Left: Logo ── */}
        <div
          id="header-logo"
          onClick={handleLogoClick}
          className="flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <i className="fa-solid fa-shield-halved text-sm" />
          </div>
          <span className="hidden text-lg font-extrabold tracking-tight text-foreground sm:block">
            {t('brand.name')}
          </span>
        </div>

        {/* ── Center: Navigation (logged in, desktop only) ── */}
        {user && (
          <nav
            id="header-nav"
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex"
          >
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                id={`header-nav-${link.to.replace('/', '')}`}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/15 text-primary shadow-sm shadow-primary/10'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                  }`
                }
              >
                <i className={`${link.icon} text-[11px]`} />
                {t(link.labelKey)}
              </NavLink>
            ))}
          </nav>
        )}

        {/* ── Right: Dynamic area ── */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Language toggle */}
              <Button
                id="header-lang-toggle"
                variant="ghost"
                size="sm"
                onClick={toggleLang}
                className="h-8 w-8 rounded-md border border-white/5 p-0 text-xs font-bold text-muted-foreground hover:bg-white/5 hover:text-foreground"
                title={lang === 'en' ? 'Switch to Chinese' : '切换到英文'}
              >
                {lang === 'en' ? '中' : 'EN'}
              </Button>

              {/* User email */}
              <span
                id="header-user-email"
                className="hidden max-w-[160px] truncate text-xs text-muted-foreground lg:block"
              >
                {user.email}
              </span>

              {/* Sign out */}
              <Button
                id="header-sign-out"
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <i className="fa-solid fa-arrow-right-from-bracket mr-1.5 text-[11px]" />
                {t('nav.logout')}
              </Button>
            </>
          ) : (
            <Button
              id="header-get-started"
              size="sm"
              onClick={() => navigate('/')}
              className="bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
            >
              <i className="fa-solid fa-bolt mr-1.5 text-[11px]" />
              {t('nav.login')}
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
