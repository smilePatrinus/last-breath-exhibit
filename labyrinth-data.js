(function () {
  "use strict";
  const width=31,height=23,tileSize=32,visionRadius=4.25,spawn={x:3,y:20};
  function inSight(position,cell,radius=visionRadius) {
    return Math.hypot(cell.x-position.x,cell.y-position.y)<=radius;
  }
  const landmarks=[
    {id:"shortcut",x:8,y:5,label:"高讀數捷徑",type:"blocked"},
    {id:"specimen",x:11,y:18,label:"培養紀錄",type:"record"},
    {id:"mispaired",x:14,y:9,label:"同一份 BAL？",type:"blocked"},
    {id:"missing",x:21,y:12,label:"其他證據",type:"record"},
    {id:"proven",x:17,y:8,label:"已證實？",type:"blocked"},
    {id:"exit",x:28,y:3,label:"保留脈絡",type:"exit"}
  ];
  const gates=[
    {id:"specimen",x:14,y:16,axis:"x",message:"這扇門需要先核對培養來源。附近有一座紀錄櫃。"},
    {id:"missing",x:25,y:10,axis:"y",message:"還有一頁證據範圍要看。回頭找發光的紀錄。"}
  ];
  function create() {
    return {position:{...spawn},seen:[],found:{},visited:[spawn.x+","+spawn.y],explored:[],
      trace:[],dialog:null,complete:false,result:null};
  }
  function floorPlan(state) {
    const grid=Array.from({length:height},()=>Array(width).fill(false));
    function line(x,y,toX,toY) {
      const dx=Math.sign(toX-x),dy=Math.sign(toY-y);
      grid[y][x]=true;
      while(x!==toX || y!==toY){x+=dx;y+=dy;grid[y][x]=true;}
    }
    for(let y=18;y<=21;y++)for(let x=2;x<=7;x++)grid[y][x]=true;
    line(3,20,6,20);line(6,20,6,16);
    line(6,16,3,16);line(3,16,3,9);line(3,9,8,9);line(8,9,8,5);
    line(3,12,1,12);line(1,12,1,19);line(1,19,3,19);
    line(6,16,17,16);
    for(let y=17;y<=19;y++)for(let x=9;x<=13;x++)grid[y][x]=true;
    line(11,16,11,18);
    line(11,16,11,12);line(11,12,14,12);line(14,12,14,9);
    line(11,13,7,13);line(7,13,7,16);
    line(17,16,21,16);line(21,16,21,12);
    line(21,12,17,12);line(17,12,17,8);
    line(17,10,19,10);line(19,10,19,12);
    line(21,12,25,12);line(25,12,25,8);line(25,8,28,8);line(28,8,28,3);
    line(25,12,25,14);line(25,14,28,14);line(28,14,28,18);
    line(28,18,23,18);line(23,18,23,16);line(23,16,21,16);
    for(const gate of gates)if(!state.found[gate.id])grid[gate.y][gate.x]=false;
    return grid;
  }
  function remember(state,id,entry) {
    state.found[id]=true;
    if(!state.trace.some(item=>item.gate===id))state.trace.push({gate:id,...entry});
  }
  function visit(state,id,records) {
    if(state.dialog || state.complete)return false;
    const landmark=landmarks.find(item=>item.id===id);
    if(!landmark)return false;
    const specimen=records.find(record=>record.id==="L01");
    const culture=specimen?.tests.find(test=>test.kind==="culture" && test.target==="B");
    const body={
      shortcut:{title:"這條捷徑，少了其他證據",voice:"偵探 · 心想",
        copy:"念珠菌的讀數最高，但光靠這個數字，還到不了「確認致病」的出口。沿著岔路找檢體紀錄吧。",
        fact:"高 reads 代表檢出訊號，仍需核對菌種特性與其他支持。",source:"D07 · L02 mNGS 訊號；念珠菌判讀規則"},
      mispaired:{title:"同一天，未必是同一次採檢",voice:"偵探 · 心想",
        copy:"這個入口寫著「同一份 BAL」，但培養原單的編號和檢體類型還沒對上。走回去看看原始紀錄。",
        fact:"採檢日、核發日與檢體編號，要一起核對。",source:"第一關帶入的採檢清冊與檢驗投影片"},
      proven:{title:"這裡還不能寫「已證實」",voice:"醫師 · 通話",
        copy:"這份案卷未提供同種念珠菌的血液、無菌部位或病理證據。缺資料保持未知，不能直接補成陽性或陰性。",
        fact:"未提供 ≠ 陰性；未提供 ≠ 已證實。",source:"展示病例 D07 的資料範圍"}
    };
    if(id==="specimen") {
      if(!specimen || !culture) {
        state.dialog={title:"原始培養紀錄還沒帶來",voice:"偵探 · 心想",
          copy:"這座櫃子要核對 L01 的採檢與培養。先完成第一關，帶入同編號的原始紀錄。",fact:"缺少的來源不能用猜的補上。"};
        return true;
      }
      remember(state,id,{title:"核對培養來源",choice:"另一份 L01 痰液",evidence:"culture:B",
        reason:"L01 痰液於 11/16 採檢，11/18 為核發日。保留呼吸道脈絡，與 L02 BAL 分開。",
        rule:"R-S4-CANDIDA-RESP-CONTEXT-NOT-PICKED"});
      state.dialog={title:"找到了：這張是痰液培養",voice:"偵探",
        copy:"原來十八日是核發日。這張培養來自另一份 L01 痰液，不能接成 L02 的同檢體 BAL 培養。",
        fact:"L01 · 痰液\n採檢 "+specimen.dateTime+"\n核發 2026/"+culture.released+"\n"+culture.finding,
        source:window.BreathDocuments.origin(specimen,"id")+" / "+window.BreathDocuments.origin(specimen,"result"),
        reward:"「呼吸道紀錄」的門開了。",kind:"source"};
    } else if(id==="missing") {
      if(!state.found.specimen)return false;
      remember(state,id,{title:"核對侵襲性證據",choice:"尚未提供，保持未知",evidence:"missing:invasive",
        reason:"本展示案卷未提供同種 Candida 的血液、無菌部位或病理紀錄，維持 unknown。",
        rule:"R-S4-CANDIDA-RESP-CONTEXT-NOT-PICKED"});
      state.dialog={title:"這一頁，確實還是空白",voice:"醫師 · 通話",
        copy:"目前沒有提供同種念珠菌的血液、無菌部位或病理資料。先如實留下缺口，再找能保留未知的出口。",
        fact:"血液／無菌部位／病理\n本案未提供 · unknown",
        source:"展示病例 D07 的資料範圍",reward:"「尚未提供」的走廊已開啟。",kind:"unknown"};
    } else if(id==="exit") {
      if(!state.found.specimen || !state.found.missing)return false;
      remember(state,id,{title:"抵達脈絡出口",choice:"暫不列入，保留呼吸道脈絡",evidence:"signal:B",
        reason:"讀數與培養檢出都留下；目前不足以補上侵襲性證據，尚不能認定它就是本次感染原因。",
        rule:"R-S4-CANDIDA-RESP-CONTEXT-NOT-PICKED"});
      state.complete=true;
      state.result={outcome:"暫不列入 · 留存呼吸道脈絡",trace:state.trace.map(item=>({...item})),explored:true};
      state.dialog={title:"出口找到了，疑問也留下來了",voice:"偵探",
        copy:"它確實被找到了。但目前的證據，還不足以認定它就是這次感染的原因。",
        fact:"念珠菌：暫不列入正式候選\n保留檢出與呼吸道脈絡；缺少的資料保持未知。",
        source:"本輪實際探索的三個節點",kind:"finish"};
    } else state.dialog=body[id];
    if(!state.dialog)return false;
    if(!state.seen.includes(id))state.seen.push(id);
    return true;
  }
  function task(state) {
    if(!state.found.specimen)return "帶著念珠菌探索，找一找培養的原始紀錄。";
    if(!state.found.missing)return "檢體來源對上了。穿過新開的門，查看還缺哪些證據。";
    return "缺少的項目保持未知。沿著走廊找到「保留脈絡」出口。";
  }
  window.BreathLabyrinthData={width,height,tileSize,visionRadius,inSight,spawn,landmarks,gates,create,floorPlan,visit,task};
})();
