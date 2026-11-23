(function () {
  "use strict";
  function easy(base) {
    const spawn={x:3,y:20},width=29,height=23;
    const landmarks=[{id:"specimen",x:5,y:5,label:"培養紀錄",type:"record"},
      {id:"missing",x:18,y:4,label:"其他證據",type:"record"},{id:"exit",x:26,y:2,label:"保留脈絡",type:"exit"}];
    const gates=[{id:"specimen",x:12,y:12,axis:"x",message:"先到左側紀錄室核對培養來源，再通過這扇門。"},
      {id:"missing",x:21,y:7,axis:"x",message:"先到上方紀錄室查看其他證據，再前往出口區。"}];
    function floorPlan(state) {
      const grid=Array.from({length:height},()=>Array(width).fill(false));
      const line=(x,y,a,b)=>{while(true){grid[y][x]=true;if(x===a&&y===b)break;x+=Math.sign(a-x);y+=Math.sign(b-y);}};
      const room=(left,top,right,bottom)=>{for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++)grid[y][x]=true;};
      // Entrance plaza, a small loop, and the first archive.
      room(2,18,6,21);
      line(4,18,4,13);line(4,13,8,13);line(8,13,8,7);
      room(4,4,9,8);
      line(4,13,4,10);line(4,10,8,10);
      line(4,15,2,15);line(2,15,2,11);
      line(8,12,15,12);
      // The courtyard has two ways around its central wall and a short side room.
      room(14,10,18,14);
      line(16,10,16,6);room(14,3,19,7);
      line(14,10,14,8);line(14,8,19,8);line(19,8,19,7);
      line(17,14,17,17);room(18,16,20,18);line(17,17,18,17);
      line(19,7,24,7);
      // Walk around the bend to the exit instead of spawning next to it.
      line(24,7,24,11);line(24,11,26,11);line(26,11,26,3);
      room(24,1,27,4);
      line(24,9,22,9);line(22,9,22,12);
      line(26,11,26,15);room(23,14,26,17);
      gates.forEach(g=>{if(!state.found[g.id])grid[g.y][g.x]=false;});
      return grid;
    }
    return {width,height,spawn,landmarks,gates,visionRadius:6,
      inSight:(p,c,r=6)=>Math.hypot(c.x-p.x,c.y-p.y)<=r,floorPlan,
      create:()=>({...base.create(),position:{...spawn},visited:["3,20"],difficulty:"easy",hintGoal:"specimen"})};
  }
  function hard(base) {
    const width=63,height=43,spawn={x:1,y:41};
    const grid=Array.from({length:height},()=>Array(width).fill(false));
    let seed=20261123;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    for(const [left,right] of [[1,19],[21,39],[41,61]]) {
      const stack=[{x:left,y:1}];grid[1][left]=true;
      while(stack.length) {
        const at=stack[stack.length-1];
        const choices=[[2,0],[-2,0],[0,2],[0,-2]].map(([x,y])=>({x:at.x+x,y:at.y+y}))
          .filter(p=>p.x>=left&&p.x<=right&&p.y>=1&&p.y<=41&&!grid[p.y][p.x]);
        if(!choices.length){stack.pop();continue;}
        const next=choices[Math.floor(random()*choices.length)];
        grid[(at.y+next.y)/2][(at.x+next.x)/2]=true;grid[next.y][next.x]=true;stack.push(next);
      }
    }
    grid[21][20]=true;grid[21][40]=true;
    const landmarks=[{id:"specimen",x:19,y:21,label:"培養紀錄",type:"record"},
      {id:"missing",x:39,y:21,label:"其他證據",type:"record"},{id:"exit",x:61,y:1,label:"保留脈絡",type:"exit"}];
    const gates=[{id:"specimen",x:20,y:21,axis:"x",message:"必須先核對培養來源。"},
      {id:"missing",x:40,y:21,axis:"x",message:"必須先核對資料範圍。"}];
    const quizzes=[
      ["L02 的檢體部位是什麼？",["肺泡灌洗液（BAL）","痰液","血液"],0,"採檢清冊 L02／P-01，核對檢體類型。"],
      ["L01 應使用哪一個日期作為採檢日？",["11/18 核發","11/16 採檢","11/20 培養核發"],1,"L01 原單同時保存採檢與核發欄位，不能混用。"],
      ["白色念珠菌的培養支持來自哪裡？",["L02 同份 BAL","同菌種血液","另一份 L01 痰液"],2,"核對原始培養報告上的檢體編號與種類。"],
      ["案卷未提供的血液／病理結果，應記為？",["陰性","未知（未提供）","陽性"],1,"資料缺漏和檢驗陰性是不同狀態。"],
      ["FilmArray 的肺炎克雷伯氏菌群回報能支持到？",["直接確認 K. variicola","完全沒有微生物訊號","菌群層級，物種仍待核對"],2,"群內有不只一個物種，請保留回報層級。"],
      ["文獻記載其他病例的檢出，能直接證實本案致病嗎？",["不能，仍需本案證據","可以，只要同菌名","可以，只要 reads 最高"],0,"文獻提供背景；檢出與本案因果判定要分開。"]
    ];
    const segments=[[spawn,landmarks[0]],[{x:21,y:21},landmarks[1]],[{x:41,y:21},landmarks[2]]];
    const mainPaths=segments.map(([start,end])=>[start,...window.BreathMaze.pathTo(grid,start,end)]);
    const clueNames=["檢體身分鑰匙","採檢時序鑰匙","培養來源鑰匙","未知證據鑰匙","菌群層級鑰匙","文獻界線鑰匙"];
    const clueText=[
      "L02 的採檢類型是肺泡灌洗液（BAL），不是痰液或血液。",
      "L01 於 11/16 採檢；11/18 是核發日期。採檢與核發欄位不能混用。",
      "白色念珠菌的培養來自另一份 L01 痰液，不能接成 L02 同份 BAL 培養。",
      "案卷未提供的血液、無菌部位或病理證據，維持未知，不補成陽性或陰性。",
      "FilmArray 的 K. pneumoniae group 回報支持菌群層級，不能直接確認群內的個別物種。",
      "其他病例的文獻可作背景；本案的致病角色仍需本案證據，不能由同菌名或最高 reads 直接確定。"
    ];
    mainPaths.forEach((path,sector)=>{
      const used=new Set();
      for(let n=0;n<2;n++) {
        let index=Math.floor(path.length*(n?0.67:0.33));
        index=Math.max(2,Math.min(path.length-4,index));
        while(used.has(index)||used.has(index+1))index++;
        used.add(index);used.add(index+1);
        const point=path[index],door=path[index+1],number=sector*2+n+1,id="quiz"+number,keyId="key"+number,quiz=quizzes[number-1];
        landmarks.push({id,...point,label:"第 "+number+" 道大門",type:"gate",keyId,number,sector,
          question:quiz[0],options:quiz[1],right:quiz[2],reference:quiz[3]});
        gates.push({id,...door,axis:door.x===point.x?"y":"x",message:"大門仍上著鎖。先探索周圍找對應的線索鑰匙，再回到門前使用。"});
      }
    });
    // Keep every corridor and doorway in place. Keys go to reachable off-route branches.
    const occupied=new Set(landmarks.map(p=>p.x+","+p.y));
    const floorWith=found=>grid.map((row,y)=>row.map((floor,x)=>floor&&!gates.some(g=>g.x===x&&g.y===y&&!found[g.id])));
    for(let number=1;number<=6;number++) {
      const door=landmarks.find(l=>l.id==="quiz"+number),sector=door.sector,left=[1,21,41][sector],right=[19,39,61][sector];
      const found={specimen:sector>0,missing:sector>1};
      for(let n=1;n<number;n++)found["quiz"+n]=true;
      const accessible=floorWith(found),start=segments[sector][0];
      const reachable=new Map([[start.x+","+start.y,0]]),queue=[start];
      for(let i=0;i<queue.length;i++) {
        const at=queue[i],distance=reachable.get(at.x+","+at.y);
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const next={x:at.x+dx,y:at.y+dy},key=next.x+","+next.y;
          if(!accessible[next.y]?.[next.x]||reachable.has(key))continue;
          reachable.set(key,distance+1);queue.push(next);
        }
      }
      const main=new Set(mainPaths[sector].map(p=>p.x+","+p.y));
      const target={x:number%2?left:right,y:number%2?1:41};
      const candidates=queue.filter(p=>p.x>=left&&p.x<=right&&!main.has(p.x+","+p.y)&&!occupied.has(p.x+","+p.y));
      if(!candidates.length)throw new Error("No accessible side branch for "+door.id);
      const degree=p=>[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>grid[p.y+dy]?.[p.x+dx]).length;
      const perimeter=candidates.filter(p=>p.x<=left+2||p.x>=right-2||p.y<=3||p.y>=39);
      const pool=perimeter.length?perimeter:candidates;
      const score=p=>Math.abs(p.x-target.x)+Math.abs(p.y-target.y)-Math.min(25,window.BreathMaze.pathTo(accessible,p,door).length)*.18-(degree(p)===1?.5:0);
      pool.sort((a,b)=>score(a)-score(b)||a.y-b.y||a.x-b.x);
      const point=pool[0];occupied.add(point.x+","+point.y);
      landmarks.push({id:door.keyId,...point,type:"key",label:clueNames[number-1],number,doorId:door.id,
        statement:clueText[number-1],reference:quizzes[number-1][3]});
    }
    return {width,height,spawn,landmarks,gates,visionRadius:3.7,
      inSight:(p,c,r=3.7)=>Math.hypot(c.x-p.x,c.y-p.y)<=r,
      floorPlan:state=>grid.map((row,y)=>row.map((floor,x)=>floor&&!gates.some(g=>g.x===x&&g.y===y&&!state.found[g.id]))),
      create:()=>({...base.create(),position:{...spawn},visited:["1,41"],difficulty:"hard",keys:[],quizAnswers:[],quizMistakes:0}),
      task(state) {
        const count=state.keys?.length||0,opened=state.quizAnswers.length;
        return count===0?"先離開主路探索迷宮角落，找到線索鑰匙，再回對應大門。":
          "已收集 "+count+" / 6 把線索鑰匙，解開 "+opened+" / 6 道大門。帶著鑰匙回到對應大門核對封印。";
      },
      visit(state,id,records) {
        const item=landmarks.find(x=>x.id===id);
        if(item?.type==="key") {
          if(state.dialog||state.complete)return false;
          state.keys ||= [];
          const first=!state.keys.includes(id);
          if(first)state.keys.push(id);
          if(!state.seen.includes(id))state.seen.push(id);
          state.dialog={title:(first?"找到線索鑰匙：":"重讀線索：")+item.label,voice:"偵探",
            copy:"這把鑰匙對應第 "+item.number+" 道大門。先收進鑰匙包，再找路回到門前。",
            fact:item.statement,source:"D07 教學案卷 · "+item.reference,kind:"key",
            reward:first?"已收進鑰匙包，尚未開啟大門。":""};
          return true;
        }
        if(item?.type!=="gate") {
          if(id==="exit" && !Array.from({length:6},(_,i)=>"quiz"+(i+1)).every(key=>state.found[key])) {
            if(state.dialog||state.complete)return false;
            state.dialog={title:"出口的封印還沒完全解開",voice:"偵探",copy:"需要收集六把線索鑰匙，並在各自大門使用，才能通過出口。",fact:"已解鎖 "+state.quizAnswers.length+" / 6 道大門",kind:"locked"};
            return true;
          }
          return base.visit(state,id,records);
        }
        if(state.dialog||state.complete||state.found[id])return false;
        if(!state.keys?.includes(item.keyId)) {
          state.dialog={title:item.label+"：還缺一把鑰匙",voice:"偵探",
            copy:"這道門需要「"+clueNames[item.number-1]+"」。先回迷宮周圍找線索，找到後再回來。",
            fact:"鑰匙包："+(state.keys?.length||0)+" / 6\n尚未取得這道門的線索。",kind:"locked"};
          return true;
        }
        const clue=landmarks.find(l=>l.id===item.keyId);
        state.dialog={quizId:id,title:item.label,voice:"門上的封印",copy:item.question,
          options:item.options,reference:"帶來的鑰匙："+clue.label,fact:clue.statement,kind:"quiz"};
        return true;
      },
      answer(state,value) {
        const clue=state.dialog,item=landmarks.find(x=>x.id===clue?.quizId);
        if(!item||!state.keys?.includes(item.keyId)||!Number.isInteger(value)||!item.options[value])return false;
        if(value!==item.right){state.quizMistakes++;state.dialog.error="這個答案與案卷不符。請重新核對證據。";return false;}
        state.found[item.id]=true;state.seen.push(item.id);
        state.quizAnswers.push({id:item.id,key:item.keyId,question:item.question,answer:item.options[value]});
        state.dialog=null;return true;
      }
    };
  }
  window.BreathModeMaze={easy,hard};
})();
