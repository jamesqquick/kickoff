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
