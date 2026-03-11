export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const limitRaw = Number(url.searchParams.get("limit") || "50");
    const limit = Math.min(Math.max(limitRaw, 1), 200);

    const stmt = context.env.DB.prepare(`
      SELECT
        id,
        created_at,
        product_type,
        customer_name,
        customer_phone,
        customer_email,
        customer_memo,
        image_file_name
      FROM orders
      ORDER BY id DESC
      LIMIT ?
    `).bind(limit);

    const rows = await stmt.all();

    return Response.json(
      {
        ok: true,
        count: rows?.results?.length ?? 0,
        orders: rows?.results ?? []
      },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (e) {
    return Response.json(
      { ok: false, error: "SERVER_ERROR", detail: String(e?.message ?? e) },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
