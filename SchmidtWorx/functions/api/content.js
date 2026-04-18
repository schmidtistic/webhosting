// Cloudflare Pages Function — handles /api/content
//
// Required environment variables (set in CF Pages → Settings → Environment variables):
//   GITHUB_PAT      — fine-grained GitHub token, repo "webhosting", contents: write
//   EDITOR_PASSWORD — the password Greg enters in the editor

const REPO_OWNER = 'schmidtistic';
const REPO_NAME  = 'webhosting';
const JSON_PATH  = 'SchmidtWorx/data/gregory-schmidt.json';
const HTML_PATH  = 'SchmidtWorx/Reflections/gregory-schmidt.html';
const GH_API     = 'https://api.github.com';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Editor-Password',
};

// ── GitHub helpers ──────────────────────────────────────────────────────────

function ghHeaders(pat) {
  return {
    Authorization: `Bearer ${pat}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'SchmidtWorx-Editor/1.0',
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

// ── HTML renderer ───────────────────────────────────────────────────────────

function toRoman(n) {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let out = '';
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { out += syms[i]; n -= vals[i]; }
  }
  return out;
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderParagraphs(text, indent = '                ') {
  if (!text?.trim()) return '';
  return text.trim()
    .split(/\n{2,}/)
    .map(p => `${indent}<p>${esc(p.trim()).replace(/\n/g, `<br>\n${indent}`)}</p>`)
    .join('\n');
}

function renderHTML(data, forPreview = false) {
  const { meta, hero, context, sections = [], footer = '' } = data;
  const baseTag = forPreview
    ? '\n    <base href="https://schmidtworx.com/">'
    : '';
  const scriptTag = forPreview
    ? ''
    : '\n    <script src="/scripts/menu.js"><\/script>';

  const sectionItems = sections.map((sec, i) => {
    const roman = toRoman(i + 1);
    const entries = (sec.entries ?? []).map(e => `
            <li>
              <details>
                <summary>${esc(e.summary)}</summary>

${renderParagraphs(e.body)}

              </details>
            </li>`).join('');

    return `
        <li>
          <strong>${roman}. ${esc(sec.title)}</strong>
          <p class="section-note">${esc(sec.note)}</p>
          <ul>${entries}
          </ul>
        </li>`;
  }).join('');

  const contentsBlock = sections.length > 0 ? `
        <section id="contents" class="content-panel">
          <h2 class="content-title">Contents</h2>
          <ul class="content-list">
            ${sectionItems}
          </ul>
        </section>
` : '';

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
    <meta property="og:image" content="https://schmidtworx.com/web-app-manifest-512x512.png" />
    <meta property="og:site_name" content="SchmidtWorx" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${esc(meta.title)}" />
    <meta name="twitter:description" content="${esc(meta.description)}" />
    <meta name="twitter:image" content="https://schmidtworx.com/web-app-manifest-512x512.png" />
    <link rel="stylesheet" href="/style.css" />
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
            <li><a href="/index.html">Home</a></li>
            <li><a href="/Reflections/index.html">Reflections</a></li>
            <li aria-current="page">Gregory Schmidt</li>
          </ol>
        </nav>

        <section class="hero">
            <p class="eyebrow">${esc(hero.eyebrow)}</p>
            <h1>${esc(hero.title)}</h1>
            <p class="tagline">
                ${esc(hero.tagline)}
            </p>
        </section>

        <section id="context" class="section-card">
            <p class="section-kicker">${esc(context.kicker)}</p>
            <h2 class="section-heading">${esc(context.heading)}</h2>
            <p>
                ${esc(context.body)}
            </p>
        </section>
${contentsBlock}
        <footer>
            <p>${esc(footer)}</p>
        </footer>

    </main>
${scriptTag}
</body>

</html>`;
}

// ── Response helpers ────────────────────────────────────────────────────────

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// ── Main handler ────────────────────────────────────────────────────────────

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  const pass = request.headers.get('X-Editor-Password');
  if (!pass || pass !== env.EDITOR_PASSWORD) {
    return jsonRes({ error: 'Unauthorized' }, 401);
  }

  const url = new URL(request.url);

  // GET — load current content from GitHub
  if (request.method === 'GET') {
    const res = await ghGet(JSON_PATH, env.GITHUB_PAT);

    if (res.status === 404) {
      // File not yet in repo — return empty default
      const def = {
        meta: {
          title: 'Reflections – Gregory Schmidt — SchmidtWorx',
          description: 'Personal reflections from Gregory Schmidt (1956–).',
          url: 'https://schmidtworx.com/Reflections/gregory-schmidt.html',
        },
        hero: { eyebrow: 'Gregory Schmidt · 1956–', title: 'Reflections', tagline: '' },
        context: { kicker: 'Context', heading: '', body: '' },
        sections: [],
      };
      return jsonRes({ content: def, sha: null });
    }

    if (!res.ok) return jsonRes({ error: 'GitHub error: ' + res.status }, 502);

    const file = await res.json();
    const content = JSON.parse(b64Decode(file.content));
    return jsonRes({ content, sha: file.sha });
  }

  // POST — preview or publish
  if (request.method === 'POST') {
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonRes({ error: 'Invalid JSON body' }, 400);
    }

    const { content, sha } = body;
    if (!content) return jsonRes({ error: 'Missing content' }, 400);

    // Preview — render and return HTML, no commit
    if (url.searchParams.get('preview') === 'true') {
      const html = renderHTML(content, true);
      return new Response(html, {
        headers: { ...CORS, 'Content-Type': 'text/html;charset=UTF-8' },
      });
    }

    // Publish — commit JSON then rendered HTML
    const jsonStr = JSON.stringify(content, null, 2);
    const jsonPut = await ghPut(
      JSON_PATH, jsonStr, sha,
      'Update Gregory Schmidt reflections via editor',
      env.GITHUB_PAT
    );
    if (!jsonPut.ok) {
      const detail = await jsonPut.text();
      return jsonRes({ error: 'Failed to save content', detail }, 502);
    }
    const jsonData = await jsonPut.json();
    const newJsonSha = jsonData.content.sha;

    // Get current SHA of the HTML output file (may not exist yet)
    let htmlSha = null;
    const htmlGet = await ghGet(HTML_PATH, env.GITHUB_PAT);
    if (htmlGet.ok) {
      const htmlFile = await htmlGet.json();
      htmlSha = htmlFile.sha;
    }

    const html = renderHTML(content, false);
    const htmlPut = await ghPut(
      HTML_PATH, html, htmlSha,
      'Render Gregory Schmidt page via editor',
      env.GITHUB_PAT
    );
    if (!htmlPut.ok) {
      const detail = await htmlPut.text();
      return jsonRes({ error: 'Failed to publish page', detail }, 502);
    }

    return jsonRes({ success: true, newJsonSha });
  }

  return new Response('Method not allowed', { status: 405, headers: CORS });
}
