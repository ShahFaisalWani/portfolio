const id = import.meta.env.VITE_GA_TRACKING_ID as string | undefined;
// Only report from the production build, so local development never pollutes the numbers.
const enabled = import.meta.env.PROD && Boolean(id);

/*
  GA loads after the page is idle, so gtag never competes with the first paint or hydration.
  Calls made before then wait in a queue and replay once it is ready.
*/
type GA = typeof import("react-ga4").default;
let ga: GA | null = null;
const queue: ((ga: GA) => void)[] = [];

function call(fn: (ga: GA) => void) {
  if (!enabled) return;
  if (ga) fn(ga);
  else queue.push(fn);
}

export function initAnalytics() {
  if (!enabled) return;
  const start = () =>
    import("react-ga4").then(({ default: ReactGA }) => {
      ReactGA.initialize(id!);
      ga = ReactGA;
      queue.splice(0).forEach((fn) => fn(ReactGA));
    });
  const idle = () => ("requestIdleCallback" in window ? requestIdleCallback(start, { timeout: 4000 }) : setTimeout(start, 1500));
  if (document.readyState === "complete") idle();
  else addEventListener("load", idle, { once: true });
}

export function trackPageview(page: string) {
  call((ga) => ga.send({ hitType: "pageview", page }));
}

export function trackEvent(category: string, action: string, label?: string) {
  call((ga) => ga.event({ category, action, label }));
}

export function pingTraffic() {
  if (!import.meta.env.PROD) return;
  fetch("/api-proxy/").catch(() => {});
}
