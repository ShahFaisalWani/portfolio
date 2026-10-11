import ReactGA from "react-ga4";

const id = import.meta.env.VITE_GA_TRACKING_ID as string | undefined;
// Only report from the production build, so local development never pollutes the numbers.
const enabled = import.meta.env.PROD && Boolean(id);

export function initAnalytics() {
  if (enabled) ReactGA.initialize(id!);
}

export function trackPageview(page: string) {
  if (enabled) ReactGA.send({ hitType: "pageview", page });
}

export function trackEvent(category: string, action: string, label?: string) {
  if (enabled) ReactGA.event({ category, action, label });
}

export function pingTraffic() {
  if (!import.meta.env.PROD) return;
  fetch("/api-proxy/").catch(() => {});
}
