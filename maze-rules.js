(function () {
  "use strict";
  const content = window.BreathContent;
  const source = {
    repository:"OliveWoo/Multimodal-Diagnosis-Model",
    scorer:"current_pipeline/tools/deterministic_mngs_max_scorer.py",
    scorerBlob:"877cf5c8319776eaba3023bf1dd256e2e6294fa7",
    taxonomy:"current_pipeline/rules/organism_taxonomy_rules.json",
    taxonomyBlob:"3a062ff31332caed098780683627639ab07b6f37"
  };
  const families = [
    {id:"hospital", label:"院內相關細菌", title:"醫療相關／非發酵革蘭陰性菌"},
    {id:"yeast", label:"念珠菌／酵母", title:"Candida 或其他酵母菌"},
    {id:"typical", label:"常見呼吸道菌", title:"典型呼吸道病原菌"}
  ];
  const familyFor = {A:"hospital", B:"yeast", C:"typical"};
  const manuals = {
    family:{title:"先認身分，再進不同走廊",
      body:"先看物種與主要規則分類。同一個屬裡仍可能有不同特性，名稱相似也要核對到物種。拿「分類卡」對照門牌。",
      rule:"organism_taxonomy_rules · exact_profiles / genus_profiles"},
    signal:{title:"訊號要和它自己的來源一起讀",
      body:"這個分支先核對 reads 大於 0、排名不超過 3，且排名在第 1 或帶有 NTC 等對照標記。展示卡提供的是排名 2、NTC=00；拿它逐項核對，不能只拿不同菌種的 reads 比大小。通過後還要查院端支持。",
      rule:"clean_mngs_signal / typical_pneumonia_hospital_mngs_rule"},
    support:{title:"院端支持要對上菌名與檢體",
      body:"檢驗支持要能對回候選。培養是否指名同一菌種？採檢是否屬於本次下呼吸道檢體？拿第一關的原單核對。",
      rule:"typical_pneumonia_hospital_mngs_rule"},
    candida:{title:"念珠菌走自己的證據路徑",
      body:"呼吸道 Candida 可保留為脈絡。要升為正式候選，程式還會核對同菌種血液、無菌部位或病理等侵襲性證據。高 reads 本身無法補上這些資料。",
      rule:"R-S4-CANDIDA-RESP-CONTEXT-NOT-PICKED"},
    unknown:{title:"空白欄位保留 unknown",
      body:"沒提供一項檢驗，就先記為未知。資料未提供、檢驗陰性、陽性，各自代表不同狀態。",
      rule:"PIPELINE_UPDATE_20261020 · 方法界線"},
    group:{title:"群組支持有自己的範圍",
      body:"肺炎克雷伯氏菌群包含 K. pneumoniae、K. quasipneumoniae 和 K. variicola。群組檢出能支持這個範圍，仍要保留個別物種的疑問。",
      rule:"taxonomy · species_identity_matters"}
  };

  function node(id,title,question,manual,options,right,proof,result) {
    return {id,title,question,manual,options,right,proof,result};
  }

  function journey(id) {
    const family = families.find((entry) => entry.id === familyFor[id]);
    const root = node("family","身分岔路","這張候選分類卡，應該帶你進哪條走廊？","family",
      families.map((entry) => ({id:entry.id,label:entry.label})),family.id,"identity:"+id,
      "分類卡指向「" + family.title + "」。接下來按這條規則查看它需要的證據。");
    const routes = {
      A:[
        node("signal","訊號迴廊","這個候選的 mNGS 整理後訊號，目前能不能用來往下核對？","signal",
          [{id:"missing",label:"資料尚未整理"},{id:"usable",label:"符合訊號條件"},{id:"highest",label:"只放讀數最高"}],
          "usable","signal:A","1246 reads 大於 0，排名 2 在前三，並有 NTC=00 標記，符合這個分支的訊號條件。接著查它有沒有院端支持。"),
        node("support","院端證據門","第一關的哪種資料，能接上這個候選？","support",
          [{id:"other",label:"另一菌種的培養"},{id:"reads",label:"單看 mNGS 讀數"},{id:"exact",label:"同菌種 BAL 培養"}],
          "exact","culture:A","L02 的 BAL 培養直接寫出 Pseudomonas aeruginosa。訊號、檢體與菌名接成同一條路。")
      ],
      B:[
        node("origin","檢體分岔口","最先看到的白色念珠菌培養，實際來自哪裡？","support",
          [{id:"bal",label:"本次 L02 的 BAL"},{id:"sputum",label:"另一份 L01 痰液"},{id:"blood",label:"同菌種血液培養"}],
          "sputum","culture:B","11/18 是核發日。這張培養來自 11/16 的 L01 痰液，保留為呼吸道脈絡。"),
        node("invasive","侵襲性證據門","本案案卷有沒有提供同菌種血液、無菌部位或病理資料？","unknown",
          [{id:"negative",label:"視為全部陰性"},{id:"unknown",label:"目前尚未提供"},{id:"positive",label:"已證實侵襲感染"}],
          "unknown","missing:invasive","這些項目尚未提供，記為 unknown。案卷的空白不能自動變成陰性或陽性。"),
        node("candida","高讀數的回音","讀數最高的呼吸道念珠菌，目前能走到哪個出口？","candida",
          [{id:"context",label:"保留脈絡待查"},{id:"causal",label:"直接認定致病"},{id:"erase",label:"刪去所有檢出"}],
          "context","signal:B","高讀數和呼吸道培養都留在案卷，但目前不足以補上侵襲性證據。這次先走脈絡出口。")
      ],
      C:[
        node("group","菌名回廊","這份 FilmArray 的回報，能支持到哪一層？","group",
          [{id:"exact",label:"直接指名此物種"},{id:"empty",label:"完全沒有線索"},{id:"group",label:"只支持所屬菌群"}],
          "group","group:C","Klebsiella pneumoniae group 包含多個物種。這張結果可保留群組支持，沒有直接指名 K. variicola。"),
        node("review","尚未開啟的門","物種與群組之間還有空白，接下來怎麼走？","group",
          [{id:"finish",label:"當成同種結案"},{id:"review",label:"保留疑問再複核"},{id:"erase",label:"整筆檢出刪除"}],
          "review","group:C","把物種層級的疑問留在案卷。下一站查閱文獻，並保留文獻本身能支持的範圍。")
      ]
    };
    return [root,...routes[id]];
  }

  function cards(records,id) {
    const candidate = content.candidates[id];
    const family = families.find((entry) => entry.id === familyFor[id]);
    const list = [
      {id:"identity:"+id,title:"候選分類卡",subtitle:candidate.scientific,
       body:family.title + "。候選身分已經過分類整理。",source:"分類規則 · 物種／屬層級"},
      {id:"signal:"+id,title:"mNGS 整理後訊號",subtitle:"L02 · BAL · " + candidate.reads.toLocaleString("zh-TW") + " reads",
       body:id === "A" ? "模擬欄位：rank_priority = 2；rank_rule = NTC=00。請依手冊核對 reads、排名與對照標記，再往院端證據門走。" :
         "這個數字是定序檢出訊號。讀數大小仍需和候選特性、檢體來源及其他支持一起判讀。",
       source:"mNGS 報告節錄 · 展示訊號卡"}
    ];
    for (const record of records) {
      for (const test of record.tests) {
        if (!test.target) continue;
        const key = test.kind === "group" ? "group:C" : "culture:"+test.target;
        list.push({id:key,title:test.label,subtitle:test.finding,
          body:record.id + " · " + record.type + "；採檢 " + record.dateTime + "；核發 " + test.released,
          source:window.BreathDocuments.origin(record,"id") + " / " + window.BreathDocuments.origin(record,"result")});
      }
    }
    list.push({id:"missing:invasive",title:"尚未提供的項目",subtitle:"血液／無菌部位／病理",
      body:"本展示案卷未提供同種 Candida 的血液、無菌部位或病理檢驗紀錄。這個狀態保持 unknown。",
      source:"本展示病例的資料範圍"});
    return list;
  }

  function create() {
    return {candidate:"A",index:0,selected:"",drawer:"",feedback:null,trace:[],results:{},position:null};
  }

  function current(state) {
    return journey(state.candidate)[state.index];
  }

  function evaluate(state,option,records) {
    const gate = current(state);
    if (!gate.options.some((entry) => entry.id === option)) return {ok:false,body:"請選擇目前這間房的門。"};
    if (option !== gate.right) return {ok:false,body:manuals[gate.manual].body};
    if (!state.selected || state.selected !== gate.proof ||
        !cards(records,state.candidate).some((card) => card.id === state.selected)) {
      return {ok:false,body:"這個方向需要一張能支持它的紀錄。打開案卷，選一張作依據，再回到這扇門。"};
    }
    return {ok:true,body:gate.result};
  }

  window.BreathMazeRules = {source,families,familyFor,manuals,journey,cards,create,current,evaluate};
})();
