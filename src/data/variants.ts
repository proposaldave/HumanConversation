export type Theme = {
  page: string
  ink: string
  muted: string
  surface: string
  line: string
  accent: string
  accentSoft: string
  button: string
  buttonText: string
  serif: boolean
}

export type Variant = {
  slug: string
  nav: string
  eyebrow: string
  headline: string
  subhead: string
  image: string
  theme: Theme
  cta: string
  problemTitle: string
  problemLines: string[]
  outcomes: string[]
}

export const publicVariant: Variant = {
  slug: 'public',
  nav: 'Home',
  eyebrow: 'Category creation',
  headline: 'AI for the conversations that build community.',
  subhead:
    'Human Conversation helps community teams remember what people share, understand who fits together, and follow up with care.',
  image: 'generated/v3-investor.png',
  theme: {
    page: '#050608',
    ink: '#f4efe4',
    muted: '#bdb7aa',
    surface: 'rgba(244, 239, 228, 0.08)',
    line: 'rgba(244, 239, 228, 0.16)',
    accent: '#6ab7ff',
    accentSoft: 'rgba(106, 183, 255, 0.16)',
    button: '#6ab7ff',
    buttonText: '#050608',
    serif: true,
  },
  cta: 'Start with one conversation',
  problemTitle: 'Built to fit in',
  problemLines: [
    'Works beside the systems your community already uses.',
    'Helps staff remember the context people share in real conversations.',
    'Keeps every suggested follow-up staff-reviewed.',
  ],
  outcomes: ['Works beside existing tools', 'Keeps staff in control', 'Makes follow-up easier'],
}
