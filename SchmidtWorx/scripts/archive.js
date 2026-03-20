document.addEventListener("DOMContentLoaded", function () {
    const main = document.querySelector("main");

    if (!main) {
        return;
    }

    const path = normalizePath(window.location.pathname);
    const pageTitle = document.querySelector("h1")?.textContent.trim() || document.title;
    const detailsList = Array.from(document.querySelectorAll("details"));
    const archiveCards = Array.from(document.querySelectorAll(".archive-card"));
    const hero = main.querySelector(".hero");

    enhanceDetails(detailsList);
    injectUtilityGrid({
        main,
        hero,
        path,
        pageTitle,
        detailCount: detailsList.length,
        archiveCount: archiveCards.length
    });
    injectRelatedNavigation(path);
    openHashTarget();
    bindDetailScrolling();
});

function normalizePath(path) {
    if (!path || path === "/") {
        return "/index.html";
    }

    return path.endsWith("/") ? path + "index.html" : path;
}

function slugify(value) {
    return value
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (typeof text === "string") {
        element.textContent = text;
    }

    return element;
}

function getTopLevelGroups() {
    return Array.from(document.querySelectorAll(".content-list > li"));
}

function getGroupTitle(group) {
    const heading = group.querySelector(":scope > strong, :scope > h3");
    return heading ? heading.textContent.trim() : "";
}

function enhanceDetails(detailsList) {
    const usedIds = new Set();

    detailsList.forEach(function (details) {
        const summary = details.querySelector(":scope > summary");

        if (!summary) {
            return;
        }

        const baseId = "entry-" + slugify(summary.textContent.trim());
        let uniqueId = baseId;
        let suffix = 2;

        while (usedIds.has(uniqueId)) {
            uniqueId = baseId + "-" + suffix;
            suffix += 1;
        }

        usedIds.add(uniqueId);
        summary.id = uniqueId;
        details.dataset.entryTitle = summary.textContent.trim().toLowerCase();

        const directChildren = Array.from(details.children).filter(function (child) {
            return child !== summary;
        });

        if (directChildren.length === 1 && directChildren[0].classList.contains("details-body")) {
            directChildren[0].classList.add("prose");
            return;
        }

        const body = createElement("div", "details-body prose");

        directChildren.forEach(function (child) {
            body.appendChild(child);
        });

        details.appendChild(body);
    });

    getTopLevelGroups().forEach(function (group) {
        const title = getGroupTitle(group);

        if (!title) {
            return;
        }

        group.id = group.id || "group-" + slugify(title);
    });
}

function injectUtilityGrid(context) {
    if (!context.hero) {
        return;
    }

    const utilityGrid = createElement("section", "utility-grid");
    utilityGrid.setAttribute("aria-label", "Archive tools");

    const breadcrumbsCard = buildBreadcrumbCard(context.path, context.pageTitle);

    if (breadcrumbsCard) {
        utilityGrid.appendChild(breadcrumbsCard);
    }

    utilityGrid.appendChild(buildPageGuideCard(context));

    const pageTools = buildPageToolsCard(context);

    if (pageTools) {
        utilityGrid.appendChild(pageTools);
    }

    utilityGrid.appendChild(buildSearchCard(context.path));

    context.hero.insertAdjacentElement("afterend", utilityGrid);
}

function buildBreadcrumbCard(path, pageTitle) {
    if (path === "/index.html") {
        return null;
    }

    const crumbs = [{ label: "Home", href: "/index.html" }];

    if (path.startsWith("/Reflections/")) {
        crumbs.push({ label: "Reflections", href: "/Reflections/index.html" });
    }

    if (path.startsWith("/LettersAndRecordings/")) {
        crumbs.push({ label: "Recordings and Artifacts", href: "/LettersAndRecordings/index.html" });
    }

    if (path !== "/Reflections/index.html" && path !== "/LettersAndRecordings/index.html") {
        crumbs.push({ label: pageTitle });
    }

    const card = createElement("section", "utility-card");
    const label = createElement("p", "utility-label", "Breadcrumbs");
    const nav = createElement("nav", "breadcrumbs");
    nav.setAttribute("aria-label", "Breadcrumb");
    const list = createElement("ol", "breadcrumb-list");

    crumbs.forEach(function (crumb, index) {
        const item = createElement("li", "breadcrumb-item");

        if (crumb.href && index < crumbs.length - 1) {
            const link = createElement("a", "breadcrumb-link", crumb.label);
            link.href = crumb.href;
            item.appendChild(link);
        } else {
            const current = createElement("span", "breadcrumb-current", crumb.label);
            item.appendChild(current);
        }

        list.appendChild(item);
    });

    nav.appendChild(list);
    card.append(label, nav);
    return card;
}

function buildPageGuideCard(context) {
    const card = createElement("section", "utility-card");
    const label = createElement("p", "utility-label", "Page Guide");
    const title = createElement("h2", "utility-title", guideTitleForPath(context.path));
    const copy = createElement("p", "utility-copy", guideCopyForPath(context.path));
    const meta = createElement("div", "meta-list");

    meta.appendChild(makeMetaPill(labelForType(context.path)));

    if (context.detailCount) {
        meta.appendChild(makeMetaPill(context.detailCount + " entries"));
    }

    if (context.archiveCount) {
        meta.appendChild(makeMetaPill(context.archiveCount + " pages"));
    }

    if (context.path === "/index.html") {
        meta.appendChild(makeMetaPill("No implied chronology"));
    }

    if (context.path.startsWith("/Reflections/") && context.path !== "/Reflections/index.html") {
        meta.appendChild(makeMetaPill("Ordered by relationship"));
    }

    if (context.path.startsWith("/LettersAndRecordings/")) {
        meta.appendChild(makeMetaPill("Dates only where known"));
    }

    card.append(label, title, copy, meta);
    return card;
}

function buildPageToolsCard(context) {
    if (!context.detailCount && !context.archiveCount) {
        return null;
    }

    const card = createElement("section", "utility-card");
    const label = createElement("p", "utility-label", context.detailCount ? "Page Tools" : "Browse Tools");
    const title = createElement("h2", "utility-title", context.detailCount ? "Navigate this page" : "Browse this section");
    card.append(label, title);

    if (context.detailCount) {
        const input = createElement("input", "filter-input");
        input.type = "search";
        input.placeholder = "Filter entries on this page";
        input.setAttribute("aria-label", "Filter entries on this page");

        const status = createElement("p", "filter-status", context.detailCount + " entries available");
        const controls = createElement("div", "tool-row");
        const expand = createElement("button", "tool-button", "Expand all");
        const collapse = createElement("button", "tool-button", "Collapse all");
        const clear = createElement("button", "tool-button", "Clear filter");

        expand.type = "button";
        collapse.type = "button";
        clear.type = "button";

        expand.addEventListener("click", function () {
            document.querySelectorAll("details").forEach(function (details) {
                if (!details.closest(".hidden-by-filter")) {
                    details.open = true;
                }
            });
        });

        collapse.addEventListener("click", function () {
            document.querySelectorAll("details").forEach(function (details) {
                details.open = false;
            });
        });

        clear.addEventListener("click", function () {
            input.value = "";
            filterDetails("");
            status.textContent = context.detailCount + " entries available";
        });

        input.addEventListener("input", function () {
            const visibleCount = filterDetails(input.value.trim().toLowerCase());
            status.textContent = visibleCount + (visibleCount === 1 ? " matching entry" : " matching entries");
        });

        controls.append(expand, collapse, clear);
        card.append(input, controls, status);

        const groups = getTopLevelGroups()
            .map(function (group) {
                return { id: group.id, title: getGroupTitle(group) };
            })
            .filter(function (group) {
                return group.title;
            });

        if (groups.length > 1) {
            const jumpLabel = createElement("p", "jump-label", "Jump to a section");
            const jumpList = createElement("ul", "jump-list");

            groups.forEach(function (group) {
                const item = createElement("li", "jump-item");
                const link = createElement("a", "jump-link", group.title);
                link.href = "#" + group.id;
                item.appendChild(link);
                jumpList.appendChild(item);
            });

            card.append(jumpLabel, jumpList);
        }

        return card;
    }

    const input = createElement("input", "filter-input");
    input.type = "search";
    input.placeholder = "Filter pages in this section";
    input.setAttribute("aria-label", "Filter pages in this section");

    const status = createElement("p", "filter-status", context.archiveCount + " pages available");

    input.addEventListener("input", function () {
        const query = input.value.trim().toLowerCase();
        let visible = 0;

        document.querySelectorAll(".archive-card").forEach(function (cardElement) {
            const text = cardElement.textContent.toLowerCase();
            const match = !query || text.includes(query);
            cardElement.classList.toggle("hidden-by-filter", !match);

            if (match) {
                visible += 1;
            }
        });

        status.textContent = visible + (visible === 1 ? " matching page" : " matching pages");
    });

    card.append(input, status);
    return card;
}

function filterDetails(query) {
    let visibleCount = 0;

    document.querySelectorAll("details").forEach(function (details) {
        const title = details.dataset.entryTitle || "";
        const item = details.closest(".details-card, li, section");
        const match = !query || title.includes(query);

        if (item) {
            item.classList.toggle("hidden-by-filter", !match);
        }

        if (match) {
            visibleCount += 1;
        }
    });

    getTopLevelGroups().forEach(function (group) {
        const visibleChildren = group.querySelectorAll("details").length
            ? Array.from(group.querySelectorAll("details")).some(function (details) {
                const item = details.closest(".details-card, li, section");
                return item && !item.classList.contains("hidden-by-filter");
            })
            : !query;

        group.classList.toggle("hidden-by-filter", !visibleChildren);
    });

    return visibleCount;
}

function buildSearchCard(currentPath) {
    const card = createElement("section", "utility-card site-search");
    const label = createElement("p", "utility-label", "Find in Archive");
    const title = createElement("h2", "utility-title", "Search across pages");
    const input = createElement("input", "filter-input");
    input.type = "search";
    input.placeholder = "Search page titles and entry names";
    input.setAttribute("aria-label", "Search across pages");

    const status = createElement("p", "filter-status", "Start typing to search the archive.");
    const results = createElement("ul", "search-results");
    let searchIndex = null;
    let loadingPromise = null;

    async function ensureIndex() {
        if (searchIndex) {
            return searchIndex;
        }

        if (!loadingPromise) {
            status.textContent = "Indexing archive pages...";
            loadingPromise = buildSearchIndex().then(function (index) {
                searchIndex = index;
                status.textContent = "Start typing to search the archive.";
                return searchIndex;
            });
        }

        await loadingPromise;
        return searchIndex;
    }

    input.addEventListener("focus", function () {
        void ensureIndex();
    });

    input.addEventListener("input", async function () {
        const query = input.value.trim().toLowerCase();
        results.innerHTML = "";

        if (!query) {
            status.textContent = "Start typing to search the archive.";
            return;
        }

        const index = await ensureIndex();
        const matches = index
            .filter(function (entry) {
                return entry.searchText.includes(query);
            })
            .filter(function (entry) {
                return !(entry.path === currentPath && entry.url === currentPath);
            })
            .slice(0, 12);

        if (!matches.length) {
            status.textContent = "No matches found.";
            return;
        }

        status.textContent = matches.length + (matches.length === 1 ? " result" : " results");

        matches.forEach(function (entry) {
            const item = createElement("li", "search-result");
            const link = createElement("a", "result-link");
            const line = createElement("span", "result-title", entry.title);
            const meta = createElement("span", "result-meta", entry.context + (entry.meta ? " / " + entry.meta : ""));
            link.href = entry.url;
            link.append(line, meta);
            item.appendChild(link);
            results.appendChild(item);
        });
    });

    card.append(label, title, input, status, results);
    return card;
}

async function buildSearchIndex() {
    const pages = [
        "/index.html",
        "/Reflections/index.html",
        "/Reflections/michael-schmidt.html",
        "/Reflections/gregory-schmidt.html",
        "/Reflections/kenneth-oswald-schmidt.html",
        "/LettersAndRecordings/index.html",
        "/LettersAndRecordings/michael-schmidt.html"
    ];

    const parser = new DOMParser();
    const results = [];

    for (const page of pages) {
        try {
            const response = await fetch(page);
            const html = await response.text();
            const doc = parser.parseFromString(html, "text/html");
            const h1 = doc.querySelector("h1")?.textContent.trim() || doc.title;
            const title = doc.title.trim();

            results.push(makeSearchEntry({
                title: h1,
                context: title,
                meta: "Page",
                path: page,
                url: page
            }));

            doc.querySelectorAll(".archive-card a[href]").forEach(function (link) {
                const href = new URL(link.getAttribute("href"), "https://example.com" + page).pathname;
                results.push(makeSearchEntry({
                    title: link.textContent.trim(),
                    context: h1,
                    meta: "Archive page",
                    path: page,
                    url: href
                }));
            });

            doc.querySelectorAll("details summary").forEach(function (summary) {
                const itemTitle = summary.textContent.trim();
                const parentGroup = summary.closest(".content-list > li");
                const groupTitle = parentGroup ? getTitleFromDocumentGroup(parentGroup) : "";

                results.push(makeSearchEntry({
                    title: itemTitle,
                    context: h1,
                    meta: groupTitle,
                    path: page,
                    url: page + "#" + "entry-" + slugify(itemTitle)
                }));
            });
        } catch (error) {
            console.error("Unable to index page", page, error);
        }
    }

    return dedupeSearchEntries(results);
}

function getTitleFromDocumentGroup(group) {
    const heading = group.querySelector(":scope > strong, :scope > h3");
    return heading ? heading.textContent.trim() : "";
}

function makeSearchEntry(entry) {
    return {
        ...entry,
        searchText: [entry.title, entry.context, entry.meta].join(" ").toLowerCase()
    };
}

function dedupeSearchEntries(entries) {
    const seen = new Set();

    return entries.filter(function (entry) {
        const key = entry.url + "::" + entry.title;

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

function injectRelatedNavigation(path) {
    const footer = document.querySelector("main footer");

    if (!footer) {
        return;
    }

    const related = relatedLinksForPath(path);

    if (!related.length) {
        return;
    }

    const section = createElement("section", "related-nav utility-card");
    const label = createElement("p", "utility-label", "Continue Exploring");
    const title = createElement("h2", "utility-title", "Nearby in the archive");
    const grid = createElement("div", "related-grid");

    related.forEach(function (entry) {
        const card = createElement("a", "related-card");
        const kind = createElement("span", "related-kind", entry.kind);
        const heading = createElement("span", "related-title", entry.title);
        const copy = createElement("span", "related-copy", entry.copy);
        card.href = entry.href;
        card.append(kind, heading, copy);
        grid.appendChild(card);
    });

    section.append(label, title, grid);
    footer.insertAdjacentElement("beforebegin", section);
}

function relatedLinksForPath(path) {
    const map = {
        "/index.html": [
            {
                href: "/Reflections/index.html",
                kind: "Collection",
                title: "Reflections and Legacy",
                copy: "Written reflections preserved across generations."
            },
            {
                href: "/LettersAndRecordings/index.html",
                kind: "Collection",
                title: "Recordings and Artifacts",
                copy: "Voice, video, and other preserved moments."
            }
        ],
        "/Reflections/index.html": [
            {
                href: "/Reflections/michael-schmidt.html",
                kind: "Featured page",
                title: "Michael Schmidt",
                copy: "Reflections written across different stages of life."
            },
            {
                href: "/Reflections/kenneth-oswald-schmidt.html",
                kind: "Preserved document",
                title: "Kenneth Oswald Schmidt",
                copy: "A primary family document connected to the 1995 reunion."
            }
        ],
        "/LettersAndRecordings/index.html": [
            {
                href: "/LettersAndRecordings/michael-schmidt.html",
                kind: "Featured page",
                title: "Michael Schmidt",
                copy: "Messages, readings, and preserved video artifacts."
            },
            {
                href: "/Reflections/index.html",
                kind: "Related collection",
                title: "Reflections and Legacy",
                copy: "Move from recorded voice into written reflection."
            }
        ],
        "/Reflections/michael-schmidt.html": [
            {
                href: "/LettersAndRecordings/michael-schmidt.html",
                kind: "Related page",
                title: "Michael Schmidt Recordings",
                copy: "The same archive voice in audio and video form."
            },
            {
                href: "/Reflections/kenneth-oswald-schmidt.html",
                kind: "Other reflection",
                title: "Kenneth Oswald Schmidt",
                copy: "A preserved family document from an earlier generation."
            }
        ],
        "/Reflections/gregory-schmidt.html": [
            {
                href: "/Reflections/index.html",
                kind: "Back to collection",
                title: "Collected Voices",
                copy: "Return to the full reflections archive."
            },
            {
                href: "/Reflections/michael-schmidt.html",
                kind: "Related page",
                title: "Michael Schmidt",
                copy: "Explore another page in the same collection."
            }
        ],
        "/Reflections/kenneth-oswald-schmidt.html": [
            {
                href: "/Reflections/index.html",
                kind: "Back to collection",
                title: "Collected Voices",
                copy: "Return to the reflections archive."
            },
            {
                href: "/assets/Schmidt-Reunion-1995.pdf",
                kind: "Source document",
                title: "Original Reunion PDF",
                copy: "Open the preserved source document."
            }
        ],
        "/LettersAndRecordings/michael-schmidt.html": [
            {
                href: "/Reflections/michael-schmidt.html",
                kind: "Related page",
                title: "Michael Schmidt Reflections",
                copy: "Read the written reflections alongside the recordings."
            },
            {
                href: "/LettersAndRecordings/index.html",
                kind: "Back to collection",
                title: "Recordings and Artifacts",
                copy: "Return to the full recordings collection."
            }
        ]
    };

    return map[path] || [];
}

function openHashTarget() {
    const hash = decodeURIComponent(window.location.hash.replace("#", ""));

    if (!hash) {
        return;
    }

    const target = document.getElementById(hash);

    if (!target) {
        return;
    }

    if (target.tagName.toLowerCase() === "summary") {
        const details = target.closest("details");

        if (details) {
            details.open = true;
        }
    }
}

function bindDetailScrolling() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    document.querySelectorAll("details").forEach(function (details) {
        details.addEventListener("toggle", function () {
            if (!details.open) {
                return;
            }

            const summary = details.querySelector(":scope > summary");

            if (!summary) {
                return;
            }

            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    const y = summary.getBoundingClientRect().top + window.scrollY;

                    window.scrollTo({
                        top: y - 72,
                        behavior: "smooth"
                    });
                });
            });
        });
    });
}

function guideTitleForPath(path) {
    if (path === "/index.html") {
        return "Start with a collection";
    }

    if (path === "/Reflections/index.html") {
        return "Browse preserved writing";
    }

    if (path === "/LettersAndRecordings/index.html") {
        return "Browse recorded material";
    }

    if (path.startsWith("/Reflections/")) {
        return "Use the page tools to navigate";
    }

    if (path.startsWith("/LettersAndRecordings/")) {
        return "Explore by format and entry";
    }

    return "Explore the archive";
}

function guideCopyForPath(path) {
    if (path === "/index.html") {
        return "This site is organized as an archive rather than a timeline. Browse by collection, then by person or entry.";
    }

    if (path === "/Reflections/index.html") {
        return "Reflections are grouped by voice and relationship, not by upload date or a strict chronology.";
    }

    if (path === "/LettersAndRecordings/index.html") {
        return "Recordings use dates only where they are known with confidence.";
    }

    if (path.startsWith("/Reflections/")) {
        return "Long pages can be filtered, expanded, and jumped by section without changing the writing itself.";
    }

    if (path.startsWith("/LettersAndRecordings/")) {
        return "Media entries are arranged as an archive of messages, readings, and preserved moments.";
    }

    return "Browse the archive by collection or search directly for a page or entry.";
}

function labelForType(path) {
    if (path === "/index.html") {
        return "Archive home";
    }

    if (path === "/Reflections/index.html" || path === "/LettersAndRecordings/index.html") {
        return "Collection page";
    }

    return "Archive page";
}

function makeMetaPill(text) {
    return createElement("span", "meta-pill", text);
}
