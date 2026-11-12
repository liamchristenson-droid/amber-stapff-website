import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;

export async function getSettings() {
  const entry = await getEntry('settings', 'home');
  if (!entry) throw new Error('Missing src/content/settings/home.yml');
  return entry.data;
}

/** "0-0003-cartier women's initiative": shown before hidden, then Order, then title. Mirrors public/admin/index.html. */
export const sortKey = (d: { published?: boolean; order: number; title: string }) =>
  `${d.published === false ? 1 : 0}-${String(Math.max(0, Math.round(d.order))).padStart(4, '0')}-${d.title.trim().toLowerCase()}`;

export async function getProjects(): Promise<Project[]> {
  const all = await getCollection('projects', ({ data }) => data.published !== false);
  // Same rule the editor list uses (see sortKey): Order number, then title A–Z.
  return all.sort((a, b) => (sortKey(a.data) < sortKey(b.data) ? -1 : sortKey(a.data) > sortKey(b.data) ? 1 : 0));
}

export const projectUrl = (p: Project) => `/work/${p.id}.html`;

/** Split text into paragraphs on blank lines. */
export const paragraphs = (text?: string) =>
  (text ?? '').split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
