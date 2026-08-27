/**
 * Shared navigation guard store.
 *
 * Guide pages register their "unsaved" guard here. The SiteHeader (or any
 * component that calls router.push) checks this store before navigating.
 * If a guard is active, navigation is deferred until the user decides
 * whether to save, leave without saving, or cancel.
 */

type GuardState = {
  shouldBlock: boolean;
  onRequestNavigation: (href: string) => void;
};

let activeGuard: GuardState | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** Called by guide pages to register / unregister their guard */
export function registerGuard(guard: GuardState | null) {
  activeGuard = guard;
  emit();
}

/** Called by the SiteHeader (or any router.push caller) before navigating */
export function isNavigationBlocked(): boolean {
  return activeGuard?.shouldBlock === true;
}

/** Request navigation through the guard. If blocked, the guard's modal opens. */
export function requestNavigation(href: string): boolean {
  if (activeGuard?.shouldBlock) {
    activeGuard.onRequestNavigation(href);
    return true; // navigation was intercepted
  }
  return false; // safe to proceed with router.push
}

/** Subscribe to guard state changes */
export function subscribeGuard(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
