(function(){
  if(window.CustomBroHUD){ return; }

  const defaultData = {
    status:{
      state:"작업 브로 상태 = 보통 바쁨",
      detail:"큐 4건 · SLA 3일"
    },
    tasks:[
      { label:"최근 주문 확인", description:"관리자 주문 100건", action:"go", target:"./admin-orders.html" },
      { label:"보관함 바로가기", description:"주문번호/연락처로 조회", action:"go", target:"./drawer.html" },
      { label:"주문 페이지 열기", description:"새 주문 접수", action:"go", target:"./index.html#order" }
    ],
    helpLinks:[
      { label:"주문 방법", hint:"STEP 가이드", href:"./index.html#order" },
      { label:"재주문 안내", hint:"서랍 사용법", href:"./drawer.html" },
      { label:"문의 메일", hint:"custombro365@gmail.com", href:"mailto:custombro365@gmail.com" }
    ],
    notice:"문제 없으면 조용히 진행, 필요한 순간만 알려줍니다."
  };

  function ready(fn){
    if(document.readyState === "loading"){
      document.addEventListener("DOMContentLoaded", fn, { once:true });
    } else {
      fn();
    }
  }

  function createHudElements(){
    if(!document.body){ return; }

    const launcher = document.createElement("button");
    launcher.type = "button";
    launcher.className = "hud-launcher";
    launcher.setAttribute("aria-label","CustomBro 상태창 열기");

    const panel = document.createElement("aside");
    panel.className = "hud-panel";
    panel.setAttribute("aria-hidden","true");
    panel.innerHTML = templateFromData(defaultData);

    const scanlines = document.createElement("div");
    scanlines.className = "hud-scanlines";
    panel.appendChild(scanlines);

    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    let isOpen = false;

    function open(){
      if(isOpen) return;
      panel.classList.add("open");
      panel.setAttribute("aria-hidden","false");
      launcher.setAttribute("aria-pressed","true");
      isOpen = true;
    }
    function close(){
      if(!isOpen) return;
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden","true");
      launcher.removeAttribute("aria-pressed");
      isOpen = false;
    }
    function toggle(){ isOpen ? close() : open(); }

    launcher.addEventListener("click", toggle);
    panel.querySelector(".hud-close")?.addEventListener("click", close);
    document.addEventListener("keydown", evt => {
      if(evt.key === "Escape"){
        close();
      }
    });

    panel.addEventListener("click", evt => {
      const button = evt.target.closest("[data-hud-action]");
      if(!button) return;
      const action = button.getAttribute("data-hud-action");
      const target = button.getAttribute("data-hud-target");
      handleAction(action, target);
      close();
    });

    function setData(next){
      const merged = mergeData(defaultData, next || {});
      panel.innerHTML = templateFromData(merged);
      panel.appendChild(scanlines);
    }

    window.CustomBroHUD = { open, close, toggle, setData };
  }

  function mergeData(base, next){
    return {
      status: { ...base.status, ...(next.status || {}) },
      tasks: Array.isArray(next.tasks) ? next.tasks : base.tasks,
      helpLinks: Array.isArray(next.helpLinks) ? next.helpLinks : base.helpLinks,
      notice: next.notice || base.notice
    };
  }

  function templateFromData(data){
    const tasksMarkup = (data.tasks || []).map(task => {
      const desc = task.description ? `<span>${task.description}</span>` : "";
      const action = task.action || "go";
      const target = task.target || "";
      return `<button type="button" data-hud-action="${action}" data-hud-target="${escapeHtml(target)}">${escapeHtml(task.label || "작업")}${desc}</button>`;
    }).join("");

    const linksMarkup = (data.helpLinks || []).map(link => {
      const hint = link.hint ? `<span>${escapeHtml(link.hint)}</span>` : "";
      const href = escapeHtml(link.href || "#");
      return `<a href="${href}" target="${href.startsWith('mailto:') ? '_self' : '_self'}">${escapeHtml(link.label || "도움")}${hint}</a>`;
    }).join("");

    return `
      <header>
        <p>STATUS HUD</p>
        <button type="button" class="hud-close" aria-label="상태창 닫기">✕</button>
      </header>
      <div class="hud-body">
        <div class="hud-col primary">
          <div class="hud-status-chip">
            <strong>${escapeHtml(data.status?.state || "상태 미확인")}</strong>
            <span>${escapeHtml(data.status?.detail || "")}</span>
          </div>
          <div class="hud-section">
            <h3>내 작업</h3>
            <div class="hud-grid">
              ${tasksMarkup}
            </div>
          </div>
        </div>
        <div class="hud-col secondary">
          <div class="hud-section">
            <h3>도움</h3>
            <div class="hud-links">
              ${linksMarkup}
            </div>
          </div>
          <p class="hud-note">${escapeHtml(data.notice || "")}</p>
        </div>
      </div>
    `;
  }

  function handleAction(action, target){
    switch(action){
      case "go":
        if(target){ window.location.href = target; }
        break;
      case "scroll":
        if(target){
          const el = document.querySelector(target);
          if(el){ el.scrollIntoView({ behavior:"smooth", block:"start" }); }
        }
        break;
      case "refresh":
        window.location.reload();
        break;
      default:
        break;
    }
  }

  function escapeHtml(value){
    return (value ?? "").toString()
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;");
  }

  ready(createHudElements);
})();
