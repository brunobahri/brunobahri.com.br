import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getVisiblePosts } from '../lib/posts';

export async function GET(context: APIContext) {
  const posts = (await getVisiblePosts()).filter((post) => post.data.date);

  return rss({
    title: 'Bruno Bahri',
    description: 'Field notes on application security for multi-tenant SaaS.',
    site: context.site ?? 'https://brunobahri.com.br',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/posts/${post.id}`,
      categories: post.data.tags,
    })),
  });
}
