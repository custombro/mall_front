const searchForm = document.getElementById("drawerSearchForm");
const orderIdInput = document.getElementById("searchOrderId");
const nameInput = document.getElementById("searchName");
const phoneInput = document.getElementById("searchPhone");
const resetBtn = document.getElementById("resetSearch");
const drawerStatus = document.getElementById("drawerStatus");
const drawerResults = document.getElementById("drawerResults");
let currentOrders = [];

function esc(v){
  return (v ?? "").toString()
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"','&quot;');
}

function renderOrders(){
  if(!currentOrders.length){
    drawerResults.innerHTML = '<div class="drawer-empty">조회된 주문이 없습니다. 주문번호 또는 이름+연락처를 다시 확인해주세요.</div>';
    return;
  }
  drawerResults.innerHTML = currentOrders.map((order, idx) => {
    const tags = [];
    if(order.option_meta?.order_label){ tags.push(`주문명: ${esc(order.option_meta.order_label)}`); }
    tags.push(`상품: ${esc(order.product_label || order.product_type)}`);
    tags.push(`파일: ${esc(order.image_file_name || "파일 없음")}`);
    const memo = order.customer_memo || "(요청사항 없음)";
    return `
      <article class="drawer-card" data-order-id="${order.id}">
        <h3>#${esc(order.id)} · ${esc(order.product_label || order.product_type)}</h3>
        <div class="drawer-meta">
          <span>${esc(order.created_at)}</span>
          <span>${esc(order.customer_name || "-" )}</span>
          <span>${esc(order.customer_phone || "-" )}</span>
        </div>
        <div class="drawer-meta">
          ${tags.map(tag => `<span>${tag}</span>`).join("")}
        </div>
        <div class="drawer-note">${esc(memo)}</div>
        <div class="drawer-actions">
          <button class="btn primary" data-mode="same" data-order-index="${idx}">같은 사양 재주문</button>
          <button class="btn ghost" data-mode="edit" data-order-index="${idx}">수정 후 재주문</button>
        </div>
      </article>
    `;
  }).join("");

  drawerResults.querySelectorAll("button[data-order-index]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-order-index"));
      const mode = btn.getAttribute("data-mode") === "edit" ? "edit" : "same";
      const order = currentOrders[idx];
      if(!order){ return; }
      startReorder(order, mode);
    });
  });
}

async function searchOrders(payload){
  drawerStatus.textContent = "조회 중...";
  drawerResults.innerHTML = "";
  try{
    const res = await fetch("/api/my-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if(!res.ok || !data.ok){
      throw new Error(data?.error || "LOAD_FAILED");
    }
    currentOrders = (data.orders || []).map(o => ({
      ...o,
      option_meta: o.option_meta || o.option_json?.meta || null,
      product_label: o.product_label || o.option_json?.product || o.product_type
    }));
    drawerStatus.textContent = currentOrders.length ? `총 ${currentOrders.length}건이 보관함에서 열렸습니다.` : "조건에 맞는 주문이 없습니다.";
    renderOrders();
  }catch(err){
    drawerStatus.textContent = `조회 실패: ${err.message || err}`;
    drawerResults.innerHTML = '<div class="drawer-empty">조회 중 오류가 발생했습니다.</div>';
  }
}

function startReorder(order, mode){
  if(!window?.localStorage){
    alert("이 브라우저에서는 재주문 프리필을 저장할 수 없습니다.");
    return;
  }
  const payload = {
    saved_at: Date.now(),
    mode,
    order_id: order.id,
    product_type: order.product_type,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    customer_email: order.customer_email,
    customer_memo: order.customer_memo,
    order_label: order.option_meta?.order_label || "",
    option_json: order.option_json,
    image_file_name: order.image_file_name
  };
  localStorage.setItem("custombro_reorder_prefill", JSON.stringify(payload));
  drawerStatus.textContent = `주문 #${order.id} 사양을 불러왔습니다. 주문 페이지로 이동합니다...`;
  window.location.href = "./index.html#order";
}

searchForm.addEventListener("submit", e => {
  e.preventDefault();
  const orderId = orderIdInput.value.trim();
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();

  if(!orderId && !(name && phone)){
    drawerStatus.textContent = "주문번호를 입력하거나, 이름과 연락처를 모두 입력해주세요.";
    return;
  }

  if(orderId){
    searchOrders({ search_type: "order_id", order_id: Number(orderId) });
    return;
  }

  searchOrders({ search_type: "customer", customer_name: name, customer_phone: phone });
});

resetBtn.addEventListener("click", () => {
  orderIdInput.value = "";
  nameInput.value = "";
  phoneInput.value = "";
  currentOrders = [];
  drawerResults.innerHTML = "";
  drawerStatus.textContent = "주문번호 또는 이름+연락처(둘 다) 중 하나로 조회할 수 있습니다.";
});

renderOrders();
