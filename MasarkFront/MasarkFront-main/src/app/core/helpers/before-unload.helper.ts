/**
 * Installs a window beforeunload handler that prompts the user if unsaved changes exist.
 *
 * @param conditionFn Function that returns true if safe to leave (or false if unsaved changes exist).
 * @returns A cleanup function to remove the event listener.
 */
export function installBeforeUnload(conditionFn: () => boolean): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = (event: BeforeUnloadEvent) => {
    // If conditionFn returns false, unsaved changes exist and we should warn the user
    if (!conditionFn()) {
      event.preventDefault();
      event.returnValue = '';
      return '';
    }
    return undefined;
  };

  window.addEventListener('beforeunload', handler);

  return () => {
    window.removeEventListener('beforeunload', handler);
  };
}
