import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme";
import { trackPageview } from "@/lib/analytics";
import { applyPageMeta, pageMeta } from "@/content/seo";
import { hydrated } from "@/lib/prerender";
import Home from "@/pages/Home";

const Admin = lazy(() => import("@/pages/Admin"));

export default function App() {
  const location = useLocation();

  useEffect(hydrated, []);

  useEffect(() => {
    trackPageview(location.pathname + location.search);
  }, [location]);

  useEffect(() => {
    if (location.pathname !== "/admin") applyPageMeta(pageMeta(location.pathname));
  }, [location.pathname]);

  return (
    <ThemeProvider>
      <Routes>
        {/* case studies open as a layer over Home, so both paths keep the same Home mounted */}
        <Route path="/" element={<Home />}>
          <Route path="projects/:id" element={null} />
        </Route>
        <Route
          path="/admin"
          element={
            <Suspense fallback={null}>
              <Admin />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}
