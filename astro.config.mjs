import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://brunobahri.com.br',
  trailingSlash: 'never',
  build: {
    format: 'file',
    inlineStylesheets: 'never',
  },
  markdown: {
    syntaxHighlight: false,
  },
  devToolbar: {
    enabled: false,
  },
  integrations: [sitemap()],
});
