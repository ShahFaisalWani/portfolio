import { person, projects, socials, type Project } from "./site";
import portrait from "@/assets/media/faisal.webp";

/*
  Page metadata for every indexable route. The build (scripts/prerender.mjs) writes it into each
  prerendered page's <head>; on the client, applyPageMeta keeps the tab title and share tags in
  step when a case study opens or closes without a page load.
*/

export const SITE_URL = "https://www.faisalwani.dev";
const SITE_NAME = "Faisal Wani";
const abs = (path: string) => (path.startsWith("http") ? path : SITE_URL + path);

export type PageMeta = {
  path: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  type: "website" | "article";
  jsonLd: Record<string, unknown>;
};

export const routes = ["/", ...projects.map((p) => `/projects/${p.id}`)];

const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const personNode = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: person.name,
  alternateName: person.short,
  url: `${SITE_URL}/`,
  image: abs(portrait),
  email: `mailto:${person.email}`,
  jobTitle: "Research Engineer",
  worksFor: { "@type": "Organization", name: "SCB DataX" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "Prince of Songkla University" },
  sameAs: socials.map((s) => s.href),
  knowsAbout: [
    "Speech recognition",
    "LLM evaluation",
    "AI observability",
    "Python",
    "TypeScript",
    "FastAPI",
    "Next.js",
    "React",
    "Node.js",
    "Azure",
    "Google Cloud",
    "Docker",
    "ROS2",
  ],
};

const websiteNode = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: `${SITE_URL}/`,
  name: SITE_NAME,
  inLanguage: "en",
  publisher: { "@id": PERSON_ID },
};

function homeMeta(): PageMeta {
  const title = "Shah Faisal Wani | AI & Full-Stack Engineer";
  const description =
    "Shah Faisal Wani is an AI and full-stack engineer building speech AI, LLM evaluation and production web platforms. Explore his work, projects and experience.";
  return {
    path: "/",
    title,
    description,
    image: abs("/og/home.jpg"),
    imageAlt: "Shah Faisal Wani, AI and full-stack engineer",
    type: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "ProfilePage",
          "@id": `${SITE_URL}/#profilepage`,
          url: `${SITE_URL}/`,
          name: title,
          description,
          inLanguage: "en",
          isPartOf: { "@id": WEBSITE_ID },
          mainEntity: { "@id": PERSON_ID },
        },
        personNode,
        websiteNode,
      ],
    },
  };
}

/* "Tour booking platform" -> "tour booking platform", but acronyms ("AI voice tutor", "B2B site") keep their case */
const lowerFirst = (s: string) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);

function projectMeta(p: Project): PageMeta {
  const url = `${SITE_URL}/projects/${p.id}`;
  const cover = p.cover.kind === "image" ? p.cover.src : p.cover.poster;
  return {
    path: `/projects/${p.id}`,
    title: `${p.title}: ${lowerFirst(p.kicker)} case study | ${person.name}`,
    description: p.summary,
    image: abs(`/og/${p.id}.jpg`),
    imageAlt: p.cover.alt,
    type: "article",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": `${url}#webpage`,
          url,
          name: p.title,
          description: p.summary,
          inLanguage: "en",
          isPartOf: { "@id": WEBSITE_ID },
          primaryImageOfPage: abs(cover),
          breadcrumb: { "@id": `${url}#breadcrumb` },
          mainEntity: { "@id": `${url}#work` },
        },
        {
          "@type": "CreativeWork",
          "@id": `${url}#work`,
          name: p.title,
          description: p.summary,
          genre: p.kicker,
          keywords: p.stack.join(", "),
          image: abs(cover),
          author: { "@id": PERSON_ID },
          ...(p.links[0] ? { sameAs: p.links[0].href } : {}),
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${url}#breadcrumb`,
          itemListElement: [
            { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: p.title, item: url },
          ],
        },
        personNode,
        websiteNode,
      ],
    },
  };
}

export function pageMeta(path: string): PageMeta {
  const id = path.match(/^\/projects\/([^/]+)\/?$/)?.[1];
  const project = projects.find((p) => p.id === id);
  return project ? projectMeta(project) : homeMeta();
}

/* [attribute, key, content] for every tag that changes between pages */
function tags(m: PageMeta): [string, string, string][] {
  const url = SITE_URL + m.path;
  return [
    ["name", "description", m.description],
    ["property", "og:type", m.type],
    ["property", "og:url", url],
    ["property", "og:title", m.title],
    ["property", "og:description", m.description],
    ["property", "og:image", m.image],
    ["property", "og:image:alt", m.imageAlt],
    ["name", "twitter:title", m.title],
    ["name", "twitter:description", m.description],
    ["name", "twitter:image", m.image],
    ["name", "twitter:image:alt", m.imageAlt],
  ];
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* The per-page <head> block, as HTML (build time). */
export function headTags(m: PageMeta): string {
  const json = JSON.stringify(m.jsonLd).replace(/</g, "\\u003c");
  return [
    `<title>${esc(m.title)}</title>`,
    `<link rel="canonical" href="${SITE_URL + m.path}" />`,
    ...tags(m).map(([attr, key, content]) => `<meta ${attr}="${key}" content="${esc(content)}" />`),
    `<script type="application/ld+json">${json}</script>`,
  ].join("\n    ");
}

/* Keeps the live document in step after client-side route changes. */
export function applyPageMeta(m: PageMeta) {
  document.title = m.title;
  document.querySelector('link[rel="canonical"]')?.setAttribute("href", SITE_URL + m.path);
  for (const [attr, key, content] of tags(m)) {
    let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.content = content;
  }
}
