import { Location } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { SHELL_ROUTER } from '../injection-tokens';

declare global {
  interface Window {
    _paq?: unknown[][];
  }
}

const TITLE_DELAY_MS = 300;

/**
 * Sends a Matomo page view for the current URL and for every completed
 * navigation of the shell router. The Matomo loader lives in assets/js/custom.js.
 *
 * Provided in the module (not root) so it resolves the SHELL_ROUTER token.
 */
@Injectable()
export class MatomoTrackingService {
  private router = inject(SHELL_ROUTER);
  private location = inject(Location);
  private subscription?: Subscription;
  private lastUrl: string | null = null;
  private timer?: ReturnType<typeof setTimeout>;

  start(): void {
    if (this.subscription) {
      return;
    }

    // The module may load after the first navigation has already finished.
    this.schedule(this.router.url);

    this.subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.schedule(event.urlAfterRedirects);
      }
    });
  }

  // Wait briefly so the app can update document.title after navigation ends.
  private schedule(routerUrl: string): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.track(routerUrl), TITLE_DELAY_MS);
  }

  private track(routerUrl: string): void {
    const paq = (window._paq = window._paq || []);
    // Router URLs omit the origin and base href, which Matomo needs for a full URL.
    const url = window.location.origin + this.location.prepareExternalUrl(routerUrl);
    if (url === this.lastUrl) {
      return;
    }
    if (this.lastUrl !== null) {
      paq.push(['setReferrerUrl', this.lastUrl]);
    }
    this.lastUrl = url;
    paq.push(['setCustomUrl', url]);
    paq.push(['setDocumentTitle', document.title]);
    paq.push(['trackPageView']);
  }
}
