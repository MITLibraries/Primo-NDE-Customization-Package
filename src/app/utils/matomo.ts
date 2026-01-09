/* 
* This function injects the Matomo Tag Manager <script> into the current document. 
* This function is called by src/bootstrap.ts.  
*/

export function injectMatomo() {
    try {
        const w = window as any;
        if (w._mtm && w._mtm.__matomo_injected) return;
        w._mtm = w._mtm || [];
        w._mtm.push({ 'mtm.startTime': (new Date().getTime()), 'event': 'mtm.Start' });
        (function () {
            const d = document;
            const g = d.createElement('script');
            const s = d.getElementsByTagName('script')[0];
            g.async = true;
            g.src = 'https://matomo.libraries.mit.edu/js/container_SF5ZTPZP.js';
            g.onerror = (ev) => {
                console.error('Matomo script failed to load', g.src, ev);
            };
            if (s && s.parentNode) {
                s.parentNode.insertBefore(g, s);
            } else {
                d.head.appendChild(g);
            }
        })();
        w._mtm.__matomo_injected = true;
    } catch (e) {
        console.error('error injecting matomo', e)
    }
}
