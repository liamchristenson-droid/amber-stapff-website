import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      published: z.boolean().default(true),
      order: z.number().default(99),
      summary: z.string().default(''),
      client: z.string().optional(),
      location: z.string().optional(),
      year: z.string().optional(),
      role: z.string().optional(),
      working_under: z.string().optional(),
      credits: z.string().optional(),
      cover: image(),
      cover_alt: z.string().default(''),
      cover_shape: z.string().optional(), // no longer used: all homepage covers share one landscape shape
      cover_focus: z.enum(['center', 'top', 'bottom', 'left', 'right']).default('center'),
      home_layout: z.enum(['landscape', 'portrait']).default('landscape'),
      sort_key: z.string().optional(), // set by the editor so its list matches the website order
      hero: image(),
      hero_alt: z.string().default(''),
      intro: z.string().optional(),
      overview: z.string().optional(),
      challenge: z.string().optional(),
      approach: z.string().optional(),
      outcome: z.string().optional(),
      gallery: z
        .array(
          z.object({
            layout: z.enum(['full', 'pair', 'trio']).default('pair'),
            images: z.array(z.object({ image: image(), alt: z.string().default('') })).default([]),
          }),
        )
        .default([]),
    }),
});

const settings = defineCollection({
  loader: glob({ pattern: '*.yml', base: './src/content/settings' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      positioning: z.string(),
      meta: z.array(z.string()).default([]),
      hero_video: z.string().optional(),
      hero_poster: image().optional(),
      hero_image: image().optional(),
      hero_caption: z.string().optional(),
      hero_caption_right: z.string().optional(),
      about_label: z.string().optional(),
      about_statement: z.string(),
      headshot: image().optional(),
      stats: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
      worked_with: z.string().optional(),
      countries: z.string().optional(),
      contact_heading: z.string(),
      email: z.string(),
      services: z.array(z.object({ title: z.string(), text: z.string() })).default([]),
      footer_location: z.string().optional(),
    }),
});

export const collections = { projects, settings };
