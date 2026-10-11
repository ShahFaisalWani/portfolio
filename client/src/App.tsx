import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme";
import { initAnalytics, trackPageview } from "@/lib/analytics";
import Home from "@/pages/Home";

const Admin = lazy(() => import("@/pages/Admin"));

initAnalytics();

export default function App() {
  const location = useLocation();

  useEffect(() => {
    trackPageview(location.pathname + location.search);
  }, [location]);

  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/admin"
          element={
            <Suspense fallback={null}>
              <Admin />
            </Suspense>
          }
        />
        <Route path="*" element={<Home />} />
      </Routes>
    </ThemeProvider>
  );
}
