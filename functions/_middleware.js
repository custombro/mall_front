function unauthorized() {
  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="CustomBro Admin"'
    }
  });
}

function parseBasicAuth(header) {
  try {
    if (!header || !header.startsWith("Basic ")) return null;
    const raw = atob(header.slice(6));
    const idx = raw.indexOf(":");
    if (idx < 0) return null;
    return {
      user: raw.slice(0, idx),
      pass: raw.slice(idx + 1)
    };
  } catch {
    return null;
  }
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  const needsAuth =
    path === "/admin-orders" ||
    path === "/admin-orders.html" ||
    path.startsWith("/api/admin-orders");

  if (!needsAuth) {
    return context.next();
  }

  const creds = parseBasicAuth(context.request.headers.get("Authorization"));
  if (!creds) {
    return unauthorized();
  }

  const expectedUser = (context.env.ADMIN_USER ?? "").toString();
  const expectedPass = (context.env.ADMIN_PASS ?? "").toString();

  if (creds.user !== expectedUser || creds.pass !== expectedPass) {
    return unauthorized();
  }

  return context.next();
}
