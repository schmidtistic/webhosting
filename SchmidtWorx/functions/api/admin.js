// Cloudflare Pages Function — handles /api/admin
//
// Required environment variables (CF Pages → Settings → Environment variables):
//   GITHUB_PAT      — fine-grained GitHub token, repo "webhosting", contents: write
//   ADMIN_PASSWORD  — Mike's admin password

const REPO_OWNER = 'schmidtistic';
const REPO_NAME  = 'webhosting';
const GH_API     = 'https://api.github.com';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Editor-Password',
};

// ── Page registry — add new pages here ──────────────────────────────────────

const PAGES = {
  forward: {
    jsonPath: 'SchmidtWorx/data/michael-schmidt-forward.json',
    htmlPath: 'SchmidtWorx/Reflections/michael-schmidt-forward.html',
    commitMessage: 'Update For Cooper page via admin editor',
    defaultContent() {
      return {
        meta: {
          title: 'For Cooper — Michael Schmidt — SchmidtWorx',
          description: 'Things Mike Schmidt figured out and wants to pass forward. For Cooper, and anyone else who finds it useful.',
          url: 'https://schmidtworx.com/Reflections/michael-schmidt-forward.html',
        },
        hero: { eyebrow: 'Michael Schmidt · 1981–', title: 'For Cooper', tagline: "What I'd want you to know. And anyone else who finds it useful." },
        context: { kicker: 'Context', heading: 'Things figured out. Worth passing on.', body: '' },
        lessons: { kicker: 'Lessons', heading: 'What I Know', intro: 'One at a time.', entries: [] },
        notes:   { kicker: 'Notes', heading: 'What I See', intro: 'Not lessons. Just what I notice.', entries: [] },
        videos:  { kicker: 'Worth Your Time', heading: 'Watch These', intro: '', items: [] },
        footer:  '',
      };
    },
    render: renderForwardHTML,
  },
};

// ── GitHub helpers ───────────────────────────────────────────────────────────

function ghHeaders(pat) {
  return {
    Authorization: `Bearer ${pat}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'SchmidtWorx-Admin/1.0',
    'Content-Type': 'application/json',
  };
}

async function ghGet(path, pat) {
  return fetch(`${GH_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
    headers: ghHeaders(pat),
  });
}

async function ghPut(path, content, sha, message, pat) {
  const body = { message, content: b64Encode(content) };
  if (sha) body.sha = sha;
  return fetch(`${GH_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
    method: 'PUT',
    headers: ghHeaders(pat),
    body: JSON.stringify(body),
  });
}

function b64Encode(str) {
  const bytes = new TextEncoder().encode(str);
  const chars = Array.from(bytes, b => String.fromCharCode(b));
  return btoa(chars.join(''));
}

function b64Decode(str) {
  const binary = atob(str.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// ── HTML helpers ─────────────────────────────────────────────────────────────

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderParagraphs(text, indent = '            ') {
  if (!text?.trim()) return '';
  return text.trim()
    .split(/\n{2,}/)
    .map(p => `${indent}<p>${esc(p.trim()).replace(/\n/g, `<br>\n${indent}`)}</p>`)
    .join('\n');
}

// ── For Cooper renderer ──────────────────────────────────────────────────────

function renderForwardHTML(data, forPreview = false) {
  const { meta, hero, context, lessons, notes, videos, footer } = data;

  const baseTag    = forPreview ? '\n  <base href="https://schmidtworx.com/">' : '';
  const scriptTag  = forPreview ? '' : '\n  <script src="/scripts/menu.js"><\/script>';

  // Lessons entries (collapsible details/summary)
  const lessonItems = (lessons.entries ?? []).map(e => {
    const bodyHTML = e.placeholder || !e.body?.trim()
      ? `\n            <p style="color: var(--muted); font-style: italic;">[ coming soon ]</p>\n`
      : `\n${renderParagraphs(e.body, '            ')}\n`;
    return `
        <li>
          <details>
            <summary>${esc(e.summary)}</summary>
${bodyHTML}
          </details>
        </li>`;
  }).join('');

  // Notes entries (strong + paragraph)
  const noteItems = (notes.entries ?? []).map(n => `
        <li>
          <strong>${esc(n.title)}</strong>
          <p>${esc(n.body)}</p>
        </li>`).join('');

  // Videos JS array
  const videoArray = (videos.items ?? []).map(v =>
    `    {\n      id: ${JSON.stringify(v.id)},\n      title: ${JSON.stringify(v.title)},\n      start: ${Number(v.start) || 0},\n      note: ${JSON.stringify(v.note || '')}\n    }`
  ).join(',\n');

  // Context body
  const ctxParas = renderParagraphs(context.body, '        ');

  // Footer
  const footerHTML = footer?.trim()
    ? `\n    <footer>\n      <p>${esc(footer)}</p>\n    </footer>\n`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />${baseTag}
  <title>${esc(meta.title)}</title>
  <meta name="description" content="${esc(meta.description)}" />

  <meta property="og:title" content="${esc(meta.title)}" />
  <meta property="og:description" content="${esc(meta.description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${esc(meta.url)}" />
  <meta property="og:image" content="https://schmidtworx.com/SWLogo.png" />
  <meta property="og:site_name" content="SchmidtWorx" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${esc(meta.title)}" />
  <meta name="twitter:description" content="${esc(meta.description)}" />

  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="stylesheet" href="/style.css" />

  <style>
    .video-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
      margin-top: 1.5rem;
    }
    .video-card {
      background: var(--bg-soft);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .video-card:hover {
      border-color: var(--border-strong);
      box-shadow: 0 4px 24px rgba(0,0,0,0.35);
    }
    .video-thumb {
      position: relative;
      display: block;
      aspect-ratio: 16 / 9;
      overflow: hidden;
    }
    .video-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: opacity 0.2s;
    }
    .video-card:hover .video-thumb img { opacity: 0.8; }
    .video-play {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    .video-info { padding: 0.9rem 1.1rem 1rem; }
    .video-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--fg);
      margin: 0 0 0.4rem;
      line-height: 1.4;
    }
    .video-note {
      font-size: 0.85rem;
      color: var(--muted);
      line-height: 1.65;
      margin: 0.5rem 0 0.4rem;
    }
    .watch-link {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.75rem;
      color: var(--accent);
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      margin-top: 0.5rem;
      transition: color 0.2s;
    }
    .watch-link:hover { color: var(--accent-strong); }
  </style>
</head>
<body>

  <!-- Header loads here -->
  <header>
    <div class="nav-container">
        <a class="site-title" href="/index.html" aria-label="SchmidtWorx home">
            <span class="site-title-mark">Archive</span>
            <span class="site-title-text">SchmidtWorx</span>
        </a>
        <button class="hamburger" id="hamburger" type="button" aria-expanded="false" aria-controls="menu"
            aria-label="Open navigation">
            <span aria-hidden="true">☰</span>
        </button>
    </div>

    <nav id="menu" aria-label="Primary navigation">
        <a class="nav-link" href="/index.html">Home</a>
        <a class="nav-link" href="/Reflections/index.html">Reflections</a>
        <a class="nav-link" href="/LettersAndRecordings/index.html">Recordings and Artifacts</a>
    </nav>
  </header>
  <!-- Header ends here -- Populate Body starting right below -->

  <main class="container page-shell">

    <nav aria-label="Breadcrumb" class="breadcrumb">
      <ol>
        <li><a href="/">Home</a></li>
        <li><a href="/Reflections/">Reflections</a></li>
        <li aria-current="page">Michael Schmidt</li>
      </ol>
    </nav>

    <section class="hero">
      <p class="eyebrow">${esc(hero.eyebrow)}</p>
      <h1>${esc(hero.title)}</h1>
      <p class="tagline">${esc(hero.tagline)}</p>
      <nav class="view-switcher" aria-label="Switch perspective">
        <a class="view-tab" href="michael-schmidt.html">Reflections</a>
        <a class="view-tab is-active" href="michael-schmidt-forward.html" aria-current="page">For Cooper</a>
        <a class="view-tab" href="michael-schmidt-inspiration.html">Inspiration</a>
      </nav>
    </section>

    <section id="context" class="section-card">
      <p class="section-kicker">${esc(context.kicker)}</p>
      <h2 class="section-heading">${esc(context.heading)}</h2>
${ctxParas}
    </section>

    <section id="lessons" class="content-panel">
      <p class="section-kicker">${esc(lessons.kicker)}</p>
      <h2 class="content-title">${esc(lessons.heading)}</h2>
      <p class="content-intro">${esc(lessons.intro)}</p>

      <ul class="content-list">
${lessonItems}
      </ul>
    </section>

    <section id="what-i-see" class="content-panel">
      <p class="section-kicker">${esc(notes.kicker)}</p>
      <h2 class="content-title">${esc(notes.heading)}</h2>
      <p class="content-intro">${esc(notes.intro)}</p>

      <ul class="content-list">
${noteItems}
      </ul>
    </section>

    <section id="watch-these" class="content-panel">
      <p class="section-kicker">${esc(videos.kicker)}</p>
      <h2 class="section-heading">${esc(videos.heading)}</h2>
      <p>${esc(videos.intro)}</p>
      <div id="video-grid" class="video-grid"></div>
    </section>
${footerHTML}
  </main>
${scriptTag}
  <script>
  var videos = [
${videoArray}
  ];

  (function () {
    var grid = document.getElementById('video-grid');
    if (!grid) return;

    videos.forEach(function (v) {
      var url = 'https://www.youtube.com/watch?v=' + v.id + (v.start ? '&t=' + v.start + 's' : '');
      var thumb = 'https://img.youtube.com/vi/' + v.id + '/mqdefault.jpg';

      var noteHTML = (v.note && v.note.trim())
        ? '<p class="video-note">' + v.note + '</p>'
        : '';

      var card = document.createElement('div');
      card.className = 'video-card';
      card.innerHTML =
        '<a class="video-thumb" href="' + url + '" target="_blank" rel="noopener noreferrer">' +
          '<img src="' + thumb + '" alt="' + v.title + '" loading="lazy">' +
          '<div class="video-play">' +
            '<svg width="48" height="48" viewBox="0 0 48 48" fill="none">' +
              '<circle cx="24" cy="24" r="24" fill="rgba(0,0,0,0.55)"/>' +
              '<polygon points="19,14 38,24 19,34" fill="#f2eee6" opacity="0.92"/>' +
            '</svg>' +
          '</div>' +
        '</a>' +
        '<div class="video-info">' +
          '<p class="video-title">' + v.title + '</p>' +
          noteHTML +
          '<a class="watch-link" href="' + url + '" target="_blank" rel="noopener noreferrer">Watch on YouTube \u2197</a>' +
        '</div>';

      grid.appendChild(card);
    });
  })();
  </script>
</body>
</html>`;
}

// ── Response helpers ──────────────────────────────────────────────────────────

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  const pass = request.headers.get('X-Editor-Password');
  if (!pass || pass !== env.ADMIN_PASSWORD) {
    return jsonRes({ error: 'Unauthorized' }, 401);
  }

  const url  = new URL(request.url);
  const page = url.searchParams.get('page');

  if (!page || !PAGES[page]) {
    return jsonRes({ error: `Unknown page: ${page}. Valid pages: ${Object.keys(PAGES).join(', ')}` }, 400);
  }

  const cfg = PAGES[page];

  // GET — load current content from GitHub
  if (request.method === 'GET') {
    const res = await ghGet(cfg.jsonPath, env.GITHUB_PAT);

    if (res.status === 404) {
      return jsonRes({ content: cfg.defaultContent(), sha: null });
    }
    if (!res.ok) return jsonRes({ error: 'GitHub error: ' + res.status }, 502);

    const file    = await res.json();
    const content = JSON.parse(b64Decode(file.content));
    return jsonRes({ content, sha: file.sha });
  }

  // POST — preview or publish
  if (request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch {
      return jsonRes({ error: 'Invalid JSON body' }, 400);
    }

    const { content, sha } = body;
    if (!content) return jsonRes({ error: 'Missing content' }, 400);

    // Preview — render HTML, no commit
    if (url.searchParams.get('preview') === 'true') {
      const html = cfg.render(content, true);
      return new Response(html, {
        headers: { ...CORS, 'Content-Type': 'text/html;charset=UTF-8' },
      });
    }

    // Publish — commit JSON then rendered HTML
    const jsonStr = JSON.stringify(content, null, 2);
    const jsonPut = await ghPut(cfg.jsonPath, jsonStr, sha, cfg.commitMessage, env.GITHUB_PAT);
    if (!jsonPut.ok) {
      const detail = await jsonPut.text();
      return jsonRes({ error: 'Failed to save content', detail }, 502);
    }
    const jsonData   = await jsonPut.json();
    const newJsonSha = jsonData.content.sha;

    let htmlSha = null;
    const htmlGet = await ghGet(cfg.htmlPath, env.GITHUB_PAT);
    if (htmlGet.ok) {
      const htmlFile = await htmlGet.json();
      htmlSha = htmlFile.sha;
    }

    const html    = cfg.render(content, false);
    const htmlPut = await ghPut(cfg.htmlPath, html, htmlSha, cfg.commitMessage, env.GITHUB_PAT);
    if (!htmlPut.ok) {
      const detail = await htmlPut.text();
      return jsonRes({ error: 'Failed to publish page', detail }, 502);
    }

    return jsonRes({ success: true, newJsonSha });
  }

  return new Response('Method not allowed', { status: 405, headers: CORS });
}
