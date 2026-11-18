(function () {
  "use strict";
  const {records,caseInfo} = window.BreathContent;
  const columns = {id:"B",date:"C",type:"D"};

  function address(record,key) {
    return columns[key] + record.row;
  }

  function value(record,key) {
    return key === "date" ? record.dateTime : record[key];
  }

  function origin(record,key) {
    return key === "result" ? "病程彙整.pptx · " + record.doc : "採檢清冊.xlsx · 採檢紀錄!" + address(record,key);
  }

  function workbook(selected, renderToken, html) {
    const [id,key] = selected.split(":");
    const active = records.find((record) => record.id === id && columns[key]);
    const top = active ? address(active,key) : "A1";
    const formula = active ? value(active,key) : "病例代號";
    const rows = records.map((record) => '<tr><th scope="row">' + record.row + '</th><td>' + caseInfo.patient +
      '</td><td>' + renderToken(record,"id") + '</td><td>' + renderToken(record,"date") +
      '</td><td>' + renderToken(record,"type") + '</td></tr>').join("");
    return '<div class="office workbook"><div class="office-title"><b aria-hidden="true">X</b>' +
      '<strong>採檢清冊.xlsx</strong><span>模擬資料</span></div><div class="formula-bar">' +
      '<span>' + top + '</span><i>fx</i><div>' + html(formula) + '</div></div>' +
      '<table class="workbook-grid" aria-label="採檢紀錄工作表"><colgroup><col class="row-index"><col class="patient-col">' +
      '<col class="id-col"><col class="date-col"><col class="type-col"></colgroup><thead><tr class="column-address">' +
      '<td></td><td>A</td><td>B</td><td>C</td><td>D</td></tr>' +
      '<tr><th aria-label="工作表第 1 列">1</th><th scope="col">病例代號</th><th scope="col">檢體編號</th>' +
      '<th scope="col">採檢時間</th><th scope="col">檢體類型</th></tr></thead><tbody>' + rows +
      '</tbody></table><div class="sheet-footer"><span>採檢紀錄</span><small>3 筆紀錄</small></div></div>';
  }

  function labReport(record, html, controls = {}) {
    const tests = record.tests.map((test) =>
      '<tr><th scope="row">' + html(test.label) + '</th><td><em>' + html(test.finding) +
      '</em><small>' + html(test.detail) + '</small></td><td>' + html(test.released) + '</td></tr>').join("");
    const fact = (label, text) => '<div><dt>' + label + '</dt><dd>' + text + '</dd></div>';
    return '<div class="lab-report"><div class="lab-head"><div><p>檢驗醫學部 · 報告節錄</p><strong>微生物檢驗報告</strong></div>' +
      '<span>模擬病例</span></div><dl class="lab-metadata">' +
      fact("病例代號",caseInfo.patient) + fact("檢體編號",controls.id || record.id) +
      fact("檢體類型",html(record.type) + " · " + record.sampleCode) + fact("採檢時間",html(record.dateTime)) +
      fact("收件時間",html(record.received)) + fact("末次核發",controls.date || html(record.reportDate)) +
      '</dl><table class="lab-results"><thead><tr><th scope="col">檢驗項目</th><th scope="col">結果節錄</th>' +
      '<th scope="col">核發時間</th></tr></thead><tbody>' + tests + '</tbody></table></div>';
  }

  function powerpoint(active, button, renderToken, html) {
    const pages = records.map((record,index) => button('<span class="slide-icon" aria-hidden="true"></span>' +
      '<span><small>' + (index+1) + '</small> ' + record.doc + '</span>',"slide",record.id,{
        kind:"slide-thumb",attrs:' aria-pressed="' + (active === record) +
          '" aria-label="第 ' + (index+1) + ' 張投影片 ' + html(record.slideTitle) + '"'
      })).join("");
    const dates = button("報告日 " + active.reportDate,"report-date",active.id,{kind:"date-chip"});
    return '<div class="office ppt"><div class="office-title"><b aria-hidden="true">P</b>' +
      '<strong>病程彙整.pptx</strong><span>模擬資料</span></div><div class="ppt-layout">' +
      '<nav class="slide-rail" aria-label="投影片">' + pages + '</nav>' +
      '<section class="report-slide"><header><p>病例 ' + caseInfo.patient + ' · ' + active.doc + '</p><h3>' +
      html(active.slideTitle) + '</h3></header><div class="report-inset">' + labReport(active,html,{date:dates}) +
      '</div><div class="slide-result"><span>帶入紀錄表</span>' + renderToken(active,"result") + '</div>' +
      '</section></div></div>';
  }

  window.BreathDocuments = {address,value,origin,workbook,labReport,powerpoint};
})();

