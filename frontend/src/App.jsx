import { Component, createContext, useContext, useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import {
  AlertCircle, ArrowRight, Bell, CalendarDays, CheckCircle2, ChevronRight,
  Clock3, GraduationCap, LogOut, MapPin, Menu, Search, ShieldCheck,
  Ticket, Timer, Users, X, Eye, EyeOff, Building2, Sparkles,
  Plus, Pencil, SlidersHorizontal, UserCheck
} from 'lucide-react'
import { ThemeToggle } from './components/ui/ThemeToggle'
import { Button, Card, EmptyState, ConfirmDialog, Drawer, StatCard, ToastIcon } from './components/ui'
import { getEventImage, normalizeArray, normalizeObject } from './utils/eventMedia'

const API_URL = 'http://127.0.0.1:8000/api'
const api = axios.create({ baseURL: API_URL })

const AuthContext = createContext(null)
const ToastContext = createContext(null)

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('nexbuild_user'))
      return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : null
    } catch { return null }
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const request = api.interceptors.request.use((config) => {
      const token = localStorage.getItem('nexbuild_token')
      if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    })
    const response = api.interceptors.response.use(
      (value) => value,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('nexbuild_token')
          localStorage.removeItem('nexbuild_user')
          setUser(null)
          if (!window.location.pathname.startsWith('/login')) window.location.assign('/login')
        }
        if (error.response?.status === 403) {
          window.dispatchEvent(new CustomEvent('campus-api-message', {
            detail: { message: 'You do not have permission to perform this action.', type: 'error' },
          }))
        }
        return Promise.reject(error)
      },
    )
    return () => {
      api.interceptors.request.eject(request)
      api.interceptors.response.eject(response)
    }
  }, [])

  const login = async (email, password) => {
    setLoading(true)
    try {
      const { data } = await api.post('/login', { email, password })
      localStorage.setItem('nexbuild_token', data.token)
      localStorage.setItem('nexbuild_user', JSON.stringify(data.user))
      setUser(data.user)
      return data.user
    } finally { setLoading(false) }
  }

  const register = async (values) => {
    setLoading(true)
    try {
      await api.post('/register', values)
      return await login(values.email, values.password)
    } finally { setLoading(false) }
  }

  const logout = async () => {
    try { await api.post('/logout') } catch {}
    localStorage.removeItem('nexbuild_token')
    localStorage.removeItem('nexbuild_user')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}
const useAuth = () => useContext(AuthContext)

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const push = (message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((items) => [...items, { id, message, type }])
    setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 4200)
  }
  useEffect(() => {
    const handleMessage = (event) => push(event.detail.message, event.detail.type || 'error')
    window.addEventListener('campus-api-message', handleMessage)
    return () => window.removeEventListener('campus-api-message', handleMessage)
  }, [])
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex w-[calc(100%-2.5rem)] max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast-enter flex items-start gap-3 rounded-2xl border border-border bg-surface-raised p-4 shadow-raised">
            <ToastIcon type={toast.type} />
            <p className="text-sm font-semibold leading-5 text-text-primary">{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
const useToast = () => useContext(ToastContext)

function Brand({ light = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="NexBuild home">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-brand-foreground shadow-lg shadow-brand/20">
        <GraduationCap className="h-6 w-6" />
      </span>
      <span className={`font-display text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-text-primary'}`}>NexBuild</span>
    </Link>
  )
}

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const signOut = async () => { await logout(); navigate('/login') }
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-surface-raised/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <Brand />
        {user && (
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? 'bg-brand/10 text-brand' : 'text-text-muted hover:text-text-primary'}`}>Discover Events</NavLink>
            {user.role === 'student'
              ? <NavLink to="/my-registrations" className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? 'bg-brand/10 text-brand' : 'text-text-muted hover:text-text-primary'}`}>My Registrations</NavLink>
              : <NavLink to="/organizer" className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? 'bg-brand/10 text-brand' : 'text-text-muted hover:text-text-primary'}`}>Organizer Studio</NavLink>}
          </nav>
        )}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <ThemeToggle compact />
              <button className="grid h-9 w-9 place-items-center rounded-full text-text-muted hover:bg-surface hover:text-text-primary" aria-label="Notifications"><Bell className="h-5 w-5" /></button>
              <div className="text-right">
                <p className="text-sm font-bold text-text-primary">{user?.name || 'Account'}</p>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-brand">{user?.role === 'student' ? 'Member' : user?.role || 'Member'}</p>
              </div>
              <button onClick={signOut} className="grid h-9 w-9 place-items-center rounded-lg border border-border text-text-muted hover:border-danger/30 hover:bg-danger/10 hover:text-danger" aria-label="Sign out"><LogOut className="h-4 w-4" /></button>
            </>
          ) : <Link to="/login" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700">Sign in</Link>}
        </div>
        <div className="flex items-center gap-2 md:hidden">
          {user && <ThemeToggle compact />}
          <button onClick={() => setOpen(!open)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 md:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
        </div>
      </div>
      {open && user && (
        <div className="border-t border-slate-100 bg-white px-5 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            <Link onClick={() => setOpen(false)} to="/" className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700">Discover Events</Link>
            {user.role === 'student' && <Link onClick={() => setOpen(false)} to="/my-registrations" className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700">My Registrations</Link>}
                {user.role === 'organizer' && <Link onClick={() => setOpen(false)} to="/organizer" className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700">Organizer Studio</Link>}
            <button onClick={signOut} className="rounded-lg px-3 py-3 text-left text-sm font-semibold text-rose-600">Sign out</button>
          </div>
        </div>
      )}
    </header>
  )
}

function AuthLayout({ mode }) {
  const { login, register, loading } = useAuth()
  const push = useToast()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' })

  const setValue = (key, value) => {
    setForm((old) => ({ ...old, [key]: value }))
    setErrors((old) => ({ ...old, [key]: undefined }))
  }

  const submit = async (e) => {
    e?.preventDefault()
    const next = {}
    if (mode === 'register' && !form.name.trim()) next.name = 'Please enter your name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.'
    if (form.password.length < (mode === 'register' ? 8 : 1)) next.password = mode === 'register' ? 'Password must be at least 8 characters.' : 'Enter your password.'
    if (mode === 'register' && form.password !== form.password_confirmation) next.password_confirmation = 'Passwords do not match.'
    setErrors(next)
    if (Object.keys(next).length) { push('Please check the highlighted fields.', 'error'); return }
    try {
      await (mode === 'register' ? register(form) : login(form.email, form.password))
      push(mode === 'register' ? 'Account created successfully.' : 'Welcome back!')
      navigate('/')
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to sign in. Check your credentials.'
      push(message, 'error')
    }
  }

  const demo = async (role) => {
    const email = role === 'organizer' ? 'organizer@campus.edu' : 'student1@campus.edu'
    setForm((old) => ({ ...old, email, password: 'password' }))
    try { await login(email, 'password'); push(`${role === 'organizer' ? 'Organizer' : 'Explorer'} demo opened.`); navigate('/') }
    catch { push('Demo sign-in failed. Make sure the backend is running.', 'error') }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
      <aside className="relative hidden overflow-hidden bg-slate-950 px-12 py-10 lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(79,70,229,.28),transparent_28%),radial-gradient(circle_at_80%_80%,rgba(16,185,129,.12),transparent_30%)]" />
        <div className="relative"><Brand light /></div>
        <div className="relative my-auto max-w-xl">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-indigo-200"><Sparkles className="h-3.5 w-3.5" /> Good times, great people</span>
          <h1 className="font-display text-5xl font-extrabold leading-[1.08] tracking-tight text-white">Find your next thing.<br />Meet your people.</h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-slate-300">Discover gatherings, track seat availability, and make every week more memorable.</p>
          <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
            {[['12+', 'live events'], ['2.4k', 'members'], ['98%', 'seat accuracy']].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[.06] p-4 backdrop-blur-sm">
                <p className="font-display text-xl font-bold text-white">{value}</p><p className="mt-1 text-xs text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-slate-500">© 2026 NexBuild Community</p>
      </aside>
      <main className="relative grid place-items-center bg-slate-50 px-5 py-10">
        <div className="absolute right-5 top-5"><ThemeToggle compact /></div>
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Brand /></div>
          <div className="mb-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">{mode === 'login' ? 'Welcome back' : 'Join the community'}</p>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-950">{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</h2>
          </div>
          <form onSubmit={submit} noValidate className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
            {mode === 'register' && <Field label="Full name" value={form.name} onChange={(v) => setValue('name', v)} error={errors.name} placeholder="Alex Morgan" />}
            <Field label="Email address" type="email" value={form.email} onChange={(v) => setValue('email', v)} error={errors.email} placeholder="you@campus.edu" />
            <Field label="Password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(v) => setValue('password', v)} error={errors.password} placeholder="••••••••" trailing={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-700">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
            } />
            {mode === 'register' && <Field label="Confirm password" type="password" value={form.password_confirmation} onChange={(v) => setValue('password_confirmation', v)} error={errors.password_confirmation} placeholder="••••••••" />}
            <button disabled={loading} className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-600/15 hover:bg-indigo-700 disabled:opacity-60">
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight className="h-4 w-4" />
            </button>
            {mode === 'login' && (
              <div className="mt-6">
                <div className="mb-3 flex items-center gap-3"><div className="h-px flex-1 bg-slate-200" /><span className="text-xs font-semibold text-slate-400">Quick demo access</span><div className="h-px flex-1 bg-slate-200" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => demo('organizer')} className="rounded-xl border border-slate-200 px-3 py-3 text-left hover:border-indigo-300 hover:bg-indigo-50"><span className="block text-sm font-bold text-slate-800">Organizer Demo</span><span className="mt-1 block text-[11px] text-slate-500">Manage community events</span></button>
                  <button type="button" onClick={() => demo('student')} className="rounded-xl border border-slate-200 px-3 py-3 text-left hover:border-indigo-300 hover:bg-indigo-50"><span className="block text-sm font-bold text-slate-800">Explorer Demo</span><span className="mt-1 block text-[11px] text-slate-500">Discover & join</span></button>
                </div>
              </div>
            )}
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === 'login' ? 'New to NexBuild?' : 'Already have an account?'}{' '}
            <Link to={mode === 'login' ? '/register' : '/login'} className="font-bold text-indigo-600 hover:text-indigo-700">{mode === 'login' ? 'Create account' : 'Sign in'}</Link>
          </p>
        </div>
      </main>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, error, placeholder, trailing }) {
  return (
    <label className="mb-5 block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <span className="relative block">
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className={`h-12 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 ${trailing ? 'pr-12' : ''} ${error ? 'border-rose-400 ring-4 ring-rose-50' : 'border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50'}`} />
        {trailing && <span className="absolute right-4 top-1/2 -translate-y-1/2">{trailing}</span>}
      </span>
      {error && <span className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-rose-600"><AlertCircle className="h-3.5 w-3.5" />{error}</span>}
    </label>
  )
}

const formatDate = (value, options = {}) => {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', ...options,
  }).format(date)
}

const dateTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(date)
}

function handleEventMediaError(event) {
  if (!event.currentTarget.src.endsWith('/images/campus-default.jpg')) {
    event.currentTarget.src = '/images/campus-default.jpg'
  }
}

function StatusPill({ event }) {
  if (event?.registration_deadline && new Date(event.registration_deadline) < new Date()) {
    return <span className="inline-flex items-center rounded-full border border-rose-200/70 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">Registration Closed</span>
  }
  if (Number(event?.available_seats) <= 0) {
    return <span className="inline-flex items-center rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">Waitlist Active</span>
  }
  return <span className="inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Spots Open</span>
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="h-36 bg-slate-200" /><div className="p-5">
        <div className="h-4 w-24 rounded bg-slate-200" /><div className="mt-4 h-6 w-4/5 rounded bg-slate-200" />
        <div className="mt-3 h-4 w-full rounded bg-slate-100" /><div className="mt-6 h-2 rounded bg-slate-100" />
      </div>
    </div>
  )
}

function EventCard({ event }) {
  const media = getEventImage(event)
  const capacity = Number(event?.capacity) || 0
  const availableSeats = Number(event?.available_seats) || 0
  const filled = capacity ? Math.max(0, capacity - availableSeats) : 0
  const percent = capacity ? Math.min(100, Math.round((filled / capacity) * 100)) : 0
  const eventDate = event?.event_date
  return (
    <Link to={`/events/${event?.id || ''}`} className="group overflow-hidden rounded-2xl border border-border/75 bg-surface-raised shadow-soft transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-raised">
      <div className="relative h-44 w-full overflow-hidden">
        <img src={media} onError={handleEventMediaError} alt="" className="h-44 w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
        <div className="absolute left-4 top-4">
          <span className="rounded-full border border-white/20 bg-slate-950/35 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">{event?.category?.name || 'Community Event'}</span>
        </div>
        <div className="absolute bottom-4 right-4 grid h-12 w-12 place-items-center rounded-xl border border-white/20 bg-slate-950/35 text-center text-white backdrop-blur-md">
          <div><span className="block text-[9px] font-bold uppercase">{eventDate ? formatDate(eventDate, { year: undefined }).split(' ')[0] : 'TBD'}</span><strong className="tabular-nums font-display text-lg leading-none">{eventDate && !Number.isNaN(new Date(eventDate).getTime()) ? new Date(eventDate).getDate() : '—'}</strong></div>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <StatusPill event={event || {}} />
          <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600" />
        </div>
        <h3 className="mt-3 font-display text-lg font-extrabold leading-snug text-text-primary">{event?.title || 'Untitled event'}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-muted">{event?.description || 'Event details coming soon.'}</p>
        <div className="mt-4 space-y-2 text-xs font-semibold text-text-muted">
          <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-brand" /><span className="tabular-nums">{eventDate ? dateTime(eventDate) : 'Date to be announced'}</span></div>
          <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand" /><span>{event?.location || 'Location to be announced'}</span></div>
          <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-brand" /><span>{event?.organizer?.name || 'Community Hosts'}</span></div>
        </div>
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs tabular-nums"><span className="font-semibold text-text-muted"><strong className="text-text-primary">{availableSeats}</strong> remaining</span><span className="font-bold text-text-muted">{percent}% filled</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${percent}%` }} /></div>
          <p className="mt-2 text-[11px] text-text-muted tabular-nums">{filled} confirmed · {capacity || '—'} total seats</p>
        </div>
      </div>
    </Link>
  )
}

function Discover() {
  const { user } = useAuth()
  const push = useToast()
  const [events, setEvents] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('soonest')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([api.get('/categories'), api.get('/events')])
      .then(([categoryRes, eventRes]) => {
        if (!active) return
        setCategories(normalizeArray(categoryRes.data).filter((item) => item && typeof item === 'object'))
        setEvents(normalizeArray(eventRes.data).filter((item) => item && typeof item === 'object'))
      })
      .catch((error) => {
        if (!active) return
        setLoadError(true)
        push(error.response?.data?.message || 'Could not load events. Please try again.', 'error')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => events.filter((event) => {
    const matchesSearch = !search || `${event.title || ''} ${event.description || ''} ${event.location || ''}`.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !category || event.category_id === Number(category)
    return matchesSearch && matchesCategory
  }).sort((a, b) => sort === 'seats'
    ? (Number(b.available_seats) || 0) - (Number(a.available_seats) || 0)
    : (new Date(a.event_date || 0).getTime() || 0) - (new Date(b.event_date || 0).getTime() || 0)), [events, search, category, sort])

  const firstName = typeof user?.name === 'string' ? user.name.trim().split(/\s+/)[0] : 'Explorer'
  const seatsLeft = events.reduce((sum, event) => sum + (Number(event.available_seats) || 0), 0)

  return (
    <main className="min-h-[calc(100vh-72px)]">
      <section className="border-b border-slate-200/70 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-12">
          <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-brand">Discover</p>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">Good to see you, {firstName === 'Student' ? 'Explorer' : firstName}.</h1>
              <p className="mt-3 text-sm text-text-muted sm:text-base">Explore what’s happening around your community this season.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[['Live events', events.length], ['Categories', categories.length], ['Seats left', seatsLeft]].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center"><p className="font-display text-xl font-extrabold text-slate-950">{value}</p><p className="mt-0.5 text-[11px] font-semibold text-slate-500">{label}</p></div>
              ))}
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 md:flex-row">
            <label className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events, topics, or locations..." className="h-12 w-full rounded-xl border border-slate-200/75 bg-slate-50 pl-12 pr-11 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50" />
              {search && <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Clear search"><X className="h-4 w-4" /></button>}
            </label>
            <label className="relative">
              <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-600" />
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-12 appearance-none rounded-xl border border-slate-200/75 bg-white pl-10 pr-9 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50">
                <option value="soonest">Soonest Event</option>
                <option value="seats">Most Seats Left</option>
              </select>
            </label>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          <button onClick={() => setCategory('')} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${!category ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15' : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-200'}`}>All</button>
          {categories.map((item) => (
            <button key={item.id} onClick={() => setCategory(String(item.id))} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${category === String(item.id) ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15' : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-200'}`}>{item.name}</button>
          ))}
        </div>
        {loading ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[1,2,3].map((item) => <SkeletonCard key={item} />)}</div>
          : loadError ? <EmptyState icon={AlertCircle} title="Events didn’t load" description="Check your connection and try again." action={<Button onClick={() => window.location.reload()}>Reload</Button>} />
          : filtered.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map((event) => <EventCard key={event.id} event={event} />)}</div>
          : <EmptyState
              icon={Search}
              title="No events found"
              description="Try another category or a broader search."
              action={<Button variant="secondary" onClick={() => { setSearch(''); setCategory('') }}>Clear filters</Button>}
            />}
      </section>
    </main>
  )
}

function ConfirmModal({ open, onClose, onConfirm, title, description, busy = false }) {
  return <ConfirmDialog open={open} onClose={onClose} onConfirm={onConfirm} title={title} description={description} confirmLabel="Cancel registration" busy={busy} />
}

function EventDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const push = useToast()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const load = () => api.get(`/events/${id}`).then((res) => setEvent(normalizeObject(res.data, 'event'))).finally(() => setLoading(false))
  useEffect(() => { setLoading(true); load().catch(() => push('Unable to load this event.', 'error')) }, [id])

  const register = async () => {
    if (!user) { navigate('/login'); return }
    setBusy(true)
    try {
      const { data } = await api.post(`/events/${id}/register`)
      push(data.registration.status === 'confirmed' ? 'You’re confirmed! Your seat is reserved.' : 'You joined the priority waitlist.')
      await load()
    } catch (error) {
      push(error.response?.data?.message || 'Registration could not be completed.', 'error')
    } finally { setBusy(false) }
  }

  const cancel = async () => {
    setBusy(true)
    try {
      await api.post(`/events/${id}/cancel`)
      setConfirmOpen(false)
      push('Registration cancelled.')
      await load()
    } catch (error) {
      push(error.response?.data?.message || 'Cancellation could not be completed.', 'error')
    } finally { setBusy(false) }
  }

  if (loading) return <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8"><SkeletonCard /></main>
  if (!event) return <main className="grid min-h-[70vh] place-items-center"><div className="text-center"><h1 className="font-display text-2xl font-extrabold">Event unavailable</h1><Link to="/" className="mt-4 inline-block text-sm font-bold text-indigo-600">Back to events</Link></div></main>

  const filled = event.capacity - event.available_seats
  const percent = event.capacity ? Math.round((filled / event.capacity) * 100) : 0
  const deadlinePassed = new Date(event.registration_deadline) < new Date()
  const cancellationPassed = new Date(event.cancellation_deadline) < new Date()
  const status = event.registration_status
  return (
    <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
      <Link to="/" className="mb-5 inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-indigo-600"><ArrowRight className="h-4 w-4 rotate-180" /> All events</Link>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-950 dark:border-slate-800 sm:h-80">
            <img src={getEventImage(event)} onError={(e) => { e.currentTarget.src = '/images/campus-default.jpg' }} alt={event.title} className="h-full w-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent" />
            <div className="absolute left-6 top-6 sm:left-8 sm:top-8">
              <span className="rounded-full border border-white/20 bg-slate-950/35 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">{event.category?.name || 'Community Event'}</span>
            </div>
            <div className="absolute bottom-5 left-6 right-6 text-white sm:left-8 sm:right-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/75">{formatDate(event.event_date)}</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-white/90"><MapPin className="h-4 w-4" />{event.location}</p>
            </div>
          </div>
          <div className="mt-7 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl">{event.title}</h1>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
              <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-indigo-600" />{dateTime(event.event_date)}</span>
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-indigo-600" />{event.location}</span>
              <span className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-indigo-600" />{event.organizer?.name || 'Community Hosts'}</span>
            </div>
            <div className="my-7 h-px bg-slate-100" />
            <h2 className="font-display text-xl font-extrabold text-slate-950">About this event</h2>
            <p className="mt-3 leading-7 text-slate-600">{event.description}</p>
            <h2 className="mt-8 font-display text-xl font-extrabold text-slate-950">Schedule & venue</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="flex gap-3 rounded-2xl border border-slate-200/75 bg-slate-50/60 p-4"><Clock3 className="mt-0.5 h-5 w-5 text-indigo-600" /><div><p className="text-xs font-bold uppercase text-slate-400">Date & time</p><p className="mt-1 text-sm font-bold text-slate-800 tabular-nums">{dateTime(event.event_date)}</p></div></div>
              <div className="flex gap-3 rounded-2xl border border-slate-200/75 bg-slate-50/60 p-4"><Building2 className="mt-0.5 h-5 w-5 text-indigo-600" /><div><p className="text-xs font-bold uppercase text-slate-400">Venue</p><p className="mt-1 text-sm font-bold text-slate-800">{event.location}</p></div></div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-indigo-200/70 bg-indigo-50/60 p-4"><p className="text-xs font-bold uppercase text-indigo-500">Registration deadline</p><p className="mt-2 text-sm font-bold text-indigo-950 tabular-nums">{dateTime(event.registration_deadline)}</p></div>
              <div className="rounded-2xl border border-slate-200/75 bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">Cancellation deadline</p><p className="mt-2 text-sm font-bold text-slate-800 tabular-nums">{dateTime(event.cancellation_deadline)}</p></div>
            </div>
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-amber-700" /><div><h3 className="font-display text-sm font-extrabold text-amber-950">Registration & cancellation policy</h3><p className="mt-2 text-sm leading-6 text-amber-900/75">Registration closes {dateTime(event.registration_deadline)}. Cancellation is available until {dateTime(event.cancellation_deadline)}. Waitlisted members move into confirmed seats when one becomes available.</p></div></div>
            </div>
          </div>
        </div>
        <aside>
          <div className="sticky top-[96px] rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            {status === 'confirmed' && <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-5 w-5" />You're Confirmed!</div>}
            {status === 'waitlisted' && <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-700"><Timer className="h-5 w-5" />You're on the Waitlist</div>}
            {status === 'cancelled' && <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-600"><X className="h-5 w-5" />Cancelled</div>}
            <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Seat capacity</p><p className="mt-1 font-display text-xl font-extrabold text-slate-950">{filled} / {event.capacity} seats filled</p></div><Users className="h-6 w-6 text-indigo-500" /></div>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${percent}%` }} /></div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-bold uppercase text-slate-400">Available</p><p className="mt-1 text-lg font-extrabold text-emerald-600">{event.available_seats}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-bold uppercase text-slate-400">Deadline</p><p className="mt-1 text-xs font-bold text-slate-700">{formatDate(event.registration_deadline)}</p></div>
            </div>
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-xs font-semibold text-slate-600"><Timer className="h-4 w-4 text-indigo-500" /><span>Registration closes <strong>{dateTime(event.registration_deadline)}</strong></span></div>
            {status === 'confirmed' || status === 'waitlisted'
              ? <button onClick={() => setConfirmOpen(true)} disabled={busy || cancellationPassed} className="mt-5 h-12 w-full rounded-xl border border-rose-200/80 bg-rose-50 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400">{busy ? 'Please wait...' : cancellationPassed ? 'Cancellation Closed' : 'Cancel Registration'}</button>
              : <button onClick={register} disabled={busy || deadlinePassed} className="mt-5 h-12 w-full rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-600/15 hover:bg-indigo-700 disabled:bg-slate-300 disabled:shadow-none">
                  {busy ? 'Please wait...' : deadlinePassed ? 'Deadline Passed' : event.available_seats > 0 ? 'Confirm My Seat' : 'Join Priority Waitlist'}
                </button>}
            <p className="mt-3 text-center text-[11px] font-semibold text-slate-400">Free registration · Instant confirmation</p>
          </div>
        </aside>
      </div>
      <ConfirmModal open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={cancel} busy={busy} title="Cancel this registration?" description="This will release your place. If you're confirmed, the next student on the waitlist may be promoted automatically." />
    </main>
  )
}

function MyRegistrations() {
  const push = useToast()
  const [registrations, setRegistrations] = useState([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [target, setTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const load = () => api.get('/my-registrations').then((res) => setRegistrations(
    normalizeArray(res.data).filter((item) => item && typeof item === 'object'),
  )).finally(() => setLoading(false))
  useEffect(() => {
    let active = true
    api.get('/my-registrations')
      .then((res) => {
        if (active) setRegistrations(normalizeArray(res.data).filter((item) => item && typeof item === 'object'))
      })
      .catch(() => { if (active) push('Unable to load registrations.', 'error') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const cancel = async () => {
    setCancelling(true)
    try {
      await api.post(`/events/${target.event_id}/cancel`)
      push('Registration cancelled.')
      setTarget(null)
      await load()
    } catch (error) {
      push(error.response?.data?.message || 'Cancellation failed.', 'error')
    } finally { setCancelling(false) }
  }

  const labels = { All: 'All', confirmed: 'Confirmed', waitlisted: 'Waitlisted', cancelled: 'Cancelled' }
  const visible = registrations.filter((item) => filter === 'All' || item.status === filter.toLowerCase())
  const upcoming = visible.filter((item) => new Date(item.event?.event_date) >= new Date())
  const past = visible.filter((item) => new Date(item.event?.event_date) < new Date())

  return (
    <main className="mx-auto min-h-[calc(100vh-72px)] max-w-7xl px-5 py-10 lg:px-8">
      <div className="flex items-end justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Your activity</p><h1 className="mt-2 font-display text-3xl font-extrabold text-slate-950">My Registrations</h1></div>
        <Link to="/" className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:border-indigo-200 sm:flex"><CalendarDays className="h-4 w-4 text-indigo-600" />Discover events</Link>
      </div>
      <div className="mt-8 flex gap-2 overflow-x-auto border-b border-slate-200">
        {Object.entries(labels).map(([value, label]) => (
          <button key={value} onClick={() => setFilter(value)} className={`shrink-0 border-b-2 px-4 pb-3 text-sm font-bold ${filter === value ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{label}</button>
        ))}
      </div>
      {loading ? <div className="mt-6 grid gap-4">{[1,2].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-slate-200" />)}</div>
        : visible.length ? <div className="mt-6 space-y-8">
            {[['Upcoming', upcoming], ['Past', past]].map(([heading, items]) => items.length > 0 && (
              <section key={heading}>
                <div className="mb-3 flex items-center gap-3"><h2 className="font-display text-sm font-extrabold text-text-primary">{heading}</h2><span className="tabular-nums rounded-full border border-border bg-surface-raised px-2 py-0.5 text-[10px] font-bold text-text-muted">{items.length}</span></div>
                <div className="grid gap-3">{items.map((item) => (
              <Card key={item.id} className="grid items-center gap-5 p-5 sm:grid-cols-[72px_1fr_auto]">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><CalendarDays className="h-7 w-7" /></div>
                <div><div className="mb-2"><RegistrationStatus status={item.status} /></div><h3 className="font-display text-lg font-extrabold text-slate-950">{item.event?.title}</h3><div className="mt-2 flex flex-wrap gap-4 text-xs font-semibold text-slate-500"><span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{dateTime(item.event?.event_date)}</span><span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{item.event?.location}</span></div></div>
                <div className="flex gap-2 sm:justify-end">
                  <Link to={`/events/${item.event_id}`} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-indigo-200 hover:text-indigo-600">View event</Link>
                  {(item.status === 'confirmed' || item.status === 'waitlisted') && <button onClick={() => setTarget(item)} disabled={new Date(item.event?.cancellation_deadline) < new Date()} className="rounded-xl border border-rose-200/80 px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent">{new Date(item.event?.cancellation_deadline) < new Date() ? 'Closed' : 'Cancel'}</button>}
                </div>
              </Card>
                ))}</div>
              </section>
            ))}
          </div>
        : <div className="mt-8"><EmptyState icon={Ticket} title="No registrations here" description="Find an event and reserve your seat." action={<Link to="/" className="inline-flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-bold text-brand-foreground">Discover events</Link>} /></div>}
      <ConfirmModal open={!!target} onClose={() => setTarget(null)} onConfirm={cancel} busy={cancelling} title="Cancel this registration?" description="This will release your place and notify you of the updated status." />
    </main>
  )
}

function RegistrationStatus({ status }) {
  const styles = {
    confirmed: 'border-emerald-200/80 bg-emerald-50 text-emerald-700',
    waitlisted: 'border-amber-200/80 bg-amber-50 text-amber-700',
    cancelled: 'border-rose-200/80 bg-rose-50 text-rose-700',
  }
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ${styles[status] || 'border-slate-200/80 bg-slate-100 text-slate-600'}`}>{status}</span>
}

function ProtectedRoute({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

function AppShell() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
        <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
        <Route path="/my-registrations" element={<ProtectedRoute role="student"><MyRegistrations /></ProtectedRoute>} />
        <Route path="/organizer" element={<ProtectedRoute role="organizer"><OrganizerPlaceholder /></ProtectedRoute>} />
        <Route path="/organizer/events/:id/registrants" element={<ProtectedRoute role="organizer"><RegistrantPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

function EventStatusBadge({ status }) {
  const styles = {
    draft: 'border-slate-200/80 bg-slate-100 text-slate-600',
    published: 'border-emerald-200/80 bg-emerald-50 text-emerald-700',
    closed: 'border-rose-200/80 bg-rose-50 text-rose-700',
  }
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ${styles[status] || styles.draft}`}>{status}</span>
}

function toDateTimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16)
}

function EventDrawer({ open, event, categories, onClose, onSaved }) {
  const push = useToast()
  const empty = {
    category_id: '', title: '', description: '', location: '',
    event_date: '', registration_deadline: '', cancellation_deadline: '', capacity: 50,
  }
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setErrors({})
    setForm(event ? {
      category_id: String(event.category_id),
      title: event.title || '',
      description: event.description || '',
      location: event.location || '',
      event_date: toDateTimeLocal(event.event_date),
      registration_deadline: toDateTimeLocal(event.registration_deadline),
      cancellation_deadline: toDateTimeLocal(event.cancellation_deadline),
      capacity: event.capacity || 1,
    } : empty)
  }, [open, event])

  const setValue = (key, value) => {
    setForm((old) => ({ ...old, [key]: value }))
    setErrors((old) => ({ ...old, [key]: undefined }))
  }

  const validate = () => {
    const next = {}
    if (!form.category_id) next.category_id = 'Choose a category.'
    if (!form.title.trim()) next.title = 'Event title is required.'
    if (!form.description.trim()) next.description = 'Description is required.'
    if (!form.location.trim()) next.location = 'Location is required.'
    if (!form.event_date) next.event_date = 'Event date is required.'
    if (!form.registration_deadline) next.registration_deadline = 'Registration deadline is required.'
    else if (form.event_date && new Date(form.registration_deadline) > new Date(form.event_date)) next.registration_deadline = 'Registration deadline must be on or before the event date.'
    if (!form.cancellation_deadline) next.cancellation_deadline = 'Cancellation deadline is required.'
    else if (form.event_date && new Date(form.cancellation_deadline) > new Date(form.event_date)) next.cancellation_deadline = 'Cancellation deadline must be on or before the event date.'
    if (!Number.isInteger(Number(form.capacity)) || Number(form.capacity) < 1) next.capacity = 'Capacity must be at least 1.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) { push('Please correct the highlighted fields.', 'error'); return }
    setSaving(true)
    try {
      const payload = { ...form, category_id: Number(form.category_id), capacity: Number(form.capacity) }
      const { data } = event
        ? await api.put(`/organizer/events/${event.id}`, payload)
        : await api.post('/organizer/events', payload)
      push(event ? 'Event updated successfully.' : 'Event created as a draft.')
      onSaved(data.event)
      onClose()
    } catch (error) {
      const serverErrors = error.response?.data?.errors
      if (serverErrors) setErrors(Object.fromEntries(Object.entries(serverErrors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])))
      push(error.response?.data?.message || 'The event could not be saved.', 'error')
    } finally { setSaving(false) }
  }

  if (!open) return null
  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow="Organizer Studio"
      title={event ? 'Edit event' : 'Create new event'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>{event ? 'Save changes' : 'Create event'}<ArrowRight className="h-4 w-4" /></Button>
        </>
      }
    >
        <form onSubmit={submit} noValidate className="px-6 py-6">
          <DrawerField label="Event title" value={form.title} onChange={(v) => setValue('title', v)} error={errors.title} placeholder="Campus Innovation Expo" />
          <label className="mb-5 block"><span className="mb-2 block text-sm font-bold text-slate-700">Category</span><select value={form.category_id} onChange={(e) => setValue('category_id', e.target.value)} className={`h-12 w-full rounded-xl border bg-white px-4 text-sm outline-none ${errors.category_id ? 'border-rose-400 ring-4 ring-rose-50' : 'border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50'}`}><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{errors.category_id && <InlineError message={errors.category_id} />}</label>
          <label className="mb-5 block"><span className="mb-2 block text-sm font-bold text-slate-700">Description</span><textarea rows="4" value={form.description} onChange={(e) => setValue('description', e.target.value)} placeholder="Describe this event..." className={`w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none ${errors.description ? 'border-rose-400 ring-4 ring-rose-50' : 'border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50'}`} />{errors.description && <InlineError message={errors.description} />}</label>
          <DrawerField label="Location" value={form.location} onChange={(v) => setValue('location', v)} error={errors.location} placeholder="University Convention Hall" />
          <div className="grid gap-4 sm:grid-cols-2">
            <DrawerField label="Event date" type="datetime-local" value={form.event_date} onChange={(v) => setValue('event_date', v)} error={errors.event_date} />
            <DrawerField label="Capacity" type="number" value={form.capacity} onChange={(v) => setValue('capacity', v)} error={errors.capacity} />
          </div>
          <DrawerField label="Registration deadline" type="datetime-local" value={form.registration_deadline} onChange={(v) => setValue('registration_deadline', v)} error={errors.registration_deadline} />
          <DrawerField label="Cancellation deadline" type="datetime-local" value={form.cancellation_deadline} onChange={(v) => setValue('cancellation_deadline', v)} error={errors.cancellation_deadline} />
        </form>
    </Drawer>
  )
}

function InlineError({ message }) {
  return <span className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-rose-600"><AlertCircle className="h-3.5 w-3.5" />{message}</span>
}

function DrawerField({ label, type = 'text', value, onChange, error, placeholder }) {
  return <label className="mb-5 block"><span className="mb-2 block text-sm font-bold text-slate-700">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`h-12 w-full rounded-xl border px-4 text-sm outline-none ${error ? 'border-rose-400 ring-4 ring-rose-50' : 'border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50'}`} />{error && <InlineError message={error} />}</label>
}

function OrganizerPlaceholder() {
  const push = useToast()
  const [events, setEvents] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [drawer, setDrawer] = useState({ open: false, event: null })
  const [statusBusyId, setStatusBusyId] = useState(null)
  const [closeTarget, setCloseTarget] = useState(null)

  const load = () => Promise.all([api.get('/organizer/events'), api.get('/categories')])
    .then(([eventRes, categoryRes]) => {
      setEvents(normalizeArray(eventRes.data).filter((item) => item && typeof item === 'object'))
      setCategories(normalizeArray(categoryRes.data).filter((item) => item && typeof item === 'object'))
    })
    .finally(() => setLoading(false))
  useEffect(() => { load().catch(() => push('Unable to load organizer events.', 'error')) }, [])

  const saved = (savedEvent) => {
    setEvents((old) => {
      const exists = old.some((item) => item.id === savedEvent.id)
      return exists ? old.map((item) => item.id === savedEvent.id ? savedEvent : item) : [savedEvent, ...old]
    })
  }

  const updateStatus = async (event, status) => {
    setStatusBusyId(event.id)
    try {
      const { data } = await api.patch(`/organizer/events/${event.id}/status`, { status })
      setEvents((old) => old.map((item) => item.id === event.id ? { ...item, ...data.event } : item))
      setCloseTarget(null)
      push(status === 'published' ? 'Event published.' : status === 'closed' ? 'Event closed.' : 'Event moved to draft.')
    } catch (error) { push(error.response?.data?.message || 'Status could not be changed.', 'error') }
    finally { setStatusBusyId(null) }
  }

  const totals = events.reduce((sum, event) => ({
    confirmed: sum.confirmed + Number(event.confirmed_count || 0),
    waitlisted: sum.waitlisted + Number(event.waitlisted_count || 0),
  }), { confirmed: 0, waitlisted: 0 })

  return (
    <main className="mx-auto min-h-[calc(100vh-72px)] max-w-7xl px-5 py-10 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Organizer Studio</p><h1 className="mt-2 font-display text-3xl font-extrabold text-slate-950">Event management</h1></div>
        <button onClick={() => setDrawer({ open: true, event: null })} className="flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/15 hover:bg-indigo-700"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Create event</span></button>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Building2} label="Total Events" value={events.length} />
        <StatCard icon={CalendarDays} label="Published Events" value={events.filter((event) => event.status === 'published').length} tone="success" />
        <StatCard icon={UserCheck} label="Confirmed" value={totals.confirmed} tone="success" />
        <StatCard icon={Timer} label="Waitlisted" value={totals.waitlisted} tone="warning" />
      </div>
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="hidden grid-cols-[minmax(240px,1.6fr)_130px_150px_170px_220px] gap-4 border-b border-slate-200 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 lg:grid"><span>Event</span><span>Date</span><span>Capacity</span><span>Status</span><span className="text-right">Actions</span></div>
        {loading ? <div className="p-5"><div className="h-24 animate-pulse rounded-xl bg-slate-100" /></div>
          : events.length ? events.map((event) => {
            const confirmed = Number(event.confirmed_count || 0)
            const waitlisted = Number(event.waitlisted_count || 0)
            const percent = event.capacity ? Math.min(100, Math.round((confirmed / event.capacity) * 100)) : 0
            return <div key={event.id} className="grid gap-4 border-b border-slate-100 p-5 last:border-0 lg:grid-cols-[minmax(240px,1.6fr)_130px_170px_170px_220px] lg:items-center">
              <div><div className="mb-2 flex items-center gap-2"><EventStatusBadge status={event.status} /><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">{event.category?.name || 'Event'}</span></div><h3 className="font-display text-sm font-extrabold text-slate-950">{event.title}</h3><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" />{event.location}</p></div>
              <div className="text-xs font-bold text-slate-700">{formatDate(event.event_date)}<p className="mt-1 font-medium text-slate-400">{new Date(event.event_date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p></div>
              <div><div className="flex justify-between text-[11px]"><span className="font-bold text-slate-600">{confirmed} / {event.capacity}</span>{waitlisted > 0 && <span className="font-bold text-amber-700">{waitlisted} waitlist</span>}</div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${percent}%` }} /></div></div>
              <div className="flex flex-wrap items-center gap-2"><EventStatusBadge status={event.status} />{event.status === 'draft' && <button disabled={statusBusyId === event.id} onClick={() => updateStatus(event, 'published')} className="text-xs font-bold text-emerald-700 hover:text-emerald-800 disabled:opacity-50">{statusBusyId === event.id ? 'Publishing...' : 'Publish'}</button>}{event.status === 'published' && <button disabled={statusBusyId === event.id} onClick={() => setCloseTarget(event)} className="text-xs font-bold text-rose-600 hover:text-rose-700 disabled:opacity-50">Close Event</button>}{event.status === 'closed' && <button disabled={statusBusyId === event.id} onClick={() => updateStatus(event, 'draft')} className="text-xs font-bold text-slate-600 hover:text-slate-800 disabled:opacity-50">{statusBusyId === event.id ? 'Updating...' : 'Move to Draft'}</button>}</div>
              <div className="flex flex-wrap justify-start gap-2 lg:justify-end"><Link to={`/organizer/events/${event.id}/registrants`} className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-indigo-200 hover:text-indigo-600"><UserCheck className="h-3.5 w-3.5" />Registrants</Link><button onClick={() => setDrawer({ open: true, event })} className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-indigo-200 hover:text-indigo-600"><Pencil className="h-3.5 w-3.5" />Edit</button></div>
            </div>
          }) : <div className="grid min-h-72 place-items-center text-center"><div><CalendarDays className="mx-auto h-10 w-10 text-slate-300" /><h3 className="mt-4 font-display text-lg font-extrabold">No events yet</h3><button onClick={() => setDrawer({ open: true, event: null })} className="mt-3 text-sm font-bold text-indigo-600">Create your first event</button></div></div>}
      </div>
      <EventDrawer open={drawer.open} event={drawer.event} categories={categories} onClose={() => setDrawer({ open: false, event: null })} onSaved={saved} />
      <ConfirmDialog
        open={!!closeTarget}
        onClose={() => setCloseTarget(null)}
        onConfirm={() => closeTarget && updateStatus(closeTarget, 'closed')}
        title="Close this event?"
        description="Closing stops new registrations and clearly marks the event as unavailable."
        confirmLabel="Close event"
        busy={!!closeTarget && statusBusyId === closeTarget.id}
      />
    </main>
  )
}

function RegistrantPage() {
  const { id } = useParams()
  const push = useToast()
  const [event, setEvent] = useState(null)
  const [registrants, setRegistrants] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    Promise.all([api.get('/organizer/events'), api.get(`/organizer/events/${id}/registrants`)])
      .then(([eventRes, rosterRes]) => {
        const events = normalizeArray(eventRes.data).filter((item) => item && typeof item === 'object')
        setEvent(events.find((item) => Number(item.id) === Number(id)) || null)
        setRegistrants(normalizeArray(rosterRes.data).filter((item) => item && typeof item === 'object' && item.user && typeof item.user === 'object'))
      })
      .catch(() => push('Unable to load the event roster.', 'error'))
      .finally(() => setLoading(false))
  }, [id])

  const toggleCheckIn = async (registrant) => {
    const attended = !registrant.attendance?.attended
    const previous = registrants
    setBusyId(registrant.user.id)
    setRegistrants((old) => old.map((item) => item.id === registrant.id ? {
      ...item,
      attendance: {
        ...item.attendance,
        attended,
        checked_in_at: attended ? new Date().toISOString() : null,
      },
    } : item))
    try {
      const { data } = await api.post(`/organizer/events/${id}/attendance`, {
        user_id: registrant.user.id,
        attended,
      })
      setRegistrants((old) => old.map((item) => item.id === registrant.id ? { ...item, attendance: data.attendance } : item))
      push(attended ? `${registrant.user.name} checked in.` : `Check-in removed for ${registrant.user.name}.`)
    } catch (error) {
      setRegistrants(previous)
      push(error.response?.data?.message || 'Check-in update failed.', 'error')
    } finally { setBusyId(null) }
  }

  const visible = registrants.filter((registrant) => {
    const matchesSearch = `${registrant.user.name} ${registrant.user.email}`.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filter === 'All' || registrant.status === filter.toLowerCase()
    return matchesSearch && matchesStatus
  })
  const confirmedCount = registrants.filter((item) => item.status === 'confirmed').length
  const waitlistedCount = registrants.filter((item) => item.status === 'waitlisted').length
  const checkedInCount = registrants.filter((item) => item.attendance?.attended).length

  if (loading) return <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8"><div className="h-40 animate-pulse rounded-2xl bg-slate-200" /></main>

  return (
    <main className="mx-auto min-h-[calc(100vh-72px)] max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
      <Link to="/organizer" className="mb-5 inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-indigo-600"><ArrowRight className="h-4 w-4 rotate-180" /> Organizer Studio</Link>
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><div className="mb-3 flex items-center gap-2">{event && <EventStatusBadge status={event.status} />}<span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">{event?.category?.name || 'Community Event'}</span></div><h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-950">{event?.title || 'Event guests'}</h1><div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">{event && <><span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{dateTime(event.event_date)}</span><span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{event.location}</span></>}</div></div>
          <div className="grid grid-cols-3 gap-2">
            {[['Confirmed', confirmedCount, 'text-emerald-700 bg-emerald-50'], ['Waitlist', waitlistedCount, 'text-amber-700 bg-amber-50'], ['Checked in', checkedInCount, 'text-indigo-700 bg-indigo-50']].map(([label, value, style]) => <div key={label} className={`min-w-24 rounded-xl px-3 py-2 text-center ${style}`}><p className="text-lg font-extrabold">{value}</p><p className="text-[10px] font-bold uppercase">{label}</p></div>)}
          </div>
        </div>
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <label className="relative w-full md:max-w-sm"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email..." className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-10 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50" />{search && <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-100" aria-label="Clear attendee search"><X className="h-4 w-4" /></button>}</label>
          <div className="flex gap-2 overflow-x-auto">{['All', 'Confirmed', 'Waitlisted'].map((item) => <button key={item} onClick={() => setFilter(item)} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold ${filter === item ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-200'}`}>{item}</button>)}</div>
        </div>
        {visible.length ? <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left"><thead><tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400"><th className="px-5 py-3">Attendee</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Check-in</th><th className="px-5 py-3 text-right">Action</th></tr></thead>
            <tbody>{visible.map((registrant) => {
              const attended = registrant.attendance?.attended
              return <tr key={registrant.id} className="border-b border-slate-100 last:border-0"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-50 font-display text-sm font-extrabold text-indigo-700">{registrant.user.name?.split(' ').map((part) => part[0]).slice(0,2).join('')}</div><div><p className="text-sm font-bold text-slate-900">{registrant.user.name}</p><p className="mt-0.5 text-xs text-slate-500">{registrant.user.email}</p></div></div></td>
                <td className="px-5 py-4"><RegistrationStatus status={registrant.status} /></td>
                <td className="px-5 py-4">{attended ? <div><span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Checked In</span>{registrant.attendance?.checked_in_at && <p className="mt-1 text-[11px] text-slate-400">{dateTime(registrant.attendance.checked_in_at)}</p>}</div> : <span className="text-xs font-semibold text-slate-400">Not checked in</span>}</td>
                <td className="px-5 py-4 text-right"><button disabled={busyId === registrant.user.id || registrant.status !== 'confirmed'} onClick={() => toggleCheckIn(registrant)} className={`relative h-7 w-12 rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${attended ? 'bg-emerald-600' : 'bg-slate-300'}`} aria-label={`${attended ? 'Remove' : 'Complete'} check-in for ${registrant.user.name}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${attended ? 'right-1' : 'left-1'}`} /></button></td>
              </tr>
            })}</tbody>
          </table>
        </div> : <EmptyState icon={Users} title="No registrants found" description="Try changing your search or status filter." />}
      </div>
    </main>
  )
}

class AppErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-surface px-5 py-10">
          <section className="w-full max-w-lg rounded-3xl border border-border bg-surface-raised p-8 text-center shadow-raised">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-danger/10"><AlertCircle className="h-7 w-7 text-danger" /></div>
            <h1 className="mt-5 font-display text-2xl font-extrabold text-text-primary">Something didn’t load correctly</h1>
            <p className="mt-2 text-sm leading-6 text-text-muted">Your session is safe. Reload the page or return to sign in and try again.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button variant="secondary" onClick={() => window.location.reload()}>Reload</Button>
              <Button onClick={() => {
                localStorage.removeItem('nexbuild_token')
                localStorage.removeItem('nexbuild_user')
                window.location.assign('/login')
              }}>Back to Login</Button>
            </div>
          </section>
        </main>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<PublicOnly><AuthLayout mode="login" /></PublicOnly>} />
              <Route path="/register" element={<PublicOnly><AuthLayout mode="register" /></PublicOnly>} />
              <Route path="*" element={<AppShell />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  )
}

function PublicOnly({ children }) {
  const { user } = useAuth()
  return user ? <Navigate to="/" replace /> : children
}
