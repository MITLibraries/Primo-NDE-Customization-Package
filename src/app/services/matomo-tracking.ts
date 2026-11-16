import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';

declare global {
  interface Window {
    _paq?: unknown[][];
  }
}

const TITLE_DELAY_MS = 300;

/**
 * Sends a Matomo page view for the current URL and for every completed
 * navigation of the shell router. The Matomo loader lives in assets/js/custom.js.
 */
export function trackPageViews(router: Router): Subscription {
  const paq = (window._paq = window._paq || []);
  let lastUrl: string | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const track = () => {
    const url = window.location.href;
    if (url === lastUrl) {
      return;
    }
    if (lastUrl !== null) {
      paq.push(['setReferrerUrl', lastUrl]);
    }
    lastUrl = url;
    paq.push(['setCustomUrl', url]);
    paq.push(['setDocumentTitle', document.title]);
    paq.push(['trackPageView']);
  };

  // Wait briefly so the app can update document.title after navigation ends.
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(track, TITLE_DELAY_MS);
  };

  // The module may load after the first navigation has already finished.
  schedule();

  return router.events.subscribe((event) => {
    if (event instanceof NavigationEnd) {
      schedule();
    }
  });
}
