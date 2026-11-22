(function () {
  "use strict";
  // All teaching diagrams are local SVG + real text, shared by HTTP and file:// play.
  const drawings = {
    sample: '<path d="M12 28h21l6-10h10l5 10h11v40H12z" fill="#305868"/><path d="M17 43h43v20H17z" fill="#8bc8bd"/><path d="M30 9h18v8H30zm3 8h12v15H33z" fill="#e4c894"/><path d="M36 45h7v4h-7zm13 8h5v5h-5zm-26 2h7v4h-7z" fill="#eee4c9"/>',
    reads: '<path d="M9 13h24v8H9zm32 0h20v8H41zM17 30h24v8H17zm32 0h17v8H49zM7 48h22v8H7zm30 0h25v8H37z" fill="#8fc9bf"/><path d="M15 13h5v8h-5zm32 0h5v8h-5zM23 30h5v8h-5zm32 0h5v8h-5zM13 48h5v8h-5zm30 0h5v8h-5z" fill="#efd297"/><path d="M9 25h20m12 18h21" stroke="#58717d" stroke-width="2" stroke-dasharray="3 4"/>',
    match: '<path d="M9 14h15v45H9zm19-5h16v50H28zm20 10h16v40H48z" fill="#507b81"/><path d="M12 23h9m10-4h10m10 9h10M12 48h9m10 0h10m10 0h10" stroke="#e9d3a9" stroke-width="4"/><path d="m28 65 9 7 19-18" fill="none" stroke="#9ce2c5" stroke-width="5"/>',
    report: '<path d="M17 7h35l10 10v52H17z" fill="#e8ddc5"/><path d="M52 7v12h10" fill="#b9ac96"/><path d="M25 26h18m-18 12h26m-26 12h18" stroke="#5c7d77" stroke-width="4"/><path d="M48 42h8v8h-8zm0 13h8v6h-8z" fill="#ae7b43"/>',
    background: '<path d="M9 61h54v8H9zM42 9h12v10H42zm-5 10h22v8H37zm4 8h14v9H41z" fill="#668894"/><path d="m42 36 6 10 6-10M13 20h7v7h-7zm9 17h5v5h-5zm-8 9h6v6h-6z" fill="#e5c587"/><path d="M31 53h31v8H31z" fill="#9ccebe"/><path d="M19 26 36 48" stroke="#e5c587" stroke-width="2" stroke-dasharray="3 4"/>',
    colonization: '<path d="M8 50h56v9H8zm0 9h56v9H8z" fill="#8faeb0"/><path d="M16 37h10v10H16zm22-7h12v12H38zm-9-13h9v9h-9z" fill="#92d1b4"/><path d="M19 40h3v3h-3zm22-7h3v3h-3z" fill="#24454d"/><path d="M11 54h9m8 0h10m8 0h11" stroke="#e8d9bc" stroke-width="2"/>',
    infection: '<path d="M10 50h52v17H10z" fill="#98aead"/><path d="M30 46h12v8H30zm-6-15h13v12H24z" fill="#d99c7d"/><path d="M20 19v8m-9 9h8m24-17-5 8" stroke="#ebbd7b" stroke-width="3"/><circle cx="50" cy="28" r="14" fill="#20323e" stroke="#e5c587" stroke-width="4"/><path d="m59 40 8 10M46 24v-4h8v8h-4v5m0 3v4" stroke="#e5c587" stroke-width="3" fill="none"/>',
    evidence: '<path d="M12 12h46v55H12z" fill="#e5dcc7"/><path d="M25 8h20v10H25z" fill="#557d7d"/><path d="M20 29h29m-29 12h29m-29 12h17" stroke="#698a80" stroke-width="4"/><path d="m44 53 6 5 13-14" stroke="#9bd3b8" stroke-width="4" fill="none"/>',
    folder: '<path d="M7 20h23l8 8h29v38H7z" fill="#b49459"/><path d="M10 32h57v34H10z" fill="#e1c381"/><path d="M20 10h35v32H20z" fill="#e8e1cf"/><path d="M27 19h20m-20 8h20m-20 8h13" stroke="#709e92" stroke-width="3"/>'
  };
  const icon = (name) => '<svg class="lesson-icon" viewBox="0 0 76 78" aria-hidden="true" focusable="false">' + drawings[name] + '</svg>';
  const steps = [
    ["sample","取得檢體","例如肺泡灌洗液"],
    ["reads","讀取遺傳片段","定序產生短序列"],
    ["match","比對資料庫","尋找相符的序列"],
    ["report","形成檢出清單","列出微生物訊號"]
  ];
  const flowNotes = {
    sample: ["先從檢體開始","mNGS 會廣泛尋找檢體中的微生物遺傳訊號。"],
    reads: ["定序：把遺傳訊號讀成片段","DNA／RNA 經相應流程，產生可供分析的短序列（reads）。"],
    match: ["比對：這些片段可能來自誰？","把序列與參考資料庫對照，整理微生物的檢出訊號。"],
    report: ["有名字，還沒有致病結論","清單是調查起點；訊號多寡也需要放回病例判讀。"]
  };
  const explanations = [
    ["background","背景訊號","環境／試劑等"],
    ["colonization","定植","存在於身體部位"],
    ["infection","與感染相關？","還需要其他證據"]
  ];
  const explanationNotes = {
    possibilities: ["同樣是「檢出」，意義可能不同","需要回到檢體來源與病人狀況，才能區分這些可能。"],
    background: ["背景訊號：可能在過程中被帶入","採檢、環境或試劑中的微量遺傳物質，也可能留下訊號。"],
    colonization: ["定植：存在，不代表正在造成感染","微生物可能存在於該部位，卻不是這次生病的原因。"],
    infection: ["感染相關：需要拼上其他支持","菌種、檢體部位、宿主與臨床證據，要一起考量。"]
  };
  function heading(part,title,sub) {
    return '<header class="lesson-heading"><p class="lesson-kicker">醫師的說明板 <span>' + part +
      '</span></p><h2>' + title + '</h2><p>' + sub + '</p></header>';
  }
  function note(title,body) {
    return '<div class="lesson-note"><strong>' + title + '</strong><p>' + body + '</p></div>';
  }
  function flow(id) {
    const active = steps.findIndex(([key]) => key === id);
    return heading("01 / 03","mNGS 怎麼找到微生物？","宏基因體次世代定序") +
      '<ol class="lesson-flow">' + steps.map(([key,title,sub],index) =>
        '<li class="' + (index === active ? 'is-current' : index < active ? 'is-seen' : '') + '"' +
        (index === active ? ' aria-current="step"' : '') + '><span class="lesson-step">' + (index+1) + '</span>' +
        icon(key) + '<strong>' + title + '</strong><small>' + sub + '</small></li>').join("") + '</ol>' +
      note(...flowNotes[id]) + '<p class="lesson-footnote">流程簡圖｜實際檢驗另含前處理、品質控制與分析。</p>';
  }
  function possibilities(id) {
    return heading("02 / 03","檢出 ≠ 致病","清單上的名字，可能有不同解釋") +
      '<div class="lesson-possibilities">' + explanations.map(([key,title,sub]) =>
        '<div class="lesson-possibility ' + (id === key ? 'is-current' : '') + '">' +
        icon(key) + '<strong>' + title + '</strong><small>' + sub + '</small></div>').join("") + '</div>' +
      note(...explanationNotes[id]) + '<p class="lesson-footnote">概念示意｜同一菌種的意義，會隨檢體與病人狀況改變。</p>';
  }
  function evidence() {
    return heading("03 / 03","把名字放回病例","我們的研究從這些既有報告出發") +
      '<div class="lesson-evidence"><div><b>採檢脈絡</b><span>誰、哪裡、什麼時候？</span></div>' +
      '<div><b>病人狀況</b><span>症狀、宿主與風險</span></div>' +
      '<div><b>其他檢驗</b><span>培養、分子檢測等支持</span></div>' +
      '<div><b>影像與文獻</b><span>病況脈絡與判讀依據</span></div></div>' +
      note("一項檢出，需要多方核對","讀數是線索之一，不能只憑高低指定致病菌。") +
      '<p class="lesson-footnote">影像提供臨床脈絡，不能單靠影像確認菌種。</p>';
  }
  function dossier() {
    return heading("03 / 03","先把散落的線索接起來","這就是你要調查的事") +
      '<div class="lesson-dossier"><div class="lesson-sources">' +
      '<span><i class="source-excel">X</i>採檢清冊<small>Excel</small></span>' +
      '<span><i class="source-ppt">P</i>檢驗截圖<small>PPT</small></span>' +
      '<span><i class="source-mngs">M</i>檢出清單<small>mNGS</small></span></div>' +
      '<div class="lesson-join" aria-hidden="true">↓</div><div class="lesson-folder">' +
      icon("folder") + '<span><b>同一份病例案卷</b><small>病人 · 檢體 · 採檢時間 · 原始來源</small></span></div></div>' +
      note("先整理，再判讀","把報告接錯，後面的推論就可能跟著走錯。") +
      '<p class="lesson-footnote">本專題整合既有臨床資料與 mNGS 報告，協助病原判讀。</p>';
  }
  function render(id) {
    const body = flowNotes[id] ? flow(id) : explanationNotes[id] ? possibilities(id) :
      id === "evidence" ? evidence() : id === "dossier" ? dossier() : "";
    return body ? '<figure class="lesson-board" data-lesson="' + id +
      '" aria-label="mNGS 與研究動機圖解">' + body + '</figure>' : "";
  }
  window.BreathIntroVisuals = {render};
})();
