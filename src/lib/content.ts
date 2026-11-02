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

export type Cell = { project: Project; width: string; drop: string };

/**
 * Lay the project list out as editorial rows. Wide covers take a full row; the rest pair up,
 * cycling through three rhythms (big/small, small/big, equal). A lone project left at the end
 * joins the row before it as a trio.
 */
export function layoutRows(projects: Project[]): Cell[][] {
  const groups: Project[][] = [];
  let pending: Project | null = null;
  for (const p of projects) {
    if (p.data.cover_shape === 'wide') {
      if (pending) { groups.push([pending]); pending = null; }
      groups.push([p]);
    } else if (pending) {
      groups.push([pending, p]);
      pending = null;
    } else {
      pending = p;
    }
  }
  if (pending) {
    const prev = groups[groups.length - 1];
    if (prev && prev.length === 2) prev.push(pending);
    else groups.push([pending]);
  }

  let rhythm = 0;
  return groups.map((g) => {
    if (g.length === 1) {
      const wide = g[0].data.cover_shape === 'wide';
      return [{ project: g[0], width: wide ? 'w-12' : 'w-7', drop: '' }];
    }
    if (g.length === 3) return g.map((project) => ({ project, width: 'w-4', drop: '' }));
    const [a, b] = g;
    const portrait = (x: Project) => x.data.cover_shape === 'portrait';
    // A portrait cover always takes the narrower column so it never towers over the row.
    if (portrait(a) && !portrait(b)) return [{ project: a, width: 'w-5', drop: '' }, { project: b, width: 'w-7', drop: 'drop-2' }];
    if (portrait(b) && !portrait(a)) return [{ project: a, width: 'w-7', drop: '' }, { project: b, width: 'w-5', drop: 'drop-1' }];
    const r = rhythm++ % 3;
    if (r === 0) return [{ project: g[0], width: 'w-7', drop: '' }, { project: g[1], width: 'w-5', drop: 'drop-1' }];
    if (r === 1) return [{ project: g[0], width: 'w-5', drop: '' }, { project: g[1], width: 'w-7', drop: 'drop-2' }];
    return [{ project: g[0], width: 'w-6', drop: '' }, { project: g[1], width: 'w-6', drop: '' }];
  });
}
