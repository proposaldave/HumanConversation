import { ArrowRight, Mail, MessageCircle } from 'lucide-react'
import { type CSSProperties, useEffect } from 'react'
import { publicPage } from './data/variants'

const contactEmail = 'hello@humanconversation.com'
const githubPagesBasePath = '/HumanConversation'
const basePath = window.location.hostname === 'proposaldave.github.io' ? githubPagesBasePath : ''

function assetPath(path: string) {
  const normalizedPath = path.replace(/^\/+/, '')
  return basePath ? `${basePath}/${normalizedPath}` : `/${normalizedPath}`
}

function toAppPath(route: string) {
  return `${basePath}${route}` || '/'
}

function App() {
  useEffect(() => {
    document.title = 'Human Conversation'
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  const style = {
    '--page': publicPage.theme.page,
    '--ink': publicPage.theme.ink,
    '--muted': publicPage.theme.muted,
    '--line': publicPage.theme.line,
    '--button': publicPage.theme.button,
    '--button-text': publicPage.theme.buttonText,
  } as CSSProperties

  return (
    <div className="min-h-screen bg-[var(--page)] text-[var(--ink)]" style={style}>
      <header className="fixed left-0 right-0 top-0 z-50 bg-[var(--page)]/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href={toAppPath('/')} className="flex items-center gap-3 rounded-md px-2 py-2 text-left" aria-label="Human Conversation home">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--line)] text-[var(--ink)]">
              <MessageCircle size={18} />
            </span>
            <span className="text-sm font-extrabold">Human Conversation</span>
          </a>

          <a
            href={`mailto:${contactEmail}`}
            className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-extrabold transition hover:-translate-y-0.5"
            style={{ background: publicPage.theme.button, color: publicPage.theme.buttonText }}
          >
            Contact
            <ArrowRight size={16} />
          </a>
        </div>
      </header>

      <main className="relative min-h-screen overflow-hidden">
        <img
          src={assetPath(publicPage.image)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#050608_0%,rgba(5,6,8,0.9)_42%,rgba(5,6,8,0.58)_100%)]" />

        <section className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-28 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="font-serif text-6xl font-semibold leading-[0.96] md:text-8xl">
              {publicPage.headline}
            </h1>
            <p className="mt-7 max-w-2xl text-xl font-semibold leading-8 text-[var(--muted)] md:text-2xl">
              {publicPage.subhead}
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center justify-center gap-2 rounded-md px-5 py-4 text-base font-extrabold transition hover:-translate-y-0.5"
                style={{ background: publicPage.theme.button, color: publicPage.theme.buttonText }}
              >
                <Mail size={18} />
                Email us
              </a>
              <a
                href={`mailto:${contactEmail}`}
                className="text-base font-extrabold underline decoration-[var(--line)] underline-offset-4 transition hover:text-white"
              >
                {contactEmail}
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
