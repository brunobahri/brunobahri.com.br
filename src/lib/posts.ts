import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

const timeOf = (post: Post) => post.data.date?.getTime() ?? Number.MAX_SAFE_INTEGER;

export async function getVisiblePosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => timeOf(b) - timeOf(a));
}

export const formatDate = (date?: Date) => (date ? date.toISOString().slice(0, 10) : 'draft');

export const formatTags = (tags: string[]) => tags.map((tag) => `#${tag}`).join(' ');
