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

function getKeyringState(){
  const base = 4500;
  const sizeAdd = {s:0,m:1000,l:2000}[keyringSize.value];
  const doubleAdd = keyringDouble.checked ? 1500 : 0;
  const qty = Math.max(1, Number(keyringQty.value || 1));
  const total = (base + sizeAdd + doubleAdd) * qty;
  return {
    product: "아크릴 키링",
    shape: ({circle:"원형",square:"사각형",rounded:"라운드 사각형"})[keyringShape.value],
    size: ({s:"소형",m:"중형",l:"대형"})[keyringSize.value],
    doubleSided: keyringDouble.checked ? "양면" : "단면",
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

function getPopState(){
  const base = 12000;
  const baseAdd = {s:0,m:4000,l:8000}[popBase.value];
  const uprightAdd = {basic:0,round:1500}[popUpright.value];
  const slotAdd = {"1":0,"2":2000}[popSlot.value];
  const qty = Math.max(1, Number(popQty.value || 1));
  const total = (base + baseAdd + uprightAdd + slotAdd) * qty;
  return {
    product: "아크릴 POP 진열대",
    baseSize: ({s:"소형",m:"중형",l:"대형"})[popBase.value],
    upright: ({basic:"기본 직사각",round:"상단 라운드"})[popUpright.value],
    slot: (popSlot.value === "1" ? "1슬롯 기본형" : "2슬롯 안정형"),
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

/* order */
const orderProduct = document.getElementById("orderProduct");
const customerName = document.getElementById("customerName");
const customerPhone = document.getElementById("customerPhone");
const customerEmail = document.getElementById("customerEmail");
const customerMemo = document.getElementById("customerMemo");
const orderSummary = document.getElementById("orderSummary");
const refreshOrderSummary = document.getElementById("refreshOrderSummary");
const copyOrderSummary = document.getElementById("copyOrderSummary");
const downloadOrderTxt = document.getElementById("downloadOrderTxt");
const sendOrderEmail = document.getElementById("sendOrderEmail");
const useKeyringForOrder = document.getElementById("useKeyringForOrder");
const usePopForOrder = document.getElementById("usePopForOrder");

function makeSummary(){
  const product = orderProduct.value;
  const name = safe(customerName.value);
  const phone = safe(customerPhone.value);
  const email = safe(customerEmail.value);
  const memo = safe(customerMemo.value);

  let body = "";
  if(product === "keyring"){
    const s = getKeyringState();
    body = [
      "[CustomBro 주문요청서]",
      `접수시각: ${getNow()}`,
      "",
      "[고객정보]",
      `이름: ${name || "(미입력)"}`,
      `연락처: ${phone || "(미입력)"}`,
      `이메일: ${email || "(미입력)"}`,
      "",
      "[상품]",
      `상품명: ${s.product}`,
      `모양: ${s.shape}`,
      `크기: ${s.size}`,
      `양면여부: ${s.doubleSided}`,
      `수량: ${s.qty}`,
      `업로드 파일명: ${s.image}`,
      `예상가: ${won(s.total)}`,
      "",
      "[추가요청]",
      memo || "(없음)",
      "",
      "[안내]",
      "현재 버전은 이미지 원본 자동 첨부/결제가 아직 연결되지 않았습니다.",
      "주문요약 전송 후 원본 파일은 회신 메일 또는 별도 채널로 전달해 주세요."
    ].join("\n");
  } else {
    const s = getPopState();
    body = [
      "[CustomBro 주문요청서]",
      `접수시각: ${getNow()}`,
      "",
      "[고객정보]",
      `이름: ${name || "(미입력)"}`,
      `연락처: ${phone || "(미입력)"}`,
      `이메일: ${email || "(미입력)"}`,
      "",
      "[상품]",
      `상품명: ${s.product}`,
      `바닥판 크기: ${s.baseSize}`,
      `세워지는 판: ${s.upright}`,
      `슬롯 방식: ${s.slot}`,
      `수량: ${s.qty}`,
      `업로드 파일명: ${s.image}`,
      `예상가: ${won(s.total)}`,
      "",
      "[추가요청]",
      memo || "(없음)",
      "",
      "[안내]",
      "현재 버전은 이미지 원본 자동 첨부/결제가 아직 연결되지 않았습니다.",
      "주문요약 전송 후 원본 파일은 회신 메일 또는 별도 채널로 전달해 주세요."
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

useKeyringForOrder.addEventListener("click", fillOrderFromKeyring);
usePopForOrder.addEventListener("click", fillOrderFromPop);

updateKeyring();
updatePop();
makeSummary();
