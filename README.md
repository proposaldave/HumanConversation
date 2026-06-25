# Human Conversation Landing Page Exploration

Six landing-page directions for HumanConversation.com.

Human Conversation is AI for the conversations that build community. This app is built as a Vite + React + TypeScript + Tailwind exploration with route-aware variants and generated hero visuals.

## Run

```bash
npm install
npm run dev
```

Open the local URL Vite prints. The main gallery is `/`.

## Public GitHub Pages Build

```bash
npm run build:pages
```

The app is configured to work on both the temporary GitHub Pages URL and the future custom domain:

```text
https://proposaldave.github.io/HumanConversation/
https://humanconversation.com/
```

The public root URL opens Variant 3 directly for clean sharing while the domain transfer is pending.

## Routes

- `/HumanConversation/` - recommended public landing page, Variant 3 Investor
- `/HumanConversation/#/gallery` - gallery and comparison home on GitHub Pages
- `/` - recommended public landing page after HumanConversation.com is connected
- `/#/gallery` - gallery and comparison home after HumanConversation.com is connected
- `/HumanConversation/#/v1-manifesto` - worldview / category emotion
- `/HumanConversation/#/v2-operator` - club operator painkiller
- `/HumanConversation/#/v3-investor` - category creation / data moat
- `/HumanConversation/#/v4-product` - product workflow
- `/HumanConversation/#/v5-club` - pickleball wedge
- `/HumanConversation/#/v6-minimal` - ultra-minimal brand direction

## What Each Variant Tests

### 1. Manifesto

Tests whether the company can lead with a broad human worldview: AI should make community more human, not less. Best for a public launch or investor first impression.

### 2. Operator

Tests whether the buyer immediately feels the pain: staff hear everything, but the signal disappears into memory and texts. Best for club owner sales and pilot outreach.

### 3. Investor

Tests whether the venture-scale category is clear: conversation signal becomes the missing layer for autonomous social coordination. Best for investors.

### 4. Product

Tests whether the product is understandable quickly: guided conversation, structured memory, recommended next move, human confirmation, outcome learning. Best for demos and Steve alignment.

### 5. Club

Tests whether the pickleball wedge is sharp: ratings do not tell you who belongs together. Best for pickleball and padel buyers.

### 6. Minimal

Tests whether the simplest statement is the most premium: Human Conversation, AI for the conversations that build community. Best for a polished brand home.

## Recommended Winner

Use Variant 3 as the investor-facing winner and Variant 2 as the operator-facing sales page.

Variant 3 makes the biggest idea legible: the conversation layer for autonomous social coordination. Variant 2 makes the buyer pain concrete enough to sell.

## Assets

Generated hero images live in:

```text
public/generated/
```

The original tool outputs remain in the Codex generated image folder. The app references only the project-local copies.

## Form Behavior

The early-access form opens a prefilled email to `hello@humanconversation.com` with name, email, organization, role, and community intent. The footer uses the same public contact address.
