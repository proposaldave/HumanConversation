# Human Conversation

Simple public landing page for HumanConversation.com.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build:pages
```

## Publish

Use this command for every public landing page update:

```bash
npm run publish:pages
```

It builds the site, saves a timestamped private snapshot to `proposaldave/HumanConversation-private-backups`, deploys `dist` to the public `gh-pages` branch, and reasserts `humanconversation.com` as the GitHub Pages custom domain.

Use this only when you need a private snapshot without publishing:

```bash
npm run backup:landing
```

The site is published at:

```text
https://humanconversation.com/
https://proposaldave.github.io/HumanConversation/
```

Keep `public/CNAME` set to `humanconversation.com` so GitHub Pages stays attached to the custom domain.

## Contact

The public contact email is `hello@humanconversation.com`.
