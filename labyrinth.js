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
    const grid=data.floorPlan({found:{specimen:true,missing:true}});
    const cells=[];
    grid.forEach((row,y)=>row.forEach((floor,x)=>{
      if(floor)cells.push('<rect x="'+x+'" y="'+y+'" width="1" height="1"/>');
    }));
    return '<svg viewBox="0 0 '+data.width+' '+data.height+'" role="img" aria-label="迷宮全圖，金點是你的位置">'+
      '<g class="labyrinth-mini-floor">'+cells.join("")+'</g>'+
      data.landmarks.map(item=>'<circle cx="'+(item.x+.5)+'" cy="'+(item.y+.5)+'" r=".6" class="'+
        (state.seen.includes(item.id)?"read":item.type==="exit"?"exit":"landmark")+'"/>').join("")+
      '<circle class="labyrinth-mini-player" cx="'+(state.position.x+.5)+'" cy="'+(state.position.y+.5)+'" r=".7"/></svg>';
  }
  function render(state,button,html) {
    if(state.complete && !state.dialog) return '<section class="panel labyrinth-finish"><p class="eyebrow">白色念珠菌 · 本輪探索完成</p>'+
      '<h2>找到了出口，也留下了證據的界線。</h2><ol>'+state.trace.map(item=>'<li><strong>'+html(item.title)+
      '</strong><p>'+html(item.choice)+'</p></li>').join("")+'</ol><p>這次實際走過的是念珠菌路線。其他兩個候選仍保留在原始案卷，接著去文獻室追查 K. variicola 的疑問。</p>'+
      '<div class="actions">'+button("前往文獻室","review-next","",{kind:"primary"})+
      button("再走一次","labyrinth-replay")+'</div><p class="hint"><a href="?v=12&demo=maze&maze=rules">對照原本的規則迷宮</a></p></section>';
    const journal='<section class="panel labyrinth-journal"><p class="eyebrow">一路找到的線索</p>'+
      '<div class="labyrinth-fact known"><b>mNGS</b><p>白色念珠菌讀數最高</p><small>檢出訊號，還需其他支持。</small></div>'+
      '<div class="labyrinth-fact '+(state.found.specimen?"known":"")+'"><b>培養從哪裡來？</b><p>'+
      (state.found.specimen?"L01 · 另一份痰液":"還沒找到原始紀錄")+'</p>'+
      (state.found.specimen?button("重讀來源","labyrinth-read","specimen",{kind:"quiet small"}):"")+'</div>'+
      '<div class="labyrinth-fact '+(state.found.missing?"known":"")+'"><b>侵襲性證據</b><p>'+
      (state.found.missing?"未提供 · 保持未知":"還沒核對資料範圍")+'</p>'+
      (state.found.missing?button("重讀範圍","labyrinth-read","missing",{kind:"quiet small"}):"")+'</div></section>';
    let dialog="";
    if(state.dialog) {
      const clue=state.dialog;
      dialog='<section class="labyrinth-message '+html(clue.kind||"")+
        '" role="alertdialog" aria-modal="true" aria-labelledby="labyrinth-message-title"><div class="labyrinth-face" aria-hidden="true"></div>'+
        '<p class="eyebrow">'+html(clue.voice)+'</p><h2 id="labyrinth-message-title">'+html(clue.title)+'</h2><p>'+html(clue.copy)+
        '</p><div class="labyrinth-paper">'+html(clue.fact)+'</div>'+
        (clue.source?'<small class="labyrinth-source">'+html(clue.source)+'</small>':"")+
        (clue.reward?'<p class="labyrinth-reward">'+html(clue.reward)+'</p>':"")+
        '<div class="actions">'+button(state.complete?"收起探索紀錄":"繼續探索","labyrinth-close","",{kind:"primary"})+'</div></section>';
    }
    const landmarks=data.landmarks.map(item=>button(html(item.label),"labyrinth-landmark",item.id,{
      kind:"labyrinth-sign "+item.type+(state.seen.includes(item.id)?" seen":""),
      attrs:' style="left:'+(item.x+.5)*size+'px;top:'+(item.y*size-15)+'px;" aria-label="走向'+html(item.label)+'"'+(state.dialog?' disabled':"")
    })).join("");
    return '<section class="labyrinth-mission"><div><p class="eyebrow">本次探路 · 白色念珠菌</p><h2>沿證據，找到能走的出口。</h2><p>'+
      html(data.task(state))+'</p></div><span class="labyrinth-companion">同行候選<br><b>Candida albicans</b></span></section>'+
      '<div class="labyrinth-layout"><section class="labyrinth-board"><div class="labyrinth-viewport" tabindex="0" aria-label="自由探索迷宮，方向鍵或 WASD 移動">'+
      '<div class="labyrinth-camera"><canvas aria-hidden="true"></canvas>'+landmarks+'</div></div>'+
      '<div class="labyrinth-controls"><p>走近牌子，自動查看線索。<br><small>方向鍵／WASD、點石板路，或按住方向按鈕。</small></p>'+
      '<div class="dpad">'+[["left","←","左"],["up","↑","上"],["down","↓","下"],["right","→","右"]].map(([id,label,name])=>
        button(label,"labyrinth-move",id,{attrs:' aria-label="向'+name+'移動"'+(state.dialog?' disabled':"")})).join("")+
      '</div></div>'+dialog+'</section><aside class="labyrinth-aside">'+journal+
      '<details class="panel labyrinth-minimap" open><summary>看一下迷宮全圖</summary>'+minimap(state)+
      '<p>金點是你；亮點是紀錄與出口。</p></details></aside></div>';
  }

  function mount(root,state,onVisit,onBlocked) {
    const viewport=root.querySelector(".labyrinth-viewport");
    if(!viewport)return null;
    const camera=root.querySelector(".labyrinth-camera"),canvas=root.querySelector("canvas");
    canvas.width=data.width*size;canvas.height=data.height*size;
    const ctx=canvas.getContext("2d"),grid=data.floorPlan(state);
    const base=document.createElement("canvas");
    base.width=canvas.width;base.height=canvas.height;
    const terrain=base.getContext("2d");
    let at={...state.position},visual={...at},route=[],segment=null,held=null,face="up",walk=1;
    let raf=0,stopped=false,pending="",lastBlock=0;
    const visited=new Set(state.visited);
    const locked=()=>Boolean(state.dialog || state.complete || document.querySelector("dialog[open]"));
    function tile(context,index,x,y,w=size,h=size) {
      if(tiles.complete&&tiles.naturalWidth) {
        const sw=tiles.naturalWidth/2,sh=tiles.naturalHeight/2;
        context.drawImage(tiles,(index%2)*sw,Math.floor(index/2)*sh,sw,sh,x,y,w,h);
      } else {context.fillStyle=index===0?"#9d7b51":"#25263b";context.fillRect(x,y,w,h);}
    }
    function rebuild() {
      terrain.imageSmoothingEnabled=false;
      for(let y=0;y<data.height;y++)for(let x=0;x<data.width;x++) {
        tile(terrain,grid[y][x]?0:1,x*size,y*size);
        if(!grid[y][x]){terrain.fillStyle="#101b2d5c";terrain.fillRect(x*size,y*size,size,size);}
        else if(x>14){terrain.fillStyle="#82ccb51a";terrain.fillRect(x*size,y*size,size,size);}
      }
      for(const gate of data.gates)if(!state.found[gate.id])tile(terrain,2,(gate.x-.5)*size,(gate.y-1)*size,2*size,2*size);
    }
    function draw(now=0) {
      if(stopped)return;
      ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(base,0,0);
      ctx.fillStyle="#ffe8a522";
      for(const key of visited){const [x,y]=key.split(",").map(Number);ctx.fillRect(x*size+7,y*size+7,18,18);}
      for(const item of data.landmarks){
        const read=state.seen.includes(item.id),x=(item.x+.5)*size,y=(item.y+.5)*size;
        if(item.type==="record")tile(ctx,3,x-17,y-17,34,34);
        else if(item.type==="blocked")tile(ctx,2,x-19,y-28,38,45);
        else {ctx.fillStyle="#b2e3b7";ctx.fillRect(x-12,y-13,24,27);ctx.fillStyle="#255343";ctx.fillRect(x-7,y-10,14,24);}
        ctx.globalAlpha=read?.3:.65+Math.sin(now/240)*.15;
        ctx.strokeStyle=item.type==="exit"?"#c5ffd8":"#fff0a7";ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(x,y,20,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
      }
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
      const sx=Math.max(0,Math.min(canvas.width-viewport.clientWidth,px-viewport.clientWidth*.48));
      const sy=Math.max(0,Math.min(canvas.height-viewport.clientHeight,py-viewport.clientHeight*.56));
      camera.style.transform="translate("+(-sx)+"px,"+(-sy)+"px)";
      const mini=root.querySelector(".labyrinth-mini-player");
      if(mini){mini.setAttribute("cx",visual.x+.5);mini.setAttribute("cy",visual.y+.5);}
    }
    function blocked(goal) {
      const gate=data.gates.find(item=>item.x===goal.x&&item.y===goal.y&&!state.found[item.id]);
      if(gate&&performance.now()-lastBlock>1000){lastBlock=performance.now();onBlocked(gate.message);}
    }
    function arrived() {
      state.position={...at};
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
      if(!grid[goal.y]?.[goal.x]){blocked(goal);return;}
      held=null;pending=eventId;route=window.BreathMaze.pathTo(grid,segment?.to||at,goal);
      if(!route.length&&at.x===goal.x&&at.y===goal.y)arrived();
      else if(!route.length)onBlocked("這邊還走不通。看看沿途的紀錄與門牌。");
    }
    function toLandmark(id) {
      const landmark=data.landmarks.find(item=>item.id===id);
      if(landmark)walkTo(landmark,id);
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
    rebuild();draw();raf=requestAnimationFrame(tick);
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
