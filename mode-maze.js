(function () {
  "use strict";
  function easy(base) {
    const spawn={x:2,y:10},width=19,height=13;
    const landmarks=[{id:"specimen",x:5,y:9,label:"培養紀錄",type:"record"},
      {id:"missing",x:12,y:6,label:"其他證據",type:"record"},{id:"exit",x:16,y:2,label:"保留脈絡",type:"exit"}];
    const gates=[{id:"specimen",x:8,y:6,axis:"x",message:"先查看培養紀錄。"},
      {id:"missing",x:16,y:4,axis:"y",message:"先查看其他證據。"}];
    function floorPlan(state) {
      const grid=Array.from({length:height},()=>Array(width).fill(false));
      const line=(x,y,a,b)=>{while(true){grid[y][x]=true;if(x===a&&y===b)break;x+=Math.sign(a-x);y+=Math.sign(b-y);}};
      line(2,10,5,10);line(5,10,5,6);line(5,6,16,6);line(16,6,16,2);
      line(5,6,3,6);line(12,6,12,8);
      gates.forEach(g=>{if(!state.found[g.id])grid[g.y][g.x]=false;});
      return grid;
    }
    return {width,height,spawn,landmarks,gates,visionRadius:7.5,
      inSight:(p,c,r=7.5)=>Math.hypot(c.x-p.x,c.y-p.y)<=r,floorPlan,
      create:()=>({...base.create(),position:{...spawn},visited:["2,10"],difficulty:"easy",hintGoal:"specimen"})};
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
    segments.forEach(([start,end],sector)=>{
      const path=[start,...window.BreathMaze.pathTo(grid,start,end)];
      const used=new Set();
      for(let n=0;n<2;n++) {
        let index=Math.floor(path.length*(n?0.67:0.33));
        index=Math.max(2,Math.min(path.length-4,index));
        while(used.has(index)||used.has(index+1))index++;
        used.add(index);used.add(index+1);
        const point=path[index],door=path[index+1],id="quiz"+(sector*2+n+1),quiz=quizzes[sector*2+n];
        landmarks.push({id,...point,label:"岔路證據門 "+(sector*2+n+1),type:"quiz",question:quiz[0],options:quiz[1],right:quiz[2],reference:quiz[3]});
        gates.push({id,...door,axis:door.x===point.x?"y":"x",message:"回到附近的證據碑，先核對問題才能開門。"});
      }
    });
    return {width,height,spawn,landmarks,gates,visionRadius:3.7,
      inSight:(p,c,r=3.7)=>Math.hypot(c.x-p.x,c.y-p.y)<=r,
      floorPlan:state=>grid.map((row,y)=>row.map((floor,x)=>floor&&!gates.some(g=>g.x===x&&g.y===y&&!state.found[g.id]))),
      create:()=>({...base.create(),position:{...spawn},visited:["1,41"],difficulty:"hard",quizAnswers:[],quizMistakes:0}),
      visit(state,id,records) {
        const item=landmarks.find(x=>x.id===id);
        if(item?.type!=="quiz")return base.visit(state,id,records);
        if(state.dialog||state.complete||state.found[id])return false;
        state.dialog={quizId:id,title:item.label,voice:"證據碑",copy:item.question,
          options:item.options,reference:item.reference,fact:"選擇符合案卷的答案，門上的封印才會解除。",kind:"quiz"};
        return true;
      },
      answer(state,value) {
        const clue=state.dialog,item=landmarks.find(x=>x.id===clue?.quizId);
        if(!item||!Number.isInteger(value)||!item.options[value])return false;
        if(value!==item.right){state.quizMistakes++;state.dialog.error="這個答案與案卷不符。請重新核對證據。";return false;}
        state.found[item.id]=true;state.seen.push(item.id);
        state.quizAnswers.push({id:item.id,question:item.question,answer:item.options[value]});
        state.dialog=null;return true;
      }
    };
  }
  window.BreathModeMaze={easy,hard};
})();
