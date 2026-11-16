var _paq = window._paq = window._paq || [];
(function() {
  var u = "https://matomo.libraries.mit.edu/";
  _paq.push(['setTrackerUrl', u + 'matomo.php']);
  _paq.push(['setSiteId', '13']);
  _paq.push(['enableLinkTracking']);
  // Page views are sent from the Angular router: see src/app/services/matomo-tracking.service.ts

  var d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0];
  g.async = true; g.src = u + 'matomo.js'; s.parentNode.insertBefore(g, s);
})();

