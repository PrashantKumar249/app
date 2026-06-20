import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
      },
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        applyTheme(next)
        set({ theme: next })
      },
    }),
    {
      name: 'ssc-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme)
      },
    },
  ),
)

export function initTheme() {
  const stored = localStorage.getItem('ssc-theme')
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as { state?: { theme?: Theme } }
      applyTheme(parsed.state?.theme ?? 'dark')
      return
    } catch {
      // fall through
    }
  }
  applyTheme('dark')
}
