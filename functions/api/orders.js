export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

export async function onRequestGet(context) {
  const row = await context.env.DB.prepare(
    "SELECT COUNT(*) AS cnt FROM orders"
  ).first();

  return Response.json({
    ok: true,
    total_orders: row?.cnt ?? 0
  }, {
    headers: { "Access-Control-Allow-Origin": "*" }
  });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    const productType   = (body.product_type ?? "").toString();
    const customerName  = (body.customer_name ?? "").toString();
    const customerPhone = (body.customer_phone ?? "").toString();
    const customerEmail = (body.customer_email ?? "").toString();
    const customerMemo  = (body.customer_memo ?? "").toString();
    const orderSummary  = (body.order_summary ?? "").toString();
    const optionJson    = JSON.stringify(body.option_json ?? {});
    const imageFileName = (body.image_file_name ?? "").toString();
    const sourceUrl     = context.request.url;

    if (!productType || !orderSummary) {
      return Response.json(
        { ok: false, error: "MISSING_REQUIRED_FIELDS" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const stmt = context.env.DB.prepare(`
      INSERT INTO orders (
        product_type,
        customer_name,
        customer_phone,
        customer_email,
        customer_memo,
        order_summary,
        option_json,
        image_file_name,
        source_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      productType,
      customerName,
      customerPhone,
      customerEmail,
      customerMemo,
      orderSummary,
      optionJson,
      imageFileName,
      sourceUrl
    );

    const result = await stmt.run();
    const orderId = result?.meta?.last_row_id ?? null;

    return Response.json(
      { ok: true, order_id: orderId },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (e) {
    return Response.json(
      { ok: false, error: "SERVER_ERROR", detail: String(e?.message ?? e) },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
