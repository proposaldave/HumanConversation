export type VariantSlug =
  | 'v1-manifesto'
  | 'v2-operator'
  | 'v3-investor'
  | 'v4-product'
  | 'v5-club'
  | 'v6-minimal'

export type Theme = {
  name: string
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
  slug: VariantSlug
  route: string
  number: string
  nav: string
  eyebrow: string
  headline: string
  subhead: string
  image: string
  theme: Theme
  cta: string
  problemTitle: string
  problemLines: string[]
  truthTitle: string
  truth: string
  flowTitle: string
  flow: { title: string; body: string }[]
  productTitle: string
  productBody: string
  mockMessages: { speaker: string; text: string }[]
  suggestedAction: string
  proofTitle: string
  proofBody: string
  outcomes: string[]
  testing: string
  bestFor: string
  finalLine: string
}

export const variants: Variant[] = [
  {
    slug: 'v1-manifesto',
    route: '/v1-manifesto',
    number: '01',
    nav: 'Manifesto',
    eyebrow: 'Worldview',
    headline: 'Human Conversation',
    subhead:
      'AI for the conversations that build community. The future of community software starts with better memory for real human moments.',
    image: 'generated/v1-manifesto.png',
    theme: {
      name: 'Deep navy / warm cream / signal coral',
      page: '#07131f',
      ink: '#fff8ec',
      muted: '#d6c8b7',
      surface: 'rgba(255, 248, 236, 0.08)',
      line: 'rgba(255, 248, 236, 0.2)',
      accent: '#ff6f57',
      accentSoft: 'rgba(255, 111, 87, 0.16)',
      button: '#ff6f57',
      buttonText: '#08111c',
      serif: true,
    },
    cta: 'Build a community that remembers',
    problemTitle: 'The imbalance',
    problemLines: [
      'Technology was supposed to connect us.',
      'Instead, it pulled us away from each other.',
      'The most important signal in a community still happens in real conversations.',
    ],
    truthTitle: 'The truth',
    truth:
      'Communities still run on people talking, noticing, remembering, and inviting. Human Conversation gives those moments memory, structure, and follow-through.',
    flowTitle: 'The shift',
    flow: [
      {
        title: 'Guided prompts',
        body: 'Staff get the right question at the right moment, based on player context and recent behavior.',
      },
      {
        title: 'Structured memory',
        body: 'The system captures preference, fit, friction, availability, and staff judgment without turning the staffer into a data clerk.',
      },
      {
        title: 'Next-best invitations',
        body: 'Conversation signal turns into a specific invite, group, follow-up, or court-fill action.',
      },
      {
        title: 'Better groups',
        body: 'Every approval, edit, rejection, and outcome improves the next recommendation.',
      },
    ],
    productTitle: 'The machine does not replace the community builder.',
    productBody: 'It learns from them. Staff stay human. Coordination gets intelligent.',
    mockMessages: [
      { speaker: 'Member', text: 'I would play more if I knew where I fit.' },
      { speaker: 'Prompt', text: 'Ask what kind of group feels easiest to return to.' },
      { speaker: 'Memory', text: 'Prefers smaller groups, patient pace, early evenings.' },
    ],
    suggestedAction: 'Invite Maya to Tuesday 6:30 with Priya, Anna, and Chris. Ask staff to confirm.',
    proofTitle: 'Early proof from the proving ground',
    proofBody:
      'NEPC data shows players rarely state social preference directly, but group composition can create a 37-point acceptance swing.',
    outcomes: ['Better invitations', 'More remembered members', 'Less invisible staff judgment'],
    testing: 'Tests emotional pull with investors, operators, and anyone tired of app-first community software.',
    bestFor: 'Company launch, investor first impression, category narrative.',
    finalLine: 'Community intelligence starts with a human conversation.',
  },
  {
    slug: 'v2-operator',
    route: '/v2-operator',
    number: '02',
    nav: 'Operator',
    eyebrow: 'Club operator',
    headline: 'Your best staff already know what matters.',
    subhead:
      'Now your club can learn from every conversation. Human Conversation captures member needs, hidden social signal, and next-best coordination actions without forcing players into another app.',
    image: 'generated/v2-operator.png',
    theme: {
      name: 'Charcoal / soft white / human red',
      page: '#201d1a',
      ink: '#fff9f0',
      muted: '#d7cabe',
      surface: 'rgba(255, 255, 255, 0.09)',
      line: 'rgba(255, 255, 255, 0.18)',
      accent: '#f05f4b',
      accentSoft: 'rgba(240, 95, 75, 0.15)',
      button: '#fff9f0',
      buttonText: '#201d1a',
      serif: false,
    },
    cta: 'Start with one staff conversation',
    problemTitle: 'What staff hear every day',
    problemLines: [
      'I want better games.',
      'I do not know where I fit.',
      'Can you help me find a group?',
      'I would play more if I knew who to play with.',
    ],
    truthTitle: 'What usually happens',
    truth:
      'The signal disappears into memory, text threads, sticky notes, and staff heroics. The club depends on people knowing everything, all the time.',
    flowTitle: 'What Human Conversation does',
    flow: [
      {
        title: 'Prompt the staffer',
        body: 'Give the coordinator a short, human question that uncovers what actually matters.',
      },
      {
        title: 'Capture the note',
        body: 'Turn the conversation into structured player memory, without extra admin drag.',
      },
      {
        title: 'Suggest the move',
        body: 'Recommend the next invite, group, follow-up, or retention action.',
      },
      {
        title: 'Confirm with a human',
        body: 'Staff approve or edit every AI action at launch.',
      },
    ],
    productTitle: 'No new player app.',
    productBody: 'The interface is conversation-first. Staff use the flow. Members just get better experiences.',
    mockMessages: [
      { speaker: 'Front desk', text: 'Jordan wants stronger games but gets nervous joining open play.' },
      { speaker: 'AI note', text: 'Signal: play preference, social hesitation, weekday evenings.' },
      { speaker: 'Next action', text: 'Offer a curated group before open play.' },
    ],
    suggestedAction: 'Ask Krista to confirm Jordan for Thursday 7:00 with three known-good returners.',
    proofTitle: 'The operator pain is constant',
    proofBody:
      'Social sports clubs coordinate players every day, and staff judgment about fit, trust, chemistry, reliability, and energy matters.',
    outcomes: ['Better groups', 'Faster fills', 'Fewer awkward mismatches', 'More members who come back'],
    testing: 'Tests whether a club owner immediately says: I need this.',
    bestFor: 'Sales page, pilot outreach, club-owner demos.',
    finalLine: 'A smarter club starts with one better conversation.',
  },
  {
    slug: 'v3-investor',
    route: '/v3-investor',
    number: '03',
    nav: 'Investor',
    eyebrow: 'Category creation',
    headline: 'AI for the conversations that build community.',
    subhead:
      'Human Conversation helps community teams remember what people share, understand who fits together, and follow up with care.',
    image: 'generated/v3-investor.png',
    theme: {
      name: 'Black / bone / electric blue',
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
    truthTitle: 'Human memory',
    truth:
      'Human Conversation helps teams remember the useful details people share, then use that memory with care.',
    flowTitle: 'Simple staff support',
    flow: [
      {
        title: 'Conversation',
        body: 'A staffer learns useful human context during normal community work.',
      },
      {
        title: 'Memory',
        body: 'Human Conversation keeps the signal organized without changing core operations.',
      },
      {
        title: 'Suggested follow-up',
        body: 'The system proposes an invite, group, introduction, or note for a human to review.',
      },
      {
        title: 'Human approval',
        body: 'Staff approve, edit, or ignore. Their judgment stays central.',
      },
    ],
    productTitle: 'A simple helper for community teams.',
    productBody:
      'Built for communities where trust, timing, and thoughtful follow-up matter.',
    mockMessages: [
      { speaker: 'Member context', text: 'Wants a more comfortable way to join the right group.' },
      { speaker: 'Staff insight', text: 'Prefers reliable, welcoming people and a clear next step.' },
      { speaker: 'Follow-up', text: 'Suggest a small invite for staff to approve.' },
    ],
    suggestedAction: 'Draft a staff-reviewed note based on the last real conversation.',
    proofTitle: 'Why it matters',
    proofBody:
      'The right follow-up can make a community feel more personal, timely, and welcoming.',
    outcomes: ['Works beside existing tools', 'Keeps staff in control', 'Makes follow-up easier'],
    testing: 'Tests category clarity, venture scale, and data-moat legibility.',
    bestFor: 'Investor landing page, seed deck companion, founder-forward fundraising.',
    finalLine: 'The best community systems help people feel remembered.',
  },
  {
    slug: 'v4-product',
    route: '/v4-product',
    number: '04',
    nav: 'Product',
    eyebrow: 'How it works',
    headline: 'From conversation to coordination.',
    subhead:
      'Human Conversation helps community staff ask the right questions, remember what matters, and coordinate the next best experience.',
    image: 'generated/v4-product.png',
    theme: {
      name: 'Soft white / ink / human red',
      page: '#f6f4ee',
      ink: '#151412',
      muted: '#5f5a53',
      surface: 'rgba(255, 255, 255, 0.76)',
      line: 'rgba(21, 20, 18, 0.13)',
      accent: '#c8462c',
      accentSoft: 'rgba(200, 70, 44, 0.12)',
      button: '#151412',
      buttonText: '#f6f4ee',
      serif: false,
    },
    cta: 'Turn one conversation into the next best invite',
    problemTitle: 'The product job',
    problemLines: [
      'Ask the right question.',
      'Capture the hidden signal.',
      'Recommend the next move.',
      'Learn from the outcome.',
    ],
    truthTitle: 'Built for the staff flow',
    truth:
      'A conversation-first copilot turns staff judgment into useful coordination memory.',
    flowTitle: 'The four-step flow',
    flow: [
      {
        title: 'Guide the conversation',
        body: 'AI suggests the right question based on the player, club context, and recent behavior.',
      },
      {
        title: 'Capture the signal',
        body: 'The system structures preferences, constraints, social fit, availability, and staff judgment.',
      },
      {
        title: 'Recommend the next move',
        body: 'Invite this player. Build this group. Fill this court. Follow up next week.',
      },
      {
        title: 'Learn from the outcome',
        body: 'Staff approve, edit, or reject. Every correction trains the system.',
      },
    ],
    productTitle: 'Human confirmation by default.',
    productBody:
      'At launch, AI guides, captures, structures, and recommends. A human confirms the action before anything goes out.',
    mockMessages: [
      { speaker: 'Prompt', text: 'Ask: what would make you excited to come back next week?' },
      { speaker: 'Staff note', text: 'Wants a friendly but faster group. Free Tuesdays after 6.' },
      { speaker: 'Suggested next action', text: 'Invite to Tuesday ladder warm-up. Staff approval required.' },
    ],
    suggestedAction: 'Send suggested invite after staff confirms the player fit and group tone.',
    proofTitle: 'Why this beats another field in a CRM',
    proofBody:
      'Behavioral signals reveal social preference better than surveys because the signal appears in real choices, corrections, and outcomes.',
    outcomes: ['Guided prompts', 'Structured memory', 'Suggested next actions', 'Human confirmation'],
    testing: 'Tests whether the product is understandable in under 10 seconds.',
    bestFor: 'Product demo page, Steve spec alignment, pilot onboarding.',
    finalLine: 'One conversation becomes the next best real-world invite.',
  },
  {
    slug: 'v5-club',
    route: '/v5-club',
    number: '05',
    nav: 'Club',
    eyebrow: 'Pickleball wedge',
    headline: 'The best groups start with human context.',
    subhead:
      'Human Conversation helps pickleball clubs learn what players actually need and coordinate games people want to come back for.',
    image: 'generated/v5-club.png',
    theme: {
      name: 'Forest / parchment / warm amber',
      page: '#17231f',
      ink: '#fff4df',
      muted: '#d9cab0',
      surface: 'rgba(255, 244, 223, 0.09)',
      line: 'rgba(255, 244, 223, 0.18)',
      accent: '#f1b75d',
      accentSoft: 'rgba(241, 183, 93, 0.16)',
      button: '#f1b75d',
      buttonText: '#17231f',
      serif: true,
    },
    cta: 'Build a human-first club',
    problemTitle: 'The human layer',
    problemLines: [
      'Skill level matters.',
      'So do trust, tone, schedule, energy, and comfort.',
      'The best club teams already notice those details.',
    ],
    truthTitle: 'The real question',
    truth:
      'The better question is simple: will these people want to play again?',
    flowTitle: 'What staff already know',
    flow: [
      {
        title: 'Who needs encouragement',
        body: 'Some players need the right first group before they feel ready to come back.',
      },
      {
        title: 'Who wants stronger games',
        body: 'Some players care about pace, intensity, and how a group feels.',
      },
      {
        title: 'Who brings good energy',
        body: 'The staff knows who makes groups better, but that knowledge rarely becomes reusable data.',
      },
      {
        title: 'Who should not be matched yet',
        body: 'Good coordination includes avoiding the wrong invite at the wrong time.',
      },
    ],
    productTitle: 'Human-first club support.',
    productBody: 'Capture staff knowledge and turn it into better groups, better games, and higher retention.',
    mockMessages: [
      { speaker: 'Player', text: 'I want better games, but not the intense group yet.' },
      { speaker: 'Staff signal', text: 'Competitive growth, confidence sensitive, prefers familiar partner.' },
      { speaker: 'Invite', text: 'Build a small bridge group before advanced play.' },
    ],
    suggestedAction: 'Offer a curated bridge game, then ask after play whether the pace felt right.',
    proofTitle: 'Early NEPC proof',
    proofBody:
      'Early club data suggests small curated groups can make the next invite feel more personal and useful.',
    outcomes: ['Better groups', 'Better games', 'Higher retention', 'More human context'],
    testing: 'Tests whether the wedge feels sharp enough for club buyers.',
    bestFor: 'Pickleball/padel landing page, club pitch, vertical wedge story.',
    finalLine: 'Better matching starts with what staff already know.',
  },
  {
    slug: 'v6-minimal',
    route: '/v6-minimal',
    number: '06',
    nav: 'Minimal',
    eyebrow: 'Inevitable',
    headline: 'Human Conversation',
    subhead: 'AI for the conversations that build community.',
    image: 'generated/v6-minimal.png',
    theme: {
      name: 'Minimal white / ink / tiny neon accent',
      page: '#fbfaf6',
      ink: '#12110f',
      muted: '#69645d',
      surface: 'rgba(255, 255, 255, 0.8)',
      line: 'rgba(18, 17, 15, 0.12)',
      accent: '#3d8bff',
      accentSoft: 'rgba(61, 139, 255, 0.11)',
      button: '#12110f',
      buttonText: '#fbfaf6',
      serif: true,
    },
    cta: 'Start the conversation',
    problemTitle: 'The sequence',
    problemLines: [
      'Communities run on conversations.',
      'Those conversations contain the truth.',
      'Today, the truth disappears.',
      'Human Conversation captures it.',
    ],
    truthTitle: 'The turn',
    truth:
      'The system turns conversation into better coordination. Every better coordination creates more signal. The community gets smarter every week.',
    flowTitle: 'The quiet system',
    flow: [
      {
        title: 'Notice',
        body: 'A human hears what matters.',
      },
      {
        title: 'Remember',
        body: 'The system keeps the signal without making the moment feel mechanical.',
      },
      {
        title: 'Coordinate',
        body: 'A better invite, group, follow-up, or introduction happens.',
      },
      {
        title: 'Learn',
        body: 'The next real-world moment gets sharper.',
      },
    ],
    productTitle: 'The interface gets out of the way.',
    productBody: 'Huge idea. Minimal surface. The page makes the category feel inevitable.',
    mockMessages: [
      { speaker: 'Conversation', text: 'I want to come back, I just need the right group.' },
      { speaker: 'Memory', text: 'Right group becomes reusable signal.' },
      { speaker: 'Coordination', text: 'The next invite feels obvious.' },
    ],
    suggestedAction: 'Create the next invite from the last real conversation. Confirm with staff.',
    proofTitle: 'The insight',
    proofBody:
      'Behavioral and conversational context helps staff understand what makes people want to come back.',
    outcomes: ['Less interface', 'More memory', 'Better coordination', 'A clearer category'],
    testing: 'Tests whether the simplest articulation is the strongest.',
    bestFor: 'Premium home page, teaser, investor pre-read, brand lockup.',
    finalLine: 'A better human conversation.',
  },
]

export const variantBySlug = new Map(variants.map((variant) => [variant.slug, variant]))
