function won(v){ return v.toLocaleString("ko-KR") + "원"; }

const keyringShape = document.getElementById("keyringShape");
const keyringSize = document.getElementById("keyringSize");
const keyringDouble = document.getElementById("keyringDouble");
const keyringQty = document.getElementById("keyringQty");
const keyringPrice = document.getElementById("keyringPrice");
const keyringFrame = document.getElementById("keyringFrame");
const keyringFile = document.getElementById("keyringFile");
const keyringImg = document.getElementById("keyringImg");

function updateKeyring(){
  const base = 4500;
  const sizeAdd = {s:0,m:1000,l:2000}[keyringSize.value];
  const doubleAdd = keyringDouble.checked ? 1500 : 0;
  const qty = Math.max(1, Number(keyringQty.value || 1));
  const total = (base + sizeAdd + doubleAdd) * qty;
  keyringPrice.textContent = "예상가: " + won(total);
  keyringFrame.className = "keyring-frame " + keyringShape.value;
}
[keyringShape,keyringSize,keyringDouble,keyringQty].forEach(el => el.addEventListener("input", updateKeyring));
keyringFile.addEventListener("change", e => {
  const f = e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = ev => {
    keyringImg.src = ev.target.result;
    keyringImg.style.display = "block";
  };
  reader.readAsDataURL(f);
});
updateKeyring();

const popBase = document.getElementById("popBase");
const popUpright = document.getElementById("popUpright");
const popSlot = document.getElementById("popSlot");
const popQty = document.getElementById("popQty");
const popPrice = document.getElementById("popPrice");
const popBaseBox = document.getElementById("popBaseBox");
const popUprightBox = document.getElementById("popUprightBox");
const popFile = document.getElementById("popFile");
const popImg = document.getElementById("popImg");

function updatePop(){
  const base = 12000;
  const baseAdd = {s:0,m:4000,l:8000}[popBase.value];
  const uprightAdd = {basic:0,round:1500}[popUpright.value];
  const slotAdd = {"1":0,"2":2000}[popSlot.value];
  const qty = Math.max(1, Number(popQty.value || 1));
  const total = (base + baseAdd + uprightAdd + slotAdd) * qty;
  popPrice.textContent = "예상가: " + won(total);
  popBaseBox.className = "pop-base " + popBase.value;
  popUprightBox.className = "pop-upright " + popUpright.value;
}
[popBase,popUpright,popSlot,popQty].forEach(el => el.addEventListener("input", updatePop));
popFile.addEventListener("change", e => {
  const f = e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = ev => {
    popImg.src = ev.target.result;
    popImg.style.display = "block";
  };
  reader.readAsDataURL(f);
});
updatePop();
