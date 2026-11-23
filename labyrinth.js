(function () {
  "use strict";
  const data=window.BreathLabyrinthData;
  const size=data.tileSize;
  const moves={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  const keys={ArrowUp:"up",KeyW:"up",ArrowDown:"down",KeyS:"down",ArrowLeft:"left",KeyA:"left",ArrowRight:"right",KeyD:"right"};
  const rows={down:0,left:1,right:2,up:3};
  const tiles=new Image(),sprite=new Image();
  tiles.src="./assets/maze-tiles.png";sprite.src="./assets/detective-walk.png";
  function minimap(state) {
    const grid=data.floorPlan({found:Object.fromEntries(data.gates.map(gate=>[gate.id,true]))});
    const known=new Set(state.explored||[]);
    const cells=[];
    grid.forEach((row,y)=>row.forEach((floor,x)=>{
      if(floor)cells.push('<rect data-cell="'+x+','+y+'" class="'+(known.has(x+','+y)?'explored':'unexplored')+'" x="'+x+'" y="'+y+'" width="1" height="1"/>');
    }));
    return '<svg viewBox="0 0 '+data.width+' '+data.height+'" role="img" aria-label="已探索區域，金點是你的位置">'+
      '<g class="labyrinth-mini-floor">'+cells.join("")+'</g><path class="labyrinth-hint-route" d="" fill="none" aria-hidden="true"/>'+
      data.landmarks.map(item=>'<circle data-mini-landmark="'+item.id+'" cx="'+(item.x+.5)+'" cy="'+(item.y+.5)+'" r=".6" class="'+
        (state.seen.includes(item.id)?"read":item.type==="exit"?"exit":item.type==="key"?"clue-key":item.type==="gate"?"locked-gate":"landmark")+(known.has(item.x+','+item.y)?'':' undiscovered')+'"/>').join("")+
      '<circle class="labyrinth-mini-player" cx="'+(state.position.x+.5)+'" cy="'+(state.position.y+.5)+'" r=".7"/></svg>';
  }
  function render(state,button,html) {
    if(state.complete && !state.dialog) return '<section class="panel labyrinth-finish"><p class="eyebrow">白色念珠菌 · 本輪探索完成</p>'+
      '<h2>找到了出口，也留下了證據的界線。</h2><ol>'+state.trace.map(item=>'<li><strong>'+html(item.title)+
      '</strong><p>'+html(item.choice)+'</p></li>').join("")+'</ol><p>這次實際走過的是念珠菌路線。其他兩個候選仍保留在原始案卷，接著去文獻室追查 K. variicola 的疑問。</p>'+
      (state.difficulty==="hard"?'<p class="key-completion">線索鑰匙 '+(state.keys?.length||0)+' / 6 · 已解鎖 '+state.quizAnswers.length+' / 6 道大門</p>':"")+
      '<div class="actions">'+button("前往文獻室","review-next","",{kind:"primary"})+
      button("再走一次","labyrinth-replay")+'</div><p class="hint"><a href="?v=20&demo=maze&maze=rules">對照原本的規則迷宮</a></p></section>';
    const journal='<section class="panel labyrinth-journal"><p class="eyebrow">一路找到的線索</p>'+
      '<div class="labyrinth-fact known"><b>mNGS</b><p>白色念珠菌讀數最高</p><small>檢出訊號，還需其他支持。</small></div>'+
      '<div class="labyrinth-fact '+(state.found.specimen?"known":"")+'"><b>培養從哪裡來？</b><p>'+
      (state.found.specimen?"L01 · 另一份痰液":"還沒找到原始紀錄")+'</p>'+
      (state.found.specimen?button("重讀來源","labyrinth-read","specimen",{kind:"quiet small"}):"")+'</div>'+
      '<div class="labyrinth-fact '+(state.found.missing?"known":"")+'"><b>侵襲性證據</b><p>'+
      (state.found.missing?"未提供 · 保持未知":"還沒核對資料範圍")+'</p>'+
      (state.found.missing?button("重讀範圍","labyrinth-read","missing",{kind:"quiet small"}):"")+'</div></section>';
    const keyBag=state.difficulty==="hard"?'<section class="panel labyrinth-keybag"><div class="panel-top"><h2>線索鑰匙包</h2>'+
      '<strong class="key-count">'+(state.keys?.length||0)+' / 6</strong></div><p>先在角落找線索，再回對應的大門使用。</p><ul>'+
      data.landmarks.filter(item=>item.type==="key").sort((a,b)=>a.number-b.number).map(item=>{
        const owned=state.keys?.includes(item.id),used=Boolean(state.found[item.doorId]);
        return '<li class="'+(owned?'owned':'missing')+'"><span class="bag-key" aria-hidden="true">⚿</span><div><b>'+
          (owned?html(item.label):'第 '+item.number+' 把：未找到')+'</b><small>'+
          (owned?'對應第 '+item.number+' 道大門 · '+(used?'已解鎖':'尚未使用'):'探索迷宮周圍的支路')+'</small></div>'+
          (owned?button("重讀","labyrinth-read",item.id,{kind:"quiet small",attrs:' aria-label="重讀'+html(item.label)+'"'}):'')+'</li>';
      }).join("")+'</ul></section>':"";
    let dialog="";
    if(state.dialog) {
      const clue=state.dialog;
      dialog='<section class="labyrinth-message '+html(clue.kind||"")+
        '" role="alertdialog" aria-modal="true" aria-labelledby="labyrinth-message-title"><div class="labyrinth-face" aria-hidden="true"></div>'+
        '<p class="eyebrow">'+html(clue.voice)+'</p><h2 id="labyrinth-message-title">'+html(clue.title)+'</h2><p>'+html(clue.copy)+
        '</p><div class="labyrinth-paper">'+html(clue.fact)+'</div>'+
        (clue.source?'<small class="labyrinth-source">'+html(clue.source)+'</small>':"")+
        (clue.reward?'<p class="labyrinth-reward">'+html(clue.reward)+'</p>':"")+
        (clue.quizId ? '<div class="maze-quiz-options">'+clue.options.map((option,index)=>button(html(option),"maze-answer",String(index),{kind:"quiet"})).join("")+'</div>'+
          (clue.error?'<p class="mode-errors" role="status">'+html(clue.error)+'</p>':'')+
          '<p class="hint">'+html(clue.reference)+'</p>' : '')+
        '<div class="actions">'+button(state.complete?"收起探索紀錄":"繼續探索","labyrinth-close","",{kind:"primary"})+'</div></section>';
    }
    const landmarks=data.landmarks.map(item=>button(html(item.label),"labyrinth-landmark",item.id,{
      kind:"labyrinth-sign "+item.type+(state.seen.includes(item.id)?" seen":""),
      attrs:' style="left:'+(item.x+.5)*size+'px;top:'+(item.y*size-15)+'px;" aria-label="走向'+html(item.label)+'"'+
        (!data.inSight(state.position,item,2.25)?' hidden':"")+(state.dialog||!data.inSight(state.position,item,2.25)?' disabled':"")
    })).join("");
    return '<section class="labyrinth-mission"><div><p class="eyebrow">本次探路 · 白色念珠菌</p><h2>沿證據，找到能走的出口。</h2><p>'+
      html(data.task(state))+'</p></div><span class="labyrinth-companion">同行候選<br><b>Candida albicans</b></span></section>'+
      '<div class="labyrinth-layout"><section class="labyrinth-board"><div class="labyrinth-viewport" tabindex="0" aria-label="自由探索迷宮，方向鍵或 WASD 移動">'+
      '<div class="labyrinth-camera"><canvas aria-hidden="true"></canvas>'+landmarks+'</div><div class="labyrinth-fog" aria-hidden="true"></div></div>'+
      '<div class="labyrinth-controls"><p>在身邊的微光中探索，走近亮點查看線索。<br><small>方向鍵／WASD、點亮處的石板路，或按住方向按鈕。</small></p>'+
      '<div class="dpad">'+[["left","←","左"],["up","↑","上"],["down","↓","下"],["right","→","右"]].map(([id,label,name])=>
        button(label,"labyrinth-move",id,{attrs:' aria-label="向'+name+'移動"'+(state.dialog?' disabled':"")})).join("")+
      '</div></div>'+dialog+'</section><aside class="labyrinth-aside">'+keyBag+journal+
      '<details class="panel labyrinth-minimap" open><summary>看已探索的區域</summary>'+minimap(state)+
      '<p>只記下照亮過的附近；金點是你。</p><p class="labyrinth-hint-status" hidden>金色虛線是提示路徑，沿著它走到下一份線索。</p></details></aside></div>';
  }

  function mount(root,state,onVisit,onBlocked) {
    const viewport=root.querySelector(".labyrinth-viewport");
    if(!viewport)return null;
    const camera=root.querySelector(".labyrinth-camera"),canvas=root.querySelector("canvas");
    const fog=root.querySelector(".labyrinth-fog");
    const signs=new Map(Array.from(root.querySelectorAll('.labyrinth-sign'),node=>[node.dataset.value,node]));
    const miniCells=new Map(Array.from(root.querySelectorAll('[data-cell]'),node=>[node.dataset.cell,node]));
    const miniLandmarks=new Map(Array.from(root.querySelectorAll('[data-mini-landmark]'),node=>[node.dataset.miniLandmark,node]));
    canvas.width=data.width*size;canvas.height=data.height*size;
    canvas.style.width=canvas.width+"px";canvas.style.height=canvas.height+"px";
    camera.style.width=canvas.width+"px";camera.style.height=canvas.height+"px";
    const ctx=canvas.getContext("2d"),grid=data.floorPlan(state);
    const base=document.createElement("canvas");
    base.width=canvas.width;base.height=canvas.height;
    const terrain=base.getContext("2d");
    let at={...state.position},visual={...at},route=[],segment=null,held=null,face="up",walk=1;
    let raf=0,stopped=false,pending="",lastBlock=0;
    const visited=new Set(state.visited);
    state.explored ||= [];
    const explored=new Set(state.explored);
    const locked=()=>Boolean(state.dialog || state.complete || document.querySelector("dialog[open]"));
    function reveal() {
      const radius=Math.ceil(data.visionRadius);
      for(let y=Math.max(0,at.y-radius);y<Math.min(data.height,at.y+radius+1);y++)
        for(let x=Math.max(0,at.x-radius);x<Math.min(data.width,at.x+radius+1);x++){
          const key=x+","+y;
          if(data.inSight(at,{x,y})&&!explored.has(key)){
            explored.add(key);state.explored.push(key);
            const cell=miniCells.get(key);
            if(cell){cell.classList.remove('unexplored');cell.classList.add('explored');}
          }
        }
      for(const item of data.landmarks)miniLandmarks.get(item.id)?.classList.toggle('undiscovered',!explored.has(item.x+','+item.y));
    }
    function tile(context,index,x,y,w=size,h=size) {
      if(tiles.complete&&tiles.naturalWidth) {
        const sw=tiles.naturalWidth/2,sh=tiles.naturalHeight/2;
        context.drawImage(tiles,(index%2)*sw,Math.floor(index/2)*sh,sw,sh,x,y,w,h);
      } else {context.fillStyle=index===0?"#9d7b51":"#25263b";context.fillRect(x,y,w,h);}
    }
    function rebuild() {
      terrain.imageSmoothingEnabled=false;
      for(let y=0;y<data.height;y++)for(let x=0;x<data.width;x++) {
        const doorway=data.gates.some(gate=>gate.x===x&&gate.y===y);
        tile(terrain,grid[y][x]||doorway?0:1,x*size,y*size);
        if(!grid[y][x]&&!doorway){terrain.fillStyle="#101b2d5c";terrain.fillRect(x*size,y*size,size,size);}
        else if(x>14){terrain.fillStyle="#82ccb51a";terrain.fillRect(x*size,y*size,size,size);}
      }
      for(const gate of data.gates)drawGate(gate,!state.found[gate.id]);
    }
    function drawGate(gate,closed) {
      // Door art occupies the same single tile as the doorway, including its frame.
      terrain.save();
      terrain.beginPath();terrain.rect(gate.x*size,gate.y*size,size,size);terrain.clip();
      terrain.translate((gate.x+.5)*size,(gate.y+.5)*size);
      if(gate.axis==="y")terrain.rotate(Math.PI/2);
      terrain.translate(-size/2,-size/2);
      terrain.fillStyle="#352c35";terrain.fillRect(10,0,12,5);terrain.fillRect(10,27,12,5);
      terrain.fillStyle="#b19a6a";terrain.fillRect(12,1,8,3);terrain.fillRect(12,28,8,3);
      if(closed){
        terrain.fillStyle="#452c20";terrain.fillRect(12,4,8,24);
        terrain.fillStyle="#a77438";terrain.fillRect(14,5,4,22);
        terrain.fillStyle="#d5b36a";terrain.fillRect(13,10,6,2);terrain.fillRect(13,21,6,2);
        terrain.fillStyle="#f7dc8b";terrain.fillRect(15,15,2,3);
      }else{
        terrain.fillStyle="#a6d49d88";terrain.fillRect(15,5,2,22);
      }
      terrain.restore();
    }
    let hintKey="", hintPath=[];
    function drawHint() {
      const key=[state.hintGoal || "",at.x,at.y,Boolean(state.found.specimen),Boolean(state.found.missing)].join(":");
      if(key!==hintKey) {
        hintKey=key;
        const goal=data.landmarks.find(item=>item.id===state.hintGoal);
        hintPath=goal&&!state.dialog?[{...at},...window.BreathMaze.pathTo(grid,at,goal)]:[];
      }
      const mini=root.querySelector(".labyrinth-hint-route");
      const path=hintPath.map((cell,index)=>(index?"L":"M")+(cell.x+.5)+","+(cell.y+.5)).join(" ");
      if(mini)mini.setAttribute("d",path);
      const note=root.querySelector(".labyrinth-hint-status");
      if(note)note.hidden=hintPath.length<2;
      if(hintPath.length<2)return;
      ctx.save();ctx.strokeStyle="#ffe385";ctx.lineWidth=4;ctx.setLineDash([7,5]);
      ctx.lineDashOffset=-performance.now()/100;
      ctx.beginPath();hintPath.forEach((cell,index)=>ctx[index?"lineTo":"moveTo"]((cell.x+.5)*size,(cell.y+.5)*size));ctx.stroke();
      ctx.setLineDash([]);ctx.fillStyle="#ffe385";
      hintPath.slice(1,5).forEach(cell=>{ctx.fillRect((cell.x+.5)*size-3,(cell.y+.5)*size-3,6,6);});
      ctx.restore();
    }
    function draw(now=0) {
      if(stopped)return;
      ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(base,0,0);
      ctx.fillStyle="#ffe8a522";
      for(const key of visited){const [x,y]=key.split(",").map(Number);ctx.fillRect(x*size+7,y*size+7,18,18);}
      for(const item of data.landmarks){
        const read=state.seen.includes(item.id),x=(item.x+.5)*size,y=(item.y+.5)*size;
        if(item.type==="key") {
          const color=read?"#7f9c8c":"#ffe18b";
          ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x-5,y-3,5,0,Math.PI*2);ctx.stroke();
          ctx.fillStyle=color;ctx.fillRect(x,y-4,16,3);ctx.fillRect(x+8,y-1,3,6);ctx.fillRect(x+14,y-1,3,5);
        }
        else if(item.type==="gate") {
          ctx.fillStyle=state.found[item.id]?"#a6d49d":"#bd9771";
          ctx.fillRect(x-7,y-6,14,12);ctx.fillStyle="#172f38";ctx.fillRect(x-2,y-2,4,6);
        }
        else if(item.type==="record" || item.type==="quiz")tile(ctx,3,x-17,y-17,34,34);
        else if(item.type==="blocked"){
          ctx.save();ctx.beginPath();ctx.rect(item.x*size,item.y*size,size,size);ctx.clip();
          tile(ctx,2,item.x*size,item.y*size,size,size);ctx.restore();
        }
        else {ctx.fillStyle="#b2e3b7";ctx.fillRect(x-12,y-13,24,27);ctx.fillStyle="#255343";ctx.fillRect(x-7,y-10,14,24);}
        ctx.globalAlpha=read?.3:.65+Math.sin(now/240)*.15;
        ctx.strokeStyle=item.type==="exit"?"#c5ffd8":"#fff0a7";ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(x,y,item.type==="record"?18:13,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
      }
      drawHint();
      const px=(visual.x+.5)*size,py=(visual.y+1)*size;
      ctx.fillStyle="#07152277";ctx.beginPath();ctx.ellipse(px,py-2,10,3,0,0,Math.PI*2);ctx.fill();
      if(sprite.complete&&sprite.naturalWidth) {
        const sw=sprite.naturalWidth/3,sh=sprite.naturalHeight/4;
        ctx.drawImage(sprite,walk*sw,rows[face]*sh,sw,sh,px-25,py-49,50,50);
      }
      const bob=locked()?0:Math.sin(now/220)*2;
      ctx.fillStyle="#f5e5b1";ctx.strokeStyle="#4a5e48";ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(px+24,py-10+bob,7,10,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.ellipse(px+30,py-18+bob,4,5,.4,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle="#324f42";ctx.fillRect(px+23,py-13+bob,2,2);
      const sx=px-viewport.clientWidth*.5;
      const sy=(visual.y+.5)*size-viewport.clientHeight*.5;
      camera.style.transform="translate("+(-sx)+"px,"+(-sy)+"px)";
      fog.style.setProperty('--light-x',(px-sx)+'px');
      fog.style.setProperty('--light-y',((visual.y+.5)*size-sy)+'px');
      fog.style.setProperty('--vision-radius',(data.visionRadius*size)+'px');
      for(const item of data.landmarks){
        const sign=signs.get(item.id),visible=data.inSight(visual,item,2.25);
        sign.hidden=!visible;sign.disabled=!visible||Boolean(state.dialog);
        const below=item.y<visual.y;
        sign.classList.toggle('below',below);
        sign.style.top=((below?item.y+1:item.y)*size+(below?8:-15))+'px';
      }
      const mini=root.querySelector(".labyrinth-mini-player");
      if(mini){mini.setAttribute("cx",visual.x+.5);mini.setAttribute("cy",visual.y+.5);}
    }
    function blocked(goal) {
      const gate=data.gates.find(item=>item.x===goal.x&&item.y===goal.y&&!state.found[item.id]);
      if(gate&&performance.now()-lastBlock>1000){lastBlock=performance.now();onBlocked(gate.message);}
    }
    function arrived() {
      state.position={...at};
      reveal();
      const key=at.x+","+at.y;
      if(!visited.has(key)){visited.add(key);state.visited.push(key);}
      const item=data.landmarks.find(item=>item.x===at.x&&item.y===at.y);
      if(item&&(!state.seen.includes(item.id)||pending===item.id)){
        held=null;route=[];pending="";onVisit(item.id);
      }
    }
    function begin(next,now) {
      face=next.x!==at.x?(next.x>at.x?"right":"left"):(next.y>at.y?"down":"up");
      segment={from:{...at},to:next,start:now};
    }
    function tick(now) {
      if(stopped)return;
      if(!locked()){
        if(segment){
          const t=Math.min(1,(now-segment.start)/105);
          visual={x:segment.from.x+(segment.to.x-segment.from.x)*t,y:segment.from.y+(segment.to.y-segment.from.y)*t};
          walk=[0,1,2,1][Math.floor(now/95)%4];
          if(t===1){at={...segment.to};visual={...at};segment=null;arrived();}
        }else if(held){
          const [dx,dy]=moves[held],next={x:at.x+dx,y:at.y+dy};
          if(grid[next.y]?.[next.x])begin(next,now);else blocked(next);
        }else if(route.length)begin(route.shift(),now);else walk=1;
      }
      draw(now);raf=requestAnimationFrame(tick);
    }
    function walkTo(goal,eventId="") {
      if(locked())return;
      if(!data.inSight(visual,goal)){onBlocked("那裡還在黑暗中。先沿著看得見的石板路探索。");return;}
      if(!grid[goal.y]?.[goal.x]){blocked(goal);return;}
      const visibleGrid=grid.map((row,y)=>row.map((floor,x)=>floor&&data.inSight(visual,{x,y})));
      held=null;pending=eventId;route=window.BreathMaze.pathTo(visibleGrid,segment?.to||at,goal);
      if(!route.length&&at.x===goal.x&&at.y===goal.y)arrived();
      else if(!route.length)onBlocked("亮處還看不到相通的路。先沿眼前的走廊探索。");
    }
    function toLandmark(id) {
      const landmark=data.landmarks.find(item=>item.id===id);
      if(landmark){
        if(!data.inSight(visual,landmark,2.25)){onBlocked("那個地標還在黑暗裡，先走近看看。");return;}
        walkTo(landmark,id);
      }
    }
    const keydown=event=>{
      if(event.altKey||event.ctrlKey||event.metaKey||event.target.closest("input,textarea")||locked())return;
      if(keys[event.code]){event.preventDefault();held=keys[event.code];route=[];pending="";}
    };
    const keyup=event=>{if(keys[event.code]===held)held=null;};
    const release=()=>{held=null;};
    const pointerdown=event=>{
      const control=event.target.closest('[data-action="labyrinth-move"]');
      if(!control||locked()||event.button!==0)return;
      event.preventDefault();held=control.dataset.value;route=[];pending="";
    };
    const controlClick=event=>{
      const control=event.target.closest('[data-action="labyrinth-move"]');
      if(control&&event.detail===0&&!locked()){
        const [dx,dy]=moves[control.dataset.value];walkTo({x:at.x+dx,y:at.y+dy});
      }
    };
    const mapClick=event=>{
      if(event.target.closest("button")||locked())return;
      const rect=camera.getBoundingClientRect();
      walkTo({x:Math.floor((event.clientX-rect.x)/size),y:Math.floor((event.clientY-rect.y)/size)});
    };
    document.addEventListener("keydown",keydown);document.addEventListener("keyup",keyup);
    window.addEventListener("blur",release);window.addEventListener("pointerup",release);window.addEventListener("pointercancel",release);
    root.addEventListener("pointerdown",pointerdown);root.addEventListener("click",controlClick);
    viewport.addEventListener("click",mapClick);
    const loaded=()=>{rebuild();draw();};
    tiles.addEventListener("load",loaded);sprite.addEventListener("load",loaded);
    reveal();rebuild();draw();raf=requestAnimationFrame(tick);
    return {toLandmark,walkTo,stop(){
      stopped=true;cancelAnimationFrame(raf);
      document.removeEventListener("keydown",keydown);document.removeEventListener("keyup",keyup);
      window.removeEventListener("blur",release);window.removeEventListener("pointerup",release);window.removeEventListener("pointercancel",release);
      root.removeEventListener("pointerdown",pointerdown);root.removeEventListener("click",controlClick);viewport.removeEventListener("click",mapClick);
      tiles.removeEventListener("load",loaded);sprite.removeEventListener("load",loaded);
    }};
  }
  window.BreathLabyrinth={render,mount};
})();
