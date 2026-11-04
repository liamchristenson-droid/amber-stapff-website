import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;

export async function getSettings() {
  const entry = await getEntry('settings', 'home');
  if (!entry) throw new Error('Missing src/content/settings/home.yml');
  return entry.data;
}

export async function getProjects(): Promise<Project[]> {
  const all = await getCollection('projects', ({ data }) => data.published !== false);
  return all.sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));
}

export const projectUrl = (p: Project) => `/work/${p.id}.html`;

/** Split text into paragraphs on blank lines. */
export const paragraphs = (text?: string) =>
  (text ?? '').split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
