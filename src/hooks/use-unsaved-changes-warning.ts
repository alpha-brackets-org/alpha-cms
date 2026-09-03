import { useEffect } from 'react';

/**
 * Warns before a tab close/refresh when there are unsaved form changes.
 * Does not intercept in-app route navigation (Next.js App Router has no
 * built-in navigation-block hook) — this covers the tab-close/refresh case.
 */
export function useUnsavedChangesWarning(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);
}
