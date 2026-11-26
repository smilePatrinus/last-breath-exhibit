(function () {
  "use strict";
  const say=(role,body,extra={})=>({role,body,face:1,...extra});
  const intro=[
    say("doctor","血氧又下降了。請幫我查這份報告。",{cue:"phone",motion:"doctor-in",emphasis:["查這份報告"]}),
    say("detective","先告訴我，mNGS 在找什麼？",{motion:"detective-in",emphasis:["mNGS"]}),
    say("doctor","mNGS 從檢體的遺傳訊號，找出可能的微生物。",{lesson:"report",emphasis:["遺傳訊號"]}),
    say("doctor","檢出不等於致病，也可能是背景訊號或定植。",{lesson:"possibilities",emphasis:["檢出不等於致病","背景訊號","定植"]}),
    say("doctor","我們把病歷、檢驗與 mNGS 報告對齊，再整合判讀。",{lesson:"dossier",emphasis:["報告對齊","整合判讀"]}),
    say("detective","先核對檢體與採檢時間，再看誰有證據支持。",{report:true,prop:"D07｜L02 BAL｜11/18 採檢",emphasis:["檢體與採檢時間"]}),
    say("narrator","肺部影像亮起裂縫，偵探走進資料交錯的肺城。",{cue:"rift",motion:"rift",rift:true}),
    say("detective","通話保持。我先從原始紀錄查起。",{face:2,motion:"cross",rift:true,label:"進入肺城",emphasis:["原始紀錄"]})
  ];
  const scripts=[
    [say("doctor","核對檢體與採檢時間，別把核發日當採檢日。",{cue:"phone",emphasis:["採檢時間","核發日"]}),
     say("detective","用 Excel 對編號，再從 PPT 帶入結果。",{face:2,prop:"同一檢體｜四格資料",emphasis:["對編號","帶入結果"]})],
    [say("doctor","念珠菌讀數最高，仍要查培養來源與缺少的證據。",{cue:"phone",emphasis:["培養來源","缺少的證據"]}),
     say("detective","沿線索走；資料沒提供，就保留未知。",{face:2,emphasis:["保留未知"]})],
    [say("doctor","查同菌種的呼吸道病例，連文獻限制一起保留。",{cue:"phone",emphasis:["同菌種","呼吸道","文獻限制"]}),
     say("detective","比對菌名與部位，再決定收入或略過。",{face:2,emphasis:["菌名與部位","收入或略過"]})],
    [say("doctor","用原始證據，核對每一句推論。",{cue:"phone",emphasis:["原始證據","推論"]}),
     say("detective","點證據言彈，再點有底色的片語。",{face:2,emphasis:["證據言彈","有底色的片語"]})]
  ];
  const objectives=["核對同一檢體的四格資料。","走到紀錄，再找出口。","比對菌名與檢體部位。","用證據核對推論。"];
  const tasks=["選檢體 → 核對四格 → 收錄。","方向鍵或方向鈕移動，沿金線走。","圈選檢體；左滑略過、右滑收入。","點言彈、開始議論，再瞄準片語。"];
  function chapter(base,index) {
    return {...base,objective:objectives[index],task:tasks[index],script:scripts[index]};
  }
  function ending() {
    return [
      say("narrator","文件歸位，肺城仍留著一道裂縫。",{scene:"world",rift:true,cue:"rift"}),
      say("narrator","偵探帶著報告，回到診療室。",{motion:"return"}),
      say("doctor","這一項，你保留了「尚待確認」。",{motion:"doctor-in",emphasis:["尚待確認"]}),
      say("detective","證據不足，就如實保留。",{trace:true,label:"收起案卷",emphasis:["證據不足","如實保留"]})
    ];
  }
  function papers(originals) {
    return originals.filter(p=>["01","02","04"].includes(p.id)).map(p=>{
      if(p.id==="01")return {...p,title:"血液／尿液研究",segments:[
        {text:"K. variicola；檢體為"},{text:"血液與泌尿道",type:"mismatch",hint:"不是呼吸道檢體。"}],
        note:"非呼吸道",feedback:"非呼吸道，略過。"};
      if(p.id==="02")return {...p,title:"BAL 檢出病例",segments:[
        {text:"K. variicola 在"},{text:"肺泡灌洗液（BAL）",key:"site"},
        {text:"被檢出；"},{text:"未確認致病。",type:"limit",hint:"檢出不等於確認致病。"}],
        note:"同檢體類型，未確認致病",feedback:"同檢體類型，保留致病未確認的限制。"};
      return {...p,title:"痰液共檢出病例",segments:[
        {text:"K. variicola 在"},{text:"痰液（呼吸道）",key:"site"},{text:"與另一菌共檢出；"},
        {text:"不同檢體，僅作背景。",type:"limit",hint:"痰液與 BAL 不同，且有共檢出。"}],
        note:"呼吸道背景，保留共檢出限制",feedback:"可作呼吸道背景，保留檢體與共檢出限制。"};
    });
  }
  function prepare(state) {
    const clue=state.labyrinth?.dialog;
    if(clue && !clue.quickCopy) {
      const texts={
        source:{title:"培養來自 L01 痰液",copy:"11/18 是核發日，不能當成 L02 同份 BAL。",fact:"L01 痰液｜11/16 採檢｜11/18 核發\nCandida albicans",reward:"第一道門已開。"},
        unknown:{title:"未提供，就記未知",copy:"血液、無菌部位或病理資料未提供。",fact:"未提供 ≠ 陰性／陽性",reward:"第二道門已開。"},
        finish:{title:"保留線索與疑問",copy:"檢出念珠菌，仍不足以確認致病。",fact:"暫不列入，保留呼吸道脈絡。"}
      };
      if(texts[clue.kind])Object.assign(clue,texts[clue.kind],{quickCopy:true});
    }
  }
  function debate(session) {
    const short={
      specimen:{title:"同一天，就是同份檢體？",mission:"用 L01 原單核對來源。",reply:"L01 是 11/16 的痰液；11/18 是核發日。",correction:"L01 痰液不是 L02 同份 BAL。",doctor:"保留檢體與日期來源。"},
      support:{title:"這項培養支持成立嗎？",mission:"用 L02 培養支持藍色片語。",reply:"L02 BAL 培養也找到銅綠假單胞菌。",correction:"同菌種、同檢體培養支持，優先保留。",doctor:"支持仍需放回臨床脈絡。"},
      species:{title:"菌群等於特定物種？",mission:"核對 FilmArray 的回報層級。",reply:"FilmArray 只報菌群，未指名 K. variicola。",correction:"保留菌群支持；物種仍待確認。",doctor:"不要超過檢驗的支持範圍。"},
      literature:{title:"文獻能確認本案致病？",mission:"用文獻的限制反駁。",reply:"別例的檢出，只能提供背景。",correction:"文獻不能直接確認本案致病。",doctor:"保留可參考的線索與限制。"},
      uncertainty:{title:"資料不足，如何交付？",mission:"用菌群原單支持保留疑問。",reply:"現有證據仍停在菌群層級。",correction:"物種與致病角色保留待確認。",doctor:"如實留下已知與缺口。"}
    };
    session.rounds.forEach(round=>Object.assign(round,short[round.id]||{}));
  }
  function guide(state,action,step) {
    if(state.view==="travel")return step("quick-travel",action("walk-goal"),"走到本關入口","點此走到目的地。");
    if(state.view==="gather"){
      if(state.records.length===2)return step("quick-gather-done",action("gather-next"),"兩份完成","帶著案卷前往迷宮。");
      if(Object.keys(state.draft).length===4)return step("quick-collect",action("collect"),"核對後收錄","確認四格來自同一檢體。");
      const r=window.BreathContent.records.find(r=>!state.records.some(x=>x.id===r.id));
      return step("quick-import-"+r.id,action("easy-import",r.id),"帶入 "+r.id,"點檢體卡，帶入四格。");
    }
    if(state.view==="labyrinth"){
      if(state.labyrinth.dialog)return null;
      if(state.labyrinth.complete)return step("quick-maze-done",action("review-next"),"前往文獻室","帶著已找到的線索出發。");
      if(state.labyrinth.visited.length>2)return null;
      return step("quick-walk",".labyrinth-controls .dpad","沿金線走","方向鍵或方向鈕移動。亮點是線索。","繼續調查");
    }
    if(state.view==="literature"){
      const p=window.BreathContent.literature[state.paper];
      return step("quick-paper-"+p.id,action("classify",p.fit?"keep":"skip"),p.fit?"收入並保留限制":"略過這篇",p.feedback);
    }
    if(state.view==="debate"){
      const s=state.debate;
      if(s.feedback||s.drawer||s.phase==="running")return null;
      if(s.phase==="complete")return step("quick-debate-done",action("debate-report"),"組成報告","四段核對完成。");
      return step("quick-debate-start",action("debate-start"),"開始議論","點標記片語發射；可集中放慢。");
    }
    if(state.view==="report")return step("quick-report",action(state.submitted?"back-done":"submit"),state.submitted?"返回結案":"送出報告","保留已知與尚待確認。");
    return null;
  }
  function reportSummary(items,html) {
    const reasons={A:"同份 BAL 培養支持。",B:"另一份痰液培養，侵襲證據未提供。",C:"菌群支持，物種與致病角色待確認。"};
    return '<section class="panel quick-results"><h2>判讀摘要</h2><ul>'+items.map(item=>'<li><strong>'+html(item.name)+'</strong><span class="tag '+item.grade+'">'+html(item.tier)+'</span><p>'+
      html(item.id==="A"&&item.grade!=="ready"?"尚缺同檢體培養支持。":reasons[item.id])+'</p></li>').join("")+'</ul></section>';
  }
  window.BreathQuick={intro,ending,chapter,papers,prepare,debate,guide,reportSummary,objectives};
})();
