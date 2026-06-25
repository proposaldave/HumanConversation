import {
  ArrowRight,
  Check,
  Clipboard,
  Copy,
  Layers3,
  Menu,
  MessageCircle,
  Network,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import { type CSSProperties, type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react'
import { type Variant, type VariantSlug, variantBySlug, variants } from './data/variants'

const contactEmail = 'hello@humanconversation.com'
const basePath = import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL.replace(/\/$/, '')
const defaultPublicVariant: VariantSlug = 'v3-investor'

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((value) => value + value).join('') : clean
  const value = Number.parseInt(full, 16)
  const red = (value >> 16) & 255
  const green = (value >> 8) & 255
  const blue = value & 255
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function heroOverlay(variant: Variant) {
  return `linear-gradient(90deg, ${variant.theme.page} 0%, ${hexToRgba(variant.theme.page, 0.9)} 44%, ${hexToRgba(
    variant.theme.page,
    0.3,
  )} 72%, transparent 100%)`
}

function getRouteSlug(): VariantSlug | null {
  const hashSlug = window.location.hash.replace(/^#\/?/, '').replace(/\/$/, '')
  if (hashSlug === 'gallery') return null
  if (variantBySlug.has(hashSlug as VariantSlug)) return hashSlug as VariantSlug

  const pathname = window.location.pathname
  const localPath = basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) || '/' : pathname
  const slug = localPath.replace(/^\/+/, '').replace(/\/$/, '')
  if (!slug) return defaultPublicVariant
  return variantBySlug.has(slug as VariantSlug) ? (slug as VariantSlug) : null
}

function toAppPath(route: string) {
  return `${basePath}${route}` || '/'
}

function toHashPath(route: string) {
  if (route === '/') return toAppPath('/')
  if (route === '/gallery') return `${toAppPath('/')}#/gallery`
  return `${toAppPath('/')}#${route}`
}

function assetPath(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}

function App() {
  const [activeSlug, setActiveSlug] = useState<VariantSlug | null>(() => getRouteSlug())
  const activeVariant = activeSlug ? variantBySlug.get(activeSlug) ?? null : null

  useEffect(() => {
    const onPopState = () => setActiveSlug(getRouteSlug())
    const onHashChange = () => setActiveSlug(getRouteSlug())
    window.addEventListener('popstate', onPopState)
    window.addEventListener('hashchange', onHashChange)
    return () => {
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [])

  useEffect(() => {
    document.title = activeVariant
      ? `${activeVariant.nav} - Human Conversation`
      : 'Human Conversation - AI for the conversations that build community'
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [activeVariant])

  const navigate = (route: string) => {
    window.history.pushState({}, '', toHashPath(route))
    setActiveSlug(getRouteSlug())
  }

  return (
    <div className="min-h-screen bg-[#fbf7ef] text-[#1a1612]">
      <VariantSwitcher activeSlug={activeSlug} onNavigate={navigate} />
      {activeVariant ? (
        <VariantPage key={activeVariant.slug} variant={activeVariant} />
      ) : (
        <Gallery onNavigate={navigate} />
      )}
    </div>
  )
}

function VariantSwitcher({
  activeSlug,
  onNavigate,
}: {
  activeSlug: VariantSlug | null
  onNavigate: (route: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-black/10 bg-[#fbf7ef]/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => {
            onNavigate('/gallery')
            setOpen(false)
          }}
          className="group flex items-center gap-3 rounded-md px-2 py-2 text-left transition hover:bg-black/5"
          aria-label="Open gallery"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#1a1612] text-[#fbf7ef]">
            <MessageCircle size={18} />
          </span>
          <span className="hidden leading-none sm:block">
            <span className="block text-sm font-extrabold">Human Conversation</span>
            <span className="block pt-1 text-xs font-semibold text-black/50">Landing directions</span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Variant switcher">
          {variants.map((variant) => (
            <button
              key={variant.slug}
              type="button"
              onClick={() => onNavigate(variant.route)}
              className={`rounded-md px-3 py-2 text-sm font-bold transition ${
                activeSlug === variant.slug
                  ? 'bg-[#1a1612] text-[#fbf7ef]'
                  : 'text-black/60 hover:bg-black/[0.06] hover:text-black'
              }`}
            >
              {variant.number} {variant.nav}
            </button>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-black/12 bg-white/60 text-[#1a1612] lg:hidden"
          aria-label="Toggle variant menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-black/10 bg-[#fbf7ef] px-4 py-3 lg:hidden">
          <div className="grid gap-2">
            {variants.map((variant) => (
              <button
                key={variant.slug}
                type="button"
                onClick={() => {
                  onNavigate(variant.route)
                  setOpen(false)
                }}
                className={`flex items-center justify-between rounded-md px-3 py-3 text-left text-sm font-bold ${
                  activeSlug === variant.slug ? 'bg-[#1a1612] text-[#fbf7ef]' : 'bg-white/70 text-[#1a1612]'
                }`}
              >
                <span>{variant.number} {variant.nav}</span>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  )
}

function Gallery({ onNavigate }: { onNavigate: (route: string) => void }) {
  return (
    <main className="route-fade pt-20">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(91,143,212,0.22),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(200,70,44,0.16),transparent_26%),linear-gradient(180deg,#fbf7ef_0%,#f4ecdd_100%)]" />
        <SignalSketch className="absolute right-0 top-20 hidden h-[520px] w-[620px] opacity-40 lg:block" accent="#5B8FD4" />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-4xl">
              <p className="mb-5 inline-flex rounded-md border border-[#c8462c]/30 bg-[#c8462c]/10 px-3 py-2 text-xs font-extrabold uppercase text-[#c8462c]">
              First exploration
            </p>
            <h1 className="font-serif text-6xl font-semibold leading-[0.98] text-[#1a1612] md:text-7xl lg:text-8xl">
              Six directions for the conversation layer.
            </h1>
            <p className="mt-8 max-w-3xl text-xl font-medium leading-8 text-[#4b433b] md:text-2xl">
              Human Conversation is AI for the conversations that build community. These are six fully designed ways to
              make that idea land.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {variants.map((variant) => (
              <button
                key={variant.slug}
                type="button"
                onClick={() => onNavigate(variant.route)}
                className="group overflow-hidden rounded-lg border border-black/10 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={assetPath(variant.image)}
                    alt={`${variant.nav} visual direction`}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/12 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-extrabold uppercase text-white/70">{variant.number}</p>
                      <h2 className="mt-1 text-2xl font-extrabold text-white">{variant.nav}</h2>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-black transition group-hover:bg-[#c8462c] group-hover:text-white">
                      <ArrowRight size={18} />
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm font-bold text-[#c8462c]">{variant.eyebrow}</p>
                  <p className="mt-3 line-clamp-3 text-lg font-bold leading-6 text-[#1a1612]">{variant.headline}</p>
                  <p className="mt-4 text-sm font-medium leading-6 text-black/58">{variant.testing}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}

function VariantPage({ variant }: { variant: Variant }) {
  const style = {
    '--page': variant.theme.page,
    '--ink': variant.theme.ink,
    '--muted': variant.theme.muted,
    '--surface': variant.theme.surface,
    '--line': variant.theme.line,
    '--accent': variant.theme.accent,
    '--accent-soft': variant.theme.accentSoft,
    '--button': variant.theme.button,
    '--button-text': variant.theme.buttonText,
  } as CSSProperties

  return (
    <main className="route-fade pt-16" style={style}>
      <section className="variant-shell relative min-h-screen overflow-hidden">
        <img
          src={assetPath(variant.image)}
          alt={`${variant.nav} generated hero visual`}
          className="hero-image absolute bottom-0 right-0 top-0 h-full w-full object-cover opacity-[0.82] md:w-[68%]"
        />
        <div className="absolute inset-0" style={{ background: heroOverlay(variant) }} />
        <SignalSketch className="absolute bottom-8 right-4 h-[360px] w-[520px] opacity-35" accent={variant.theme.accent} />
        <div className="relative mx-auto grid min-h-screen max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-4xl animate-fade-up">
            <p
              className="mb-6 inline-flex rounded-md border px-3 py-2 text-xs font-extrabold uppercase"
              style={{ borderColor: variant.theme.line, color: variant.theme.accent, background: variant.theme.accentSoft }}
            >
              {variant.eyebrow}
            </p>
            <h1
              className={`max-w-5xl text-6xl font-semibold leading-[0.96] md:text-7xl lg:text-8xl ${
                variant.theme.serif ? 'font-serif' : 'font-sans font-extrabold'
              }`}
            >
              {variant.headline}
            </h1>
            <p className="muted-text mt-8 max-w-3xl text-xl font-semibold leading-8 md:text-2xl">
              {variant.subhead}
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href="#early-access"
                className="inline-flex items-center justify-center gap-2 rounded-md px-5 py-4 text-base font-extrabold transition hover:-translate-y-0.5"
                style={{ background: variant.theme.button, color: variant.theme.buttonText }}
              >
                {variant.cta}
                <ArrowRight size={18} />
              </a>
              <CopyDirectionButton variant={variant} mode="hero" />
            </div>
          </div>
        </div>
      </section>

      <section className="variant-shell px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="animate-fade-up">
            <SectionKicker variant={variant}>{variant.problemTitle}</SectionKicker>
            <h2 className="mt-5 max-w-xl font-serif text-4xl font-semibold leading-tight md:text-6xl">
              Conversation is the missing data layer.
            </h2>
          </div>
          <div className="grid gap-3">
            {variant.problemLines.map((line) => (
              <div
                key={line}
                className="rounded-lg border p-5 text-xl font-bold leading-8"
                style={{ borderColor: variant.theme.line, background: variant.theme.surface }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="variant-shell px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
            <div>
              <SectionKicker variant={variant}>{variant.truthTitle}</SectionKicker>
              <p className="mt-5 max-w-3xl text-3xl font-semibold leading-tight md:text-5xl">{variant.truth}</p>
            </div>
            <div className="relative min-h-[340px] overflow-hidden rounded-lg border" style={{ borderColor: variant.theme.line }}>
              <img src={assetPath(variant.image)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-65" />
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${variant.theme.page} 0%, transparent 62%)` }} />
              <SignalSketch className="absolute inset-0 h-full w-full opacity-70" accent={variant.theme.accent} />
            </div>
          </div>
        </div>
      </section>

      <section className="variant-shell px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionKicker variant={variant}>{variant.flowTitle}</SectionKicker>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {variant.flow.map((step, index) => (
              <article
                key={step.title}
                className="min-h-[270px] rounded-lg border p-6 transition hover:-translate-y-1"
                style={{ borderColor: variant.theme.line, background: variant.theme.surface }}
              >
                <div
                  className="mb-8 flex h-11 w-11 items-center justify-center rounded-md text-sm font-extrabold"
                  style={{ background: variant.theme.accentSoft, color: variant.theme.accent }}
                >
                  {String(index + 1).padStart(2, '0')}
                </div>
                <h3 className="text-2xl font-extrabold">{step.title}</h3>
                <p className="muted-text mt-5 text-base font-semibold leading-7">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="variant-shell px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <SectionKicker variant={variant}>Product</SectionKicker>
            <h2 className="mt-5 font-serif text-4xl font-semibold leading-tight md:text-6xl">{variant.productTitle}</h2>
            <p className="muted-text mt-6 max-w-2xl text-xl font-semibold leading-8">{variant.productBody}</p>
          </div>
          <ProductMockup variant={variant} />
        </div>
      </section>

      <section className="variant-shell px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div
            className="rounded-lg border p-8 md:p-10"
            style={{ borderColor: variant.theme.line, background: variant.theme.accentSoft }}
          >
            <SectionKicker variant={variant}>{variant.proofTitle}</SectionKicker>
            <p className="mt-6 max-w-4xl font-serif text-4xl font-semibold leading-tight md:text-6xl">{variant.proofBody}</p>
          </div>
          <div className="grid gap-3">
            {variant.outcomes.map((outcome) => (
              <div
                key={outcome}
                className="flex items-center gap-3 rounded-lg border p-5 text-lg font-extrabold"
                style={{ borderColor: variant.theme.line, background: variant.theme.surface }}
              >
                <Check size={20} style={{ color: variant.theme.accent }} />
                {outcome}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="variant-shell px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <DirectionPanel variant={variant} />
          <EarlyAccessForm variant={variant} />
        </div>
      </section>

      <section className="variant-shell px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-lg border p-8 md:p-12" style={{ borderColor: variant.theme.line }}>
          <p className="max-w-4xl font-serif text-4xl font-semibold leading-tight md:text-6xl">{variant.finalLine}</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href="#early-access"
              className="inline-flex items-center justify-center gap-2 rounded-md px-5 py-4 text-base font-extrabold transition hover:-translate-y-0.5"
              style={{ background: variant.theme.button, color: variant.theme.buttonText }}
            >
              {variant.cta}
              <Send size={18} />
            </a>
            <CopyDirectionButton variant={variant} mode="footer" />
          </div>
        </div>
      </section>

      <Footer variant={variant} />
    </main>
  )
}

function SectionKicker({ children, variant }: { children: string; variant: Variant }) {
  return (
    <p
      className="inline-flex rounded-md border px-3 py-2 text-xs font-extrabold uppercase"
      style={{ borderColor: variant.theme.line, color: variant.theme.accent, background: variant.theme.accentSoft }}
    >
      {children}
    </p>
  )
}

function ProductMockup({ variant }: { variant: Variant }) {
  return (
    <div
      className="relative overflow-hidden rounded-lg border p-4 shadow-2xl"
      style={{ borderColor: variant.theme.line, background: variant.theme.surface }}
    >
      <div className="absolute right-6 top-6 h-24 w-24 rounded-md opacity-35 blur-2xl" style={{ background: variant.theme.accent }} />
      <div className="relative rounded-lg border p-4" style={{ borderColor: variant.theme.line, background: 'rgba(255,255,255,0.08)' }}>
        <div className="mb-4 flex items-center justify-between gap-3 border-b pb-4" style={{ borderColor: variant.theme.line }}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md" style={{ background: variant.theme.accentSoft }}>
              <MessageCircle size={19} style={{ color: variant.theme.accent }} />
            </span>
            <div>
              <p className="text-sm font-extrabold">Conversation capture</p>
              <p className="muted-text text-xs font-bold">Human confirmation required</p>
            </div>
          </div>
          <ShieldCheck size={21} style={{ color: variant.theme.accent }} />
        </div>

        <div className="grid gap-3">
          {variant.mockMessages.map((message, index) => (
            <div
              key={`${message.speaker}-${message.text}`}
              className={`rounded-lg border p-4 ${index === 1 ? 'ml-7' : ''} ${index === 2 ? 'ml-14' : ''}`}
              style={{ borderColor: variant.theme.line, background: index === 2 ? variant.theme.accentSoft : 'rgba(255,255,255,0.08)' }}
            >
              <p className="text-xs font-extrabold uppercase" style={{ color: variant.theme.accent }}>{message.speaker}</p>
              <p className="mt-2 text-base font-bold leading-6">{message.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border p-4" style={{ borderColor: variant.theme.line, background: variant.theme.page }}>
          <div className="mb-3 flex items-center gap-2 text-sm font-extrabold" style={{ color: variant.theme.accent }}>
            <Sparkles size={17} />
            Suggested next action
          </div>
          <p className="text-lg font-extrabold leading-7">{variant.suggestedAction}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              className="rounded-md px-4 py-3 text-sm font-extrabold"
              style={{ background: variant.theme.button, color: variant.theme.buttonText }}
            >
              Confirm
            </button>
            <button
              type="button"
              className="rounded-md border px-4 py-3 text-sm font-extrabold"
              style={{ borderColor: variant.theme.line, color: variant.theme.ink }}
            >
              Edit first
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DirectionPanel({ variant }: { variant: Variant }) {
  return (
    <div
      className="rounded-lg border p-6 md:p-8"
      style={{ borderColor: variant.theme.line, background: variant.theme.surface }}
    >
      <SectionKicker variant={variant}>Copy this direction</SectionKicker>
      <h2 className="mt-5 text-3xl font-extrabold leading-tight">{variant.theme.name}</h2>
      <p className="muted-text mt-5 text-lg font-semibold leading-8">{variant.copyDirection}</p>
      <div className="mt-6 grid gap-3">
        <CopyLine icon={<Clipboard size={18} />} label="Best use" value={variant.bestFor} variant={variant} />
        <CopyLine icon={<Network size={18} />} label="Tests" value={variant.testing} variant={variant} />
      </div>
      <CopyDirectionButton variant={variant} mode="panel" />
    </div>
  )
}

function CopyLine({
  icon,
  label,
  value,
  variant,
}: {
  icon: ReactNode
  label: string
  value: string
  variant: Variant
}) {
  return (
    <div className="flex gap-3 rounded-lg border p-4" style={{ borderColor: variant.theme.line }}>
      <span className="mt-1" style={{ color: variant.theme.accent }}>{icon}</span>
      <div>
        <p className="muted-text text-xs font-extrabold uppercase">{label}</p>
        <p className="mt-1 text-sm font-bold leading-6">{value}</p>
      </div>
    </div>
  )
}

function CopyDirectionButton({ variant, mode }: { variant: Variant; mode: 'hero' | 'panel' | 'footer' }) {
  const [copied, setCopied] = useState(false)
  const summary = useMemo(
    () =>
      [
        `Human Conversation - ${variant.number} ${variant.nav}`,
        variant.copyDirection,
        `Best for: ${variant.bestFor}`,
        `Hero: ${variant.headline}`,
        `CTA: ${variant.cta}`,
      ].join('\n'),
    [variant],
  )

  const copy = async () => {
    await navigator.clipboard.writeText(summary)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center justify-center gap-2 rounded-md border px-5 py-4 text-base font-extrabold transition hover:-translate-y-0.5 ${
        mode === 'panel' ? 'mt-6 w-full' : ''
      }`}
      style={{ borderColor: variant.theme.line, color: variant.theme.ink, background: variant.theme.surface }}
    >
      {copied ? <Check size={18} /> : <Copy size={18} />}
      {copied ? 'Copied' : variant.secondaryCta}
    </button>
  )
}

function EarlyAccessForm({ variant }: { variant: Variant }) {
  const [submitted, setSubmitted] = useState(false)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const fields = Object.fromEntries(form.entries())
    const body = [
      `Name: ${fields.name ?? ''}`,
      `Email: ${fields.email ?? ''}`,
      `Organization: ${fields.organization ?? ''}`,
      `Role: ${fields.role ?? ''}`,
      '',
      `Community: ${fields.community ?? ''}`,
    ].join('\n')
    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent('Human Conversation early access')}&body=${encodeURIComponent(body)}`
    setSubmitted(true)
  }

  return (
    <form
      id="early-access"
      onSubmit={submit}
      className="rounded-lg border p-6 md:p-8"
      style={{ borderColor: variant.theme.line, background: variant.theme.surface }}
    >
      <SectionKicker variant={variant}>Contact</SectionKicker>
      <h2 className="mt-5 text-3xl font-extrabold leading-tight">Start with one community conversation.</h2>
      <p className="muted-text mt-4 text-base font-semibold leading-7">
        Use the form below or email{' '}
        <a href={`mailto:${contactEmail}`} className="font-extrabold underline underline-offset-4">
          {contactEmail}
        </a>
        .
      </p>

      {submitted ? (
        <div className="mt-8 rounded-lg border p-6" style={{ borderColor: variant.theme.line, background: variant.theme.accentSoft }}>
          <div className="flex items-center gap-3 text-xl font-extrabold">
            <Check size={22} style={{ color: variant.theme.accent }} />
            Opening your email app.
          </div>
          <p className="muted-text mt-3 text-base font-semibold leading-7">
            If it did not open, email {contactEmail} directly.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-3">
          <Input name="name" label="Name" variant={variant} required />
          <Input name="email" label="Email" type="email" variant={variant} required />
          <Input name="organization" label="Organization" variant={variant} required />
          <Input name="role" label="Role" variant={variant} />
          <label className="grid gap-2 text-sm font-extrabold">
            What community are you trying to build?
            <textarea
              name="community"
              rows={4}
              className="min-h-28 resize-y rounded-md border px-4 py-3 text-base font-semibold outline-none transition focus:ring-2"
              style={{ borderColor: variant.theme.line, background: variant.theme.page, color: variant.theme.ink }}
            />
          </label>
          <button
            type="submit"
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-md px-5 py-4 text-base font-extrabold transition hover:-translate-y-0.5"
            style={{ background: variant.theme.button, color: variant.theme.buttonText }}
          >
            Email early access request
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </form>
  )
}

function Input({
  name,
  label,
  type = 'text',
  required,
  variant,
}: {
  name: string
  label: string
  type?: string
  required?: boolean
  variant: Variant
}) {
  return (
    <label className="grid gap-2 text-sm font-extrabold">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        className="rounded-md border px-4 py-3 text-base font-semibold outline-none transition focus:ring-2"
        style={{ borderColor: variant.theme.line, background: variant.theme.page, color: variant.theme.ink }}
      />
    </label>
  )
}

function SignalSketch({ className, accent }: { className?: string; accent: string }) {
  return (
    <svg className={className} viewBox="0 0 620 520" fill="none" aria-hidden="true">
      <path
        className="signal-line"
        d="M38 378C122 218 213 454 305 274C387 113 446 264 580 102"
        stroke={accent}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        className="signal-line"
        d="M84 144C168 96 203 211 278 184C382 146 422 52 552 52"
        stroke={accent}
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        className="signal-line"
        d="M118 452C217 394 270 418 350 352C434 282 463 323 560 278"
        stroke={accent}
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.65"
      />
      {[88, 168, 278, 350, 452, 552].map((x, index) => (
        <circle
          key={x}
          cx={x}
          cy={[144, 314, 184, 352, 238, 52][index]}
          r={index % 2 === 0 ? 7 : 5}
          fill={accent}
          opacity={index % 2 === 0 ? 0.8 : 0.48}
        />
      ))}
    </svg>
  )
}

function Footer({ variant }: { variant?: Variant }) {
  return (
    <footer
      className="border-t px-4 py-10 sm:px-6 lg:px-8"
      style={{
        borderColor: variant?.theme.line ?? 'rgba(26,22,18,0.14)',
        background: variant?.theme.page ?? '#fbf7ef',
        color: variant?.theme.ink ?? '#1a1612',
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm font-bold opacity-80 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Layers3 size={18} style={{ color: variant?.theme.accent ?? '#c8462c' }} />
          <span>HumanConversation.com</span>
        </div>
        <div className="flex flex-col gap-2 text-[13px] md:flex-row md:items-center md:gap-5">
          <span>AI for the conversations that build community.</span>
          <a href={`mailto:${contactEmail}`} className="font-extrabold underline underline-offset-4">
            {contactEmail}
          </a>
        </div>
      </div>
    </footer>
  )
}

export default App
