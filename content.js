/* D07 and all of its dates, identifiers and results are fictional. */
(function (root) {
  "use strict";

  const candidates = {
    A:{id:"A",name:"銅綠假單胞菌",scientific:"Pseudomonas aeruginosa",short:"P. aeruginosa",family:"細菌",reads:1246},
    B:{id:"B",name:"白色念珠菌",scientific:"Candida albicans",short:"C. albicans",family:"真菌",reads:3840},
    C:{id:"C",name:"K. variicola",scientific:"Klebsiella variicola",short:"K. variicola",family:"細菌",reads:398}
  };
  const group = {
    name:"肺炎克雷伯氏菌群", scientific:"Klebsiella pneumoniae group",
    members:["K. pneumoniae","K. quasipneumoniae","K. variicola"]
  };
  const caseInfo = {
    patient:"D07", year:"2026", reference:"L02", symptom:"住院期間出現發燒、咳嗽，血氧較前下降。",
    sequencingReport:"11/19 20:05", interval:"11/15–11/21"
  };
  const records = [
    { id:"L02", date:"11/18", collected:"09:12", received:"11/18 09:34", reportDate:"11/20", type:"支氣管肺泡灌洗液",
      sampleCode:"BAL", row:2, doc:"P-01", slideTitle:"支氣管鏡後檢驗彙整", tests:[
        {kind:"culture",target:"A",label:"BAL 細菌培養", finding:candidates.A.scientific, detail:"分離菌種", released:"11/20 14:10"},
        {kind:"group",target:"G",members:["C"],label:"FilmArray 肺炎套組", finding:group.scientific,
          detail:"Detected · 10⁴ copies/mL", released:"11/18 11:05"}
      ] },
    { id:"L01", date:"11/16", collected:"07:42", received:"11/16 08:16", reportDate:"11/18", type:"痰液",
      sampleCode:"Sputum", row:3, doc:"P-02", slideTitle:"呼吸道檢體培養紀錄", tests:[
        {kind:"culture",target:"B",label:"呼吸道檢體培養", finding:candidates.B.scientific,
          detail:"分離菌種", released:"11/18 10:26"}
      ] },
    { id:"L00", date:"11/14", collected:"08:03", received:"11/14 08:35", reportDate:"11/16", type:"痰液",
      sampleCode:"Sputum", row:4, doc:"P-03", slideTitle:"較早的檢驗紀錄", tests:[
        {kind:"flora",label:"呼吸道檢體培養",finding:"Mixed respiratory flora",
          detail:"混合呼吸道菌叢",released:"11/16 11:55"}
      ] }
  ].map((record) => ({
    ...record, dateTime:caseInfo.year + "/" + record.date + " " + record.collected,
    result:record.tests.map((test) => test.kind === "group" ? group.name + "（檢出）" :
      test.target ? candidates[test.target].short + "（培養）" : test.detail).join("；")
  }));

  const bibliography = {
    taiwan:{label:"臺灣臨床分離株研究 · PubMed",url:"https://pubmed.ncbi.nlm.nih.gov/41787580/"},
    respiratory:{label:"呼吸道病例報告 · PMC",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC13372066/"},
    panel:{label:"BIOFIRE 肺炎套組使用說明",url:"https://www.biomerieux.com/content/dam/biomerieux-com/service-support/support-documents/instructions-for-use-and-manuals/RFIT-PRT-0575-FilmArray-Pneumo-Instructions-for-Use-EN.pdf"},
    yeast:{label:"IDSA 念珠菌指引第 IX 節",url:"https://www.idsociety.org/practice-guideline/candidiasis/"}
  };
  const literature = [
    { id:"01", title:"臺灣臨床分離株中的肺炎克雷伯氏菌群", source:bibliography.taiwan, fit:false, segments:[
      { text:"研究收集" },
      { text:"菌血症與泌尿道感染的分離株", type:"mismatch", hint:"研究樣本是血液或泌尿道來源，和這次的肺部檢體不同。" },
      { text:"，並辨認出 K. variicola 等群組成員。" }
    ], note:"檢體來源不同", feedback:"這篇有相符的菌種，研究檢體卻是血液和泌尿道來源。"},
    { id:"02", title:"呼吸道定序檢出與臨床判讀", fit:true, segments:[
      { text:"住院病人有" },{ text:"咳嗽", key:"symptom" },{ text:"，" },
      { text:"支氣管肺泡灌洗液（BAL）", key:"site" },{ text:"的定序結果列出 K. variicola。" },
      { text:"研究者只記錄檢出，未確認它是感染原因。", type:"limit", hint:"只能引用摘要說到的範圍。收入案卷時，這句會一起保留。" }
    ], note:"相同檢體類型；僅記載檢出", feedback:"檢體類型相符。這篇提供另一例的定序觀察，仍未確認菌種的致病角色。"},
    { id:"03", title:"以菌種層級判讀細菌性肺炎", fit:false, segments:[
      { text:"案例有" },{ text:"咳嗽", key:"symptom" },{ text:"，" },{ text:"支氣管肺泡灌洗液（BAL）",key:"site" },
      { text:"培養只報告" },{ text:"K. pneumoniae", type:"mismatch", hint:"它和 K. variicola 都屬於同一回報群組，但學名代表兩個不同菌種。" },
      { text:"，未記載 K. variicola。" }
    ], note:"同群組中的另一菌種", feedback:"部位相符，但文章研究的是 K. pneumoniae。兩個名字同群組、不同種。"},
    { id:"04", title:"呼吸道病例中的兩種細菌", source:bibliography.respiratory, fit:true, segments:[
      { text:"一份肺部感染病例報告在" },{ text:"痰液培養（呼吸道檢體）",key:"site" },
      { text:"同時分離出 K. variicola 和 A. baumannii。" },
      { text:"同一份痰液有兩種菌。", type:"limit", hint:"這篇可供呼吸道背景參考，但檢體是痰液，且合併分離出另一種菌。" }
    ], note:"呼吸道背景；痰液與 BAL 不同，且合併分離其他菌", feedback:"可參考同菌種的呼吸道報告。保留痰液來源與合併分離的限制。"},
    { id:"05", title:"實驗室菌種辨識結果", fit:false, segments:[
      { text:"摘要描述 K. variicola 在" },{ text:"實驗室參考樣本",type:"mismatch",hint:"這裡只有實驗室辨識資料，沒有病人症狀或檢體部位。" },
      { text:"中的辨識結果，未描述病人病例。" }
    ], note:"缺少可供對照的病人檢體", feedback:"只有實驗室參考樣本，缺少呼吸道病例的脈絡。"}
  ];


  const chapter = [
    {num:"01",name:"失序的紀錄",short:"整理紀錄",scene:"archive",place:"肺城・資料檔案區"},
    {num:"02",name:"文件審查窗口",short:"審查證據",scene:"counter",place:"肺城・文件審查窗口"},
    {num:"03",name:"候選複核室",short:"查閱文獻",scene:"review",place:"肺城・候選複核室"},
    {num:"04",name:"交回調查報告",short:"核對報告",scene:"review",place:"肺城・結案桌"}
  ];

  function chooseScope(record) {
    if (!record?.id) return "unknown";
    return record.id === caseInfo.reference ? "same" : "other";
  }

  function fits(record, radius) {
    if (!record?.date) return false;
    const ref = Date.parse("2026-11-18T00:00:00Z");
    const date = Date.parse(caseInfo.year + "-" + record.date.replace("/","-") + "T00:00:00Z");
    return Math.abs(date - ref) <= radius * 86400000;
  }

  const fitWindow = (record) => fits(record,3);
  const timing = (record) => !record?.date ? "採檢時間待核對" : (fits(record,2) ? "同期" : "同期窗外");

  function candidateRoutes(files, kept) {
    const matching = (scope, test) => files.find((file) => file.scope === scope && file.tests.some(test));
    const direct = matching("same",(test) => test.kind === "culture" && test.target === "A");
    const olderCulture = matching("other",(test) => test.kind === "culture" && test.target === "B");
    const groupEvidence = matching("same",(test) => test.kind === "group" && test.members.includes("C"));
    return [
      {...candidates.A,tier:direct?"優先保留":"待複核",grade:direct?"ready":"review",
       signal:"L02 的 mNGS 檢出銅綠假單胞菌。",
       reason:direct?"同一份 BAL 培養也分離出銅綠假單胞菌，可優先帶去討論。":"目前還缺能與本次 BAL 對上的培養支持。",
       path:["mNGS 檢出",direct?"同檢體培養指名同一菌種":"尚缺同檢體佐證",direct?"優先保留":"待複核"],
       inputs:direct?[direct]:[]},
      {...candidates.B,tier:"暫不列入",grade:"hold",
       signal:"白色念珠菌在 L02 的 mNGS 讀數最高。",
       reason:"白色念珠菌的培養來自 11/16 的 L01 痰液，11/18 是出報告的日子。呼吸道分離出的念珠菌也可能是定植，本案的 mNGS 檢出仍保留在原單。",
       path:["mNGS 檢出、讀數最高","比對檢體編號與來源","培養來自另一份痰液","暫不列入"],inputs:olderCulture?[olderCulture]:[]},
      {...candidates.C,tier:"待複核",grade:"review",
       signal:"L02 的 mNGS 將 K. variicola 列為檢出候選。",
       reason:groupEvidence?"同檢體 FilmArray 只能支持肺炎克雷伯氏菌群，無法從這個結果分辨群內的個別菌種。":"仍缺本案直接指名 K. variicola 的院端紀錄。",
       path:["mNGS 檢出","核對院端回報層級","僅有群組線索","待複核"],inputs:groupEvidence?[groupEvidence]:[],papers:kept}
    ];
  }

  const data = {records,candidates,group,caseInfo,bibliography,literature,chapter,chooseScope,fitWindow,timing,candidateRoutes};
  if (typeof module !== "undefined" && module.exports) module.exports = data;
  else root.BreathContent = data;
})(typeof window !== "undefined" ? window : globalThis);


