(function () {
  "use strict";
  const screen = document.getElementById("screen");
  const help = document.getElementById("help");
  const chapters = window.BreathContent.chapter;
  const visited = new Set();
  const acknowledged = new Set();
  const action = (name, value) => '[data-action="' + name + '"]' +
    (value === undefined ? "" : '[data-value="' + value + '"]');
  const step = (id, target, title, body, next = "") => ({id,target,title,body,next});
  let state, group = "", active = false, current, target, frame = 0, needsScroll = false;
  let hintMode = false, assists = {}, extraTargets = [];
  const quickHint = document.createElement("button");
  quickHint.type = "button"; quickHint.id = "quick-hint"; quickHint.className = "quick-hint";
  quickHint.textContent = "卡住了？給我提示";
  quickHint.setAttribute("aria-expanded","false"); quickHint.setAttribute("aria-controls","instruction-panel");
  quickHint.hidden = true;

  function gather() {
    if (state.records.length) return step("gather-done",".collected","第一份紀錄已完成",
      "你已把 Excel 和 PPT 接成一張可追查的紀錄。接著整理另一份在收件窗內的資料，完成兩份就能進入判讀迷宮。","換我試試");
    const selectedId = state.token.split(":")[0];
    const picked = window.BreathContent.records.find((record) =>
      record.id === (state.draft.id?.record.id || selectedId));
    const record = picked && window.BreathContent.fitWindow(picked) ? picked :
      window.BreathContent.records.find((entry) => window.BreathContent.fitWindow(entry));
    const missing = ["id","date","type","result"].find((key) => state.draft[key]?.record.id !== record.id);
    if (!missing) return step("gather-collect",action("collect"),"把這份紀錄收進案卷",
      "四格都來自 " + record.id + "。按「收錄這份紀錄」，來源的儲存格與投影片會一起留下。");
    const labels = {id:"檢體編號",date:"採檢時間",type:"檢體類型",result:"檢驗結果"};
    const token = record.id + ":" + missing;
    if (state.token === token) return step("gather-place-" + missing,action("slot",missing),
      "放進「" + labels[missing] + "」",
      "你已選好來源資料。再點這個欄位放入，也可以直接把資料拖進來。");
    const source = missing === "result" ? "ppt" : "excel";
    if (state.source !== source) return step("gather-source-" + source,action("source",source),
      missing === "result" ? "到 PPT 查這個檢體的報告" : "切回採檢 Excel",
      missing === "result" ? "採檢清冊有編號、時間和類型。檢驗結果要從對應的 PPT 投影片取得。" :
        "先從清冊抄錄 " + labels[missing] + "，用同一列把資料接起來。");
    if (source === "ppt" && state.slide !== record.id) return step("gather-slide-" + record.id,
      action("slide",record.id),"翻到相同檢體的投影片","點這張縮圖，核對報告裡的檢體編號是不是 " + record.id + "。");
    const copy = {
      id:"先點 Excel 裡的 " + record.id + "，再點紀錄表的「檢體編號」。這樣就知道這張卡在整理哪一次採檢。",
      date:"點同一列的採檢時間。日期和時分會一起帶入，別把 PPT 上的核發日當成採檢日。",
      type:"這格寫的是 " + record.type + "（" + record.sampleCode + "）。把檢體來源也帶到紀錄表。",
      result:"確認報告編號，再點下方「帶入紀錄表」的結果。下一步把它放進檢驗結果欄。"
    };
    return step("gather-take-" + missing,action("token",token),"取出「" + labels[missing] + "」",copy[missing]);
  }

  function labyrinth() {
    const session=state.labyrinth;
    if (!session || session.dialog) return null;
    if (session.complete) return step("labyrinth-finished",action("review-next"),"把走過的線索帶去下一站",
      "這次探索了念珠菌路線。接著帶原始案卷裡 K. variicola 的疑問去文獻室。","繼續調查");
    if (session.visited.length>2 || acknowledged.has("labyrinth-walk")) return null;
    return step("labyrinth-walk",".labyrinth-controls .dpad","先試著走幾步",
      "身邊只有一圈微光。用方向鍵、WASD 或點亮處的石板路移動，手機可按住方向按鈕。走近亮點查看線索，小地圖會留下探索紀錄。","我知道了");
  }

  function maze() {
    const session = state.maze;
    if (!session || session.walking || session.drawer === "book") return null;
    if (session.feedback) return step("maze-message",action("maze-continue"),"看清這扇門留下的提示",
      "方向和依據都對上，才會把這一步寫進路徑。若還缺線索，可以回頭查手冊與原單。");
    if (Object.keys(session.results).length === 3) return step("maze-finished",action("review-next"),
      "三個候選走出了不同路徑","這些路徑會跟著案卷進到最後的報告。接著帶仍有疑問的候選去查文獻。","繼續調查");
    if (session.candidate !== "A" || session.index > 0) return step("maze-done",action("maze-book"),
      "後面的門換你來判斷","每次先查線索樹和手冊，再從案卷選依據。三個候選需要的資料不同，也會走到不同出口。","換我試試");
    if (!session.readBook) return step("maze-book",action("maze-book"),"先讀這扇門的規則",
      "門牌是分支，判讀手冊會提示這個候選需要核對什麼。先按這裡查線索。");
    if (session.drawer === "evidence") return step("maze-card",action("maze-proof","identity:A"),
      "把分類卡拿在手上","第一個岔路先核對候選身分。這張卡寫著銅綠假單胞菌的主要分類，點它作為這一步的依據。");
    if (session.selected !== "identity:A") return step("maze-evidence",action("maze-evidence"),
      "從案卷找能支持判斷的紀錄","每一扇門除了方向，也需要一張依據。打開案卷，先找候選分類卡。");
    return step("maze-door",".maze-options","依分類卡選一扇門",
      "看手上的主要分類，選符合它的門。偵探會沿走廊走過去，你也能用方向鍵或 WASD 自己走。");
  }

  function literature() {
    const paper = window.BreathContent.literature[state.paper];
    if (state.paper >= 2) return step("literature-done",state.kept.length ? ".folder" : ".review-actions",
      "接下來由你判讀",
      "收入的摘要和限制會留在案卷夾。其餘文章也用同樣方式比對菌名與檢體，左滑略過、右滑收入，或使用下方按鈕。","換我試試");
    if (!paper.fit) {
      if (!acknowledged.has("literature-read")) return step("literature-read",".abstract .excerpt",
        "先比對本案與這篇文章",
        "本案是肺部 BAL 檢體，這篇卻研究血液和泌尿道來源。點摘要中有底色的文字，還可以查看線索提示。","我讀完了");
      return step("literature-skip",action("classify","skip"),"略過這篇，看看下一篇",
        "點「略過」，或把卡片向左滑。文章裡有同一菌名，仍要確認檢體部位是否能和本案比較。");
    }
    const site = paper.segments.findIndex((segment) => segment.key === "site");
    if (!state.marks.includes(site)) return step("literature-circle",action("mark",String(site)),
      "圈出可比較的檢體部位",
      "點這段有底色的檢體文字，會留下圈選。這是你收入文章時，能指出來的對照線索。");
    const limit = paper.segments.findIndex((segment) => segment.type === "limit");
    if (limit >= 0 && !acknowledged.has("literature-limit")) return step("literature-limit",
      action("mark",String(limit)),"這句限制也要一起讀",
      "摘要記錄了檢出，致病角色仍待確認。這句會和文章一起收入案卷，讓後面能追溯它支持到哪裡。","知道了");
    return step("literature-keep",action("classify","keep"),"把這篇和它的限制收入案卷",
      "點「收入案卷」，或將卡片向右滑。圈選文字、摘要和限制都會留到最後的調查報告。");
  }

  function debate() {
    const session = state.debate;
    if (!session || session.feedback || session.drawer || session.phase === "running") return null;
    if (session.phase === "complete") return step("debate-finished",action("debate-report"),"把核對紀錄帶進報告",
      "剛才支持或修正的句子都留下了依據。組成報告後，就能把原始紀錄和仍待確認的地方交回診療室。");
    if (session.index > 0) return null;
    if (!acknowledged.has("debate-read")) return step("debate-read",".debate-mission","先看本段要找什麼",
      "發言會自動流動。黃色片語可用證據反駁，藍色片語可用證據支持。先讀本段任務，再裝填言彈。","挑選言彈");
    if (!session.selected) return step("debate-ammo",".debate-ammo","選一枚證據言彈",
      "點選一份紀錄裝填；按「查看證據」可以重讀原始內容。議論中也能隨時切換。");
    return step("debate-start",action("debate-start"),"開始後，瞄準標記片語",
      "讀完幾句話，找出要反駁的那一段，用裝填的證據點擊發射。可用「集中」放慢、「暫停」閱讀；沒抓到可以重聽。");
  }

  function report() {
    if (state.submitted) return step("report-return",".report-card > summary","查看每個候選的來源",
      "展開任一候選，可以重讀原始紀錄、文獻和分流理由。","結束教學");
    return step("report-send",action("submit"),"核對結果已寫進案卷",
      "可展開議論紀錄與候選卡重讀依據，再按「送出調查報告」，把已知與待確認的問題一起交回診療室。");
  }

  function lesson() {
    if (!state) return null;
    if (state.view === "travel") return step("travel-go",action("walk-goal"),"先走到這關的目的地",
      "你可以按這個按鈕，讓偵探走到櫃檯。也能用方向鍵、WASD 或點地圖移動；到站後會接上劇情和操作教學。");
    const lessons = {gather,maze,labyrinth,literature,debate,report};
    return lessons[state.view]?.() || null;
  }


  const spotlight = document.createElement("div");
  spotlight.className = "tutorial-spotlight";
  spotlight.setAttribute("aria-hidden","true");
  spotlight.hidden = true;
  const panel = document.createElement("section");
  panel.className = "tutorial-panel";
  panel.id = "instruction-panel";
  panel.hidden = true;
  panel.setAttribute("aria-label","操作教學");
  panel.innerHTML = '<p class="tutorial-label"></p><div class="tutorial-copy" aria-live="polite" aria-atomic="true">' +
    '<h2></h2><p></p></div><div class="tutorial-actions"><button type="button" data-coach="close" class="quiet small">' +
    '略過教學</button><button type="button" data-coach="next" class="primary"></button></div>';
  document.body.append(spotlight,panel,quickHint);

  function hide() {
    cancelAnimationFrame(frame);
    spotlight.hidden = true;
    panel.hidden = true;
    target?.removeAttribute("data-tutorial-target");
    extraTargets.forEach(element => element.removeAttribute("data-hint-extra"));
    extraTargets = [];
    target = null;
    current = null;
    needsScroll = false;
    document.body.classList.remove("tutorial-active");
    document.body.removeAttribute("data-hint-route");
    help.setAttribute("aria-pressed","false");
    quickHint.setAttribute("aria-expanded","false");
    quickHint.textContent = "卡住了？給我提示";
  }

  function position(scroll = false) {
    if (!target?.isConnected || panel.hidden) return;
    const view = window.visualViewport;
    const width = view?.width || innerWidth;
    const height = view?.height || innerHeight;
    const top = view?.offsetTop || 0;
    panel.style.maxHeight = Math.max(120,height-100) + "px";
    const panelRect = panel.getBoundingClientRect();
    document.body.style.setProperty("--tutorial-space",Math.ceil(panelRect.height+88)+"px");
    const safeBottom = top+height-panelRect.height-94;
    if (scroll) target.scrollIntoView({block:"nearest",inline:"nearest",behavior:"instant"});
    let rect = target.getBoundingClientRect();
    if (scroll && (rect.top < top+14 || rect.bottom > safeBottom)) {
      const desired = top+Math.max(16,(safeBottom-top-Math.min(rect.height,180))/2);
      window.scrollBy({top:rect.top-desired,behavior:"instant"});
      rect = target.getBoundingClientRect();
    }
    const left = Math.max(4,rect.left-5);
    const upper = Math.max(top+4,rect.top-5);
    const right = Math.min(width-4,rect.right+5);
    const bottom = Math.min(top+height-4,rect.bottom+5);
    spotlight.style.left = left + "px";
    spotlight.style.top = upper + "px";
    spotlight.style.width = Math.max(0,right-left) + "px";
    spotlight.style.height = Math.max(0,bottom-upper) + "px";
  }

  function refresh() {
    if (!active) { hide(); return; }
    const next = hintMode ? window.BreathHints.next(state) : lesson();
    if (!next) { hide(); return; }
    const element = screen.querySelector(next.target);
    if (!element) { hide(); return; }
    const changed = current?.id !== next.id || panel.dataset.mode !== (hintMode ? "hint" : "tutorial");
    needsScroll ||= changed;
    target?.removeAttribute("data-tutorial-target");
    target = element;
    target.setAttribute("data-tutorial-target","");
    current = next;
    extraTargets.forEach(entry => entry.removeAttribute("data-hint-extra"));
    extraTargets = (next.also || []).map(selector => screen.querySelector(selector)).filter(Boolean);
    extraTargets.forEach(entry => entry.setAttribute("data-hint-extra",""));
    panel.dataset.mode = hintMode ? "hint" : "tutorial";
    spotlight.dataset.mode = panel.dataset.mode;
    document.body.dataset.hintRoute = String(hintMode && next.assist === "route");
    panel.querySelector(".tutorial-label").textContent = state.view === "travel" ? "肺城走圖 · 操作教學" :
      "第 " + (state.chapter+1) + " 關 · 跟著做一次";
    if (hintMode) panel.querySelector(".tutorial-label").textContent = "直接提示 · 跟著亮框做";
    const nextButton = panel.querySelector('[data-coach="next"]');
    nextButton.hidden = !next.next;
    nextButton.textContent = next.next;
    if (changed || hintMode) {
      panel.querySelector("h2").textContent = next.title;
      panel.querySelector(".tutorial-copy > p").textContent = next.body;
    }
    panel.querySelector('[data-coach="close"]').textContent = next.next && /換我|繼續調查|結束教學/.test(next.next) ?
      "關閉提示" : "略過教學";
    if (hintMode) panel.querySelector('[data-coach="close"]').textContent = "收起提示";
    panel.dataset.step = next.id;
    panel.hidden = false;
    spotlight.hidden = false;
    document.body.classList.add("tutorial-active");
    help.setAttribute("aria-pressed",String(!hintMode));
    quickHint.setAttribute("aria-expanded",String(hintMode));
    quickHint.textContent = hintMode ? "收起直接提示" : "卡住了？給我提示";
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const scroll = needsScroll;
      needsScroll = false;
      position(scroll);
      if (changed && !panel.contains(document.activeElement) &&
          target?.matches("button,summary,a,[tabindex]")) target.focus({preventScroll:true});
    });
  }

  function update(snapshot, controls) {
    state = snapshot;
    if (controls) assists = controls;
    const supported = ["travel","gather","maze","labyrinth","literature","debate","report"].includes(state.view);
    const nextGroup = supported ? state.view : "";
    help.hidden = !supported;
    quickHint.hidden = !supported;
    if (nextGroup !== group) {
      if (hintMode) assists.clear?.();
      hintMode = false;
      active = supported && !visited.has(nextGroup);
      if (supported) visited.add(nextGroup);
      group = nextGroup;
    }
    refresh();
  }

  function close() {
    const wasHint = hintMode;
    if (wasHint) assists.clear?.();
    hintMode = false;
    active = false;
    hide();
    if (!help.hidden) (wasHint ? quickHint : help).focus({preventScroll:true});
  }

  function reset() {
    if (hintMode) assists.clear?.();
    hintMode = false;
    visited.clear();
    acknowledged.clear();
    group = "";
    state = null;
    active = false;
    hide();
  }

  function open() {
    if (!state || help.hidden) return;
    if (hintMode) assists.clear?.();
    hintMode = false;
    active = true;
    for (const id of [...acknowledged]) {
      if (id.startsWith(state.view + "-")) acknowledged.delete(id);
    }
    current = null;
    refresh();
  }

  panel.addEventListener("click",(event) => {
    const control = event.target.closest("[data-coach]");
    if (!control) return;
    if (control.dataset.coach === "close") { close(); return; }
    if (!current) return;
    if (hintMode) {
      if (current.assist) assists.assist?.(current.assist,current.goal);
      else position(true);
      return;
    }
    if (/換我|繼續調查|結束教學/.test(current.next)) { close(); return; }
    acknowledged.add(current.id);
    refresh();
  });
  help.addEventListener("click",open);
  quickHint.addEventListener("click",() => {
    if (hintMode && active) { close(); return; }
    hintMode = true; active = true; current = null;
    refresh();
  });
  document.addEventListener("toggle",(event) => {
    if (event.target.matches?.(".report-card")) refresh();
  },true);
  document.addEventListener("keydown",(event) => {
    if (event.key === "Escape" && active && !document.querySelector("dialog[open]")) close();
  });
  window.addEventListener("resize",() => position());
  window.addEventListener("scroll",() => position(),{passive:true});
  window.visualViewport?.addEventListener("resize",() => position());
  const observer = new ResizeObserver(() => position());
  observer.observe(panel);

  window.BreathTutorial = {update,reset,open};
})();
