(function(){
  if(window.CustomBroHUD){ return; }

  const CHAT_LOG_LIMIT = 14;
  const SUMMARY_ACTIVE_TIMEOUT = 4200;
  const SEARCH_TRIGGER_REGEX = /(검색|찾|search|where|어디|query)/;

  const HUD_CONTEXTS = {
    home:{
      key:"home",
      label:"주문/제작 모드",
      heading:"STATUS HUD · 제작",
      subheading:"작은 요약 + 큰 채팅으로 주문 상황 안내",
      chatHint:"주문 흐름이나 제작 대기 상황을 바로 물어보세요.",
      summaryCards:[
        {
          id:"orders",
          label:"현재 주문 수량",
          value:"12건",
          meta:"금일 신규 2건",
          detail:"현재 큐에는 12건의 주문이 쌓여 있으며 신규 2건은 급한 일정으로 표시되었습니다. 관리자 주문 페이지에서 정렬된 목록을 바로 확인할 수 있어요.",
          actions:[{ label:"관리자 주문 열기", action:"go", target:"./admin-orders.html" }]
        },
        {
          id:"recentBuild",
          label:"최근 제작 품목",
          value:"아크릴 키링",
          meta:"POP 2세트 병행",
          detail:"가장 최근 제작 중인 품목은 아크릴 키링 세트이며 POP 패널 2세트가 동시에 진행 중입니다. 빌더 미리보기를 열어 세부 옵션을 다시 확인할 수 있어요.",
          actions:[{ label:"키링 빌더 이동", action:"scroll", target:"#keyring" }]
        },
        {
          id:"drawerState",
          label:"보관함 상태",
          value:"3건 준비",
          meta:"재주문 대기",
          detail:"보관함에는 최근 저장된 데이터 3건이 재주문 대기 상태입니다. 주문번호나 연락처를 입력하면 즉시 불러올 수 있어요.",
          actions:[{ label:"보관함 열기", action:"go", target:"./drawer.html" }]
        },
        {
          id:"broStatus",
          label:"작업 브로 상태",
          value:"보통 바쁨",
          meta:"응답 SLA 3일",
          detail:"작업 브로는 보통 바쁨 모드로, 제작 진행 상황을 하루 2회 스냅샷으로 정리하고 있습니다. 급한 요청은 채팅창으로 남겨 주세요."
        },
        {
          id:"points",
          label:"포인트/등급",
          value:"준비 중",
          meta:"더미 데이터",
          detail:"포인트·등급 기능은 현재 더미 값으로 표시됩니다. 추후 실제 고객 포인트 API가 연결되면 자동 반영될 예정입니다."
        }
      ],
      quickChips:[
        { id:"chip-order-how", label:"주문은 어떻게 하나요?", prompt:"주문은 어떻게 하나요?" },
        { id:"chip-drawer", label:"보관함에서 다시 주문하고 싶어요", prompt:"보관함에서 다시 주문하고 싶어요" },
        { id:"chip-backlog", label:"지금 제작이 얼마나 밀려있나요?", prompt:"지금 제작이 얼마나 밀려있나요?" },
        { id:"chip-keyring", label:"키링 제작 방법 알려줘", prompt:"키링 제작 방법 알려줘" },
        { id:"chip-open-drawer", label:"보관함 열기", action:{ type:"go", target:"./drawer.html" } }
      ],
      initialMessages:[
        { role:"system", label:"HUD", text:"CustomBro HUD V3가 주문 · 제작 페이지를 감시 중입니다." },
        { role:"system", label:"GUIDE", text:"요약 카드를 누르면 관련 설명이 채팅으로 도착하고, 아래 칩을 누르면 자주 묻는 질문을 즉시 확인할 수 있어요." }
      ],
      responses:{
        keywords:[
          {
            match:["주문","order","접수"],
            message:"주문은 빌더에서 옵션을 채운 뒤 하단 주문 섹션에서 고객 정보를 입력하고 제출하면 서버 DB에 즉시 저장됩니다.",
            meta:"index 페이지 기준",
            actions:[{ label:"주문 섹션으로 이동", action:"scroll", target:"#order" }]
          },
          {
            match:["보관함","drawer","재주문","서랍"],
            message:"보관함(drawer)은 주문번호 또는 이름+연락처로 기존 주문을 다시 불러와 재주문/수정 재주문을 연결합니다.",
            actions:[
              { label:"보관함 열기", action:"go", target:"./drawer.html" },
              { label:"주문 페이지로 이동", action:"go", target:"./index.html#order" }
            ]
          },
          {
            match:["밀려","큐","대기","progress","제작"],
            message:"현재 제작 큐는 총 12건이며 우선 작업 4건, 일반 작업 8건으로 배분되어 있습니다. 평균 리드타임은 3~4일입니다.",
            meta:"실제 API 연동 전 더미 데이터"
          },
          {
            match:["키링","방법","guide","제작 방법"],
            message:"키링 제작은 모양/컬러/텍스트를 선택 → 미리보기 확인 → 주문 폼 제출 순으로 진행됩니다. 빌더가 바로 옆 섹션에 열려 있습니다.",
            actions:[
              { label:"키링 빌더 이동", action:"scroll", target:"#keyring" },
              { label:"주문 폼 이동", action:"scroll", target:"#order" }
            ]
          }
        ],
        fallback:(query, state) => ({
          message:`"${query}" 질문은 아직 ${state?.contextLabel || "이 페이지"} 룰베이스에 연결되지 않았어요.`,
          meta:"실제 AI 연결 전 더미 응답"
        })
      }
    },
    drawer:{
      key:"drawer",
      label:"보관함/재주문 모드",
      heading:"STATUS HUD · 보관함",
      subheading:"보관함 검색 + 채팅 가이드",
      chatHint:"재주문이나 검색 질문을 입력해 보세요.",
      summaryCards:[
        {
          id:"lookup",
          label:"검색 상태",
          value:"대기 중",
          meta:"입력 시 즉시 조회",
          detail:"보관함 검색은 주문번호 또는 이름+연락처 조합으로 바로 열립니다. 검색 시 서버에서 최신 주문을 다시 수신합니다.",
          actions:[{ label:"검색 폼 위치", action:"scroll", target:".drawer-search" }]
        },
        {
          id:"recentDrawer",
          label:"최근 조회 주문",
          value:"#DR-241",
          meta:"POP 세트",
          detail:"가장 최근에 조회한 주문은 #DR-241 POP 세트입니다. 동일 사양 재주문 버튼으로 즉시 작성할 수 있어요.",
          actions:[{ label:"재주문 버튼 보기", action:"scroll", target:".drawer-results" }]
        },
        {
          id:"reorderQueue",
          label:"재주문 감지",
          value:"2건",
          meta:"수정 재주문 포함",
          detail:"동일 사양 재주문 1건과 수정 재주문 1건이 대기 중입니다. 버튼 클릭 시 필요한 필드만 편집하도록 안내합니다.",
          actions:[{ label:"주문 페이지 열기", action:"go", target:"./index.html#order" }]
        },
        {
          id:"broStatus",
          label:"작업 브로 상태",
          value:"지원 대기",
          meta:"응답 1분 내",
          detail:"재주문 대화에 우선순위를 둔 상태입니다. 검색 실패 시 주문 정보를 다시 확인하도록 팁을 제공합니다."
        },
        {
          id:"points",
          label:"포인트/등급",
          value:"준비 중",
          meta:"더미 데이터",
          detail:"재주문 페이지에서도 포인트·등급은 아직 더미 표시입니다. 추후 고객 DB 연동 후 업데이트됩니다."
        }
      ],
      quickChips:[
        { id:"chip-drawer-repeat", label:"보관함에서 다시 주문하고 싶어요", prompt:"보관함에서 다시 주문하고 싶어요" },
        { id:"chip-search-without", label:"주문번호 없이 찾을 수 있나요?", prompt:"주문번호 없이 찾을 수 있나요?" },
        { id:"chip-edit-reorder", label:"수정 재주문은 어떻게 해요?", prompt:"수정 재주문은 어떻게 해요?" },
        { id:"chip-go-order", label:"주문 페이지 이동", action:{ type:"go", target:"./index.html#order" } }
      ],
      initialMessages:[
        { role:"system", label:"HUD", text:"보관함 페이지 모드를 활성화했습니다. 검색 결과에 맞춰 안내 메시지를 업데이트합니다." },
        { role:"system", label:"TIP", text:"검색 폼 아래 재주문/수정 재주문 버튼이 있는 카드에 맞춰 필요한 도움말을 제공합니다." }
      ],
      responses:{
        keywords:[
          {
            match:["다시","재주문","repeat","보관함"],
            message:"보관함 카드에 있는 \"재주문\" 버튼을 누르면 동일 사양이 주문 폼에 미리 채워집니다. 수정이 필요한 항목만 바꾼 뒤 다시 제출하세요.",
            actions:[{ label:"주문 폼 열기", action:"go", target:"./index.html#order" }]
          },
          {
            match:["주문번호","번호","없이","검색"],
            message:"주문번호가 없다면 이름과 휴대폰 뒷자리를 함께 입력하면 동일 주문을 찾을 수 있습니다. 연락처는 하이픈 없이 입력해 주세요.",
            actions:[{ label:"검색 폼 위치", action:"scroll", target:".drawer-search" }]
          },
          {
            match:["수정","옵션","변경","edit"],
            message:"수정 재주문 버튼은 기존 데이터를 복사한 뒤 옵션만 바꾸도록 돕습니다. 업로드 이미지가 있다면 다시 첨부해야 합니다.",
            meta:"이미지 파일은 자동 복사되지 않음"
          }
        ],
        fallback:(query, state) => ({
          message:`"${query}" 질문은 ${state?.contextLabel || "보관함"} 모드에 아직 등록되어 있지 않습니다.`,
          meta:"룰 확장 예정"
        })
      }
    },
    receipt:{
      key:"receipt",
      label:"주문 완료 모드",
      heading:"STATUS HUD · 접수 완료",
      subheading:"다음 행동을 안내하는 채팅",
      chatHint:"완료 후 궁금한 점을 질문해 보세요.",
      summaryCards:[
        {
          id:"orderDone",
          label:"접수된 주문",
          value:"완료",
          meta:"DB 저장 완료",
          detail:"주문이 정상적으로 저장되었으며 주문번호가 발급되었습니다. 메일/SMS 알림이 순차 전송됩니다.",
          actions:[{ label:"추가 주문 작성", action:"go", target:"./index.html" }]
        },
        {
          id:"nextAction",
          label:"다음 행동",
          value:"선택 대기",
          meta:"추가 주문/문의",
          detail:"추가 주문을 이어가거나 문의를 남겨 둘 수 있습니다. 좌측 버튼으로 바로 이동하세요.",
          actions:[
            { label:"주문 페이지", action:"go", target:"./index.html#order" },
            { label:"문의 메일", action:"go", target:"mailto:custombro365@gmail.com" }
          ]
        },
        {
          id:"drawerPrep",
          label:"보관함 등록",
          value:"진행 중",
          meta:"1~2분 소요",
          detail:"방금 주문은 자동으로 보관함에 저장됩니다. 잠시 후 drawer 페이지에서 같은 정보를 확인할 수 있어요.",
          actions:[{ label:"보관함 이동", action:"go", target:"./drawer.html" }]
        },
        {
          id:"broStatus",
          label:"작업 브로",
          value:"감사 메시지 전송",
          meta:"후속 안내 대기",
          detail:"작업 브로가 고객에게 감사 메시지를 전송하고 후속 제작 큐에 추가했습니다. 진행 상황을 HUD에서 계속 볼 수 있어요."
        },
        {
          id:"points",
          label:"포인트/등급",
          value:"준비 중",
          meta:"더미 데이터",
          detail:"포인트 적립은 아직 더미 처리되어 있습니다. 실제 적립분은 관리자 페이지에서만 확인 가능합니다."
        }
      ],
      quickChips:[
        { id:"chip-next", label:"다음으로 뭘 해야하나요?", prompt:"다음으로 뭘 해야하나요?" },
        { id:"chip-mail", label:"주문 확인 메일은 언제 오나요?", prompt:"주문 확인 메일은 언제 오나요?" },
        { id:"chip-edit", label:"방금 주문을 수정할 수 있나요?", prompt:"방금 주문을 수정할 수 있나요?" },
        { id:"chip-go-drawer", label:"보관함에서 확인", action:{ type:"go", target:"./drawer.html" } }
      ],
      initialMessages:[
        { role:"system", label:"HUD", text:"주문이 완료되었습니다. 다음 행동을 선택할 수 있도록 안내를 전환했습니다." },
        { role:"system", label:"TIP", text:"추가 주문이나 문의가 있다면 버튼을 누르거나 질문을 입력해 주세요." }
      ],
      responses:{
        keywords:[
          {
            match:["다음","next","추가"],
            message:"추가 주문을 이어가거나 메인 페이지로 돌아가 다른 상품을 구성할 수 있습니다.",
            actions:[{ label:"메인 페이지", action:"go", target:"./index.html" }]
          },
          {
            match:["메일","이메일","확인"],
            message:"주문 확인 메일은 최대 5분 이내로 발송됩니다. 스팸함도 함께 확인해 주세요.",
            meta:"메일 발송 대기열"
          },
          {
            match:["수정","edit","변경"],
            message:"주문서를 수정해야 한다면 보관함에서 방금 주문을 불러와 수정 재주문 버튼을 눌러 주세요.",
            actions:[{ label:"보관함으로 이동", action:"go", target:"./drawer.html" }]
          }
        ],
        fallback:(query, state) => ({
          message:`"${query}" 질문은 ${state?.contextLabel || "접수 완료"} 모드에 아직 연결되지 않았어요.`,
          meta:"룰 확장 예정"
        })
      }
    },
    admin:{
      key:"admin",
      label:"관리자 모드",
      heading:"STATUS HUD · 관리자",
      subheading:"주문 로그와 채팅형 안내",
      chatHint:"새 주문 확인이나 JSON 내보내기 질문을 입력하세요.",
      summaryCards:[
        {
          id:"monitor",
          label:"모니터링 중",
          value:"100건",
          meta:"/api/admin-orders",
          detail:"현재 관리자 API에서 최신 100건을 불러와 테이블에 표시하고 있습니다. 새로고침 버튼으로 즉시 갱신하세요.",
          actions:[{ label:"새로고침", action:"scroll", target:"#refreshBtn" }]
        },
        {
          id:"latestOrder",
          label:"최근 주문",
          value:"#A412",
          meta:"1분 전",
          detail:"마지막으로 들어온 주문은 #A412입니다. 표 상단에서 확인하고 필요하면 JSON을 복사하세요.",
          actions:[{ label:"상단으로 이동", action:"scroll", target:"body" }]
        },
        {
          id:"jsonState",
          label:"JSON 복사",
          value:"대기 중",
          meta:"버튼 준비",
          detail:"JSON 복사 버튼을 누르면 전체 데이터가 클립보드로 복사됩니다. 브라우저 권한이 필요합니다.",
          actions:[{ label:"JSON 복사", action:"scroll", target:"#copyJsonBtn" }]
        },
        {
          id:"broStatus",
          label:"작업 브로 상태",
          value:"관리자 모드",
          meta:"인증 유지",
          detail:"관리자 인증 토큰을 감시 중입니다. 만료 징후가 있으면 HUD가 알림을 띄울 예정입니다."
        },
        {
          id:"points",
          label:"포인트/등급",
          value:"준비 중",
          meta:"더미 데이터",
          detail:"관리자 화면에서도 고객 포인트는 아직 더미 데이터로만 노출됩니다."
        }
      ],
      quickChips:[
        { id:"chip-refresh", label:"신규 주문 불러오기", prompt:"신규 주문 불러오기" },
        { id:"chip-json", label:"JSON 데이터는 어떻게 복사하나요?", prompt:"JSON 데이터는 어떻게 복사하나요?" },
        { id:"chip-auth", label:"관리자 인증이 만료되면?", prompt:"관리자 인증이 만료되면 어떻게 되나요?" },
        { id:"chip-open-shop", label:"쇼핑몰 열기", action:{ type:"go", target:"./index.html" } }
      ],
      initialMessages:[
        { role:"system", label:"HUD", text:"관리자 모드로 전환했습니다. 주문 로그와 관리 작업 중심으로 답변합니다." }
      ],
      responses:{
        keywords:[
          {
            match:["신규","불러","새로고침","refresh"],
            message:"상단의 새로고침 버튼을 누르면 /api/admin-orders 에서 최신 100건을 다시 요청합니다.",
            actions:[{ label:"새로고침 버튼", action:"scroll", target:"#refreshBtn" }]
          },
          {
            match:["json","데이터","복사"],
            message:"JSON 복사 버튼은 현재 보이는 주문 목록을 그대로 복제합니다. 클릭 후 성공 알림을 확인하세요.",
            actions:[{ label:"JSON 복사", action:"scroll", target:"#copyJsonBtn" }]
          },
          {
            match:["인증","auth","login"],
            message:"관리자 인증이 만료되면 API 응답이 401로 바뀝니다. 다시 로그인해 토큰을 갱신해 주세요.",
            meta:"만료 전 HUD에서 경고 예정"
          }
        ],
        fallback:(query, state) => ({
          message:`"${query}" 질문은 ${state?.contextLabel || "관리자"} 모드에 아직 연결되지 않았어요.`,
          meta:"룰 확장 예정"
        })
      }
    }
  };

  function ready(fn){
    if(document.readyState === "loading"){
      document.addEventListener("DOMContentLoaded", fn, { once:true });
    } else {
      fn();
    }
  }

  ready(createHudElements);

  function createHudElements(){
    if(!document.body){ return; }

    const launcher = document.createElement("button");
    launcher.type = "button";
    launcher.className = "hud-launcher";
    launcher.setAttribute("aria-label","CustomBro 상태창 열기");

    const panel = document.createElement("aside");
    panel.className = "hud-panel";
    panel.setAttribute("aria-hidden","true");

    const scanlines = document.createElement("div");
    scanlines.className = "hud-scanlines";

    let hudState = createInitialState();
    let summaryResetTimer = null;

    function createInitialState(){
      const key = resolvePageKey();
      const preset = HUD_CONTEXTS[key] || HUD_CONTEXTS.home;
      const state = {
        contextKey:key,
        contextLabel:preset.label,
        heading:preset.heading || "STATUS HUD",
        subheading:preset.subheading || "Interactive 상태창",
        chatHint:preset.chatHint || "질문을 입력하세요.",
        summaryCards:cloneSummaryCards(preset.summaryCards),
        quickChips:cloneQuickChips(preset.quickChips),
        chatLog:cloneChatLog(preset.initialMessages),
        responseBank:preset.responses || {},
        lastActiveCardId:null,
        isTyping:false
      };
      if(state.chatLog.length === 0){
        state.chatLog = [{ role:"system", label:"HUD", text:"CustomBro HUD가 준비되었습니다." }];
      }
      return state;
    }

    function render(){
      panel.innerHTML = templateFromState(hudState);
      panel.appendChild(scanlines);
      attachComposer();
      scrollLogToBottom();
    }

    function attachComposer(){
      const form = panel.querySelector(".hud-composer");
      const input = form?.querySelector("input[name='hudInput']");
      if(!form || !input){ return; }
      form.addEventListener("submit", evt => {
        evt.preventDefault();
        submitPrompt(input.value);
        input.value = "";
      });
    }

    render();

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

    panel.addEventListener("click", evt => {
      const closeBtn = evt.target.closest(".hud-close");
      if(closeBtn){
        close();
        return;
      }
      const card = evt.target.closest(".hud-summary-card");
      if(card && panel.contains(card)){
        handleSummaryCard(card.getAttribute("data-card-id"));
        return;
      }
      const chip = evt.target.closest("[data-hud-chip]");
      if(chip && panel.contains(chip)){
        const prompt = chip.getAttribute("data-hud-chip");
        if(prompt){ submitPrompt(prompt); }
        return;
      }
      const actionBtn = evt.target.closest("[data-hud-action]");
      if(actionBtn && panel.contains(actionBtn)){
        const action = actionBtn.getAttribute("data-hud-action");
        const target = actionBtn.getAttribute("data-hud-target");
        handleAction(action, target);
        close();
        return;
      }
    });

    document.addEventListener("keydown", evt => {
      if(evt.key === "Escape"){
        close();
      }
    });

    function submitPrompt(rawValue){
      const text = (rawValue || "").trim();
      if(!text){ return; }
      pushHudMessage({ role:"user", label:"YOU", text });
      setTyping(true);
      window.setTimeout(() => {
        const response = resolveHudResponse(text, hudState);
        setTyping(false);
        pushHudMessage({
          role:"system",
          label:response.label || "HUD",
          text:response.text || "",
          meta:response.meta,
          actions:response.actions
        });
      }, 260);
    }

    function handleSummaryCard(cardId){
      const card = hudState.summaryCards.find(item => item.id === cardId);
      hudState.lastActiveCardId = cardId;
      window.clearTimeout(summaryResetTimer);
      if(card){
        summaryResetTimer = window.setTimeout(() => {
          hudState.lastActiveCardId = null;
          render();
        }, SUMMARY_ACTIVE_TIMEOUT);
      }
      if(card && card.detail){
        const shouldShowMeta = card.meta && !(typeof card.detail === "string" && card.detail.indexOf(card.meta) > -1);
        pushHudMessage({
          role:"system",
          label:card.label || "HUD",
          text:card.detail,
          meta:shouldShowMeta ? card.meta : undefined,
          actions:card.actions
        });
      } else {
        render();
      }
    }

    function pushHudMessage(entry){
      const payload = {
        role:entry.role || "system",
        label:entry.label,
        text:entry.text || "",
        meta:entry.meta,
        actions:Array.isArray(entry.actions) ? entry.actions.map(action => ({ ...action })) : []
      };
      hudState.chatLog = [...hudState.chatLog, payload].slice(-CHAT_LOG_LIMIT);
      render();
    }

    function setTyping(flag){
      hudState.isTyping = !!flag;
      render();
    }

    function scrollLogToBottom(){
      const logEl = panel.querySelector("[data-hud-log]");
      if(!logEl){ return; }
      logEl.scrollTop = logEl.scrollHeight;
    }

    function setData(next){
      if(!next || typeof next !== "object"){ return; }
      if(next.summaryCards){ hudState.summaryCards = cloneSummaryCards(next.summaryCards); }
      if(next.quickChips){ hudState.quickChips = cloneQuickChips(next.quickChips); }
      if(next.chatLog){ hudState.chatLog = cloneChatLog(next.chatLog); }
      if(next.responseBank){ hudState.responseBank = next.responseBank; }
      if(next.contextLabel){ hudState.contextLabel = next.contextLabel; }
      if(next.heading){ hudState.heading = next.heading; }
      if(next.subheading){ hudState.subheading = next.subheading; }
      if(next.chatHint){ hudState.chatHint = next.chatHint; }
      render();
    }

    window.CustomBroHUD = { open, close, toggle, setData };
  }

  function resolvePageKey(){
    const path = (window.location.pathname || "").toLowerCase();
    if(path.endsWith("drawer.html")) return "drawer";
    if(path.endsWith("order-complete.html")) return "receipt";
    if(path.endsWith("admin-orders.html")) return "admin";
    return "home";
  }

  function resolveHudResponse(query, state){
    const bank = state?.responseBank || {};
    const normalized = (query || "").trim().toLowerCase();
    if(isSearchPrompt(normalized)){
      const searchResponse = formatResponse(buildSearchResponse(query, state));
      if(searchResponse.text){
        return searchResponse;
      }
    }
    const keywords = Array.isArray(bank.keywords) ? bank.keywords : [];
    const matched = keywords.find(rule => matchesRule(rule, normalized));
    let base = matched || matchSummaryCardResponse(normalized, state);
    if(!base){
      base = bank.fallback;
    }
    const response = formatResponse(base, query, state);
    if(!response.text){
      response.text = "아직 준비되지 않은 질문이에요. 요구사항 문서를 참고해 주세요.";
    }
    if(!response.actions){
      response.actions = [];
    }
    return response;
  }

  function matchesRule(rule, normalized){
    if(!rule || !normalized){ return false; }
    if(rule.matchRegex && rule.matchRegex.test(normalized)){ return true; }
    if(Array.isArray(rule.match)){
      return rule.match.some(token => normalized.includes(token));
    }
    return false;
  }

  function formatResponse(source, query, state){
    if(typeof source === "function"){
      return formatResponse(source(query, state));
    }
    if(typeof source === "string"){
      return { text:source };
    }
    if(source && typeof source === "object"){
      return {
        text:source.message || source.text || "",
        meta:source.meta,
        label:source.label,
        actions:Array.isArray(source.actions) ? source.actions.map(action => ({ ...action })) : []
      };
    }
    return {};
  }

  function templateFromState(state){
    const summaryCards = (state.summaryCards || []).map(card => {
      const active = state.lastActiveCardId === card.id ? " data-active=\"true\"" : "";
      const trend = card.trend ? `<span class="hud-card-trend">${escapeHtml(card.trend)}</span>` : "";
      return `<article class="hud-summary-card" data-card-id="${escapeHtml(card.id || "card")}"${active}>
        <span class="hud-card-label">${escapeHtml(card.label || "요약")}</span>
        <strong>${escapeHtml(card.value || "-")}</strong>
        <p class="hud-card-meta">${escapeHtml(card.meta || "")}</p>
        ${trend}
      </article>`;
    }).join("");

    const logEntries = (state.chatLog || []).map(entry => {
      const roleClass = entry.role === "user" ? "user" : "system";
      const label = entry.label ? `<span class="hud-message-label">${escapeHtml(entry.label)}</span>` : "";
      const meta = entry.meta ? `<span class="hud-message-meta">${escapeHtml(entry.meta)}</span>` : "";
      const actions = Array.isArray(entry.actions) && entry.actions.length ? `<div class="hud-chat-actions">${entry.actions.map(action => {
        const type = escapeHtml(action.action || "go");
        const target = escapeHtml(action.target || "");
        return `<button type="button" data-hud-action="${type}" data-hud-target="${target}">${escapeHtml(action.label || "바로가기")}</button>`;
      }).join("")}</div>` : "";
      return `<div class="hud-chat-row ${roleClass}">
        <div class="hud-message-bubble">
          ${label}
          <p class="hud-message-text">${escapeHtml(entry.text || "")}</p>
          ${meta}
          ${actions}
        </div>
      </div>`;
    }).join("");

    const typing = state.isTyping ? `<div class="hud-chat-row system"><div class="hud-message-bubble typing"><span class="hud-typing-line"></span></div></div>` : "";

    const chips = (state.quickChips || []).map(chip => {
      if(chip.action){
        const type = escapeHtml(chip.action.type || "go");
        const target = escapeHtml(chip.action.target || "");
        return `<button type="button" class="hud-chip action" data-hud-action="${type}" data-hud-target="${target}">${escapeHtml(chip.label || "바로가기")}</button>`;
      }
      const prompt = chip.prompt || chip.label || "질문";
      return `<button type="button" class="hud-chip" data-hud-chip="${escapeHtml(prompt)}">${escapeHtml(chip.label || prompt)}</button>`;
    }).join("") || `<button type="button" class="hud-chip" disabled>추천 질문 준비 중</button>`;

    return `
      <header>
        <div>
          <p>${escapeHtml(state.heading || "STATUS HUD")}</p>
          <strong>${escapeHtml(state.subheading || "Interactive 상태창")}</strong>
        </div>
        <button type="button" class="hud-close" aria-label="상태창 닫기">✕</button>
      </header>
      <div class="hud-layout">
        <section class="hud-summary">
          <div class="hud-summary-head">
            <span>요약 카드</span>
            <em>${escapeHtml(state.contextLabel || "PAGE")}</em>
          </div>
          <div class="hud-summary-cards">
            ${summaryCards}
          </div>
        </section>
        <section class="hud-chat">
          <div class="hud-chat-head">
            <h3>채팅 / 검색</h3>
            <p>${escapeHtml(state.chatHint || "질문을 입력하세요.")}</p>
          </div>
          <div class="hud-chat-log" data-hud-log>
            ${logEntries}
            ${typing}
          </div>
          <div class="hud-chip-bar">
            ${chips}
          </div>
          <form class="hud-composer" autocomplete="off">
            <input type="text" name="hudInput" placeholder="질문을 입력하거나 칩을 선택하세요" aria-label="HUD 질문 입력" />
            <button type="submit" class="hud-send">전송</button>
          </form>
        </section>
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

  function cloneSummaryCards(cards){
    return Array.isArray(cards) ? cards.map(card => ({
      ...card,
      actions:Array.isArray(card.actions) ? card.actions.map(action => ({ ...action })) : undefined
    })) : [];
  }

  function cloneQuickChips(chips){
    return Array.isArray(chips) ? chips.map(chip => ({
      ...chip,
      action:chip.action ? { ...chip.action } : undefined
    })) : [];
  }

  function cloneChatLog(log){
    return Array.isArray(log) ? log.map(entry => ({
      role:entry.role || "system",
      label:entry.label,
      text:entry.text || "",
      meta:entry.meta,
      actions:Array.isArray(entry.actions) ? entry.actions.map(action => ({ ...action })) : []
    })) : [];
  }

  function isSearchPrompt(normalized){
    if(!normalized){ return false; }
    return SEARCH_TRIGGER_REGEX.test(normalized);
  }

  function buildSearchResponse(query, state){
    const normalized = (query || "").trim().toLowerCase();
    if(!normalized){ return { text:"" }; }
    const cards = state?.summaryCards || [];
    const tokens = normalized.split(/\s+/).filter(Boolean);
    const matches = cards.filter(card => tokens.some(token => token.length > 1 && summarySearchString(card).includes(token))).slice(0, 2);
    if(matches.length === 0){
      return {
        text:`"${query}" 관련 요약 카드를 아직 찾지 못했어요.`,
        meta:"더미 검색 응답",
        label:"SEARCH"
      };
    }
    const responseText = matches.map(card => {
      const detail = card.detail || card.meta || `현재 값 ${card.value || "-"}`;
      return `${card.label}: ${detail}`;
    }).join("\n\n");
    return {
      text:responseText,
      meta:"요약 카드 검색 결과",
      label:"SEARCH",
      actions:collectLimitedActions(matches, 3)
    };
  }

  function matchSummaryCardResponse(normalized, state){
    if(!normalized){ return null; }
    const cards = state?.summaryCards || [];
    const tokens = normalized.split(/\s+/).filter(Boolean);
    const found = cards.find(card => tokens.some(token => token.length > 1 && summarySearchString(card).includes(token)));
    if(!found){ return null; }
    return {
      text:found.detail || `${found.label || "요약"} 상태는 ${found.value || "정보 없음"} 입니다.`,
      meta:found.meta,
      label:found.label,
      actions:found.actions
    };
  }

  function collectLimitedActions(cards, limit){
    const actions = [];
    cards.forEach(card => {
      (card.actions || []).forEach(action => {
        if(actions.length < limit){
          actions.push(action);
        }
      });
    });
    return actions;
  }

  function summarySearchString(card){
    return [card.label, card.meta, card.detail, card.value].filter(Boolean).join(" ").toLowerCase();
  }

  function escapeHtml(value){
    return (value ?? "").toString()
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;");
  }
})();
