export type PublicPage = {
  headline: string
  subhead: string
  image: string
  theme: {
    page: string
    ink: string
    muted: string
    line: string
    button: string
    buttonText: string
  }
}

export const publicPage: PublicPage = {
  headline: 'Human Conversation',
  subhead: 'AI for the conversations that build community.',
  image: 'generated/hero-background.png',
  theme: {
    page: '#050608',
    ink: '#f4efe4',
    muted: '#c9c1b2',
    line: 'rgba(244, 239, 228, 0.18)',
    button: '#f4efe4',
    buttonText: '#050608',
  },
}
