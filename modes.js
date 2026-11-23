(function () {
  "use strict";
  const content=window.BreathContent;
  const copy=value=>JSON.parse(JSON.stringify(value));
  const originals={records:copy(content.records),papers:copy(content.literature),fit:content.fitWindow,
    interval:content.caseInfo.interval,maze:{...window.BreathLabyrinthData},chapter:window.BreathStory.chapter};
  const labels={easy:"簡單",normal:"普通",hard:"困難"};
  let selected=new URLSearchParams(location.search).get("difficulty")||"normal";
  if(!labels[selected])selected="normal";
  const reference=Date.parse("2026-11-18T09:12:00Z");
  const timestamp=(date,time)=>Date.parse("2026-"+date.replace("/","-")+"T"+time+":00Z");
  const hardFit=record=>Math.abs(timestamp(record.date,record.collected)-reference)<=72*3600000;
  function hardRecords() {
    const list=copy(originals.records);
    const extra=[
      ["L03","11/15","09:11","11/17","陰性","流感 A／B 核酸"],
      ["L04","11/15","09:12","11/17","未檢出","呼吸道病毒核酸"],
      ["L05","11/15","09:13","11/19","陰性","血液培養"],
      ["L06","11/21","09:11","11/23","未檢出","麴菌抗原"],
      ["L07","11/21","09:12","11/24","陰性","痰液細菌培養"],
      ["L08","11/21","09:13","11/22","未檢出","肺炎鏈球菌抗原"],
      ["L09","11/22","08:50","11/22","未檢出","呼吸道病毒核酸"]
    ];
    extra.forEach(([id,date,collected,reportDate,result,label],index)=>{
      const type=id==="L05"?"血液":id==="L06"?"肺泡灌洗液":"痰液";
      const received=new Date(timestamp(date,collected)+17*60000).toISOString().slice(5,16).replace("-","/").replace("T"," ");
      list.push({id,date,collected,received,reportDate,type,sampleCode:type==="血液"?"Blood":type==="痰液"?"Sputum":"BAL",
        doc:"P-"+String(index+4).padStart(2,"0"),slideTitle:label+"紀錄",
        dateTime:"2026/"+date+" "+collected,tests:[{kind:"context",label,finding:result,detail:label+"："+result,released:reportDate+" 16:30"}],
        result:label+"（"+result+"）"});
    });
    const order=["L02","L03","L06","L00","L05","L08","L01","L04","L07","L09"];
    return order.map((id,index)=>({...list.find(r=>r.id===id),row:index+2}));
  }
  function extraPapers() {
    const make=(id,title,fit,site,organism,note)=>({id,title,fit,segments:[
      {text:"本篇描述一名住院病人的檢驗，在"},
      {text:site,...(fit?{key:"site"}:{type:"mismatch",hint:note})},
      {text:"中記錄"+organism+"。"},
      {text:"作者保留檢出與臨床意義的區別，未替其他病例確認因果。",type:"limit",hint:"背景與因果仍需分開。"}
    ],note,feedback:note});
    return [
      make("06","呼吸道培養的共檢出病例",true,"痰液培養（呼吸道檢體）","K. variicola 與另一種細菌","可作呼吸道背景；痰液非本案同份 BAL，且有共檢出。"),
      make("07","菌種辨識與泌尿道感染",false,"尿液檢體","K. variicola","同菌種，但檢體是尿液，與此關的呼吸道病例條件不符。"),
      make("08","肺泡灌洗液的定序觀察",true,"支氣管肺泡灌洗液（BAL）","K. variicola","相同菌種與檢體部位，僅能收入為背景，仍保留未確認致病的限制。"),
      make("09","相似菌名的下呼吸道分離株",false,"BAL 培養（但僅辨識 K. quasipneumoniae）","K. quasipneumoniae","檢體相符，但為另一個物種，不能當作 K. variicola 病例。"),
      make("10","群組分子檢測的臨床紀錄",false,"BAL 的 K. pneumoniae group 群組回報","菌群陽性，未進一步分種","只有群組層級，並未記載此關要找的個別菌種病例。"),
      make("11","氣管抽吸檢體的臨床報告",true,"氣管抽吸液（下呼吸道）","K. variicola","同菌種的呼吸道背景；氣管抽吸液與 BAL 不同，保留來源限制。"),
      make("12","檢驗平台的參考菌株比較",false,"實驗室參考菌株","K. variicola","沒有病人呼吸道檢體，不符合本關收錄條件。")
    ];
  }
  function apply(id=selected) {
    selected=labels[id]?id:"normal";
    const records=selected==="hard"?hardRecords():selected==="easy"?copy(originals.records.filter(r=>r.id!=="L00")):copy(originals.records);
    const papers=selected==="hard"?[...copy(originals.papers),...extraPapers()]:
      selected==="easy"?copy(originals.papers.filter(p=>["01","02","04"].includes(p.id))):copy(originals.papers);
    content.records.splice(0,content.records.length,...records);
    content.literature.splice(0,content.literature.length,...papers);
    content.fitWindow=selected==="hard"?hardFit:originals.fit;
    content.caseInfo.interval=selected==="hard"?"11/15 09:12–11/21 09:12（含端點）":originals.interval;
    Object.assign(window.BreathLabyrinthData,originals.maze);
    if(selected!=="normal")Object.assign(window.BreathLabyrinthData,window.BreathModeMaze[selected](originals.maze));
    document.body.dataset.difficulty=selected;
  }
  function cards(button) {
    return '<fieldset class="difficulty-picker"><legend>選擇調查模式</legend><div>'+
      [["easy","快速導覽","快速帶入資料、小迷宮引導、3 篇文獻、每段 1 枚言彈。"],
       ["normal","目前的完整玩法","維持原來四關，保留教學、直接提示與集中模式。"],
       ["hard","完整挑戰","10 份檢體、63×43 大迷宮、12 篇批次判讀、限時障礙言彈；無提示。"]].map(([id,tag,desc])=>
       button('<strong>'+labels[id]+'</strong><span>'+tag+'</span><small>'+desc+'</small>',"difficulty",id,
         {kind:"difficulty-card"+(selected===id?" selected":""),attrs:' aria-pressed="'+(selected===id)+'"'})).join("")+'</div><p class="difficulty-description">'+
      (selected==="easy"?"快速帶入兩份資料，小迷宮有引導；文獻減為三篇，每段言彈只有一枚。":
       selected==="normal"?"維持目前的四關玩法，保留操作教學、直接提示、暫停與集中。":
       "十份檢體、63×43 大迷宮、十二篇整批判讀；無提示，言彈每段限時七十五秒。")+'</p></fieldset>';
  }
  function init(state) {
    state.difficulty=selected;state.gatherAudit={};state.gatherErrors=[];
    state.paperDecisions=[];state.paperGrade=null;
  }
  function prepare(state) {
    if(selected==="easy" && state.view==="literature" && content.literature[state.paper]?.fit) {
      const site=content.literature[state.paper].segments.findIndex(s=>s.key==="site");
      if(!state.marks.includes(site))state.marks.push(site);
    }
    if(selected==="easy" && state.view==="labyrinth" && !state.labyrinth.complete && !state.labyrinth.dialog)
      state.labyrinth.hintGoal=!state.labyrinth.found.specimen?"specimen":!state.labyrinth.found.missing?"missing":"exit";
  }
  function debate(session) {
    session.difficulty=selected;
    if(selected==="easy") {
      session.rounds.forEach(r=>{r.ammo=[r.correct.bullet];r.lines=r.lines.filter((line,index)=>index===0||line.id===r.correct.line);});
      session.selected=session.rounds[session.index]?.correct.bullet||"";
      session.motion="full";session.lineDuration=5200;
    }
    if(selected==="hard") {
      session.lineDuration=3600;session.timeLimit=75000;session.timeLeft=75000;session.timerStamp=null;
      session.penalties={wrong:0,miss:0,blocked:0};session.penaltyNote="";
    }
  }
  function gatherAssist(state,button,html) {
    if(selected==="normal")return "";
    if(selected==="easy")return '<section class="panel easy-import"><h2>先選一份檢體，快速整理</h2><p>按下後帶入四格，仍需核對 PPT 並按「收錄」。</p><div>'+
      content.records.map(r=>button(html(r.id+" · "+r.type+" · "+r.dateTime),"easy-import",r.id,
        {attrs:state.records.some(x=>x.id===r.id)?" disabled":""})).join("")+'</div></section>';
    return '<section class="panel mode-rules"><h2>困難：精確到分鐘的收件窗</h2><p>基準 11/18 09:12，前後 72 小時，兩端都包含。依採檢時間選出所有符合的檢體；收件、核發時間和單項結果都可拖入，但會在送出時核對。</p>'+
      (state.gatherErrors.length?'<div class="mode-errors" role="status">'+state.gatherErrors.map(e=>'<p>'+html(e)+'</p>').join("")+'</div>':"")+'</section>';
  }
  function checkGather(state) {
    const expected=content.records.filter(content.fitWindow),errors=[];
    expected.forEach(r=>{if(!state.records.some(x=>x.id===r.id))errors.push("漏收："+r.id+"，採檢 "+r.dateTime+" 在時間窗內。");});
    state.records.forEach(r=>{
      if(!content.fitWindow(r))errors.push(r.id+" 的採檢時間 "+r.dateTime+" 在窗外。");
      const audit=state.gatherAudit[r.id];
      if(!audit||Object.values(audit).some(cell=>cell.record.id!==r.id))errors.push(r.id+" 混用了不同檢體的來源。");
      if(audit?.date.key!=="date")errors.push(r.id+" 應使用採檢時間，不能使用收件或核發時間。");
      if(audit?.result.key!=="result")errors.push(r.id+" 必須帶入完整檢驗結果，不能只帶單一項目。");
    });
    state.gatherErrors=errors;return !errors.length;
  }
  function queuePaper(state,decision) {
    state.paperDecisions[state.paper]={id:content.literature[state.paper].id,decision,marks:[...state.marks]};
    state.paper++;state.marks=[...(state.paperDecisions[state.paper]?.marks||[])];
  }
  function paperRecord(paper,marks) {
    return {id:paper.id,title:paper.title,source:paper.source,note:paper.note,
      quotes:marks.map(i=>paper.segments[i]?.text||""),excerpt:paper.segments.map(p=>p.text).join("")};
  }
  function gradePapers(state) {
    const errors=[];
    content.literature.forEach((p,i)=>{
      const choice=state.paperDecisions[i],marks=choice?.marks||[];
      if(!choice||choice.decision!==(p.fit?"keep":"skip"))errors.push({id:p.id,reason:p.feedback});
      else if(p.fit&&(!marks.some(n=>p.segments[n]?.key==="site")||marks.some(n=>!["site","symptom"].includes(p.segments[n]?.key))))
        errors.push({id:p.id,reason:"需要圈對檢體部位；不能把無關敘述當成檢體或症狀證據。"});
    });
    state.paperGrade={passed:errors.length===0,errors};
    if(!errors.length)state.kept=content.literature.filter(p=>p.fit).map(p=>paperRecord(p,state.paperDecisions.find(d=>d.id===p.id).marks));
  }
  function paperReview(state,button,html) {
    const result=state.paperGrade;
    if(result)return '<section class="panel batch-review"><h2>'+(result.passed?"整批核對通過":"這批尚未通過，請重做")+'</h2>'+
      '<p>'+(result.passed?"所有取捨與圈選都已核對，文獻和限制一起收入案卷。":"送出後才揭示結果。以下是需要修正的判讀；重做會清空這批選擇。")+'</p>'+
      result.errors.map(e=>'<p class="mode-errors">文獻 '+html(e.id)+'：'+html(e.reason)+'</p>').join("")+
      '<div class="actions">'+button(result.passed?"帶著案卷前往議場":"重做這批文獻",result.passed?"papers-next":"papers-retry","",{kind:"primary"})+'</div></section>';
    return '<section class="panel batch-review"><h2>十二篇已判讀，現在整批送出</h2><p>送出前不顯示正誤。可返回任一篇修改。</p><ol>'+
      content.literature.map((p,i)=>'<li><span>'+html(p.id+" · "+p.title+" · "+(state.paperDecisions[i]?.decision==="keep"?"收入":"略過"))+'</span>'+
        button("返回修改","paper-edit",String(i),{kind:"quiet small"})+'</li>').join("")+'</ol><div class="actions">'+
      button("送出全部判讀","papers-submit","",{kind:"primary"})+'</div></section>';
  }
  function chapter(state,index=state.chapter) {
    const value=originals.chapter(state,index);
    if(selected==="normal" || !value)return value;
    const hard=selected==="hard",texts=[
      hard?"這次有十份檢體。以 11/18 09:12 前後 72 小時為窗，包含端點；按採檢時間選出所有符合的資料，收件日和核發日不能替代。":"這次先整理兩份資料。可以用快速帶入，核對來源後收錄，認識資料怎麼接起來。",
      hard?"三區迷宮的角落藏著六把線索鑰匙。先離開主路尋找，讀過後收進鑰匙包，再回到對應的大門使用。撿到鑰匙不會直接開門。":"先穿過入口走廊，再到兩間紀錄室核對線索，最後繞過轉角走到出口。金色路線會引導你，途中可以走小岔路看看。",
      hard?"這關有十二篇。收錄同菌種的呼吸道病例背景，圈出正確檢體；點選時不會提示正誤，最後整批送出。錯了就重做這批。":"先看三篇。檢體線索會先圈好，畫面會說明建議的取捨與限制，你再決定是否收入。",
      hard?"每段限時七十五秒。打錯扣八秒，打歪或碰到遮擋扣四秒；注意視線和彈道的空隙。集中可放慢發言，但倒數不會變慢，也不能暫停倒數。":"每段只帶一枚證據言彈，發言仍會動態進出。讀懂它支持或反駁什麼，再點標記片語；集中可以幫你瞄準。"
    ];
    return {...value,script:[...value.script,{role:"doctor",face:1,body:texts[index]}]};
  }
  window.BreathStory.chapter=chapter;
  window.BreathModes={apply,cards,init,prepare,debate,gatherAssist,checkGather,queuePaper,gradePapers,paperReview,
    id:()=>selected,label:()=>labels[selected],isHard:()=>selected==="hard",isEasy:()=>selected==="easy"};
})();
