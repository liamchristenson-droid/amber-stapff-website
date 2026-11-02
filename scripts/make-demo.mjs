// Builds a self-contained PREVIEW copy of the site in dist-demo/ (run after `astro build`).
// - rewrites root-absolute links to relative ones so the preview works from any folder or host
// - turns /admin into a try-it-yourself demo of the editor (Decap's in-browser "test-repo" backend,
//   pre-loaded with the real content; nothing is saved)
// The real site is dist/ — this script never touches it.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dist = path.join(root, 'dist');
const out = path.join(root, 'dist-demo');

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(dist, out, { recursive: true });

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
  const p = path.join(dir, d.name);
  return d.isDirectory() ? walk(p) : [p];
});

// 1. Relative links
for (const file of walk(out)) {
  if (!/\.(html|css)$/.test(file)) continue;
  const rel = path.relative(path.dirname(file), out) || '.';
  const prefix = rel === '.' ? '' : rel.split(path.sep).join('/') + '/';
  let s = fs.readFileSync(file, 'utf8');
  const fix = (u) => (u.startsWith('/') && !u.startsWith('//') ? prefix + u.slice(1) : u);
  s = s.replace(/\b(href|src|poster)="([^"]*)"/g, (m, a, u) => `${a}="${fix(u)}"`);
  s = s.replace(/\bsrcset="([^"]*)"/g, (m, v) => `srcset="${v.split(',').map((part) => {
    const [u, ...rest] = part.trim().split(/\s+/);
    return [fix(u), ...rest].join(' ');
  }).join(', ')}"`);
  s = s.replace(/url\((['"]?)(\/[^)'"]+)\1\)/g, (m, q, u) => `url(${q}${fix(u)}${q})`);
  fs.writeFileSync(file, s);
}

// Drop build files nothing links to (Astro also copies every original image) to keep the preview small.
const astroDir = path.join(out, '_astro');
const pages = walk(out).filter((f) => /\.(html|css)$/.test(f)).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
for (const name of fs.readdirSync(astroDir)) {
  if (!pages.includes(name)) fs.rmSync(path.join(astroDir, name));
}

// 2. Editor demo
const adminDir = path.join(out, 'admin');
const uploadsOut = path.join(adminDir, 'uploads');
fs.mkdirSync(uploadsOut, { recursive: true });

const uploadsSrc = path.join(root, 'src/assets/uploads');
const media = {};
for (const name of fs.readdirSync(uploadsSrc)) {
  if (!/\.(jpe?g|png|webp)$/i.test(name)) continue;
  await sharp(path.join(uploadsSrc, name)).resize({ width: 640, withoutEnlargement: true }).jpeg({ quality: 66 }).toFile(path.join(uploadsOut, name));
  media[name] = { content: '' };
}

const demoValue = (s) => s.replaceAll('../../assets/uploads/', 'uploads/').replace('hero_video: /media/', 'hero_video: ../media/');
const read = (p) => demoValue(fs.readFileSync(path.join(root, p), 'utf8'));
const projects = {};
for (const name of fs.readdirSync(path.join(root, 'src/content/projects'))) {
  if (name.endsWith('.md')) projects[name] = { content: read(`src/content/projects/${name}`) };
}
const settings = { 'home.yml': { content: read('src/content/settings/home.yml') } };
// Decap's test backend reads folder collections by their full folder path as one key, and single
// files / media by walking nested path segments, so the content is registered both ways.
const repoFiles = {
  'src/content/projects': projects,
  src: { content: { projects, settings } },
};
// Media entries need a File object (for the Media library) and must stringify to their URL (for
// image fields). Start with empty placeholders and swap in the real image bytes in the background.
fs.writeFileSync(path.join(adminDir, 'repo-files.js'), `window.repoFiles = ${JSON.stringify(repoFiles)};
(function () {
  var names = ${JSON.stringify(Object.keys(media))};
  var uploads = window.repoFiles.uploads = {};
  names.forEach(function (n) {
    var url = 'uploads/' + n;
    uploads[n] = { content: { path: 'uploads/' + n, fileObj: new File([], n, { type: 'image/jpeg' }), toString: function () { return url; } } };
  });
  // Hold the editor until the demo images are in memory (or 6 seconds pass), so thumbnails show.
  window.CMS_MANUAL_INIT = true;
  var queue = names.slice(), left = names.length, started = false;
  function start() { if (!started && window.initCMS) { started = true; var l = document.getElementById('demo-loading'); if (l) l.remove(); window.initCMS(); } }
  function next() {
    var n = queue.shift();
    if (!n) return;
    fetch('uploads/' + n).then(function (r) { return r.blob(); }).then(function (b) {
      uploads[n].content.fileObj = new File([b], n, { type: b.type || 'image/jpeg' });
    }).catch(function () {}).then(function () { if (--left === 0) start(); next(); });
  }
  for (var i = 0; i < 8; i++) next();
  window.addEventListener('load', function () { if (left === 0) start(); else setTimeout(start, 6000); });
})();
`);

let config = fs.readFileSync(path.join(root, 'public/admin/config.yml'), 'utf8');
config = config
  .replace(/backend:\n(?:  .*\n|    .*\n)+/, 'backend:\n  name: test-repo\n\n')
  .replace(/^site_url: .*$/m, 'site_url: ../index.html')
  .replace(/^display_url: .*$/m, 'display_url: ../index.html')
  .replace(/^logo_url: .*$/m, 'logo_url: ../favicon.svg')
  .replace(/^media_folder: .*$/m, 'media_folder: uploads')
  .replace(/^public_folder: .*$/m, 'public_folder: uploads')
  .replace('media_folder: /public/media', 'media_folder: media')
  .replace('public_folder: /media', 'public_folder: ../media');
// Saved as .txt so preview hosts that won't serve .yml still can; Decap reads it by the link's type.
fs.writeFileSync(path.join(adminDir, 'config.txt'), config);
fs.rmSync(path.join(adminDir, 'config.yml'));

let adminHtml = fs.readFileSync(path.join(adminDir, 'index.html'), 'utf8');
adminHtml = adminHtml.replace('href="config.yml"', 'href="config.txt"').replace(
  '<script src="https://unpkg.com/decap-cms',
  `<div style="position:fixed;left:12px;bottom:12px;z-index:9999;background:#141414;color:#f4f2ee;font:12px/1.4 system-ui,sans-serif;padding:8px 12px;border-radius:999px;pointer-events:none">Demo: try anything, nothing is saved</div>
  <div id="demo-loading" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;font:15px system-ui,sans-serif;color:#5e5b56;background:#eff0f4">Loading the editor…</div>
  <script src="repo-files.js"></script>
  <script src="https://unpkg.com/decap-cms`,
);
fs.writeFileSync(path.join(adminDir, 'index.html'), adminHtml);

// 3. "Try the editor" badge on the preview homepage only
const homePath = path.join(out, 'index.html');
let home = fs.readFileSync(homePath, 'utf8');
home = home.replace('</body>', `<a href="admin/index.html" style="position:fixed;right:16px;bottom:16px;z-index:50;display:inline-flex;align-items:center;min-height:44px;padding:0 18px;border-radius:999px;background:#141414;color:#f4f2ee;font:500 14px/1 'Inter Tight',system-ui,sans-serif;text-decoration:none;box-shadow:0 6px 24px rgba(0,0,0,.18)">Try the editor →</a></body>`);
fs.writeFileSync(homePath, home);

console.log('Preview written to dist-demo/');
