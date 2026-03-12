(function(){
  if(window.CustomBroHUD){ return; }

  const CHAT_LOG_LIMIT = 14;
  const TOPIC_LOG_LIMIT = 6;
  const FOLLOWUP_LIMIT = 3;
  const SUMMARY_ACTIVE_TIMEOUT = 4200;
  const SEARCH_TRIGGER_REGEX = /(검색|찾|search|where|어디|query)/;
  const HUD_BUILD_MARK = "HUD_DIALOGUE_V7_20260312";
  const HUD_STORAGE_KEY = "custombro_hud_chat_v7";
  const HUD_CUSTOMER_COPY_MARK = "HUD_CUSTOMER_COPY_V8_20260312";
  const HUD_BUILD_MARK = "HUD_DIALOGUE_V6_20260312";
  const HUD_BUILD_MARK = "HUD_DIALOGUE_V5_20260312";

  const HUD_CONTEXTS = {
    home:{
      key:"home",
      label:"주문/제작 모드",
      heading:"STATUS HUD · 제작",
      subheading:"작은 요약 + 큰 채팅으로 주문 상황 안내",
      chatHint:"주문 흐름이나 제작 대기 상황을 바로 물어보세요.",
      defaultTopic:"orders",
      summaryCards:[
        {
          id:"orders",
          topic:"orders",
          label:"현재 주문",
          value:"12건",
          meta:"오늘 2건 추가",
          detail:"지금 12건 진행 중이에요. 급한 2건은 표시해 뒀고 필요하면 관리자 화면에서 순서를 바꿀 수 있어요.",
          actions:[{ label:"관리자 주문 열기", action:"go", target:"./admin-orders.html" }]
        },
        {
          id:"recentBuild",
          topic:"build",
          label:"최근 제작",
          value:"아크릴 키링",
          meta:"POP 2세트 병행",
          detail:"방금까지 아크릴 키링과 POP 세트가 같이 돌아갔어요. 빌더에서 옵션 다시 볼 수 있어요.",
          actions:[{ label:"키링 빌더 이동", action:"scroll", target:"#keyring" }]
        },
        {
          id:"drawerState",
          topic:"drawer",
          label:"보관함",
          value:"3건 준비",
          meta:"재주문 대기",
          detail:"보관함에 3건이 저장돼 있고 주문번호나 연락처를 넣으면 바로 불러올 수 있어요.",
          actions:[{ label:"보관함 열기", action:"go", target:"./drawer.html" }]
        },
        {
          id:"broStatus",
          topic:"ops",
          label:"작업 브로",
          value:"보통 바쁨",
          meta:"응답 3일 이내",
          detail:"작업 브로가 하루 두 번 상태를 정리하고 있어요. 급하면 채팅으로 남겨 주세요."
        },
        {
          id:"points",
          topic:"points",
          label:"포인트/등급",
          value:"준비 중",
          meta:"더미 데이터",
          detail:"포인트는 아직 더미 값이에요. 실제 연결 전까지 참고용으로만 봐 주세요."
        }
      ],
      quickChips:[
        { id:"chip-order-how", label:"주문 절차 알려줘", prompt:"주문은 어떻게 하나요?", topic:"orders" },
        { id:"chip-drawer", label:"보관함 재주문", prompt:"보관함에서 다시 주문하고 싶어요", topic:"drawer" },
        { id:"chip-backlog", label:"제작 대기", prompt:"지금 제작이 얼마나 밀려있나요?", topic:"orders" },
        { id:"chip-keyring", label:"키링 제작 팁", prompt:"키링 제작 방법 알려줘", topic:"build" },
        { id:"chip-open-drawer", label:"보관함 열기", action:{ type:"go", target:"./drawer.html" } }
      ],
      initialMessages:[
        { role:"system", label:"BRO", text:"지금 보고 계신 제작 페이지 기준으로 같이 볼게요. 막히는 부분을 편하게 말해 주세요.", topic:"orders" },
        { role:"system", label:"TIP", text:"왼쪽 카드를 누르면 그 주제로 바로 이어서 설명하고, 아래 버튼은 빠른 질문이에요.", topic:"orders" }
      ],
      responses:{
        keywords:[
          {
            match:["주문","order","접수"],
            message:"원하시는 옵션을 고르고 주문 정보를 보내주시면 주문이 정상 접수됩니다. 접수 후에는 제작 순서에 맞춰 진행돼요.",
            meta:"주문 페이지 안내",
            actions:[{ label:"주문 섹션으로 이동", action:"scroll", target:"#order" }]
          },
          {
            match:["보관함","drawer","재주문","서랍"],
            message:"보관함에서는 예전에 주문한 내용을 다시 불러와서 같은 내용으로 다시 주문하거나, 조금 고쳐서 다시 주문할 수 있어요.",
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
          message:`아직 질문 뜻을 정확히 못 알아들었어요. 주문방법, 다시주문, 제작기간 중 어떤 게 궁금한지만 짧게 적어주시면 바로 이어서 설명해드릴게요.`,
          meta:"쉽게 다시 안내해드릴게요"
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
          detail:"보관함 검색은 주문번호 또는 이름+연락처 조합으로 바로 열립니다. 검색 시 최신 주문 상태를 다시 확인합니다.",
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
          detail:"재주문 페이지에서도 포인트·등급은 아직 더미 표시입니다. 정확한 표시가 곧 연결될 예정입니다."
        }
      ],
      quickChips:[
        { id:"chip-drawer-repeat", label:"보관함에서 다시 주문하고 싶어요", prompt:"보관함에서 다시 주문하고 싶어요" },
        { id:"chip-search-without", label:"주문번호 없이 찾을 수 있나요?", prompt:"주문번호 없이 찾을 수 있나요?" },
        { id:"chip-edit-reorder", label:"수정 재주문은 어떻게 해요?", prompt:"수정 재주문은 어떻게 해요?" },
        { id:"chip-go-order", label:"주문 페이지 이동", action:{ type:"go", target:"./index.html#order" } }
      ],
      initialMessages:[
        { role:"system", label:"BRO", text:"보관함 기준으로 같이 볼게요. 찾는 주문이나 다시 주문하고 싶은 건을 말해 주세요." },
        { role:"system", label:"TIP", text:"주문번호 없이 찾기, 동일사양 재주문, 수정 재주문 중 원하는 흐름으로 바로 이어갈 수 있어요." }
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
            message:"주문번호가 없어도 괜찮아요. 주문하신 분 이름과 휴대폰 뒷자리를 함께 입력하면 주문을 찾을 수 있어요.",
            actions:[{ label:"검색 폼 위치", action:"scroll", target:".drawer-search" }]
          },
          {
            match:["수정","옵션","변경","edit"],
            message:"수정 재주문은 예전 주문 내용을 바탕으로 필요한 부분만 바꿔서 다시 주문하는 방식이에요. 사진이 들어간 주문이라면 이미지를 다시 올려주셔야 할 수 있어요.",
            meta:"사진은 다시 올려주셔야 할 수 있어요"
          }
        ],
        fallback:(query, state) => ({
          message:`"${query}"라고 하신 건 보관함 흐름에서 다시 풀어드릴 수 있어요. 주문번호 없이 찾기, 동일사양 재주문, 수정 재주문 중 어떤 건지 말해 주세요.`,
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
        { role:"system", label:"BRO", text:"주문 접수는 끝났어요. 이제 수정할지, 보관함에서 다시 볼지 같이 정리해드릴게요." },
        { role:"system", label:"TIP", text:"추가 주문, 수정, 보관함 확인 중 다음 행동을 바로 선택할 수 있어요." }
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
            message:"방금 넣은 주문 내용을 바꾸고 싶다면 보관함에서 해당 주문을 불러와 수정 재주문을 누르시면 돼요.",
            actions:[{ label:"보관함으로 이동", action:"go", target:"./drawer.html" }]
          }
        ],
        fallback:(query, state) => ({
          message:`"${query}" 이후에 뭘 하면 좋을지 같이 정리해드릴게요. 추가 주문, 수정, 보관함 확인 중 원하는 방향을 말해 주세요.`,
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
        { role:"system", label:"BRO", text:"관리자 화면 기준으로 같이 보겠습니다. 주문 로그, 재주문 건, JSON 복사 흐름까지 바로 안내할게요." }
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
          message:`"${query}" 기준으로 관리자 화면에서 이어볼 수 있어요. 신규 주문 확인, 재주문 건 보기, JSON 복사 중 원하는 쪽을 말해 주세요.`,
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
    try{
      const cachedLog = JSON.parse(localStorage.getItem(`${HUD_STORAGE_KEY}:${hudState.contextKey}`) || "null");
      if(Array.isArray(cachedLog) && cachedLog.length){
        hudState.chatLog = cachedLog.slice(-CHAT_LOG_LIMIT);
      }
    } catch {}
    let summaryResetTimer = null;
    let forceScrollBottom = true;
    let lastKnownScrollTop = 0;
    const HUD_SCROLL_V7 = true;

    function createInitialState(){
      const key = resolvePageKey();
      const preset = HUD_CONTEXTS[key] || HUD_CONTEXTS.home;
      const summaryCards = cloneSummaryCards(preset.summaryCards);
      const quickChips = cloneQuickChips(preset.quickChips);
      const defaultTopic = preset.defaultTopic || getCardTopic(summaryCards[0]) || "general";
      const topicLogs = {};
      const initialLog = cloneChatLog(preset.initialMessages, defaultTopic);
      topicLogs[defaultTopic] = initialLog.length ? initialLog : [{
        role:"system",
        label:"BRO",
        text:"브로 상태창 준비 끝. 바로 이어서 도와드릴게요.",
        topic:defaultTopic
      }];
      const state = {
        contextKey:key,
        contextLabel:preset.label,
        heading:preset.heading || "STATUS HUD",
        subheading:preset.subheading || "Interactive 상태창",
        chatHint:preset.chatHint || "질문을 입력하세요.",
        summaryCards,
        quickChips,
        topicLogs,
        topicFollowups:{},
        responseBank:preset.responses || {},
        activeTopic:defaultTopic,
        lastActiveCardId:null,
        isTyping:false
      };
      state.topicFollowups[defaultTopic] = buildDefaultFollowups(defaultTopic, state.contextKey);
      return state;
    }
;
      if(state.chatLog.length === 0){
        state.chatLog = [{ role:"system", label:"BRO", text:"브로 상태창 준비 끝. 바로 이어서 도와드릴게요." }];
      }
      return state;
    }

    function render(){
      const prevLogEl = panel.querySelector("[data-hud-log]");
      const shouldStick = forceScrollBottom || isNearBottom(prevLogEl);
      if(prevLogEl){ lastKnownScrollTop = prevLogEl.scrollTop; }

      panel.innerHTML = templateFromState(hudState);
      panel.appendChild(scanlines);
      attachComposer();

      const nextLogEl = panel.querySelector("[data-hud-log]");
      if(nextLogEl){
        nextLogEl.addEventListener("scroll", () => {
          lastKnownScrollTop = nextLogEl.scrollTop;
        }, { passive:true });

        if(shouldStick){
          scrollLogToBottom();
        } else {
          restoreScroll(nextLogEl);
        }
      }

      forceScrollBottom = false;
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
          label:response.label || "BRO",
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
          label:card.label || "BRO",
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
      forceScrollBottom = true;
      try{
        localStorage.setItem(`${HUD_STORAGE_KEY}:${hudState.contextKey}`, JSON.stringify(hudState.chatLog));
      } catch {}
      render();
    }

    function setTyping(flag){
      hudState.isTyping = !!flag;
      render();
    }

    function isNearBottom(logEl){
      if(!logEl){ return true; }
      return (logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight) < 28;
    }

    function restoreScroll(logEl){
      if(!logEl){ return; }
      logEl.scrollTop = Math.max(0, Math.min(lastKnownScrollTop, logEl.scrollHeight));
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
    const previousUserMessage = Array.isArray(state?.chatLog)
      ? [...state.chatLog].reverse().find(entry =>
          entry &&
          entry.role === "user" &&
          (entry.text || "").trim() &&
          (entry.text || "").trim().toLowerCase() !== normalized
        )
      : null;

    if(/^(안녕|안녕하세요|ㅎㅇ|hello|hi)$/.test(normalized)){
      return formatResponse({
        label:"BRO",
        message:`안녕하세요. 지금 ${state?.contextLabel || "현재 페이지"} 기준으로 같이 보고 있어요. 주문, 보관함, 재주문 중에서 어떤 걸 먼저 볼까요?`,
        meta:"대화형 안내"
      });
    }

    if(/^(야|있어|뭐해|헬프|help)$/.test(normalized)){
      return formatResponse({
        label:"BRO",
        message:`네, 여기 있어요. ${state?.contextLabel || "현재 페이지"} 기준으로 바로 이어서 볼게요. 필요한 걸 짧게 말해 주세요.`,
        meta:"바로 응답"
      });
    }

    if(/(뭐야|뭔데|무슨 뜻|내가 뭐|왜 안돼|왜 안돼요|이게 뭐)/.test(normalized)){
      const prev = previousUserMessage && previousUserMessage.text
        ? `방금 "${previousUserMessage.text}"라고 하신 흐름을 기준으로 보면, `
        : "";
      return formatResponse({
        label:"BRO",
        message:`${prev}${state?.contextLabel || "이 페이지"}에서는 주문 진행, 보관함 조회, 재주문 연결 중 하나로 바로 이어서 도와드릴 수 있어요. 제가 다음 행동도 바로 집어드릴게요.`,
        meta:"문맥 기반 답변"
      });
    }
    const previousUserMessage = Array.isArray(state?.chatLog)
      ? [...state.chatLog].reverse().find(entry =>
          entry &&
          entry.role === "user" &&
          (entry.text || "").trim() &&
          (entry.text || "").trim().toLowerCase() !== normalized
        )
      : null;

    const previousBotMessage = Array.isArray(state?.chatLog)
      ? [...state.chatLog].reverse().find(entry =>
          entry &&
          entry.role !== "user" &&
          (entry.text || "").trim()
        )
      : null;

    if(/^(안녕|안녕하세요|ㅎㅇ|hello|hi)$/.test(normalized)){
      return formatResponse({
        label:"BRO",
        message:`안녕하세요. 지금 ${state?.contextLabel || "현재 페이지"} 기준으로 같이 보고 있어요. 주문, 보관함, 재주문 중에서 어떤 걸 먼저 볼까요?`,
        meta:"대화형 안내"
      });
    }

    if(/^(야|있어|뭐해|헬프|help)$/.test(normalized)){
      return formatResponse({
        label:"BRO",
        message:`네, 여기 있어요. ${state?.contextLabel || "현재 페이지"} 기준으로 바로 이어서 볼게요. 필요한 걸 짧게 말해 주세요.`,
        meta:"바로 응답"
      });
    }

    if(/^(d|di|\?+|뭐야|뭐라는거야|뭐라는 거야|왜|왜 안돼|왜 안돼요|이게 뭐야|뭔 소리야)$/.test(normalized)){
      const prevText = previousBotMessage && previousBotMessage.text ? previousBotMessage.text : "";
      const contextHint =
        state?.contextKey === "drawer" ? "주문 찾기 / 동일사양 재주문 / 수정 재주문" :
        state?.contextKey === "admin" ? "신규 주문 확인 / 재주문 건 보기 / JSON 복사" :
        state?.contextKey === "receipt" ? "추가 주문 / 수정 / 보관함 확인" :
        "주문 방법 / 보관함 / 제작 대기";

      return formatResponse({
        label:"BRO",
        message: prevText
          ? `좋아요. 방금 제 설명이 딱딱했어요. 쉽게 말하면 "${prevText}" 흐름에서 ${contextHint} 중 원하는 걸 바로 이어서 도와드릴 수 있다는 뜻이에요. 필요한 것만 한 단어로 말해 주세요.`
          : `좋아요. 더 쉽게 도와드릴게요. ${contextHint} 중 지금 필요한 걸 한 단어로 말해 주세요.`,
        meta:"문맥 재설명"
      });
    }

    if(normalized.length -le 2 -and normalized -notmatch "[0-9]"){
      return formatResponse({
        label:"BRO",
        message:`짧게 보내주셔도 괜찮아요. 주문, 다시주문, 제작기간, 수정 중 하나만 적어주셔도 바로 이어서 설명해드릴게요.`,
        meta:"짧은 입력 보정"
      });
    }

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
      const roleClass = entry.role === "user" ? "user" : "bot";
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

    const typing = state.isTyping ? `<div class="hud-chat-row bot"><div class="hud-message-bubble typing"><span class="hud-typing-line"></span></div></div>` : "";

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
            <input type="text" name="hudInput" placeholder="궁금한 걸 편하게 적어주세요. 제가 손님 입장에서 쉽게 설명해드릴게요" aria-label="HUD 질문 입력" />
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
    const previousUserMessage = Array.isArray(state?.chatLog)
      ? [...state.chatLog].reverse().find(entry =>
          entry &&
          entry.role === "user" &&
          (entry.text || "").trim() &&
          (entry.text || "").trim().toLowerCase() !== normalized
        )
      : null;

    if(/^(안녕|안녕하세요|ㅎㅇ|hello|hi)$/.test(normalized)){
      return formatResponse({
        label:"BRO",
        message:`안녕하세요. 지금 ${state?.contextLabel || "현재 페이지"} 기준으로 같이 보고 있어요. 주문, 보관함, 재주문 중에서 어떤 걸 먼저 볼까요?`,
        meta:"대화형 안내"
      });
    }

    if(/^(야|있어|뭐해|헬프|help)$/.test(normalized)){
      return formatResponse({
        label:"BRO",
        message:`네, 여기 있어요. ${state?.contextLabel || "현재 페이지"} 기준으로 바로 이어서 볼게요. 필요한 걸 짧게 말해 주세요.`,
        meta:"바로 응답"
      });
    }

    if(/(뭐야|뭔데|무슨 뜻|내가 뭐|왜 안돼|왜 안돼요|이게 뭐)/.test(normalized)){
      const prev = previousUserMessage && previousUserMessage.text
        ? `방금 "${previousUserMessage.text}"라고 하신 흐름을 기준으로 보면, `
        : "";
      return formatResponse({
        label:"BRO",
        message:`${prev}${state?.contextLabel || "이 페이지"}에서는 주문 진행, 보관함 조회, 재주문 연결 중 하나로 바로 이어서 도와드릴 수 있어요. 제가 다음 행동도 바로 집어드릴게요.`,
        meta:"문맥 기반 답변"
      });
    }
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
