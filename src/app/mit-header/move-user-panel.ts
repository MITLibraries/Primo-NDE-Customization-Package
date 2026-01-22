/**
 * Attempts to move the Primo shell's <nde-user-panel> element
 * into the custom MIT header (#mit-header). 
 * 
 * The function is called in bootstrap.ts
 *
 * This function is safe to call repeatedly:
 * - If the elements are not present yet, it does nothing.
 * - If the move succeeds, it returns true so we can stop observing.
 */
export function moveUserPanelOnce(): boolean {
  // Locate the user panel rendered by the Primo NDE shell
  const panel = document.querySelector('nde-user-panel');

  // Locate the target container rendered by our remote (<mit-header>)
  const target = document.querySelector('#mit-header');

  // Only proceed when BOTH elements exist in the DOM
  if (panel && target) {
    /**
     * appendChild() MOVES the existing DOM node.
     * It does NOT clone it or recreate it.
     *
     * Angular still owns the component instance, change detection,
     * event handlers, and injected services.
     */
    target.appendChild(panel);

    // Signal that the move was successful
    return true;
  }

  // Either Primo hasn't rendered the panel yet
  // or our header isn't available yet
  return false;
}

// Tracks whether the user panel has already been moved
let done = false;

/**
 * Observe DOM mutations because:
 * - Primo renders the header asynchronously
 * - <nde-user-panel> may appear after initial page load
 * - We cannot rely on Angular lifecycle hooks
 */
const observer = new MutationObserver(() => {
  // Only attempt the move until it succeeds
  if (!done) {
    done = moveUserPanelOnce();

    // Once the panel has been successfully moved,
    // we no longer need to watch the DOM
    if (done) {
      observer.disconnect();
    }
  }
});

/**
 * Start observing the entire document body.
 *
 * childList: true → watch for added or removed nodes
 * subtree: true   → include all descendants
 *
 * This is non-blocking and runs asynchronously.
 */
observer.observe(document.body, {
  childList: true,
  subtree: true
});
