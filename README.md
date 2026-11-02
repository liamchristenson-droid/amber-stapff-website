# Amber Stapff — portfolio website

Built with [Astro](https://astro.build) (static site) and [Decap CMS](https://decapcms.org) (the editing dashboard at `/admin`). Hosted on Netlify.

## How it fits together

- **Content** lives in plain files in this repo:
  - `src/content/projects/*.md`: one file per project (case study).
  - `src/content/settings/home.yml`: homepage, About, contact and services.
  - `src/assets/uploads/`: all images. Astro resizes and converts them to WebP when the site builds.
  - `public/media/`: the homepage video. Keep it under ~10 MB: H.264 MP4, no audio, 1280px wide.
- **Amber edits** at `https://amberstapff.com.au/admin`. Every time she clicks Publish, Decap commits the change to GitHub, and Netlify rebuilds and redeploys the site in about a minute.
- **Layout** of the homepage grid is automatic. Projects sort by their `order` number. Covers marked "wide" take a full row, the rest pair up, and a portrait cover always takes the narrower column.

## Commands

```bash
npm install        # once
npm run dev        # local preview at http://localhost:4321
npm run build      # production build → dist/
npm run build:demo # also writes dist-demo/: a portable preview with a try-it editor (nothing saves)
```

## Launch checklist

1. **GitHub**: create a private repo (e.g. `amber-stapff-website`) and push this folder to it. Then set `backend.repo` in `public/admin/config.yml` to `your-username/amber-stapff-website`.
2. **Netlify** (free plan):
   1. Add new site → Import from GitHub → pick the repo. The build command is `npm run build` and the publish directory is `dist` (also set in `netlify.toml`).
   2. Site settings → Access & security → OAuth → Install provider → GitHub, using a GitHub OAuth App. To create the app, go to GitHub → Settings → Developer settings → OAuth Apps. Set the callback URL to `https://api.netlify.com/auth/done`.
3. **Amber's login**: Amber creates a free GitHub account, and you invite her to the repo as a collaborator with Write access. She then signs in at `/admin` with "Login with GitHub".
4. **Domain**: in Netlify → Domain management, add `amberstapff.com.au` (and `www`). At her domain registrar, either point the nameservers to Netlify, or add the A / CNAME records Netlify shows. HTTPS is issued automatically.
5. **Before going live**: replace the `[Year]` / `[Role to confirm]` / `[Copy to come]` placeholders. Search the editor for "[" to find them.

## Hidden projects

The Nappy Society, South East Gardens, Flash and Hello Interiors are already loaded but hidden ("Show on website" is off) until Amber adds copy.
