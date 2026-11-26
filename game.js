(function () {
  "use strict";
  const content = window.BreathContent;
  const modes = window.BreathModes;
  const documents = window.BreathDocuments;
  const tutorial = window.BreathTutorial;
  const plot = window.BreathStory;
  const stages = window.BreathStages;
  const screen = document.getElementById("screen");
  const steps = document.getElementById("steps");
  const feedback = document.getElementById("feedback");
  const restart = document.getElementById("restart");
  const sound = document.getElementById("sound");
  const dialog = document.getElementById("restart-dialog");
  const fields = { id: "檢體編號", date: "採檢時間", type: "檢體類型", result: "檢驗結果" };
  const seals = { same: "同檢體證據", other: "其他檢體參考" };
  let state, drag, swipe, ignoreClickUntil = 0, resetToast, audio;
  let muted = false, mapControl, mazeControl, debateControl, labyrinthControl, cupControl;
  const mazeView = new URLSearchParams(location.search).get("maze") === "rules" ? "maze" : "labyrinth";
  const activity = ["gather",mazeView,"literature","debate"];
  const sceneViews = ["intro","brief","ending"];

  function reset() {
    modes.apply();
    activity[1] = modes.id() === "normal" ? mazeView : "labyrinth";
    tutorial.reset();
    state = {
      view: "title", chapter: -1, beat: 0, source: "excel", slide: "L02", draft: {}, token: "", slot: "",
      records: [], filed: [], maze: null, labyrinth: null, debate: null, demo: false, demoMaze: false, mazeMode: mazeView === 'maze' ? 'rules' : 'explore',
      paper: 0, marks: [], kept: [], submitted: false, position: null
    };
    modes.init(state);
    state.mazeMode = activity[1] === "maze" ? "rules" : "explore";
    render(true);
  }

  const html = (text) => String(text).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
  const button = (text, action, value = "", options = {}) =>
    '<button type="button" class="' + (options.kind || "quiet") + '" data-action="' + action +
    '" data-value="' + value + '"' + (options.attrs || "") + '>' + text + '</button>';
  const pressed = (value) => ' aria-pressed="' + Boolean(value) + '"';
  const getRecord = (id) => content.records.find((record) => record.id === id);
  const currentPaper = () => content.literature[state.paper];
  const tabFocus = () => screen.querySelector("[data-focus]")?.focus({ preventScroll: true });

  function toast(text, tone = "") {
    window.clearTimeout(resetToast);
    feedback.textContent = text;
    feedback.dataset.tone = tone;
    feedback.classList.add("shown");
    resetToast = window.setTimeout(() => feedback.classList.remove("shown"), 5000);
  }

  function play(effect) {
    if (muted) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      audio ||= new Audio();
      if (audio.state === "suspended") audio.resume().catch(() => {});
      const tones = {
        phone: [654, 784, 654, 784], knock: [145, 130], rift: [277, 415, 554],
        stamp: [100, 66], done: [392, 494, 587], tick: [310], footstep:[72], warning:[140,110]
      }[effect] || [310];
      const step = effect === "phone" ? 0.16 : 0.09;
      tones.forEach((frequency, index) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        const start = audio.currentTime + index * step;
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.065, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
        osc.connect(gain).connect(audio.destination);
        osc.start(start);
        osc.stop(start + 0.14);
      });
    } catch { /* Sound is optional. */ }
  }

  function go(view, chapter = state.chapter) {
    if (["maze","labyrinth"].includes(view) && !state.maze) {
      state.maze = window.BreathMazeRules.create();
      state.filed = state.records.map((record) => ({...record,scope:content.chooseScope(record)}));
    }
    if (view === "labyrinth" && !state.labyrinth) state.labyrinth = window.BreathLabyrinthData.create();
    if (view === "debate" && !state.debate) {
      state.debate = window.BreathDebateData.create(state.records,state.maze.results,state.kept);
      modes.debate(state.debate);
    }
    state.view = view;
    state.chapter = chapter;
    state.beat = 0;
    feedback.classList.remove("shown");
    render(true);
  }

  const art = (scene) => '<div class="scene-art ' + scene + '" aria-hidden="true"></div>';
  const heading = (name, description) =>
    '<header class="work-heading" data-station="' + state.chapter + '">' + art(content.chapter[state.chapter].scene) + '<div><p class="eyebrow">' + content.chapter[state.chapter].place + ' · '+modes.label()+'模式</p>' +
    '<h1 tabindex="-1" data-focus>' + name + '</h1><p>' + modes.describe(state,description) + '</p></div>' +
    '<span class="chapter-number">' + content.chapter[state.chapter].num + '<span> / 04</span></span></header>' + guide();

  function title() {
    return '<section class="hero">' + art("room") +
      '<div class="hero-content"><p class="eyebrow">肺 城 調 查 錄</p>' +
      '<h1 tabindex="-1" data-focus><span>最後一口</span><br><em>呼吸</em></h1>' +
      '<p class="hero-copy">檢驗報告有好幾個名字。<br>哪一個和這次感染有關？</p>' +
      modes.cards(button) +
      button("開始調查 <span aria-hidden=\"true\">→</span>", "start", "", {kind:"primary hero-button"}) +
      '<div class="hero-demo">' + button("試玩第二關 · 迷宮探路","demo-maze") +
      button("試玩第四關 · 言彈議論","demo-debate") +
      '<p class="hero-meta">快速試玩使用預先整理的模擬案卷。</p></div>' +
      '<p class="hero-meta">四關 · 可用滑鼠、鍵盤或觸控</p></div></section>';
  }

  function travel() {
    return stages.map(state, button);
  }

  function arrive(position) {
    state.position = position;
    go("brief");
  }

  function guide() {
    const chapter = plot.chapter(state);
    return '<details class="work-guide"><summary>' + (modes.isQuick() ? "本關任務" : modes.isHard() ? "任務說明 · 操作規則" : "醫師留言 · 任務提示") + '</summary><p>' +
      window.BreathDialogue.render(chapter.objective + chapter.task) + '</p></details>';
  }

  function sourceToken(record, key) {
    const token = record.id + ":" + key;
    const value = documents.value(record,key);
    const visible = key === "date" ? '<span>' + content.caseInfo.year + '/' + record.date + '</span><small>' +
      record.collected + '</small>' : key === "type" ? '<span title="' + html(value) + '">' + record.sampleCode +
      '</span>' : html(value);
    return button(visible, "token", token, {
      kind: "token " + (state.token === token ? "selected" : ""),
      attrs: ' data-drag="token" draggable="false"' + pressed(state.token === token) +
        ' aria-label="' + html(record.id + " " + (fields[key] || {received:"收件時間",reported:"核發時間",partial:"單項結果"}[key]) + " " + value) + '"'
    });
  }

  function gather() {
    const expectedCount = content.records.filter(content.fitWindow).length;
    const excel = state.source === "excel";
    const sourcePanel = excel ? documents.workbook(state.token,sourceToken,html) :
      documents.powerpoint(getRecord(state.slide),button,sourceToken,html);
    const prompts = {
      id:"先在工作表選一個檢體編號，放到紀錄表。",
      date:"用同一列的採檢時間填下一格。先核對日期有沒有落在收件窗。",
      type:"再抄這一列的檢體類型。BAL 是支氣管肺泡灌洗液。",
      result:"從 PPT 翻到同一個檢體編號，把檢驗結果帶入。"
    };
    const nextField = Object.keys(fields).find((key) => !state.draft[key]);
    const guideText = modes.isQuick() ? (state.records.length===2?"兩份完成，前往迷宮。":Object.keys(state.draft).length===4?"核對編號後按「收錄」。":"點上方檢體卡帶入資料。") : modes.isHard() ? "先暫存要保留的檢體，最後核對整份收件清單；可移除後重新整理。" : state.records.length === expectedCount ? "兩張卡完成了。帶著原始紀錄進入判讀迷宮，沿不同菌種的規則找線索。" :
      (prompts[nextField] || "核對欄位都來自同一份檢體，再把紀錄收進案卷。");
    const slots = Object.entries(fields).map(([key, title]) => {
      const value = state.draft[key];
      const body = value ? '<strong>' + html(documents.value(value.record,value.key || key)) + '</strong><small>' + value.origin + '</small>' :
        '<span>將' + title + '放在這裡</span>';
      return '<div class="field"><span>' + title + '</span>' + button(body, "slot", key, {
        kind: "drop " + (value ? "filled " : "") + (state.slot === key ? "selected" : ""),
        attrs: ' data-drop="token"' + pressed(state.slot === key) + ' aria-label="' + html(title + " " + (value ? documents.value(value.record,value.key || key) : "空白")) + '"'
      }) + '</div>';
    }).join("");
    const gathered = state.records.map((record) => '<li><strong>' + record.id + '</strong> <span>' +
      record.date + ' · ' + record.sampleCode + ' · ' + html(record.result) + '</span>' +
      (modes.isHard() ? button("移除","remove-record",record.id,{kind:"quiet small"}) : '') + '</li>').join("");
    return heading("失序的紀錄", "把本次感染附近的原始檢驗，整理成能追查的紀錄。") +
      modes.gatherAssist(state,button,html) +
      '<div class="reference case-strip"><span>病例 D07 · mNGS 採檢基準</span><strong>L02 · BAL · 11/18</strong>' +
      '<span>採檢收件窗 ' + html(content.caseInfo.interval) + '</span><details class="case-brief case-reference"><summary>翻開本次 mNGS 報告</summary>' +
      '<div class="case-brief-body"><p>' + content.caseInfo.symptom + '</p><p>檢體 L02 · BAL · 11/18 採檢 · ' +
      content.caseInfo.sequencingReport + ' 核發</p><table><thead><tr><th scope="col">候選學名</th><th scope="col">讀數</th></tr>' +
      '</thead><tbody>' + Object.values(content.candidates).map((item) =>
        '<tr><th scope="row"><em>' + html(item.scientific) + '</em></th><td>' + item.reads.toLocaleString("zh-TW") +
        '</td></tr>').join("") + '</tbody></table><p class="hint">讀數是模擬定序數值。後續需對照檢體與其他證據。</p></div></details></div>' +
      '<div class="work-grid"><section class="panel" id="raw-source"><div class="panel-top"><h2>原始資料</h2>' +
      '<div class="tabs" aria-label="資料來源">' + button("採檢 Excel", "source", "excel", {attrs: pressed(excel)}) +
      button("檢驗 PPT", "source", "ppt", {attrs: pressed(!excel)}) + '</div></div>' +
      '<p class="hint">拖曳來源欄位，或點資料後再點紀錄表。</p>' + sourcePanel + '</section>' +
      '<section class="panel clipboard"><div class="panel-top"><h2>採檢紀錄表</h2><span>' +
      state.records.length + (modes.isHard() ? ' 份暫存' : ' / '+expectedCount+' 份') + '</span></div><p class="next-step">' + guideText + '</p>' + slots + '<div class="mobile-return">' + button("回原始資料 ↑", "to-source", "", {kind:"quiet small"}) + '</div>' +
      '<div class="actions">' + button("清空欄位", "clear", "", {attrs:Object.keys(state.draft).length ? "" : " disabled"}) +
      button("收錄這份紀錄", "collect", "", {kind:"primary"}) + '</div>' +
      (gathered ? '<ul class="collected" aria-label="已收錄紀錄">' + gathered + '</ul>' : "") +
      ((modes.isHard() ? state.records.length > 0 : state.records.length === expectedCount) ? '<div class="actions">' +
      button(modes.isHard() ? "核對收件清單" : "帶著案卷前往判讀迷宮", "gather-next", "", {kind:"primary"}) + '</div>' : "") +
      '</section></div>';
  }

  function labyrinth() {
    return heading("呼吸道迷宮","帶著一隻候選菌，沿路上的紀錄找到出口。") +
      (state.demoMaze ? '<p class="reference labyrinth-demo-link">第二關試玩 · 第一關資料已放進背包，本輪從迷宮開始。</p>' : "") +
      window.BreathLabyrinth.render(state.labyrinth,button,html);
  }

  function visitLabyrinth(id) {
    if(window.BreathPursuit.active(state.labyrinth.pursuit)||window.BreathPursuit.overlay(state.labyrinth.pursuit)){
      toast("先躲過巡邏守衛，再停下來查看線索。");return;
    }
    if (window.BreathKeyShuffle.intercept(state.labyrinth,id)) {
      play("tick");
      render(false);
      screen.querySelector(".key-shuffle")?.scrollIntoView({block:"center"});
      return;
    }
    if (window.BreathLabyrinthData.visit(state.labyrinth,id,state.records)) {
      if(window.BreathLabyrinthData.landmarks.some(item=>item.id===id&&["key","record"].includes(item.type)))window.BreathPursuit.checkpoint(state.labyrinth);
      state.labyrinth.hintGoal = "";
      if (state.labyrinth.complete) state.maze.results.B = state.labyrinth.result;
      play(state.labyrinth.complete ? "done" : "tick");
      render(false);
      if (modes.isQuick()) screen.querySelector(".labyrinth-message")?.scrollIntoView({block:"center"});
    }
  }

  function pursuitMusic() {
    const p=state.view==="labyrinth"?state.labyrinth?.pursuit:null;
    const danger=window.BreathPursuit.active(p)||Boolean(p?.phase==="hidden"&&p.enemy);
    window.BreathMusic?.scene(state.view,state.chapter,
      sceneViews.includes(state.view)||Boolean(state.labyrinth?.dialog&&state.view==="labyrinth")||
      Boolean(state.maze?.feedback&&state.view==="maze")||Boolean(state.debate?.feedback&&state.view==="debate"),danger);
  }

  function pursuitChanged(modal) {
    if(modal){render(false);screen.querySelector(".pursuit-modal h2")?.focus({preventScroll:true});}
    else pursuitMusic();
    if(state.labyrinth?.pursuit?.phase==="warning")play("warning");
  }

  function hidePursuit(id) {
    const session=state.labyrinth;
    if(!window.BreathPursuit.hide(session.pursuit,id,session.position,window.BreathLabyrinthData.floorPlan(session)))return false;
    session.position={x:session.pursuit.closet.x,y:session.pursuit.closet.y};
    render(false);screen.querySelector(".pursuit-modal h2")?.focus({preventScroll:true});return true;
  }

  function demoMaze() {
    reset();
    state.demoMaze = true;
    state.records = content.records.filter(content.fitWindow);
    state.filed = state.records.map(record => ({...record,scope:content.chooseScope(record)}));
    go("brief",1);
  }

  function maze() {
    return heading("判讀迷宮","候選走不同規則，用案卷裡的證據找到能開的門。") +
      window.BreathMaze.render(state.maze,state.records,button,html);
  }

  function reachMazeDoor(option) {
    state.maze.walking = false;
    const result = window.BreathMaze.choose(state.maze,option,state.records);
    play(result.ok ? "done" : "tick");
    render(false);
  }

  function sourceLink(source) {
    return '<a href="' + html(source.url) + '" target="_blank" rel="noopener noreferrer">' + html(source.label) + '</a>';
  }

  function literature() {
    if (modes.isHard() && state.paper >= content.literature.length)
      return heading("整批核對文獻","送出後才顯示這一批的正誤。") + modes.paperReview(state,button,html);
    const paper = currentPaper();
    const excerpt = paper.segments.map((part, index) => modes.isHard() || part.key || part.hint ?
      button(html(part.text), "mark", String(index), {
        kind: "phrase " + (state.marks.includes(index) ? "marked" : ""),
        attrs: pressed(state.marks.includes(index))
      }) : html(part.text)).join("");
    return heading("候選複核室", "一次讀一篇。圈出能與本案對照的線索，再決定要不要存入案卷。") +
      (modes.isHard() ? '<section class="panel mode-rules"><p>十二篇批次判讀：收入同菌種的呼吸道病例背景，正確圈出檢體部位。點錯不提示，全部送出後才揭示正誤；錯了需整批重做。</p></section>' :
        modes.isEasy() ? '<p class="reference easy-paper-advice">建議'+(paper.fit?'收入':'略過')+'：'+html(paper.feedback)+'</p>' : '') +
      '<div class="reference"><span>本案焦點</span><strong>K. variicola · L02 BAL · 咳嗽</strong>' +
      '<span>FilmArray 只回報肺炎克雷伯氏菌群</span></div>' +
      '<div class="review-lanes"><section class="panel literature"><div class="panel-top"><h2>手上的文獻</h2><span>' +
      (state.paper + 1) + ' / ' + content.literature.length + '</span></div>' +
      '<article class="paper abstract" data-swipe><p class="eyebrow">' +
      (paper.source ? "公開文獻改寫" : "教學模擬文獻") + ' · ' + paper.id + '</p><h3 class="abstract-title">' +
      html(paper.title) + '</h3><p class="excerpt">' + excerpt + '</p>' +
      (paper.source ? '<p class="paper-source">' + sourceLink(paper.source) + '</p>' : "") +
      '<p class="hint">圈出可對照的檢體 · 左滑略過 · 右滑收入</p></article>' +
      '<div class="review-actions">' + button("← 略過", "classify", "skip") +
      button("收入案卷 →", "classify", "keep", {kind:"primary"}) + '</div></section>' +
      '<aside class="panel folder"><div class="panel-top"><h2>案卷夾</h2><span>' + (modes.isHard() ? state.paperDecisions.filter(d=>d?.decision==='keep').length : state.kept.length) + ' 篇</span></div>' +
      (state.kept.length ? '<ul>' + state.kept.map((item) => '<li><strong>文獻 ' + item.id +
        '</strong><span>' + html(item.note) + '</span></li>').join("") + '</ul>' : '<p class="hint">收入的摘要與限制會留在這裡。</p>') +
      '</aside></div>';
  }

  function debate() {
    return heading("言彈議論","用前三關找到的證據，指出矛盾或補上支持。") +
      (state.demo ? '<p class="reference debate-demo-note">第四關試玩 · 本輪使用預先整理的模擬案卷。</p>' : "") +
      window.BreathDebate.render(state.debate,button,html);
  }

  function selectDebateAmmo(id,keyboard=false) {
    if (state.view !== "debate" || state.debate.feedback || state.debate.shotPending || state.debate.phase === "complete") return;
    const round = window.BreathDebateData.current(state.debate);
    if (!round.ammo.includes(id) || !state.debate.cards.some(card => card.id === id)) return;
    state.debate.selected = id;
    render(false);
    if (keyboard) screen.querySelector(".debate-arena")?.focus({preventScroll:true});
  }

  function fireDebate(id) {
    if (state.view !== "debate" || state.debate.shotPending) return;
    if (!window.BreathDebateData.evaluate(state.debate,id)) return;
    if (debateControl && !debateControl.canAim(id)) return;
    if (state.debate.phase !== "running") return;
    state.debate.shotPending = true;
    const resolve = () => {
      state.debate.shotPending = false;
      const result = window.BreathDebateData.shoot(state.debate,id);
      if (!result) return;
      play(result.ok ? "done" : "tick");
      if (state.debate.difficulty === "hard" && state.debate.timeLeft <= 0) { timeoutDebate(); return; }
      render(false);
    };
    if (debateControl) debateControl.impact(id,resolve);
    else resolve();
  }

  function timeoutDebate() {
    if (state.view !== "debate" || state.debate.phase !== "running") return;
    state.debate.timeLeft=0;state.debate.phase="failed";state.debate.feedback=null;state.debate.shotPending=false;
    render(false);
  }
  function missDebate(kind) {
    if (state.view !== "debate" || state.debate.phase !== "running" || state.debate.feedback) return;
    window.BreathDebateData.penalize(state.debate,kind);
    if (state.debate.timeLeft <= 0) timeoutDebate();
  }
  function demoDebate() {
    reset();
    state.demo = true;
    state.records = content.records.filter(content.fitWindow);
    state.filed = state.records.map(record => ({...record,scope:content.chooseScope(record)}));
    state.maze = window.BreathMazeRules.create();
    while (Object.keys(state.maze.results).length < 3) {
      const gate = window.BreathMazeRules.current(state.maze);
      state.maze.selected = gate.proof;
      window.BreathMaze.choose(state.maze,gate.right,state.records);
      window.BreathMaze.next(state.maze);
    }
    state.kept = content.literature.filter(paper => paper.id === "02").map(paper => ({
      id:paper.id,title:paper.title,source:paper.source,note:paper.note,
      quotes:paper.segments.filter(segment => segment.key === "site").map(segment => segment.text),
      excerpt:paper.segments.map(segment => segment.text).join("")
    }));
    go("brief",3);
  }

  function reportCard(item) {
    const exploredLabel = state.demo ? "示範案卷中的既有判讀路徑" :
      item.decisions?.length ? "本關實際探索的路徑" : "依原始案卷整理；本關未探索此候選";
    const evidence = window.BreathMazeRules.cards(state.records,item.id);
    const decisions = (item.decisions || []).map((entry) => {
      const card = evidence.find((record) => record.id === entry.evidence);
      return '<li><strong>' + html(entry.title + ' · ' + entry.choice) + '</strong><span>依據：' +
        html(card ? card.title + ' · ' + card.subtitle : entry.evidence) + '</span><span>' + html(entry.reason) + '</span></li>';
    }).join("");
    const records = item.inputs.map((record) => '<li><strong>' + record.id + ' · ' + record.date +
      ' · ' + record.sampleCode + ' · ' + seals[record.scope] + '</strong><span>採檢 ' +
      html(record.dateTime) + ' · 末次核發 ' + record.reportDate + '</span><span>' +
      html(record.result) + '</span><span>' + html(documents.origin(record,"id")) + '、' +
      html(documents.origin(record,"result")) + '</span></li>').join("");
    const papers = (item.papers || []).map((paper) => '<li><strong>' + html(paper.title) + '</strong><span>' +
      html(paper.note) + '</span><span>標記：' + paper.quotes.map(html).join("、") +
      '</span><span>' + html(paper.excerpt) + '</span>' +
      (paper.source ? '<span>' + sourceLink(paper.source) + '</span>' : '<span>教學模擬摘要</span>') + '</li>').join("");
    return '<details id="candidate-' + item.id + '" class="panel report-card" ' + (item.id === "C" ? "open" : "") + '><summary><span class="candidate">' +
      item.id + '</span><span><strong>' + html(item.name) + '</strong><small>' + html(item.scientific) +
      '</small></span><span class="tag ' + item.grade + '">' + item.tier + '</span></summary>' +
      '<div class="report-body"><p class="labyrinth-report-source">' + html(exploredLabel) + '</p><p>' + html(item.signal) + '</p><ol class="trail">' +
      item.path.map((text) => '<li>' + html(text) + '</li>').join("") + '</ol><p>' + html(item.reason) + '</p>' +
      (decisions ? '<details class="maze-audit"><summary>查看迷宮裡的選擇與依據</summary><ul class="citations">' + decisions + '</ul></details>' : "") +
      (records ? '<h3>院端紀錄</h3><ul class="citations">' + records + '</ul>' : "") +
      (papers ? '<h3>保留的文獻</h3><ul class="citations">' + papers + '</ul>' :
        (item.id === "C" ? '<p class="hint">本輪沒有收入外部文獻，仍可保留院端群組線索。</p>' : "")) +
      '</div></details>';
  }

  function report() {
    const debateLog = state.debate?.results.length ?
      '<details class="panel debate-report-log"><summary>查看言彈議論留下的核對紀錄</summary><ol>' +
      state.debate.results.map(item => '<li><strong>' + html(item.title) + '</strong><p>' + html(item.correction) +
        '</p><small>依據：' + html(state.debate.cards.find(card => card.id === item.evidence)?.title || item.evidence) + '</small></li>').join("") +
      '</ol></details>' : "";
    const items = content.candidateRoutes(state.filed,state.kept,state.maze?.results);
    const cards = '<div class="report-grid">'+items.map(reportCard).join("")+'</div>';
    const reportBody = modes.isQuick() ? window.BreathQuick.reportSummary(items,html)+
      '<details class="panel quick-full-report"><summary>完整案卷與來源</summary>'+debateLog+cards+'</details>' : debateLog+cards;
    return heading(state.submitted ? "調查報告" : "交回調查報告", "原始來源、候選判讀路徑與議論核對結果，放進同一份案卷。") +
      (state.demo ? '<p class="reference">第四關試玩 · 使用預先整理的模擬案卷。</p>' :
        state.demoMaze ? '<p class="reference">第二關試玩 · 使用預先整理的第一關資料。</p>' : "") +
      '<p class="reference report-reply">'+(modes.isQuick()?"核對完成，保留尚待確認。":"已完成四段證據核對。保留成立的支持，也留下物種與致病角色仍待確認的地方。")+'</p>' +
      reportBody +
      '<div class="report-footer"><p>'+(modes.isQuick()?"核對後送出。":"報告會附上原單、保留的文獻與尚待確認的線索。")+'</p>' +
      button(state.submitted ? "返回結案畫面" : "送出調查報告", state.submitted ? "back-done" : "submit", "", {kind:"primary",attrs:state.debate?.phase === "complete" ? "" : " disabled"}) +
      '</div>';
  }

  function done() {
    const project = modes.isQuick() ? [["整理資料","對齊病人、檢體與採檢時間。"],["規則判讀","整合 mNGS 與院端證據。"],["查閱文獻","保留可參考內容與限制。"],["交付結果","附來源，保留待確認。"]] : [
      ["整理原始資料","以兩院資料為例，從試算表和簡報擷取欄位，按病人與採檢紀錄對齊。高醫則有自己的前端資料處理流程。"],
      ["按菌種規則分流判讀","將 mNGS 訊號、院端支持與檢體脈絡接起來。不同菌種核對不同條件，未提供的資料保留未知。"],
      ["複核仍有疑問的候選","視需要查文獻作背景，並把檢出、可參考的證據與它的限制放在一起。"],
      ["交付可追溯的結果","回到原始資料核對，保留仍待查證的候選與理由。"]
    ];
    return '<section class="hero last">' + art("room") + '<div class="hero-content"><p class="eyebrow">調查報告已送達診療室</p>' +
      (state.demo ? '<p class="reference debate-demo-note">第四關試玩完成 · 使用預先整理的模擬案卷。</p>' :
        state.demoMaze ? '<p class="reference">第二關試玩完成 · 第一關資料已預先整理，本輪實際完成後續探索。</p>' : "") +
      '<h1 tabindex="-1" data-focus><span>最後一口</span><br><em>呼吸</em></h1>' +
      '<div class="closing-copy"><p>你整理了 ' + state.records.length + ' 份採檢紀錄，完成 ' + Object.keys(state.maze.results).length +
      ' 條候選判讀路徑，並保留 ' + state.kept.length + ' 篇可供對照的文獻。</p>' +
      '<p>'+window.BreathDialogue.render(modes.isQuick()?"檢出不等於致病；證據不足，保留未知。":"把檢驗單對回採檢紀錄，就能分清痰液的培養和 BAL 的 mNGS 各自支持到哪裡。")+'</p></div>' +
      '<div class="actions">' + button("查看調查報告", "see-report", "", {kind:"primary"}) + button("再玩一次", "replay") +
      '</div></div></section><details class="panel project-note"'+(modes.isQuick()?'':' open')+'><summary>剛才玩的四步，對應到我們的專題</summary><ol>' +
      project.map(([title,description]) => '<li><strong>' + title + '</strong><p>' + description + '</p></li>').join("") +
      '</ol></details><details class="panel project-note"><summary>展示病例的資料參考</summary>' +
      '<ul class="citations">' + Object.values(content.bibliography).map((item) => '<li>' + sourceLink(item) + '</li>').join("") +
      '</ul><p class="hint">D07 的檢體、日期與檢驗數值皆為模擬。公開文獻在各卡片另有標示。</p></details>';
  }

  const views = {title, travel, gather, maze, labyrinth, literature, debate, report, done};

  function render(focus) {
    modes.prepare(state);
    cupControl?.stop();
    cupControl = null;
    labyrinthControl?.stop();
    labyrinthControl = null;
    debateControl?.stop();
    debateControl = null;
    mazeControl?.stop();
    mazeControl = null;
    const before = document.activeElement?.closest?.("[data-action]");
    const key = before && {action:before.dataset.action, value:before.dataset.value};
    restart.hidden = state.view === "title";
    const stickGuide = screen.querySelector(".work-guide")?.open && screen.dataset.view === state.view;
    if (sceneViews.includes(state.view)) {
      if (screen.dataset.view !== state.view) screen.innerHTML = stages.shell();
      stages.update(screen.firstElementChild,state,button,html);
    } else {
      mapControl?.stop();
      mapControl = null;
      screen.innerHTML = views[state.view]();
      if (state.view === "travel") mapControl = window.BreathWorld.mount(screen,state.chapter,state.position,arrive);
      const guideElement = screen.querySelector(".work-guide");
      if (guideElement) guideElement.open = Boolean(stickGuide);
    }
    if (state.view !== "travel" && mapControl) {
      mapControl.stop();
      mapControl = null;
    }
    screen.dataset.view = state.view;
    steps.innerHTML = content.chapter.map((chapter, index) => {
      const current = index === state.chapter && !["ending","done"].includes(state.view);
      const complete = index < state.chapter || state.submitted;
      return '<span class="step' + (current ? ' current' : '') + (complete ? ' complete' : '') +
        '"' + (current ? ' aria-current="step"' : '') + '><b>' + (complete ? '✓' : chapter.num) +
        '</b><span>' + chapter.short + '</span></span>';
    }).join("");
    if (focus) {
      tabFocus();
      const teachingBoard = state.view === "intro" && screen.querySelector(".lesson-board");
      if (teachingBoard && window.matchMedia("(max-width: 620px)").matches) {
        teachingBoard.scrollIntoView({block:"start"});
      } else window.scrollTo(0, 0);
    } else if (key) {
      Array.from(screen.querySelectorAll("[data-action]")).find((control) =>
        control.dataset.action === key.action && control.dataset.value === key.value)?.focus({preventScroll:true});
    }
    if (state.view === "maze") {
      mazeControl = window.BreathMaze.mount(screen,state.maze,reachMazeDoor,
        (position) => {state.maze.position = position;});
      const dialogButton = screen.querySelector(".maze-message button");
      if (dialogButton) dialogButton.focus({preventScroll:true});
    }
    if (state.view === "labyrinth") {
      labyrinthControl = window.BreathLabyrinth.mount(screen,state.labyrinth,visitLabyrinth,(message)=>toast(message),pursuitChanged,hidePursuit,()=>play("footstep"));
      const messageFocus=state.labyrinth.cupGame && ["preview","shuffling"].includes(state.labyrinth.cupGame.phase)?
        screen.querySelector(".key-shuffle h2"):screen.querySelector(".labyrinth-message button:not(:disabled)");
      messageFocus?.focus({preventScroll:true});
      screen.querySelector(".pursuit-modal h2")?.focus({preventScroll:true});
      if (state.labyrinth.cupGame) cupControl = window.BreathKeyShuffle.mount(screen,state.labyrinth.cupGame);
    }
    if (state.view === "debate") {
      debateControl = window.BreathDebate.mount(screen,state.debate,fireDebate,selectDebateAmmo,{miss:missDebate,timeout:timeoutDebate});
      const messageButton = screen.querySelector(".debate-feedback button");
      if (messageButton) messageButton.focus({preventScroll:true});
    }
    tutorial.update(state,{assist:hintAssist,clear:clearHint});
    pursuitMusic();
  }

  function placeToken(token, slot) {
    const [recordId, key] = token.split(":");
    const record = getRecord(recordId);
    if (!record || !fields[slot]) return;
    if (key !== slot && !(modes.isHard() && ((slot === "date" && ["received","reported"].includes(key)) || (slot === "result" && key === "partial")))) {
      toast("這格需要「" + fields[slot] + "」。你拿的是「" + fields[key] + "」。", "error");
      return;
    }
    const origin = documents.origin(record,key);
    state.draft[slot] = {record, origin, key};
    state.token = "";
    state.slot = "";
    play("tick");
    render(false);
  }


  function collect() {
    const {id} = state.draft;
    const cells = Object.keys(fields).map((key) => state.draft[key]);
    if (cells.some((entry) => !entry))
      return toast("先填齊檢體編號、採檢時間、檢體類型和檢驗結果。","error");
    if (!modes.isHard() && cells.some((entry) => entry.record !== id.record))
      return toast("有欄位來自不同檢體。請核對試算表的列和 PPT 報告編號。","error");
    const record = id.record;
    if (!modes.isHard() && !content.fitWindow(record))
      return toast(record.id + " 採於 " + record.date + "，超出本關的 11/15–11/21 收件窗。", "error");
    if (state.records.includes(record))
      return toast(record.id + " 已收錄，請找另一份符合日期的紀錄。", "error");
    state.gatherAudit[record.id] = {...state.draft};
    state.records.push(record);
    state.draft = {};
    state.token = "";
    state.slot = "";
    play("done");
    render(false);
    toast((modes.isHard() ? "已暫存 " : "已收錄 ") + record.id + "，並保留試算表與投影片的來源。", "success");
  }

  function mark(index) {
    const segment = currentPaper().segments[index];
    if (!segment) return;
    if (!modes.isHard() && segment.hint) return toast(segment.hint);
    if (!modes.isHard() && !segment.key) return;
    feedback.classList.remove("shown");
    state.marks = state.marks.includes(index) ? state.marks.filter((value) => value !== index) : [...state.marks, index];
    render(false);
  }

  function classify(decision) {
    const paper = currentPaper();
    if (!paper || !["keep","skip"].includes(decision)) return;
    if (modes.isHard()) {
      const editing=state.paperDecisions.filter(Boolean).length===content.literature.length;
      modes.queuePaper(state,decision);
      if(editing)state.paper=content.literature.length;
      render(true);return;
    }
    if (decision === "keep") {
      if (!paper.fit) return toast(paper.feedback, "error");
      if (!state.marks.some((index) => paper.segments[index].key === "site"))
        return toast("先在這篇摘要圈出能和本案比對的檢體部位。", "error");
      state.kept.push({id:paper.id, title:paper.title, source:paper.source, note:paper.note,
        quotes:state.marks.map((index) => paper.segments[index].text),
        excerpt:paper.segments.map((part) => part.text).join("")});
      play("done");
    } else play("tick");
    state.paper += 1;
    state.marks = [];
    if (state.paper === content.literature.length) go("travel", 3);
    else render(true);
    toast(decision === "keep" ? "已收入文獻 " + paper.id + "。 " + paper.feedback :
      "已略過文獻 " + paper.id + "。", decision === "keep" ? "success" : "");
  }

  function advance() {
    const current = stages.lines(state);
    if (state.beat === current.length - 1) {
      if (state.view === "ending") go("done");
      else if (state.view === "brief") go(activity[state.chapter]);
      else go("travel", 0);
      return;
    }
    state.beat += 1;
    if (current[state.beat].cue) play(current[state.beat].cue);
    render(true);
  }

  function clearHint() {
    if (state?.labyrinth && !modes.isEasy()) state.labyrinth.hintGoal = "";
  }
  function hintAssist(kind, goal) {
    if (modes.isHard()) return;
    if (kind === "route" && state.view === "labyrinth" && !state.labyrinth.dialog && !state.labyrinth.complete) {
      const expected = !state.labyrinth.found.specimen ? "specimen" : !state.labyrinth.found.missing ? "missing" : "exit";
      if (goal !== expected) return;
      state.labyrinth.hintGoal = goal;
      render(false);
      screen.querySelector(".labyrinth-viewport")?.focus({preventScroll:true});
    }
    if (kind === "debate" && state.view === "debate") {
      const session = state.debate;
      if (session.phase !== "running" || session.feedback || session.drawer || session.shotPending) return;
      const round = window.BreathDebateData.current(session);
      session.elapsed = (round.lines.findIndex(line => line.id === round.correct.line) + .45) * window.BreathDebateData.lineDuration;
      session.paused = true;
      render(false);
    }
  }

  function focusSource() {
    const source = screen.querySelector("#raw-source");
    source?.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});
    source?.scrollIntoView({block:"start"});
  }
  const actions = {
    start: () => { go("intro"); play("phone"); },
    difficulty: (id) => { if (state.view !== "title") return; modes.apply(id); state.difficulty=modes.id(); state.mazeMode=modes.id()==="normal" && mazeView==="maze"?"rules":"explore"; activity[1]=state.mazeMode==="rules"?"maze":"labyrinth"; render(false); },
    "easy-import": (id) => {
      if (!modes.isEasy() || state.view !== "gather") return;
      const record=getRecord(id); if (!record || state.records.includes(record)) return;
      state.draft=Object.fromEntries(Object.keys(fields).map(key=>[key,{record,key,origin:documents.origin(record,key)}]));
      state.source="ppt";state.slide=id;state.token="";state.slot="";render(false);
    },
    "remove-record": (id) => { if (!modes.isHard() || state.view!=="gather") return; state.records=state.records.filter(r=>r.id!==id);delete state.gatherAudit[id];state.gatherErrors=[];render(false); },
    "maze-answer": (value) => { if (state.view!=="labyrinth" || !modes.isHard()) return; window.BreathLabyrinthData.answer(state.labyrinth,Number(value));render(false); },
    "paper-edit": (value) => { const n=Number(value);if(!modes.isHard()||state.view!=="literature"||state.paperGrade||!Number.isInteger(n)||!state.paperDecisions[n])return;state.paper=n;state.marks=[...state.paperDecisions[n].marks];render(true); },
    "papers-submit": () => { if(!modes.isHard()||state.view!=="literature"||state.paperDecisions.filter(Boolean).length!==content.literature.length)return;modes.gradePapers(state);render(true); },
    "papers-retry": () => { if(!modes.isHard()||state.view!=="literature")return;state.paper=0;state.marks=[];state.paperDecisions=[];state.paperGrade=null;state.kept=[];render(true); },
    "papers-next": () => { if(modes.isHard()&&state.paperGrade?.passed)go("travel",3); },
    "debate-retry-round": () => { if(state.view!=="debate"||state.debate.phase!=="failed")return;state.debate.phase="ready";state.debate.feedback=null;state.debate.selected="";state.debate.elapsed=0;state.debate.focus=false;state.debate.paused=false;state.debate.drawer=false;state.debate.shotPending=false;modes.debate(state.debate);render(true); },
    "demo-debate": demoDebate,
    "demo-maze": demoMaze,
    "labyrinth-landmark": (id) => labyrinthControl?.toLandmark(id),
    "pursuit-start": () => {
      if(state.view!=="labyrinth"||!window.BreathPursuit.start(state.labyrinth.pursuit))return;
      render(false);screen.querySelector(".labyrinth-board")?.scrollIntoView({block:"start"});
    },
    "pursuit-hide": (id) => {if(state.view==="labyrinth")labyrinthControl?.hide(id);},
    "pursuit-leave": () => {
      if(state.view!=="labyrinth"||!window.BreathPursuit.leave(state.labyrinth.pursuit))return;
      render(false);screen.querySelector(".labyrinth-viewport")?.focus({preventScroll:true});
      screen.querySelector(".labyrinth-board")?.scrollIntoView({block:"center"});
    },
    "pursuit-retry": () => {
      if(state.view!=="labyrinth"||!window.BreathPursuit.retry(state.labyrinth))return;
      render(false);screen.querySelector(".labyrinth-viewport")?.focus({preventScroll:true});
      screen.querySelector(".labyrinth-board")?.scrollIntoView({block:"center"});
    },
    "key-cup": (value) => {
      if(state.view!=="labyrinth" || !state.labyrinth.cupGame)return;
      const game=state.labyrinth.cupGame;
      if(window.BreathKeyShuffle.choose(game,Number(value))){
        play(game.phase==="won"?"done":"tick");render(false);
      }
    },
    "key-switch": (value) => {
      if(state.view!=="labyrinth" || !state.labyrinth.cupGame)return;
      const game=state.labyrinth.cupGame;
      if(window.BreathKeyShuffle.resolve(game,value)){
        play(game.phase==="won"?"done":"tick");render(false);
      }
    },
    "key-retry": () => {
      if(state.view!=="labyrinth" || state.labyrinth.cupGame?.phase!=="failed")return;
      const game=state.labyrinth.cupGame;
      state.labyrinth.cupGame=window.BreathKeyShuffle.create(game.difficulty,game.landmark,game.title,Math.random,game.attempt+1);
      render(false);
    },
    "key-claim": () => {
      if(state.view!=="labyrinth")return;
      const id=window.BreathKeyShuffle.claim(state.labyrinth);
      if(id)visitLabyrinth(id);
    },
    "key-leave": () => {
      if(state.view!=="labyrinth" || !state.labyrinth.cupGame || state.labyrinth.cupGame.phase==="won")return;
      state.labyrinth.cupGame=null;state.labyrinth.dialog=null;
      render(false);screen.querySelector(".labyrinth-viewport")?.focus({preventScroll:true});
    },
    "labyrinth-close": () => {
      if(state.labyrinth.cupGame)return;
      state.labyrinth.dialog=null;
      render(false);
      screen.querySelector(".labyrinth-viewport")?.focus({preventScroll:true});
      screen.querySelector(".labyrinth-board")?.scrollIntoView({block:"start"});
    },
    "labyrinth-read": (id) => {
      if (!state.labyrinth.seen.includes(id) || state.labyrinth.dialog) return;
      visitLabyrinth(id);
    },
    "labyrinth-replay": () => {
      state.labyrinth=window.BreathLabyrinthData.create();
      state.maze.results={};
      render(true);
    },
    "debate-ammo": selectDebateAmmo,
    "debate-start": () => {
      if (!state.debate.selected || state.debate.phase !== "ready") return;
      state.debate.phase = "running";
      render(false);
      screen.querySelector(".debate-arena")?.focus({preventScroll:true});
      screen.querySelector(".debate-board")?.scrollIntoView({block:"start"});
    },
    "debate-hit": fireDebate,
    "debate-focus": () => debateControl?.focus(),
    "debate-motion": () => debateControl?.motion(),
    "debate-pause": () => debateControl?.pause(),
    "debate-replay": () => debateControl?.replay(),
    "debate-evidence": () => {
      if (!state.debate.selected || state.debate.feedback || state.debate.shotPending) return;
      state.debate.drawer = true;
      render(false);
      screen.querySelector('[data-action="debate-close"]')?.focus({preventScroll:true});
      screen.querySelector(".debate-arena")?.scrollIntoView({block:"start"});
    },
    "debate-close": () => {state.debate.drawer=false;render(false);},
    "debate-next": () => {
      window.BreathDebateData.next(state.debate);
      if (!state.debate.feedback && state.debate.phase === "ready") modes.debate(state.debate);
      render(true);
      screen.querySelector(".debate-board")?.scrollIntoView({block:"start"});
    },
    "debate-report": () => {
      if (state.debate.phase !== "complete") return;
      go("report",3);
    },
    skip: () => go("travel", 0),
    advance,
    "rewind-intro": () => {
      if (state.view !== "intro" || state.beat === 0) return;
      state.beat -= 1;
      render(true);
    },
    "walk-goal": () => mapControl?.walkTo(),
    "walk-step": (direction) => mapControl?.step(direction),
    "to-source": () => focusSource(),
    source: (value) => {
      state.source = value;
      state.token = "";
      const record = state.draft.id?.record;
      if (value === "ppt" && record) state.slide = record.id;
      render(false);
    },
    slide: (id) => {
      state.slide = id;
      state.token = "";
      render(false);
    },
    "report-date": (id) => {
      const record = getRecord(id);
      toast(record.reportDate + " 是末次核發日；這份 " + record.sampleCode + " 檢體於 " + record.date + " 採到。");
    },
    token: (value) => {
      if (state.slot) return placeToken(value, state.slot);
      state.token = state.token === value ? "" : value;
      render(false);
      if (state.token && window.matchMedia("(max-width: 620px)").matches) {
        const key = state.token.split(":")[1];
        const field = screen.querySelector('[data-action="slot"][data-value="' + key + '"]');
        field?.focus({preventScroll:true});
        field?.scrollIntoView({block:"center"});
      }
    },
    slot: (value) => {
      if (state.token) return placeToken(state.token, value);
      state.slot = state.slot === value ? "" : value;
      render(false);
    },
    clear: () => { state.draft = {}; state.token = ""; state.slot = ""; render(false); },
    collect,
    "gather-next": () => {
      if (modes.isHard() && !modes.checkGather(state)) { render(true); return; }
      if (!modes.isHard() && state.records.length !== content.records.filter(content.fitWindow).length) return;
      state.records.sort((a,b) => a.date.localeCompare(b.date));
      go("travel", 1);
    },
    "maze-door": (option) => {
      if (state.maze.feedback || state.maze.drawer || state.maze.returning) return;
      const choices = window.BreathMazeRules.current(state.maze).options;
      const index = choices.findIndex((entry) => entry.id === option);
      if (index >= 0) {
        state.maze.walking = true;
        tutorial.update(state);
        screen.querySelector(".maze-viewport")?.focus({preventScroll:true});
        screen.querySelector(".maze-viewport")?.scrollIntoView({block:"center"});
        mazeControl?.walkDoor(index);
      }
    },
    "maze-step": (direction) => mazeControl?.step(direction),
    "maze-book": () => {
      if (state.maze.feedback) return;
      state.maze.walking = false;
      state.maze.drawer = "book";
      state.maze.readBook = true;
      render(false);
    },
    "maze-evidence": () => {
      if (state.maze.feedback) return;
      state.maze.walking = false;
      state.maze.drawer = "evidence";
      render(false);
    },
    "maze-close": () => {state.maze.drawer = ""; render(false);},
    "maze-proof": (id) => {
      if (!window.BreathMazeRules.cards(state.records,state.maze.candidate).some((entry) => entry.id === id)) return;
      state.maze.selected = id;
      state.maze.drawer = "";
      render(false);
    },
    "maze-continue": () => {
      window.BreathMaze.next(state.maze);
      render(true);
    },
    "review-next": () => go("travel", 2),
    mark: (value) => mark(Number(value)),
    classify,
    submit: () => { if (state.debate?.phase === "complete") { state.submitted = true; go("ending"); play("rift"); } },
    "see-report": () => go("report", 3),
    "back-done": () => go("done"),
    replay: reset
  };

  screen.addEventListener("click", (event) => {
    const control = event.target.closest("[data-action]");
    if (!control || (performance.now() < ignoreClickUntil && event.detail !== 0)) return;
    actions[control.dataset.action]?.(control.dataset.value);
  });

  function keydown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || dialog.open) return;
    if(state.view==="labyrinth"&&window.BreathPursuit.overlay(state.labyrinth.pursuit)&&event.key==="Tab"){
      event.preventDefault();
      const controls=[...screen.querySelectorAll('.pursuit-modal button:not(:disabled)')],current=controls.indexOf(document.activeElement);
      const next=current<0?(event.shiftKey?controls.length-1:0):(current+(event.shiftKey?-1:1)+controls.length)%controls.length;
      controls[next]?.focus({preventScroll:true});return;
    }
    if (state.view === "labyrinth" && state.labyrinth.dialog && event.key === "Tab") {
      event.preventDefault();
      const controls=[...screen.querySelectorAll('.labyrinth-message button:not(:disabled),.labyrinth-message a[href]')];
      const current=controls.indexOf(document.activeElement);
      const next=current<0?(event.shiftKey?controls.length-1:0):(current+(event.shiftKey?-1:1)+controls.length)%controls.length;
      controls[next]?.focus({preventScroll:true});
      return;
    }
    if (state.view === "debate" && state.debate.feedback && event.key === "Tab") {
      event.preventDefault();
      screen.querySelector(".debate-feedback button")?.focus();
      return;
    }
    if (state.view === "maze" && state.maze.feedback && event.key === "Tab") {
      event.preventDefault();
      screen.querySelector(".maze-message button")?.focus();
      return;
    }
    if (state.view === "intro" && event.key === "ArrowLeft") {
      event.preventDefault();
      actions["rewind-intro"]();
      return;
    }
    if (sceneViews.includes(state.view) && (event.key === "ArrowRight" ||
        (event.code === "Space" && !event.target.closest("button,a")))) {
      event.preventDefault();
      advance();
    }
    if (state.view === "literature" && ["ArrowLeft","ArrowRight"].includes(event.key)) {
      event.preventDefault();
      classify(event.key === "ArrowLeft" ? "skip" : "keep");
    }
  }

  document.addEventListener("keydown", keydown);
  restart.addEventListener("click", () => {
    if (typeof dialog.showModal === "function") { dialog.returnValue = ""; dialog.showModal(); }
    else if (window.confirm("重新開始調查？")) reset();
  });
  dialog.addEventListener("close", () => { if (dialog.returnValue === "confirm") reset(); });
  sound.addEventListener("click", () => {
    muted = !muted;
    sound.setAttribute("aria-pressed", String(!muted));
    sound.textContent = "音效：" + (muted ? "關" : "開");
    if (!muted) play("tick");
  });
  const musicButton = document.getElementById("music");
  musicButton?.addEventListener("click", () => {
    const enabled = window.BreathMusic.toggle();
    musicButton.textContent = "音樂：" + (enabled ? "開" : "關");
    musicButton.setAttribute("aria-pressed",String(enabled));
  });


  function point(event) {
    return {x:event.clientX, y:event.clientY};
  }

  screen.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !event.isPrimary) return;
    const handler = event.target.closest("[data-drag]");
    const article = event.target.closest("[data-swipe]");
    if (handler) {
      drag = {id:event.pointerId, kind:handler.dataset.drag, value:handler.dataset.value,
        label:handler.innerText, start:point(event), ghost:null};
    } else if (article) {
      swipe = {id:event.pointerId, article, start:point(event), moving:false};
    }
  });

  window.addEventListener("pointermove", (event) => {
    if (drag?.id === event.pointerId) {
      const dx = event.clientX - drag.start.x, dy = event.clientY - drag.start.y;
      if (!drag.ghost && Math.hypot(dx,dy) < 7) return;
      if (!drag.ghost) {
        drag.ghost = document.createElement("span");
        drag.ghost.className = "drag-ghost";
        drag.ghost.textContent = drag.label;
        document.body.append(drag.ghost);
        screen.setPointerCapture(event.pointerId);
      }
      drag.ghost.style.left = event.clientX + "px";
      drag.ghost.style.top = event.clientY + "px";
      const target = document.elementFromPoint(event.clientX,event.clientY)?.closest("[data-drop]");
      if (drag.target !== target) {
        drag.target?.classList.remove("over");
        drag.target = target?.dataset.drop === drag.kind ? target : null;
        drag.target?.classList.add("over");
      }
    } else if (swipe?.id === event.pointerId) {
      const dx = event.clientX - swipe.start.x, dy = event.clientY - swipe.start.y;
      if (!swipe.moving && (Math.abs(dx) < 12 || Math.abs(dx) < Math.abs(dy) * 1.4)) return;
      swipe.moving = true;
      const capped = Math.max(-120,Math.min(120,dx));
      swipe.article.classList.add("swiping");
      swipe.article.style.setProperty("--swipe", capped + "px");
      swipe.article.dataset.swipeSide = Math.abs(dx) >= 54 ? (dx > 0 ? "keep" : "skip") : "";
    }
  });

  function endPointer(event, cancel = false) {
    if (drag?.id === event.pointerId) {
      const item = drag;
      drag = null;
      item.ghost?.remove();
      item.target?.classList.remove("over");
      if (!item.ghost || cancel) return;
      ignoreClickUntil = performance.now() + 260;
      if (!item.target) return;
      if (item.kind === "token") placeToken(item.value,item.target.dataset.value);

    }
    if (swipe?.id === event.pointerId) {
      const gesture = swipe;
      swipe = null;
      gesture.article.classList.remove("swiping");
      gesture.article.style.removeProperty("--swipe");
      delete gesture.article.dataset.swipeSide;
      if (!gesture.moving || cancel) return;
      ignoreClickUntil = performance.now() + 260;
      const dx = event.clientX - gesture.start.x, dy = event.clientY - gesture.start.y;
      if (Math.abs(dx) >= 54 && Math.abs(dx) > Math.abs(dy) * 1.25)
        classify(dx > 0 ? "keep" : "skip");
    }
  }

  window.addEventListener("pointerup", (event) => endPointer(event));
  window.addEventListener("pointercancel", (event) => endPointer(event,true));
  reset();
  if (new URLSearchParams(location.search).get("demo") === "debate") demoDebate();
  else if (new URLSearchParams(location.search).get("demo") === "maze") demoMaze();
})();
