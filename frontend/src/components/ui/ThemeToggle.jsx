import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/useTheme'

const options = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
]

export function ThemeToggle({ compact = false }) {
  const { theme, setTheme } = useTheme()

  if (compact) {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    const Current = options.find((item) => item.value === theme)?.Icon || Monitor
    return (
      <button
        type="button"
        onClick={() => setTheme(next)}
        className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface-raised text-text-muted shadow-soft transition-colors hover:bg-surface hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        aria-label={`Theme: ${theme}. Switch theme`}
        title={`Theme: ${theme}`}
      >
        <Current className="h-[18px] w-[18px]" />
      </button>
    )
  }

  return (
    <div className="inline-flex rounded-xl border border-border bg-surface-raised p-1" role="radiogroup" aria-label="Theme">
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          onClick={() => setTheme(value)}
          className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
            theme === value ? 'bg-brand text-brand-foreground shadow-soft' : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  )
}
