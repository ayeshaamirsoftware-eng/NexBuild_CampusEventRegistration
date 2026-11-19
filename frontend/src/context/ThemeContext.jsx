import { useEffect, useMemo, useState } from 'react'
import { ThemeContext, THEME_KEY } from './theme'

export function ThemeProvider({ children }) {
  const [choice, setChoice] = useState(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY)
      return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
    } catch {
      return 'system'
    }
  })

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = choice === 'dark' || (choice === 'system' && media.matches)
      document.documentElement.classList.toggle('dark', dark)
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0b0f14' : '#f8fafc')
    }
    apply()
    try { localStorage.setItem(THEME_KEY, choice) } catch {}
    media.addEventListener?.('change', apply)
    return () => media.removeEventListener?.('change', apply)
  }, [choice])

  const value = useMemo(() => ({ theme: choice, setTheme: setChoice }), [choice])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

