import { AlertCircle, CheckCircle2, X } from 'lucide-react'

export function Button({ children, variant = 'primary', size = 'md', loading = false, className = '', ...props }) {
  const variants = {
    primary: 'bg-brand text-brand-foreground shadow-[0_8px_20px_-10px_var(--brand)] hover:brightness-[1.06]',
    secondary: 'border border-border bg-surface-raised text-text-primary shadow-soft hover:bg-surface',
    ghost: 'text-text-muted hover:bg-surface hover:text-text-primary',
    danger: 'border border-danger/20 bg-danger/10 text-danger hover:bg-danger/15',
  }
  const sizes = { sm: 'h-9 px-3 text-xs', md: 'h-11 px-4 text-sm', lg: 'h-12 px-5 text-sm' }
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-[background-color,border-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
      {children}
    </button>
  )
}

export function Card({ children, className = '', ...props }) {
  return <div className={`rounded-2xl border border-border/75 bg-surface-raised shadow-soft ${className}`} {...props}>{children}</div>
}

export function Badge({ tone = 'neutral', children, className = '' }) {
  const tones = {
    neutral: 'border-border bg-surface text-text-muted',
    confirmed: 'border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/50 dark:text-emerald-300',
    waitlisted: 'border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-300',
    cancelled: 'border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-800/70 dark:bg-rose-950/40 dark:text-rose-300',
    published: 'border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/50 dark:text-emerald-300',
    draft: 'border-border bg-surface text-text-muted',
    closed: 'border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-800/70 dark:bg-rose-950/40 dark:text-rose-300',
  }
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${tones[tone] || tones.neutral} ${className}`}>{children}</span>
}

export function Field({ label, error, id, className = '', children, hint }) {
  return (
    <label className={`block ${className}`} htmlFor={id}>
      {label && <span className="mb-2 block text-sm font-bold text-text-primary">{label}</span>}
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs text-text-muted">{hint}</span>}
      {error && <span className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-danger"><AlertCircle className="h-3.5 w-3.5" />{error}</span>}
    </label>
  )
}

export function Input({ error, className = '', ...props }) {
  return <input className={`h-12 w-full rounded-xl border bg-surface-raised px-4 text-sm text-text-primary outline-none placeholder:text-text-muted/70 transition-[border-color,box-shadow] ${error ? 'border-danger/70 ring-4 ring-danger/10' : 'border-border hover:border-text-muted/40 focus:border-brand focus:ring-4 focus:ring-brand/10'} ${className}`} {...props} />
}

export function Select({ error, className = '', children, ...props }) {
  return <select className={`h-12 w-full rounded-xl border bg-surface-raised px-4 text-sm text-text-primary outline-none transition-[border-color,box-shadow] ${error ? 'border-danger/70 ring-4 ring-danger/10' : 'border-border hover:border-text-muted/40 focus:border-brand focus:ring-4 focus:ring-brand/10'} ${className}`} {...props}>{children}</select>
}

export function Textarea({ error, className = '', ...props }) {
  return <textarea className={`w-full resize-none rounded-xl border bg-surface-raised px-4 py-3 text-sm text-text-primary outline-none placeholder:text-text-muted/70 transition-[border-color,box-shadow] ${error ? 'border-danger/70 ring-4 ring-danger/10' : 'border-border hover:border-text-muted/40 focus:border-brand focus:ring-4 focus:ring-brand/10'} ${className}`} {...props} />
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-text-muted/10 ${className}`} />
}

export function EmptyState({ icon: Icon = AlertCircle, title, description, action }) {
  return (
    <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-border bg-surface-raised text-center">
      <div className="max-w-sm px-6">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-border bg-surface"><Icon className="h-6 w-6 text-text-muted" /></div>
        <h3 className="mt-4 font-display text-lg font-extrabold text-text-primary">{title}</h3>
        {description && <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  )
}

export function StatCard({ icon: Icon, label, value, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand/10 text-brand',
    success: 'bg-emerald-500/10 text-success',
    warning: 'bg-amber-500/10 text-warning',
  }
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-text-muted">{label}</p>
        {Icon && <span className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}><Icon className="h-4 w-4" /></span>}
      </div>
      <p className="mt-3 tabular-nums font-display text-2xl font-extrabold text-text-primary">{value}</p>
    </Card>
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', busy = false }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-[#0b0f14]/55 px-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface-raised p-6 shadow-raised">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-danger/10"><AlertCircle className="h-6 w-6 text-danger" /></div>
        <h3 id="confirm-title" className="mt-5 font-display text-xl font-extrabold text-text-primary">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={busy}>Keep it</Button>
          <Button variant="danger" onClick={onConfirm} loading={busy}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}

export function Drawer({ open, onClose, title, eyebrow, children, footer, width = 'max-w-xl' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-[#0b0f14]/45 backdrop-blur-sm" onClick={onClose} aria-label="Close drawer" />
      <aside className={`absolute right-0 top-0 flex h-full w-full ${width} translate-x-0 flex-col border-l border-border bg-surface-raised shadow-raised motion-safe:animate-[toast-in_180ms_ease-out]`}>
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>{eyebrow && <p className="text-xs font-bold uppercase tracking-wider text-brand">{eyebrow}</p>}<h2 className="mt-1 font-display text-xl font-extrabold text-text-primary">{title}</h2></div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-border text-text-muted hover:bg-surface hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-border px-6 py-4">{footer}</div>}
      </aside>
    </div>
  )
}

export function ToastIcon({ type }) {
  return type === 'error'
    ? <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
    : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
}
