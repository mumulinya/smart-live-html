export const AUTH_CHANGED_EVENT = 'app-auth-changed';

export function emitAuthChanged(action) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail: { action } }));
}
