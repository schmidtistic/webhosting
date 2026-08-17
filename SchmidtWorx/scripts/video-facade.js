/* Video facade — swaps a poster image for the real YouTube iframe on click.
 *
 * Why this exists: these players live inside collapsed <details> elements. An
 * iframe that loads while its container has no layout box makes the YouTube
 * player initialise at zero size, so it fetches the smallest poster it has and
 * then upscales that blurry image once the section is expanded. Loading a
 * fixed, full-resolution thumbnail ourselves sidesteps the problem entirely —
 * and the page stops booting a player per video on every visit.
 *
 * Markup:
 *   <div class="video-wrapper video-facade"
 *        data-video-id="9Psy1oRpZ6A"
 *        data-title="Message to Cooper"></div>
 */
(function () {
    'use strict';

    var POSTER = 'https://i.ytimg.com/vi/';

    function buildIframe(id, title) {
        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube.com/embed/' + id +
            '?autoplay=1&rel=0&playsinline=1';
        iframe.title = title;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; ' +
            'encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.allowFullscreen = true;
        return iframe;
    }

    function activate(wrapper, id, title) {
        wrapper.classList.remove('video-facade');
        wrapper.classList.add('video-playing');
        wrapper.textContent = '';
        wrapper.appendChild(buildIframe(id, title));
    }

    function mount(wrapper) {
        var id = wrapper.getAttribute('data-video-id');
        if (!id) return;
        var title = wrapper.getAttribute('data-title') || 'Video';

        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'video-facade-button';
        button.setAttribute('aria-label', 'Play ' + title);

        var img = document.createElement('img');
        // maxresdefault is 1280x720 and exists for anything uploaded at 720p or
        // above. When it doesn't, YouTube serves a 120x90 placeholder with a
        // 404, so fall back to hqdefault (480x360 — 4:3, but object-fit: cover
        // crops the letterbox bars back off).
        img.src = POSTER + id + '/maxresdefault.jpg';
        img.alt = '';
        img.loading = 'lazy';
        img.width = 1280;
        img.height = 720;
        img.addEventListener('error', function onError() {
            img.removeEventListener('error', onError);
            img.src = POSTER + id + '/hqdefault.jpg';
        });

        var badge = document.createElement('span');
        badge.className = 'video-facade-play';
        badge.setAttribute('aria-hidden', 'true');

        button.appendChild(img);
        button.appendChild(badge);
        button.addEventListener('click', function () {
            activate(wrapper, id, title);
        });

        wrapper.appendChild(button);
    }

    function init() {
        var wrappers = document.querySelectorAll('.video-facade');
        for (var i = 0; i < wrappers.length; i++) {
            mount(wrappers[i]);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
