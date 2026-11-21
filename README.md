# vanta-raven-193e

Public component registry for [prism/ui](https://component-3d-site.vercel.app).

**No secrets live here. No token is needed to read anything in this repo.**
The site loads components straight from `raw.githubusercontent.com` — anonymous,
cache-friendly, zero auth.

## Layout

```
registry.json            # index: id, name, tag, author, files
components/<id>/
  meta.json              # name, tag, author, source, description
  index.html             # markup (no <script> tags — sanitizer strips them)
  index.css              # styles, scoped under .cmp-<prefix>
  index.js               # optional behavior, plain IIFE
```

## Rules for components

1. Every CSS selector is scoped under the component's wrapper class
   (`.cmp-you`, `.cmp-send`, …). Keyframes are prefixed with the component
   name so two components never fight over `spin`.
2. HTML contains no `<script>`, inline `on*=` handlers, or external URLs
   except SVG namespaces. Behavior goes in `index.js`.
3. `meta.json` credits the original author and links the source.
4. IDs are `^[a-z0-9][a-z0-9-]{1,48}$`. Files are capped at 64 KB each.

## Publishing

The website's **Add component** form posts to its server-side
`/api/publish` endpoint. The GitHub token lives only in the server's
environment (`GITHUB_TOKEN` on Vercel) — never in this repo, never in
the browser bundle. The endpoint validates and sanitizes the payload,
rate-limits per IP, then commits through the GitHub Contents API.

## Credits

Components adapted from Uiverse.io authors: SelfMadeSystem, mrhyddenn,
arthur_6104, JkHuger, rishichawda, marcelodolza. Each `meta.json` carries
the attribution.
