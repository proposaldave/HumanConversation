import {
  ArrowRight,
  Check,
  Layers3,
  MessageCircle,
} from 'lucide-react'
import { type CSSProperties, type FormEvent, useEffect, useState } from 'react'
import { type Variant, publicVariant } from './data/variants'

const contactEmail = 'hello@humanconversation.com'
const githubPagesBasePath = '/HumanConversation'
const basePath = window.location.hostname === 'proposaldave.github.io' ? githubPagesBasePath : ''

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

function toAppPath(route: string) {
  return `${basePath}${route}` || '/'
}

function assetPath(path: string) {
  const normalizedPath = path.replace(/^\/+/, '')
  return basePath ? `${basePath}/${normalizedPath}` : `/${normalizedPath}`
}

function App() {
  useEffect(() => {
    document.title = 'Human Conversation - AI for the conversations that build community'
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  return (
    <div className="min-h-screen bg-[#fbf7ef] text-[#1a1612]">
      <SiteHeader />
      <VariantPage variant={publicVariant} />
    </div>
  )
}

function SiteHeader() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-black/10 bg-[#fbf7ef]/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <a
          href={toAppPath('/')}
          className="group flex items-center gap-3 rounded-md px-2 py-2 text-left transition hover:bg-black/5"
          aria-label="Human Conversation home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#1a1612] text-[#fbf7ef]">
            <MessageCircle size={18} />
          </span>
          <span className="hidden leading-none sm:block">
            <span className="block text-sm font-extrabold">Human Conversation</span>
            <span className="block pt-1 text-xs font-semibold text-black/50">AI for community</span>
          </span>
        </a>

        <a
          href="#early-access"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1a1612] px-4 py-3 text-sm font-extrabold text-[#fbf7ef] transition hover:-translate-y-0.5"
        >
          Contact
          <ArrowRight size={16} />
        </a>
      </div>
    </header>
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
            </div>
          </div>
        </div>
      </section>

      <section className="variant-shell px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="animate-fade-up">
            <SectionKicker variant={variant}>{variant.problemTitle}</SectionKicker>
            <h2 className="mt-5 max-w-xl font-serif text-4xl font-semibold leading-tight md:text-6xl">
              A lighter way to remember what matters between people.
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
          <SectionKicker variant={variant}>Simple by design</SectionKicker>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {variant.outcomes.map((outcome) => (
              <div
                key={outcome}
                className="flex items-start gap-3 rounded-lg border p-5 text-lg font-extrabold leading-7"
                style={{ borderColor: variant.theme.line, background: variant.theme.surface }}
              >
                <Check className="mt-1 shrink-0" size={20} style={{ color: variant.theme.accent }} />
                {outcome}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="variant-shell px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <EarlyAccessForm variant={variant} />
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
