import { Link, useLocation } from 'react-router-dom'
import { useThemeStore } from '../store/themeStore'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/topics', label: 'Topics', icon: '📚' },
  { to: '/analytics', label: 'Analytics', icon: '📈' },
  { to: '/mistakes', label: 'Mistakes', icon: '❌' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const hideNav = location.pathname.startsWith('/session/')
  const { theme, toggleTheme } = useThemeStore()

  return (
    <div className="flex min-h-dvh flex-col bg-app text-app">
      <header className="sticky top-0 z-10 border-b border-app bg-header px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link to="/" className="text-lg font-bold text-accent">
            Abhyas
          </Link>
          <div className="flex items-center gap-3">
            {!hideNav && <span className="text-xs text-muted">Pinnacle Reasoning</span>}
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg border border-app bg-surface-elevated px-2.5 py-1 text-xs text-muted"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </div>
      </header>

      <main className={`mx-auto w-full max-w-lg flex-1 ${hideNav ? 'px-0 py-0' : 'px-4 py-4'}`}>
        {children}
      </main>

      {!hideNav && (
        <nav className="sticky bottom-0 border-t border-app bg-header backdrop-blur">
          <div className="mx-auto grid max-w-lg grid-cols-4">
            {navItems.map((item) => {
              const active =
                item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                    active ? 'text-accent' : 'text-muted'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
