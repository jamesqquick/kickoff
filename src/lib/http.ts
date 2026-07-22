// Redirect (302) back to a form route with an `?error=` message. Optional
// `extra` params are merged first (e.g. `{ tab: "signup" }`) so the form can
// reopen on the correct tab. Used by the auth API routes — see ARCHITECTURE.md.
export function redirectWithError(
  path: string,
  message: string,
  extra?: Record<string, string>,
) {
  const params = new URLSearchParams({ ...extra, error: message });
  return new Response(null, {
    status: 302,
    headers: { Location: `${path}?${params}` },
  });
}

// Validate a post-auth redirect destination. Returns the path if it is a
// safe same-origin path (starts with "/"), or null to fall back to /dashboard.
// Prevents open-redirect attacks by rejecting anything with a host.
export function sameOriginRedirect(value: string): string | null {
  if (!value) return null;
  try {
    // Reject anything that looks like an absolute URL with a host.
    const url = new URL(value, "http://localhost");
    if (url.hostname !== "localhost") return null;
    // Must start with "/" (path only, no protocol/host).
    return value.startsWith("/") ? value : null;
  } catch {
    return null;
  }
}
