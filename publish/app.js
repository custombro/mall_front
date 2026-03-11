const ORDER_EMAIL = "custombro365@gmail.com";

function won(v){ return v.toLocaleString("ko-KR") + "원"; }
function safe(v){ return (v ?? "").toString().trim(); }
function getNow(){
  const d = new Date();
  const p = n => String(n).padStart(2,"0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/* keyring */
const keyringShape = document.getElementById("keyringShape");
const keyringSize = document.getElementById("keyringSize");
const keyringDouble = document.getElementById("keyringDouble");
const keyringQty = document.getElementById("keyringQty");
const keyringPrice = document.getElementById("keyringPrice");
const keyringFrame = document.getElementById("keyringFrame");
const keyringFile = document.getElementById("keyringFile");
const keyringImg = document.getElementById("keyringImg");
let keyringFileName = "";
const keyringShapeLabelToValue = {
  "원형":"circle",
  "사각형":"square",
  "라운드 사각형":"rounded"
};
const keyringSizeLabelToValue = {"소형":"s","중형":"m","대형":"l"};

function getKeyringState(){
  const base = 4500;
  const sizeAdd = {s:0,m:1000,l:2000}[keyringSize.value];
  const doubleAdd = keyringDouble.checked ? 1500 : 0;
  const qty = Math.max(1, Number(keyringQty.value || 1));
  const total = (base + sizeAdd + doubleAdd) * qty;
  const shapeValue = keyringShape.value;
  const sizeValue = keyringSize.value;
  const shapeLabel = ({circle:"원형",square:"사각형",rounded:"라운드 사각형"})[shapeValue];
  const sizeLabel = ({s:"소형",m:"중형",l:"대형"})[sizeValue];
  return {
    product: "아크릴 키링",
    product_type: "keyring",
    shape: shapeLabel,
    shapeValue,
    size: sizeLabel,
    sizeValue,
    doubleSided: keyringDouble.checked ? "양면" : "단면",
    doubleSidedFlag: keyringDouble.checked,
    qty,
    image: keyringFileName || "미업로드",
    total
  };
}
function updateKeyring(){
  const s = getKeyringState();
  keyringPrice.textContent = "예상가: " + won(s.total);
  keyringFrame.className = "keyring-frame " + keyringShape.value;
}
[keyringShape,keyringSize,keyringDouble,keyringQty].forEach(el => el.addEventListener("input", updateKeyring));
keyringFile.addEventListener("change", e => {
  const f = e.target.files[0];
  keyringFileName = f ? f.name : "";
  if(!f){
    keyringImg.style.display = "none";
    updateKeyring();
    return;
  }
  const reader = new FileReader();
  reader.onload = ev => {
    keyringImg.src = ev.target.result;
    keyringImg.style.display = "block";
  };
  reader.readAsDataURL(f);
  updateKeyring();
});

/* pop */
const popBase = document.getElementById("popBase");
const popUpright = document.getElementById("popUpright");
const popSlot = document.getElementById("popSlot");
const popQty = document.getElementById("popQty");
const popPrice = document.getElementById("popPrice");
const popBaseBox = document.getElementById("popBaseBox");
const popUprightBox = document.getElementById("popUprightBox");
const popFile = document.getElementById("popFile");
const popImg = document.getElementById("popImg");
let popFileName = "";
const popBaseLabelToValue = {"소형":"s","중형":"m","대형":"l"};
const popUprightLabelToValue = {"기본 직사각":"basic","상단 라운드":"round"};
const popSlotLabelToValue = {"1슬롯 기본형":"1","2슬롯 안정형":"2"};

function getPopState(){
  const base = 12000;
  const baseAdd = {s:0,m:4000,l:8000}[popBase.value];
  const uprightAdd = {basic:0,round:1500}[popUpright.value];
  const slotAdd = {"1":0,"2":2000}[popSlot.value];
  const qty = Math.max(1, Number(popQty.value || 1));
  const total = (base + baseAdd + uprightAdd + slotAdd) * qty;
  const baseValue = popBase.value;
  const uprightValue = popUpright.value;
  const slotValue = popSlot.value;
  return {
    product: "아크릴 POP 진열대",
    product_type: "pop",
    baseSize: ({s:"소형",m:"중형",l:"대형"})[baseValue],
    baseValue,
    upright: ({basic:"기본 직사각",round:"상단 라운드"})[uprightValue],
    uprightValue,
    slot: (slotValue === "1" ? "1슬롯 기본형" : "2슬롯 안정형"),
    slotValue,
    qty,
    image: popFileName || "미업로드",
    total
  };
}
function updatePop(){
  const s = getPopState();
  popPrice.textContent = "예상가: " + won(s.total);
  popBaseBox.className = "pop-base " + popBase.value;
  popUprightBox.className = "pop-upright " + popUpright.value;
}
[popBase,popUpright,popSlot,popQty].forEach(el => el.addEventListener("input", updatePop));
popFile.addEventListener("change", e => {
  const f = e.target.files[0];
  popFileName = f ? f.name : "";
  if(!f){
    popImg.style.display = "none";
    updatePop();
    return;
  }
  const reader = new FileReader();
  reader.onload = ev => {
    popImg.src = ev.target.result;
    popImg.style.display = "block";
  };
  reader.readAsDataURL(f);
  updatePop();
});

function withOptionMeta(option){
  return {
    ...option,
    meta: {
      ...(option.meta || {}),
      order_label: safe(orderLabel?.value),
      reorder_source_id: reorderContext?.order_id ?? null,
      reorder_mode: reorderContext?.mode ?? null,
      saved_at: getNow()
    }
  };
}

function applyKeyringPrefill(opt){
  if(!opt) return;
  const shapeVal = opt.shapeValue || keyringShapeLabelToValue[opt.shape];
  if(shapeVal){ keyringShape.value = shapeVal; }
  const sizeVal = opt.sizeValue || keyringSizeLabelToValue[opt.size];
  if(sizeVal){ keyringSize.value = sizeVal; }
  if(typeof opt.doubleSidedFlag === "boolean"){
    keyringDouble.checked = opt.doubleSidedFlag;
  } else if(typeof opt.doubleSided === "string"){
    keyringDouble.checked = opt.doubleSided.includes("양면");
  }
  keyringQty.value = opt.qty || 1;
  keyringFileName = opt.image || "";
  keyringImg.style.display = "none";
  updateKeyring();
}

function applyPopPrefill(opt){
  if(!opt) return;
  const baseVal = opt.baseValue || popBaseLabelToValue[opt.baseSize];
  if(baseVal){ popBase.value = baseVal; }
  const uprightVal = opt.uprightValue || popUprightLabelToValue[opt.upright];
  if(uprightVal){ popUpright.value = uprightVal; }
  const slotVal = opt.slotValue || popSlotLabelToValue[opt.slot];
  if(slotVal){ popSlot.value = slotVal; }
  popQty.value = opt.qty || 1;
  popFileName = opt.image || "";
  popImg.style.display = "none";
  updatePop();
}

/* order */
const orderProduct = document.getElementById("orderProduct");
const orderLabel = document.getElementById("orderLabel");
const customerName = document.getElementById("customerName");
const customerPhone = document.getElementById("customerPhone");
const customerEmail = document.getElementById("customerEmail");
const customerMemo = document.getElementById("customerMemo");
const orderSummary = document.getElementById("orderSummary");
const orderServerStatus = document.getElementById("orderServerStatus");
const refreshOrderSummary = document.getElementById("refreshOrderSummary");
const copyOrderSummary = document.getElementById("copyOrderSummary");
const downloadOrderTxt = document.getElementById("downloadOrderTxt");
const sendOrderEmail = document.getElementById("sendOrderEmail");
const submitOrderServer = document.getElementById("submitOrderServer");
const useKeyringForOrder = document.getElementById("useKeyringForOrder");
const usePopForOrder = document.getElementById("usePopForOrder");
const reorderBanner = document.getElementById("reorderBanner");
const reorderBannerTitle = document.getElementById("reorderBannerTitle");
const reorderBannerDetail = document.getElementById("reorderBannerDetail");
const clearReorderPrefill = document.getElementById("clearReorderPrefill");
let reorderContext = null;

function makeSummary(){
  const product = orderProduct.value;
  const name = safe(customerName.value);
  const phone = safe(customerPhone.value);
  const email = safe(customerEmail.value);
  const memo = safe(customerMemo.value);
  const label = safe(orderLabel.value);

  const header = [
    "[CustomBro 주문요청서]",
    `접수시각: ${getNow()}`
  ];
  if(label){ header.push(`주문명: ${label}`); }
  if(reorderContext?.order_id){
    const modeText = reorderContext.mode === "edit" ? "수정 재주문" : "동일 사양 재주문";
    header.push(`재주문 원본: #${reorderContext.order_id} (${modeText})`);
  }
  header.push("", "[고객정보]",
    `이름: ${name || "(미입력)"}`,
    `연락처: ${phone || "(미입력)"}`,
    `이메일: ${email || "(미입력)"}`,
    "",
    "[상품]");

  let body = "";
  if(product === "keyring"){
    const s = getKeyringState();
    body = [
      ...header,
      `상품명: ${s.product}`,
      `모양: ${s.shape}`,
      `크기: ${s.size}`,
      `양면여부: ${s.doubleSided}`,
      `수량: ${s.qty}`,
      `업로드 파일명: ${s.image}`,
      `예상가: ${won(s.total)}`,
      "",
      "[추가요청]",
      memo || "(없음)"
    ].join("\n");
  } else {
    const s = getPopState();
    body = [
      ...header,
      `상품명: ${s.product}`,
      `바닥판 크기: ${s.baseSize}`,
      `세워지는 판: ${s.upright}`,
      `슬롯 방식: ${s.slot}`,
      `수량: ${s.qty}`,
      `업로드 파일명: ${s.image}`,
      `예상가: ${won(s.total)}`,
      "",
      "[추가요청]",
      memo || "(없음)"
    ].join("\n");
  }
  orderSummary.value = body;
  return body;
}

function fillOrderFromKeyring(){
  orderProduct.value = "keyring";
  makeSummary();
  document.getElementById("order").scrollIntoView({behavior:"smooth", block:"start"});
}
function fillOrderFromPop(){
  orderProduct.value = "pop";
  makeSummary();
  document.getElementById("order").scrollIntoView({behavior:"smooth", block:"start"});
}

orderProduct.addEventListener("input", makeSummary);
orderLabel.addEventListener("input", makeSummary);
customerName.addEventListener("input", makeSummary);
customerPhone.addEventListener("input", makeSummary);
customerEmail.addEventListener("input", makeSummary);
customerMemo.addEventListener("input", makeSummary);

refreshOrderSummary.addEventListener("click", () => {
  makeSummary();
  alert("주문요약을 갱신했습니다.");
});

copyOrderSummary.addEventListener("click", async () => {
  const text = makeSummary();
  try{
    await navigator.clipboard.writeText(text);
    alert("주문요약을 복사했습니다.");
  }catch{
    alert("복사에 실패했습니다. 직접 선택해서 복사해 주세요.");
  }
});

downloadOrderTxt.addEventListener("click", () => {
  const text = makeSummary();
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  const name = safe(customerName.value) || "customer";
  a.href = URL.createObjectURL(blob);
  a.download = `custombro-order-${name}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
});

sendOrderEmail.addEventListener("click", () => {
  const text = makeSummary();
  const subject = orderProduct.value === "keyring"
    ? "[CustomBro] 아크릴 키링 주문요청"
    : "[CustomBro] 아크릴 POP 진열대 주문요청";
  const href = `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  window.location.href = href;
});

submitOrderServer.addEventListener("click", async () => {
  const summary = makeSummary();
  const product = orderProduct.value;
  const optionPayload = product === "keyring"
    ? withOptionMeta(getKeyringState())
    : withOptionMeta(getPopState());
  const payload = {
    product_type: product,
    customer_name: safe(customerName.value),
    customer_phone: safe(customerPhone.value),
    customer_email: safe(customerEmail.value),
    customer_memo: safe(customerMemo.value),
    order_summary: summary,
    option_json: optionPayload,
    image_file_name: product === "keyring" ? keyringFileName : popFileName,
    policy_verdict: getPolicyState().verdict,
    policy_status_label: getPolicyState().label,
    policy_reason: getPolicyState().reason,
    rights_declared: getPolicyState().rightsKey,
    sale_intent: getPolicyState().saleKey
  };

  if(!payload.customer_name || !payload.customer_phone){
    alert("이름과 연락처를 입력해 주세요.");
    return;
  }

  const policyState = getPolicyState();
  if(!policyState.confirmed){
    alert("정책 확인 체크를 완료해 주세요.");
    return;
  }
  if(policyState.verdict === "blocked"){
    alert("현재 정책상 제작 불가 판정입니다. 정책 검증 내용을 확인해 주세요.");
    return;
  }
  orderServerStatus.textContent = "서버 저장 중...";
  try{
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if(!res.ok || !data.ok){
      throw new Error(data?.error || "SAVE_FAILED");
    }

    const orderId = data.order_id ?? "";
    orderServerStatus.textContent = `서버 주문번호: ${orderId || "저장완료"}`;

    const receipt = {
      order_id: orderId,
      product_type: product,
      customer_name: payload.customer_name,
      customer_phone: payload.customer_phone,
      customer_email: payload.customer_email,
      created_at: getNow()
    };
    localStorage.setItem("custombro_last_receipt", JSON.stringify(receipt));
    if(window?.localStorage){
      localStorage.removeItem("custombro_reorder_prefill");
    }
    reorderContext = null;

    window.location.href = `./order-complete.html?order_id=${encodeURIComponent(orderId)}&product=${encodeURIComponent(product)}`;
  }catch(err){
    orderServerStatus.textContent = "서버 저장 실패";
    alert("서버 저장 실패: " + String(err.message || err));
  }
});

useKeyringForOrder.addEventListener("click", fillOrderFromKeyring);
usePopForOrder.addEventListener("click", fillOrderFromPop);

function loadReorderPrefill(){
  if(!window?.localStorage) return;
  const raw = localStorage.getItem("custombro_reorder_prefill");
  if(!raw) return;
  let data;
  try{
    data = JSON.parse(raw);
  }catch{
    localStorage.removeItem("custombro_reorder_prefill");
    return;
  }
  if(!data){ return; }
  reorderContext = data;
  orderProduct.value = data.product_type || "keyring";
  orderLabel.value = data.order_label || data.option_json?.meta?.order_label || "";
  customerName.value = data.customer_name || "";
  customerPhone.value = data.customer_phone || "";
  customerEmail.value = data.customer_email || "";
  customerMemo.value = data.customer_memo || "";

  if(data.product_type === "pop"){
    applyPopPrefill(data.option_json);
  } else {
    applyKeyringPrefill(data.option_json);
  }

  if(reorderBanner){
    reorderBanner.hidden = false;
    const modeText = data.mode === "edit" ? "수정 재주문 모드" : "재주문 모드";
    reorderBannerTitle.textContent = modeText;
    const detail = data.mode === "edit"
      ? `원본 주문 #${data.order_id} 사양을 불러왔습니다. 필요한 텍스트/요청사항을 수정한 뒤 다시 접수하세요.`
      : `원본 주문 #${data.order_id} 사양을 불러왔습니다. 수량만 조정하거나 그대로 접수할 수 있습니다.`;
    reorderBannerDetail.textContent = detail + " (업로드 파일은 다시 첨부해 주세요)";
  }

  makeSummary();
}

function clearReorderPrefillState(){
  reorderContext = null;
  if(reorderBanner){
    reorderBanner.hidden = true;
    reorderBannerDetail.textContent = "";
  }
  if(window?.localStorage){
    localStorage.removeItem("custombro_reorder_prefill");
  }
  makeSummary();
}

clearReorderPrefill?.addEventListener("click", clearReorderPrefillState);

updateKeyring();
updatePop();
loadReorderPrefill();
makeSummary();

/* CB_POLICY_V1 */
const designRights = document.getElementById("designRights");
const saleIntent = document.getElementById("saleIntent");
const contentSafety = document.getElementById("contentSafety");
const policyAgree = document.getElementById("policyAgree");
const policyVerdict = document.getElementById("policyVerdict");
const policyReason = document.getElementById("policyReason");

function policyRightsLabel(v){
  return ({
    original:"순수 창작 / 본인 저작물",
    licensed:"사용 허가·상업 이용 권리 보유",
    personal_fanart:"2차창작·팬아트·브랜드 포함",
    unknown:"권리 상태 불명"
  })[v] || "미선택";
}
function policySaleLabel(v){
  return ({
    make_only:"제작만 요청",
    sell_on_site:"사이트 판매 희망"
  })[v] || "미선택";
}
function policyContentLabel(v){
  return ({
    safe:"일반 콘텐츠",
    restricted:"성인/도박/혐오/위험 가능성 있음"
  })[v] || "미선택";
}
function currentUploadName(){
  const product = orderProduct?.value || "keyring";
  return product === "keyring" ? (keyringFileName || "") : (popFileName || "");
}
function detectPolicyHints(fileName){
  const lower = (fileName || "").toLowerCase();
  const blocked = ["casino","bet","slot","바카라","슬롯","도박","porn","adult","sex","19금","마약","weapon","gun"];
  const limited = ["pokemon","marvel","disney","sanrio","짱구","포켓몬","디즈니","마블","산리오","bts","kakao","라인프렌즈"];
  const blockedHit = blocked.find(k => lower.includes(k));
  if(blockedHit){ return { mode:"blocked", hit:blockedHit }; }
  const limitedHit = limited.find(k => lower.includes(k));
  if(limitedHit){ return { mode:"limited", hit:limitedHit }; }
  return { mode:"none", hit:"" };
}
function getPolicyState(){
  const rightsKey = designRights?.value || "original";
  const saleKey = saleIntent?.value || "make_only";
  const contentKey = contentSafety?.value || "safe";
  const confirmed = !!policyAgree?.checked;
  const fileName = currentUploadName();
  const hint = detectPolicyHints(fileName);

  let verdict = "review";
  let label = "확인 필요";
  let reason = "권리 상태와 정책 확인 체크를 완료하면 제작 가능 범위를 안내합니다.";

  if(contentKey === "restricted" || hint.mode === "blocked"){
    verdict = "blocked";
    label = "제작 불가";
    reason = hint.hit
      ? `업로드 파일명에서 '${hint.hit}' 관련 제한 키워드가 감지되었습니다. 현재 정책상 제작 불가로 처리합니다.`
      : "성인·도박·혐오·위험 가능성으로 표시되어 현재 정책상 제작 불가입니다.";
  } else if(rightsKey === "original" || rightsKey === "licensed"){
    if(hint.mode === "limited"){
      verdict = "limited";
      label = "제작 가능 / 판매 불가";
      reason = `파일명에서 '${hint.hit}' 관련 제3자 IP 가능성이 감지되어 사이트 판매는 막고 제작만 허용합니다.`;
    } else if(saleKey === "sell_on_site"){
      verdict = "allowed";
      label = "제작/판매 가능";
      reason = "순수 창작 또는 사용 권리 보유로 확인되어 사이트 판매 가능 후보로 분류했습니다.";
    } else {
      verdict = "allowed";
      label = "제작 가능";
      reason = "권리 상태가 확인되어 제작용 주문으로 접수 가능합니다.";
    }
  } else {
    verdict = "limited";
    label = "제작 가능 / 판매 불가";
    reason = rightsKey === "unknown"
      ? "권리 상태가 불명이라 사이트 판매는 막고 제작만 허용합니다. 필요 시 별도 확인이 필요합니다."
      : "2차창작·팬아트·브랜드 포함 데이터는 소장/제작용으로만 접수하고 사이트 판매는 불가합니다.";
  }

  if(!confirmed){
    verdict = "review";
    label = "확인 필요";
    reason = "권리 상태와 정책 확인 체크를 완료해야 주문 접수가 가능합니다.";
  }

  return {
    verdict,
    label,
    reason,
    confirmed,
    rightsKey,
    saleKey,
    contentKey,
    fileName,
    hint
  };
}
function renderPolicyState(){
  if(!policyVerdict || !policyReason){ return; }
  const p = getPolicyState();
  policyVerdict.textContent = p.label;
  policyVerdict.className = `policy-badge ${p.verdict}`;
  policyReason.textContent =
    `${p.reason} / 권리 상태: ${policyRightsLabel(p.rightsKey)} / 판매 의도: ${policySaleLabel(p.saleKey)} / 내용 분류: ${policyContentLabel(p.contentKey)}${p.fileName ? ` / 파일: ${p.fileName}` : ""}`;
}
if(typeof makeSummary === "function"){
  const __cbOriginalMakeSummary = makeSummary;
  makeSummary = function(){
    const base = __cbOriginalMakeSummary();
    const p = getPolicyState();
    const extended = [
      base,
      "",
      "[정책검증]",
      `판정: ${p.label}`,
      `권리상태: ${policyRightsLabel(p.rightsKey)}`,
      `판매의도: ${policySaleLabel(p.saleKey)}`,
      `내용분류: ${policyContentLabel(p.contentKey)}`,
      `사유: ${p.reason}`
    ].join("\n");
    if(orderSummary){ orderSummary.value = extended; }
    return extended;
  };
}
[designRights,saleIntent,contentSafety,policyAgree,orderProduct,keyringFile,popFile].forEach(el => {
  if(el){ el.addEventListener("input", () => { renderPolicyState(); makeSummary(); }); }
  if(el){ el.addEventListener("change", () => { renderPolicyState(); makeSummary(); }); }
});
renderPolicyState();
makeSummary();