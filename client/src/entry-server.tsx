import { StrictMode } from "react";
import { prerender } from "react-dom/static";
import { StaticRouter } from "react-router-dom";
import App from "./App";

/* Build-time render of one route to HTML (scripts/prerender.mjs), hydrated by main.tsx. */
export async function render(url: string) {
  const { prelude } = await prerender(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>,
  );
  return new Response(prelude).text();
}

export { routes, pageMeta, headTags } from "./content/seo";
export { person, socials, experiences, projects } from "./content/site";
