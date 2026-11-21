(function () {
  "use strict";
  const data=window.BreathContent;
  const documents=window.BreathDocuments;
  const line=(id,before,target="",after="",tone="refute")=>({id,before,target,after,tone});
  function build(records,mazeResults,kept) {
    const cards=[];
    const l01=records.find(record=>record.id==="L01");
    const l02=records.find(record=>record.id==="L02");
    function culture(record,target,id,title) {
      const test=record?.tests.find(item=>item.kind==="culture" && item.target===target);
      if(!test) return;
      cards.push({id,title,short:record.id+" 培養紀錄",label:"第一關 · 原始紀錄",
        subtitle:test.finding,
        body:record.id+" · "+record.type+"（"+record.sampleCode+"）\n採檢："+record.dateTime+
          "\n核發：2026/"+test.released+"\n培養："+test.finding,
        source:documents.origin(record,"id")+" / "+documents.origin(record,"result")});
    }
    culture(l01,"B","culture:L01","L01 採檢與培養");
    culture(l02,"A","culture:L02","L02 細菌培養");
    const panel=l02?.tests.find(item=>item.kind==="group" && item.members.includes("C"));
    if(panel) cards.push({id:"group:L02",title:"L02 FilmArray 回報",short:"FilmArray 原單",label:"第一關 · 原始紀錄",
      subtitle:panel.finding,body:"L02 · BAL · 採檢 "+l02.dateTime+"\n"+panel.finding+"\n"+panel.detail+
        "\n群組包含 K. pneumoniae、K. quasipneumoniae、K. variicola。",
      source:documents.origin(l02,"result")});
    cards.push({id:"signal",title:"mNGS 檢出清單",short:"mNGS 訊號",label:"本案 · 模擬定序資料",
      subtitle:"L02 · 支氣管肺泡灌洗液（BAL）",
      body:Object.values(data.candidates).map(item=>item.scientific+"："+item.reads.toLocaleString("zh-TW")+" reads").join("\n"),
      source:"展示病例 D07 · L02 mNGS 報告"});
    if(mazeResults.C) cards.push({id:"review:C",title:"K. variicola 判讀路徑",short:"迷宮判讀紀錄",label:"第二關 · 本輪紀錄",
      subtitle:mazeResults.C.outcome,body:mazeResults.C.trace.map(item=>item.title+"："+item.choice).join("\n"),
      source:"本輪實際完成的判讀迷宮"});
    for(const paper of kept) cards.push({id:"paper:"+paper.id,title:"文獻 "+paper.id+" · 原文摘錄",short:"文獻 "+paper.id+" 與限制",
      label:paper.source?"第三關 · 公開文獻改寫":"第三關 · 教學模擬文獻",
      subtitle:paper.title,body:paper.excerpt+"\n本輪保留的限制："+paper.note,
      source:paper.source?.label || "教學模擬摘要 · "+paper.id});
    const paper=kept.find(item=>item.id==="02") || kept.find(item=>item.id==="04");
    const rounds=[
      {id:"specimen",title:"日期相同，檢體也相同？",mode:"refute",
       mission:"找出混淆採檢來源的推論，用原始紀錄反駁黃色片語。",
       ammo:["culture:L02","culture:L01","signal"],correct:{line:"same",bullet:"culture:L01"},
       lines:[
         line("reads","白色念珠菌的 mNGS ","讀數最高","。"),
         line("culture","培養報告也寫著 Candida albicans。"),
         line("date","兩份文件都有","十一月十八日","。"),
         line("same","所以，它們來自","同一份 BAL 檢體","！")
       ],
       hint:"同一天可能是採檢，也可能是核發。找出 Candida 培養的原始檢體編號、類型與時間。",
       reply:"這裡接錯了。Candida 培養來自十一月十六日的 L01 痰液；十八日是核發日。mNGS 則來自 L02 的 BAL。",
       correction:"L01 痰液培養可保留為呼吸道脈絡，並非 L02 同檢體培養支持。",
       doctor:"把檢體和日期欄位寫清楚，會診時才找得到原單。"},
      {id:"support",title:"這一次，支持真的成立",mode:"agree",
       mission:"用原始培養紀錄支持藍色發言，確認這個候選有哪些依據。",
       ammo:["signal","culture:L02","culture:L01"],correct:{line:"support",bullet:"culture:L02"},
       lines:[
         line("less","銅綠假單胞菌的讀數，比念珠菌少。"),
         line("name","但 L02 培養也寫出 Pseudomonas aeruginosa。"),
         line("match","編號、檢體和菌名，這次都接得起來。"),
         line("support","所以它有","同菌種 BAL 培養支持","。","agree")
       ],
       hint:"這輪找藍色同意點。mNGS 訊號和培養是不同資料，找直接寫出同菌種的 BAL 培養。",
       reply:"這項支持成立。L02 的 BAL 培養直接分離出銅綠假單胞菌，和候選菌名、檢體都能對上。",
       correction:"銅綠假單胞菌有同菌種、同檢體的培養支持，保留為優先討論候選。",
       doctor:"有支持就把依據留下來。這項檢驗支持仍要放回完整臨床脈絡。"},
      {id:"species",title:"群組的名字，能說到哪裡？",mode:"refute",
       mission:"找到把菌群回報推成特定物種的片語，用 FilmArray 原單反駁。",
       ammo:["culture:L02","group:L02","signal"],correct:{line:"species",bullet:"group:L02"},
       lines:[
         line("mngs","mNGS 將 K. variicola 列在候選中。"),
         line("bal","FilmArray 用的也是","同一份 BAL","。"),
         line("group","回報名稱是 Klebsiella pneumoniae group。"),
         line("species","所以，","K. variicola 物種已確認","！")
       ],
       hint:"同檢體仍要核對回報層級。找 FilmArray 原單，看它指名的是菌種還是菌群。",
       reply:"原單回報的是肺炎克雷伯氏菌群。K. variicola 是其中一員，這份結果還不能分辨群內的個別物種。",
       correction:"同檢體 FilmArray 提供菌群支持，K. variicola 的物種層級仍待複核。",
       doctor:"保留這項群組支持，也保留它分不出個別物種的界線。"}
    ];
    if(paper) rounds.push({id:"literature",title:"文獻能替本案下結論嗎？",mode:"refute",
      mission:"回到第三關收入的文獻，找出超過文獻支持範圍的推論。",
      ammo:["group:L02","paper:"+paper.id,"signal"],correct:{line:"causality",bullet:"paper:"+paper.id},
      lines:[
        line("respiratory","案卷裡有","呼吸道病例","可參考。"),
        line("organism","文章也提到了 K. variicola。"),
        line("reference","這能補充同菌種的呼吸道背景。"),
        line("causality","因此，","本案致病角色也確定了","！")
      ],
      hint:"文獻裡的檢出與本案的因果判定之間，還差哪些證據？重讀收入時保留的限制。",
      reply:paper.id==="02"?"這篇只記錄另一例 BAL 定序檢出，未確認致病角色。另一例的觀察，不能直接替本案下結論。":
        "這篇是痰液病例，且同時分離出另一種細菌。可供背景參考，無法直接證明本案的致病角色。",
      correction:"文獻作為呼吸道背景，保留其檢體與共檢出限制；本案物種與致病角色仍待確認。",
      doctor:"把能參考的地方和限制一起交給我。這份報告可以開始討論了。"});
    else rounds.push({id:"uncertainty",title:"缺少文獻，怎麼交出報告？",mode:"agree",
      mission:"本輪沒有收入文獻。用已走過的判讀路徑，支持保留疑問的說法。",
      ammo:["signal","review:C","group:L02"],correct:{line:"unknown",bullet:"review:C"},
      lines:[
        line("empty","這輪案卷沒有收入外部文獻。"),
        line("available","院端仍有菌群回報可以追溯。"),
        line("gap","物種層級和致病角色，還缺足夠證據。"),
        line("unknown","所以應該","保留疑問，等待確認","。","agree")
      ],
      hint:"查第二關實際留下的 K. variicola 路徑。它最後到哪個出口？",
      reply:"這輪沒有收入文獻，就如實留下。迷宮的路徑仍指向待複核，缺少的部分保持未知。",
      correction:"保留院端菌群線索，註明本輪未收入外部文獻；物種及致病角色仍待確認。",
      doctor:"留下已知與缺口，我們才能知道下一步還要查什麼。"});
    return {cards,rounds};
  }
  function create(records,mazeResults,kept) {
    return {...build(records,mazeResults,kept),index:0,phase:"ready",selected:"",elapsed:0,
      focus:false,paused:false,drawer:false,feedback:null,results:[],mistakes:0};
  }
  function current(state) {return state.rounds[state.index];}
  function lineIndex(state) {return Math.floor(state.elapsed/4800)%current(state).lines.length;}
  function evaluate(state,lineId) {
    const round=current(state),statement=round.lines.find(item=>item.id===lineId);
    if(state.phase!=="running" || state.feedback || state.drawer) return null;
    if(!statement?.target || statement.id!==round.lines[lineIndex(state)].id)
      return {ok:false,title:"先瞄準正在出現的片語",body:"等標記的發言出現，再用言彈指出那一段。可以集中放慢，或暫停閱讀。"};
    if(!state.selected) return {ok:false,title:"還沒有裝填言彈",body:"先從下方選一份證據，再瞄準要反駁或支持的片語。"};
    if(lineId!==round.correct.line || state.selected!==round.correct.bullet ||
        !state.cards.some(item=>item.id===state.selected))
      return {ok:false,title:"這枚言彈還沒對上",body:round.hint};
    return {ok:true,title:round.mode==="agree"?"這項支持成立":"找到推論中的矛盾",body:round.reply,
      correction:round.correction,doctor:round.doctor,evidence:state.selected,target:statement.target};
  }
  function shoot(state,lineId) {
    const outcome=evaluate(state,lineId);
    if(!outcome) return null;
    state.focus=false;state.feedback=outcome;
    if(!outcome.ok) state.mistakes++;
    return outcome;
  }
  function next(state) {
    if(!state.feedback) return;
    if(!state.feedback.ok) {state.feedback=null;return;}
    const round=current(state),feedback=state.feedback;
    state.results.push({round:round.id,title:round.title,mode:round.mode,evidence:feedback.evidence,
      target:feedback.target,correction:feedback.correction});
    state.index++;state.phase="ready";state.elapsed=0;state.selected="";state.focus=false;state.paused=false;state.feedback=null;
    if(state.index===state.rounds.length) state.phase="complete";
  }
  window.BreathDebateData={build,create,current,lineIndex,evaluate,shoot,next};
})();
