# brunobahri.com.br

Field notes on application security for multi-tenant SaaS.

Static site built with Astro. It ships no JavaScript, loads nothing from third parties and runs under a strict Content Security Policy.

## Commands

```sh
npm install
npm run dev
npm run check
```

`npm run check` builds the site and fails if the output contains JavaScript, inline styles or scripts, third-party resources, an expired `security.txt`, missing security headers, or exceeds the size budgets.

## Security

Report issues through [`/.well-known/security.txt`](https://brunobahri.com.br/.well-known/security.txt).

## Fonts

Geist Mono and Geist Serif by The Geist Project Authors, under the SIL Open Font License 1.1 (`public/fonts/OFL.txt`), subset to Latin.
