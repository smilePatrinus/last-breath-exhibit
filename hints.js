(function () {
  "use strict";
  const action=(name,value)=>'[data-action="'+name+'"]'+(value===undefined?"":'[data-value="'+value+'"]');
  const step=(id,target,title,body,extra={})=>({id:"hint-"+id,target,title,body,next:"帶我看這裡",...extra});
  const fields={id:"檢體編號",date:"採檢時間",type:"檢體類型",result:"檢驗結果"};
  function gather(state) {
    const remaining=window.BreathContent.records.filter(record=>window.BreathContent.fitWindow(record)&&
      !state.records.some(item=>item.id===record.id));
    if(!remaining.length)return step("gather-finish",action("gather-next"),"兩份都好了，帶著案卷出發",
      "L01 和 L02 已經收錄。按亮起的「帶著案卷前往判讀迷宮」。");
    const pickedId=state.draft.id?.record.id || Object.values(state.draft)[0]?.record.id || state.token.split(":")[0];
    const record=remaining.find(item=>item.id===pickedId)||remaining[0];
    if(Object.values(state.draft).some(cell=>cell.record.id!==record.id))
      return step("gather-clear",action("clear"),"先清空，避免把不同檢體接在一起",
        "目前有欄位來自已收錄、窗外或不同的檢體。按「清空欄位」，這次依序整理 "+record.id+"。");
    const key=Object.keys(fields).find(name=>!state.draft[name]);
    if(!key)return step("gather-collect-"+record.id,action("collect"),"四格都對了，收錄 "+record.id,
      "按「收錄這份紀錄」。採檢清冊與 PPT 的原始來源會一起留下。");
    if(state.slot && state.slot!==key)return step("gather-cancel-slot-"+state.slot,action("slot",state.slot),
      "先取消目前選中的欄位","點一下已選中的「"+fields[state.slot]+"」，接著從「"+fields[key]+"」開始。");
    const token=record.id+":"+key;
    if(state.token===token)return step("gather-place-"+token,action("slot",key),"把剛才的資料放進「"+fields[key]+"」",
      "現在點亮框中的「"+fields[key]+"」。你剛取出的資料會填進這一格。");
    const source=key==="result"?"ppt":"excel";
    if(state.source!==source)return step("gather-source-"+token,action("source",source),
      source==="ppt"?"切到 PPT，找 "+record.id+" 的檢驗結果":"切到採檢 Excel，查 "+record.id,
      source==="ppt"?"前三格來自 Excel；檢驗結果要從同一檢體編號的 PPT 帶入。":"先按「採檢 Excel」，接著找 "+record.id+" 那一列。");
    if(source==="ppt" && state.slide!==record.id)return step("gather-slide-"+record.id,action("slide",record.id),
      "點 "+record.doc+"，確認報告編號 "+record.id,"按亮框的投影片縮圖。檢驗結果要和目前紀錄的檢體編號一致。");
    return step("gather-take-"+token,action("token",token),"取出 "+record.id+" 的「"+fields[key]+"」",
      "點亮框中的「"+window.BreathDocuments.value(record,key)+"」，"+
      (state.slot===key?"會直接填入已選的欄位。":"再點紀錄表的「"+fields[key]+"」。")+
      (key==="date"?"要取採檢時間，別取核發日期。":""));
  }
  function labyrinth(state) {
    const session=state.labyrinth;
    if(session.dialog)return step("labyrinth-dialog",action("labyrinth-close"),"先收好眼前的這條線索",
      session.dialog.title+"。讀完後按「"+(session.complete?"收起探索紀錄":"繼續探索")+"」，提示會接著告訴你下一站。");
    if(session.complete)return step("labyrinth-done",action("review-next"),"探索完成，前往文獻室",
      "按「前往文獻室」。念珠菌的檢出與證據缺口都已留在案卷。");
    const id=!session.found.specimen?"specimen":!session.found.missing?"missing":"exit";
    const names={specimen:"培養紀錄",missing:"其他證據",exit:"保留脈絡"};
    const why={specimen:"先核對這張培養究竟來自痰液還是 BAL。",missing:"穿過剛開的門，核對案卷還缺哪些證據。",exit:"兩份線索都讀過了，前往能保留未知的出口。"};
    return step("labyrinth-route-"+id,".labyrinth-viewport","下一站：「"+names[id]+"」",
      why[id]+(session.hintGoal===id?"沿金色虛線走；小地圖也會顯示路徑，走到亮點會自動查看。":
        "按下方「標出引導路線」，再沿金色虛線移動。"),
      {next:session.hintGoal===id?"重新標出路線":"標出引導路線",assist:"route",goal:id});
  }
  function maze(state) {
    const session=state.maze;
    if(session.feedback)return step("maze-message",action("maze-continue"),"讀完結果，接續判讀",
      session.feedback.ok?"這一步已核對成功。按下方按鈕接續。":"依據或分支還沒對上。先按下方按鈕回到這個節點。");
    if(Object.keys(session.results).length===3)return step("maze-done",action("review-next"),"三條路都完成了","按亮框的按鈕，帶著案卷去文獻室。");
    const gate=window.BreathMazeRules.current(session);
    if(session.walking || session.returning)return step("maze-walking",".maze-viewport","正在走向下一個節點","等偵探抵達後，這裡會指出下一份依據與分支。");
    if(session.drawer==="book")return step("maze-close-book",action("maze-close"),"讀完手冊，回到岔路","先按「回到迷宮」，提示會指出這一步的證據和分支。");
    const card=window.BreathMazeRules.cards(state.records,session.candidate).find(item=>item.id===gate.proof);
    if(session.drawer==="evidence")return step("maze-card-"+gate.id,action("maze-proof",gate.proof),
      "選「"+(card?.title||gate.proof)+"」","這張紀錄能支持目前分支。點亮框的卡片作為依據。");
    if(session.selected!==gate.proof)return step("maze-evidence-"+gate.id,action("maze-evidence"),
      "這一步先拿「"+(card?.title||gate.proof)+"」","按「查看案卷」，再選這份證據。每個候選與節點需要的依據不同。");
    const door=gate.options.find(item=>item.id===gate.right);
    return step("maze-door-"+gate.id,action("maze-door",gate.right),"選「"+door.label+"」這扇門",
      "依據已拿好。按亮框的門牌，偵探會沿走廊走過去，抵達後才會核對這一步。");
  }
  function literature(state) {
    const paper=window.BreathContent.literature[state.paper];
    if(!paper)return null;
    if(!paper.fit){
      const mismatch=paper.segments.findIndex(segment=>segment.type==="mismatch");
      return step("paper-skip-"+paper.id,action("classify","skip"),"這篇請按「略過」",
        "理由："+paper.feedback+(mismatch>=0?" 關鍵文字是「"+paper.segments[mismatch].text+"」。":""),
        {also:mismatch>=0?[action("mark",String(mismatch))]:[]});
    }
    const site=paper.segments.findIndex(segment=>segment.key==="site");
    if(!state.marks.includes(site))return step("paper-mark-"+paper.id,action("mark",String(site)),
      "先圈出「"+paper.segments[site].text+"」","點亮框中的這段文字。這是能和本案對照的檢體線索，圈好後再收入。");
    const limit=paper.segments.findIndex(segment=>segment.type==="limit");
    return step("paper-keep-"+paper.id,action("classify","keep"),"現在按「收入案卷」",
      "檢體線索已圈好。"+paper.feedback+(limit>=0?" 限制「"+paper.segments[limit].text+"」也會一起保留。":""),
      {also:limit>=0?[action("mark",String(limit))]:[]});
  }
  function debate(state) {
    const session=state.debate;
    if(session.phase==="complete")return step("debate-complete",action("debate-report"),"四段完成，組成調查報告",
      "按「組成調查報告」，再送回診療室。");
    if(session.feedback)return step("debate-feedback",action("debate-next"),
      session.feedback.ok?"命中了，接著核對下一段":"先回到議論，提示會指出正確配對",
      session.feedback.ok?"按亮框的按鈕，接續下一段或收起核對紀錄。":"按「再聽一次」，再依提示裝填證據。");
    if(session.drawer)return step("debate-drawer",action("debate-close"),"先回到議論","讀完原始證據，按「回到議論」。");
    const round=window.BreathDebateData.current(session);
    const card=session.cards.find(item=>item.id===round.correct.bullet);
    const statement=round.lines.find(item=>item.id===round.correct.line);
    const verb=round.mode==="agree"?"支持":"反駁";
    if(session.selected!==card.id)return step("debate-ammo-"+session.index,action("debate-ammo",card.id),
      "裝填「"+card.title+"」","用這份證據"+verb+"「"+statement.target+"」。先點亮框的言彈。");
    if(session.phase==="ready")return step("debate-start-"+session.index,action("debate-start"),"言彈正確，開始議論",
      "按「開始議論」。要"+verb+"的片語是「"+statement.target+"」。開始後也可用提示幫你停住這一句。");
    if(!session.paused || window.BreathDebateData.current(session).lines[window.BreathDebateData.lineIndex(session)].id!==statement.id)
      return step("debate-freeze-"+session.index,action("debate-pause"),"瞄準「"+statement.target+"」",
        "用「"+card.title+"」"+verb+"這一句。按下方「幫我停在這句」，會暫停在可瞄準的位置，再由你點片語發射。",
        {next:"幫我停在這句",assist:"debate"});
    return step("debate-hit-"+session.index,action("debate-hit",statement.id),"點亮框的「"+statement.target+"」發射",
      "已停在這一句，也裝填了「"+card.title+"」。直接點亮框的"+(round.mode==="agree"?"藍色":"黃色")+"片語，"+verb+"這項推論。");
  }
  function next(state) {
    if(state.view==="travel")return step("travel",action("walk-goal"),"按「走到目的地」就能繼續",
      "亮框的按鈕會帶偵探走到這關入口；到站後接上劇情。");
    if(state.view==="report")return step("report",action(state.submitted?"back-done":"submit"),
      state.submitted?"返回結案畫面":"最後一步：送出調查報告",
      "核對結果已保存在案卷。按亮框的按鈕繼續。");
    return ({gather,labyrinth,maze,literature,debate})[state.view]?.(state)||null;
  }
  window.BreathHints={next};
})();
