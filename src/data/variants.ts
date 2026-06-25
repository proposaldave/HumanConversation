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
  secondaryCta: string
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
  copyDirection: string
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
      'AI for the conversations that build community. The future of community software is not another dashboard. It is a better human conversation.',
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
    secondaryCta: 'Copy this direction',
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
    copyDirection:
      'Manifesto direction: lead with the human worldview, make AI feel like memory and follow-through, then land the social sports wedge.',
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
    secondaryCta: 'Copy this direction',
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
      { speaker: 'AI note', text: 'Signal: competitive preference, social hesitation, weekday evenings.' },
      { speaker: 'Next action', text: 'Offer a curated group before open play.' },
    ],
    suggestedAction: 'Ask Krista to confirm Jordan for Thursday 7:00 with three known-good returners.',
    proofTitle: 'The operator pain is constant',
    proofBody:
      'Social sports clubs coordinate players every day, but rating-first tools miss fit, trust, chemistry, reliability, and energy.',
    outcomes: ['Better groups', 'Faster fills', 'Fewer awkward mismatches', 'More members who come back'],
    copyDirection:
      'Operator direction: make the buyer feel the daily pain, show staff heroics becoming system memory, keep the product practical.',
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
    headline: 'The conversation layer for autonomous social coordination.',
    subhead:
      'Human Conversation captures hidden social signal from everyday community conversations, then turns it into better groups, invitations, and real-world experiences.',
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
    cta: 'See the coordination layer',
    secondaryCta: 'Copy this direction',
    problemTitle: 'The old stack',
    problemLines: [
      'Booking software knows what is open.',
      'Rating software knows who is competitive.',
      'Nobody knows who should be together.',
    ],
    truthTitle: 'The missing data',
    truth:
      'Human fit, trust, chemistry, reliability, energy, preference, and staff judgment are the real coordination layer. Today, that layer is mostly invisible.',
    flowTitle: 'The compounding loop',
    flow: [
      {
        title: 'Conversation',
        body: 'A staffer learns something useful in the normal course of building community.',
      },
      {
        title: 'Structured signal',
        body: 'The system maps preference, constraint, fit, and staff judgment into a usable graph.',
      },
      {
        title: 'Recommendation',
        body: 'The graph proposes a group, invitation, follow-up, or real-world next moment.',
      },
      {
        title: 'Human confirmation',
        body: 'A great community builder approves, edits, or rejects. That correction becomes proprietary training data.',
      },
    ],
    productTitle: 'The wedge has dense signal.',
    productBody:
      'Social sports clubs have constant coordination pain, high-frequency outcomes, and broken rating-first matching.',
    mockMessages: [
      { speaker: 'Signal', text: 'Reliability high. Wants stronger games. Avoids large open groups.' },
      { speaker: 'Graph', text: 'Fit improves with competitive regulars and one known friend.' },
      { speaker: 'Model', text: 'Recommend smaller curated invite, staff confirmation required.' },
    ],
    suggestedAction: 'Build a four-player group. Wait for operator approval. Measure acceptance and return behavior.',
    proofTitle: 'Early NEPC signal',
    proofBody:
      'Small curated groups reached 86.7% acceptance vs. 49.9% for large open groups in early NEPC data.',
    outcomes: ['Hidden social signal', 'Human-confirmed recommendations', 'A graph that compounds'],
    copyDirection:
      'Investor direction: define the missing layer, show the loop, and make social sports feel like the obvious wedge into real-world communities.',
    testing: 'Tests category clarity, venture scale, and data-moat legibility.',
    bestFor: 'Investor landing page, seed deck companion, founder-forward fundraising.',
    finalLine: 'The graph compounds every time a community builder coordinates a real moment.',
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
    secondaryCta: 'Copy this direction',
    problemTitle: 'The product job',
    problemLines: [
      'Ask the right question.',
      'Capture the hidden signal.',
      'Recommend the next move.',
      'Learn from the outcome.',
    ],
    truthTitle: 'Built for the staff flow',
    truth:
      'This is not an analytics dashboard. It is a conversation-first copilot that turns staff judgment into useful coordination memory.',
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
    copyDirection:
      'Product direction: make the workflow instantly legible and show exactly where AI helps without claiming full autonomy.',
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
    headline: "Ratings don't tell you who belongs together.",
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
    secondaryCta: 'Copy this direction',
    problemTitle: 'The broken default',
    problemLines: [
      'Every club uses skill ratings because nobody has a better signal.',
      'Players do not actually want a 3.5 match.',
      'They want to play with people they enjoy.',
    ],
    truthTitle: 'The real question',
    truth:
      'Not: are these four people the same rating? The better question is: will these four people want to play again?',
    flowTitle: 'What staff already know',
    flow: [
      {
        title: 'Who needs encouragement',
        body: 'Some players need the right first group more than they need another rating label.',
      },
      {
        title: 'Who wants stronger games',
        body: 'Competitive intent is more specific than a rating bracket.',
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
    productTitle: 'Not rating-first. Human-first.',
    productBody: 'Capture staff knowledge and turn it into better groups, better games, and higher retention.',
    mockMessages: [
      { speaker: 'Player', text: 'I want better games, but not the intense group yet.' },
      { speaker: 'Staff signal', text: 'Competitive growth, confidence sensitive, prefers familiar partner.' },
      { speaker: 'Invite', text: 'Build a small bridge group before open competitive play.' },
    ],
    suggestedAction: 'Offer a curated bridge game, then ask after play whether the pace felt right.',
    proofTitle: 'Early NEPC proof',
    proofBody:
      'In early NEPC data, small curated groups reached 86.7% acceptance vs. 49.9% for large open groups.',
    outcomes: ['Better groups', 'Better games', 'Higher retention', 'Less rating-only matching'],
    copyDirection:
      'Pickleball direction: own the category fight. Human-first clubs understand more than ratings and win on experience.',
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
    secondaryCta: 'Copy this direction',
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
      'Ratings tell you who is good. Behavioral and conversational signal tells you who belongs together.',
    outcomes: ['Less interface', 'More memory', 'Better coordination', 'A clearer category'],
    copyDirection:
      'Minimal direction: strip the story to its inevitability. Big type, short sequence, one signal visual.',
    testing: 'Tests whether the simplest articulation is the strongest.',
    bestFor: 'Premium home page, teaser, investor pre-read, brand lockup.',
    finalLine: 'Not another dashboard. A better human conversation.',
  },
]

export const variantBySlug = new Map(variants.map((variant) => [variant.slug, variant]))
