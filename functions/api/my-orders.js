export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const searchType = (body.search_type || "").toString();

    let stmt;
    if (searchType === "order_id") {
      const orderId = Number(body.order_id);
      if (!orderId || Number.isNaN(orderId)) {
        return Response.json({ ok: false, error: "INVALID_ORDER_ID" }, { status: 400, headers: cors() });
      }
      stmt = context.env.DB.prepare(`
        SELECT id, created_at, product_type, customer_name, customer_phone, customer_email,
               customer_memo, order_summary, option_json, image_file_name
        FROM orders
        WHERE id = ?
        ORDER BY id DESC
        LIMIT 20
      `).bind(orderId);
    } else if (searchType === "customer") {
      const name = (body.customer_name || "").toString().trim();
      const phone = (body.customer_phone || "").toString().trim();
      if (!name || !phone) {
        return Response.json({ ok: false, error: "MISSING_NAME_PHONE" }, { status: 400, headers: cors() });
      }
      stmt = context.env.DB.prepare(`
        SELECT id, created_at, product_type, customer_name, customer_phone, customer_email,
               customer_memo, order_summary, option_json, image_file_name
        FROM orders
        WHERE customer_name = ? AND customer_phone = ?
        ORDER BY id DESC
        LIMIT 20
      `).bind(name, phone);
    } else {
      return Response.json({ ok: false, error: "INVALID_SEARCH_TYPE" }, { status: 400, headers: cors() });
    }

    const rows = await stmt.all();
    const orders = (rows?.results || []).map(row => {
      let optionJson = {};
      try {
        optionJson = JSON.parse(row.option_json || "{}") || {};
      } catch (err) {
        optionJson = {};
      }
      return {
        id: row.id,
        created_at: row.created_at,
        product_type: row.product_type,
        product_label: optionJson.product || row.product_type,
        customer_name: row.customer_name,
        customer_phone: row.customer_phone,
        customer_email: row.customer_email,
        customer_memo: row.customer_memo,
        image_file_name: row.image_file_name,
        order_summary: row.order_summary,
        option_json: optionJson,
        option_meta: optionJson.meta || null
      };
    });

    return Response.json({ ok: true, count: orders.length, orders }, { headers: cors() });
  } catch (e) {
    return Response.json({ ok: false, error: "SERVER_ERROR", detail: String(e?.message || e) }, { status: 500, headers: cors() });
  }
}

function cors() {
  return { "Access-Control-Allow-Origin": "*" };
}
