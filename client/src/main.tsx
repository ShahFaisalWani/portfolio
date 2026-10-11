import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { initAnalytics } from "./lib/analytics";
import "./styles/index.css";

const root = document.getElementById("root")!;
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// Indexable routes ship prerendered HTML (scripts/prerender.mjs): hydrate it. Others start empty.
if (root.firstElementChild) hydrateRoot(root, app);
else createRoot(root).render(app);

initAnalytics();
