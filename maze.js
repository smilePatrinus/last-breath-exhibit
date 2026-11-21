(function () {
  "use strict";
  const rules = window.BreathMazeRules;
  const content = window.BreathContent;
  const order = ["A","B","C"];
  const size = 32, width = 21, height = 15;
  const spawn = {x:10,y:12};
  const doors = [{x:3,y:2},{x:10,y:2},{x:17,y:2}];
  const vectors = {up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  const keys = {ArrowUp:"up",KeyW:"up",ArrowDown:"down",KeyS:"down",ArrowLeft:"left",KeyA:"left",ArrowRight:"right",KeyD:"right"};
  const rows = {down:0,left:1,right:2,up:3};
  const tileImage = new Image();
  const spriteImage = new Image();
  tileImage.src = "./assets/maze-tiles.png";
  spriteImage.src = "./assets/detective-walk.png";

  function floorPlan(variant) {
    const grid = Array.from({length:height},() => Array(width).fill(false));
    function line(x,y,endX,endY) {
      const dx=Math.sign(endX-x),dy=Math.sign(endY-y);
      grid[y][x]=true;
      while(x!==endX || y!==endY) {x+=dx;y+=dy;grid[y][x]=true;}
    }
    for(let y=10;y<=13;y++) for(let x=8;x<=12;x++) grid[y][x]=true;
    line(10,12,10,9);
    line(10,9,6,9);line(6,9,6,5);line(6,5,3,5);line(3,5,3,2);
    line(10,9,10,2);
    line(10,9,14,9);line(14,9,14,5);line(14,5,17,5);line(17,5,17,2);
    line(6,8,2,8);line(2,8,2,11);
    line(14,7,18,7);line(18,7,18,10);
    if (variant%2) {
      line(3,5,3,7);line(3,7,6,7);
      line(14,5,14,3);line(14,3,17,3);
    } else {
      line(6,5,6,3);line(6,3,3,3);
      line(14,5,14,7);
    }
    return grid;
  }

  function pathTo(grid,start,goal) {
    const cells=[{x:Math.round(start.x),y:Math.round(start.y)}];
    const seen=new Set([cells[0].x+","+cells[0].y]);
    const parents=new Map();
    for(let index=0;index<cells.length;index++) {
      const cell=cells[index];
      if(cell.x===goal.x && cell.y===goal.y) {
        const path=[];
        let point=cell;
        while(point) {path.unshift(point);point=parents.get(point.x+","+point.y);}
        return path.slice(1);
      }
      for(const [dx,dy] of Object.values(vectors)) {
        const next={x:cell.x+dx,y:cell.y+dy},key=next.x+","+next.y;
        if(!grid[next.y]?.[next.x] || seen.has(key)) continue;
        seen.add(key);parents.set(key,cell);cells.push(next);
      }
    }
    return [];
  }

  function mount(root,state,onDoor,onPosition) {
    const viewport=root.querySelector(".maze-viewport");
    if(!viewport) return null;
    const camera=root.querySelector(".maze-camera");
    const canvas=root.querySelector("canvas");
    const ctx=canvas.getContext("2d");
    const grid=floorPlan(state.index);
    let at={...(state.position || spawn)},visual={...at};
    let route=[],segment=null,face="up",walk=1,raf=0,stopped=false,held=null,latched=false;
    const locked=Boolean(state.drawer || state.feedback || state.results[state.candidate]);
    canvas.width=width*size;canvas.height=height*size;
    ctx.imageSmoothingEnabled=false;
    function tile(index,x,y,w=size,h=size) {
      if(tileImage.complete && tileImage.naturalWidth) {
        const sw=tileImage.naturalWidth/2,sh=tileImage.naturalHeight/2;
        ctx.drawImage(tileImage,(index%2)*sw,Math.floor(index/2)*sh,sw,sh,x,y,w,h);
      } else {ctx.fillStyle=index===0?"#9e784b":"#29283e";ctx.fillRect(x,y,w,h);}
    }
    function draw(now) {
      if(stopped) return;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
        tile(grid[y][x]?0:1,x*size,y*size);
        if(!grid[y][x]) {ctx.fillStyle="#0c13224d";ctx.fillRect(x*size,y*size,size,size);}
      }
      doors.forEach((door,index) => {
        tile(2,(door.x-1)*size,(door.y-1)*size,3*size,3*size);
        ctx.fillStyle=["#9ad3c9","#efc474","#c2ace7"][index];
        ctx.fillRect(door.x*size+8,door.y*size+5,16,3);
      });
      tile(3,11*size,11*size,44,44);
      ctx.fillStyle="#2b1b215e";ctx.beginPath();ctx.ellipse((visual.x+.5)*size,(visual.y+1)*size-2,10,3,0,0,Math.PI*2);ctx.fill();
      if(spriteImage.complete && spriteImage.naturalWidth) {
        const sw=spriteImage.naturalWidth/3,sh=spriteImage.naturalHeight/4;
        ctx.drawImage(spriteImage,walk*sw,rows[face]*sh,sw,sh,(visual.x+.5)*size-25,(visual.y+1)*size-49,50,50);
      }
      ctx.fillStyle="#15312d";ctx.fillRect((visual.x+.5)*size+10,(visual.y+1)*size-42,13,15);
      ctx.fillStyle="#f9d28e";ctx.font="bold 11px monospace";ctx.textAlign="center";
      ctx.fillText(state.candidate,(visual.x+.5)*size+16,(visual.y+1)*size-30);
      const scrollX=Math.max(0,Math.min(canvas.width-viewport.clientWidth,(visual.x+.5)*size-viewport.clientWidth*.5));
      const scrollY=Math.max(0,Math.min(canvas.height-viewport.clientHeight,(visual.y+.5)*size-viewport.clientHeight*.6));
      const offsetX=viewport.clientWidth>canvas.width?(viewport.clientWidth-canvas.width)/2:-scrollX;
      camera.style.transform="translate("+offsetX+"px,"+(-scrollY)+"px)";
    }
    function arrived() {
      onPosition({...at});
      const index=doors.findIndex((door) => door.x===at.x && door.y===at.y);
      if(index>=0 && !latched && !locked && !state.returning) {
        latched=true;held=null;route=[];
        onDoor(rules.current(state).options[index].id);
      }
      if(state.returning && at.x===10 && at.y===10) state.returning=false;
    }
    function begin(next,now) {
      face=next.x!==at.x?(next.x>at.x?"right":"left"):(next.y>at.y?"down":"up");
      segment={from:{...at},to:next,start:now};
    }
    function tick(now) {
      if(stopped) return;
      if(!document.querySelector("dialog[open]") && !locked && !latched) {
        if(segment) {
          const t=Math.min(1,(now-segment.start)/95);
          visual={x:segment.from.x+(segment.to.x-segment.from.x)*t,y:segment.from.y+(segment.to.y-segment.from.y)*t};
          walk=[0,1,2,1][Math.floor(now/95)%4];
          if(t===1) {at={...segment.to};visual={...at};segment=null;arrived();}
        } else {
          if(held) {
            const [dx,dy]=vectors[held],next={x:at.x+dx,y:at.y+dy};
            if(grid[next.y]?.[next.x]) begin(next,now);
          } else if(route.length) begin(route.shift(),now);
          else walk=1;
        }
      }
      draw(now);raf=requestAnimationFrame(tick);
    }
    function walkTo(goal) {
      if(locked || latched || state.returning || !grid[goal.y]?.[goal.x]) return;
      held=null;
      route=pathTo(grid,segment?.to || at,goal);
      if(!route.length && at.x===goal.x && at.y===goal.y) arrived();
    }
    const walkDoor=(index)=>walkTo(doors[index]);
    const step=(direction)=>{
      if(!vectors[direction]) return;
      const [dx,dy]=vectors[direction];
      walkTo({x:at.x+dx,y:at.y+dy});
    };
    const keyDown=(event)=>{
      if(!keys[event.code] || event.altKey || event.ctrlKey || event.metaKey ||
          event.target.closest("input,textarea") || locked || latched || state.returning) return;
      event.preventDefault();route=[];held=keys[event.code];
    };
    const keyUp=(event)=>{if(keys[event.code]===held)held=null;};
    const blur=()=>{held=null;};
    const click=(event)=>{
      if(event.target.closest("button") || locked) return;
      const r=camera.getBoundingClientRect();
      walkTo({x:Math.floor((event.clientX-r.left)/size),y:Math.floor((event.clientY-r.top)/size)});
    };
    if(state.returning && !locked) route=pathTo(grid,at,{x:10,y:10});
    document.addEventListener("keydown",keyDown);document.addEventListener("keyup",keyUp);
    window.addEventListener("blur",blur);viewport.addEventListener("click",click);
    tileImage.addEventListener("load",draw);spriteImage.addEventListener("load",draw);
    draw(0);raf=requestAnimationFrame(tick);
    function stop() {
      stopped=true;cancelAnimationFrame(raf);
      document.removeEventListener("keydown",keyDown);document.removeEventListener("keyup",keyUp);
      window.removeEventListener("blur",blur);viewport.removeEventListener("click",click);
      tileImage.removeEventListener("load",draw);spriteImage.removeEventListener("load",draw);
    }
    return {stop,walkDoor,step};
  }


  function render(state,records,button,html) {
    const candidate=content.candidates[state.candidate];
    const gate=rules.current(state);
    const hand=rules.cards(records,state.candidate);
    const selected=hand.find((card)=>card.id===state.selected);
    const finished=Object.keys(state.results).length;
    const roster='<ol class="maze-roster">'+order.map((id)=>'<li class="'+
      (state.results[id]?"finished":id===state.candidate?"active":"")+'"><b>'+
      (state.results[id]?"✓":id)+'</b><span>'+html(content.candidates[id].name)+'</span></li>').join("")+'</ol>';
    if(finished===3 && !state.feedback) {
      return roster+'<section class="panel maze-complete"><p class="eyebrow">三條路徑已歸檔</p><h2>同一份 mNGS，三個不同出口</h2>'+
        '<div class="route-grid">'+order.map((id)=>'<article class="route-summary"><span class="candidate">'+id+
        '</span><div><h3>'+html(content.candidates[id].name)+'</h3><p>'+html(state.results[id].outcome)+'</p><ol>'+
        state.results[id].trace.map((entry)=>'<li>'+html(entry.choice)+'</li>').join("")+'</ol></div></article>').join("")+
        '</div><p>K. variicola 的物種疑問還在。帶著它進下一站，看看文獻可以補充到哪裡。</p>'+
        '<div class="actions">'+button("帶著案卷前往文獻室","review-next","",{kind:"primary"})+'</div></section>';
    }
    const modalAttrs=state.feedback?' disabled':"";
    const tools='<div class="maze-tools">'+button("判讀手冊","maze-book","",{kind:"quiet",attrs:modalAttrs})+
      button("查看案卷 · 選依據","maze-evidence","",{kind:"primary",attrs:modalAttrs})+'</div>';
    const options=gate.options.map((option,index)=>button('<b>'+["◀","◆","▶"][index]+'</b><span>'+html(option.label)+'</span>',
      "maze-door",option.id,{kind:"maze-option",attrs:state.drawer || state.feedback?' disabled':""})).join("");
    const markers=gate.options.map((option,index)=>button('<span>'+html(option.label)+'</span>',"maze-door",option.id,{
      kind:"maze-map-door door-"+index,attrs:' style="left:'+(doors[index].x+.5)*size+'px;top:'+(doors[index].y+2)*size+'px;"'+
        (state.drawer || state.feedback?' disabled':"")
    })).join("");
    const tree='<ol class="maze-path-tree">'+rules.journey(state.candidate).map((entry,index)=>'<li class="'+
      (index<state.index?"done":index===state.index?"current":"")+'"><span>'+html(entry.title)+'</span>'+
      (index<state.index?'<small>'+html(state.trace[index].choice)+'</small>':"")+'</li>').join("")+'</ol>';
    let drawer="";
    if(state.drawer==="book") {
      const manual=rules.manuals[gate.manual];
      drawer='<section class="maze-drawer" role="region" aria-label="判讀手冊"><div class="panel-top"><h2>判讀手冊</h2>'+
        button("回到迷宮","maze-close","",{kind:"quiet small"})+'</div><p class="eyebrow">這一扇門的線索</p><h3>'+
        html(manual.title)+'</h3><p>'+html(manual.body)+'</p><h3>目前候選的線索樹</h3>'+tree+
        '<p class="hint">先找規則需要的資訊，再從案卷選出對應的紀錄。每一扇門都會把這次選擇寫進路徑。</p></section>';
    }
    if(state.drawer==="evidence") {
      drawer='<section class="maze-drawer" role="region" aria-label="病例案卷"><div class="panel-top"><h2>拿哪張紀錄作依據？</h2>'+
        button("回到迷宮","maze-close","",{kind:"quiet small"})+'</div><div class="maze-evidence-grid">'+hand.map((card)=>
          button('<strong>'+html(card.title)+'</strong><em>'+html(card.subtitle)+'</em><span>'+html(card.body)+
            '</span><small>'+html(card.source)+'</small>',"maze-proof",card.id,{
              kind:"maze-evidence-card",attrs:' aria-pressed="'+(state.selected===card.id)+'"'
            })).join("")+'</div></section>';
    }
    let message="";
    if(state.feedback) {
      const feedback=state.feedback;
      const nextId=order[order.indexOf(state.candidate)+1];
      const label=feedback.ok ? (feedback.finish?(nextId?"帶 "+content.candidates[nextId].name+" 進場":"查看三個出口"):"走入下一間") :
        "回頭查線索";
      message='<section class="maze-message" role="alertdialog" aria-modal="true" aria-labelledby="maze-message-title">'+
        '<div class="maze-radio" aria-hidden="true"></div><p class="eyebrow">'+(feedback.ok?"路徑已記錄":"偵探・心想")+
        '</p><h2 id="maze-message-title">'+(feedback.ok?(feedback.finish?"到達這個候選的出口":"這扇門開了"):"還少一條能對上的線索")+
        '</h2><p>'+html(feedback.body)+'</p><div class="actions">'+button(label,"maze-continue","",{kind:"primary"})+'</div></section>';
    }
    return roster+'<section class="maze-case-header"><div><p class="eyebrow">帶著 '+html(candidate.name)+' 調查</p><h2>'+
      html(gate.title)+'</h2><p>'+html(gate.question)+'</p></div>'+tools+'</section>'+
      '<div class="maze-layout"><section class="maze-board"><div class="maze-viewport" aria-label="判讀迷宮地圖" tabindex="0">'+
      '<div class="maze-camera"><canvas aria-hidden="true"></canvas>'+markers+
      button("手冊","maze-book","",{kind:"maze-map-book",attrs:' style="left:352px;top:352px;"'})+
      '</div></div><div class="maze-under-map"><p>選一扇門前往，或用方向鍵、WASD 與點地圖移動。</p>'+
      '<div class="dpad">'+[["left","←","左"],["up","↑","上"],["down","↓","下"],["right","→","右"]].map(([id,label,name])=>
        button(label,"maze-step",id,{attrs:' aria-label="向'+name+'移動"'+(state.drawer || state.feedback?' disabled':"")})).join("")+
      '</div></div><div class="maze-options" aria-label="可前往的門">'+options+'</div>'+drawer+message+'</section>'+
      '<aside class="panel maze-clues"><p class="eyebrow">當前線索樹</p>'+tree+
      '<div class="maze-selected"><h3>手上作依據的紀錄</h3><p>'+
      (selected?html(selected.title)+'<br><em>'+html(selected.subtitle)+'</em>':"先從案卷選一張紀錄，再判斷該走哪扇門。")+
      '</p></div><p class="hint">門牌是分支，手冊是線索，案卷是作選擇的根據。</p></aside></div>';
  }

  function choose(state,option,records) {
    const outcome=rules.evaluate(state,option,records);
    state.feedback={...outcome,option,finish:outcome.ok && state.index===rules.journey(state.candidate).length-1};
    return outcome;
  }

  function next(state) {
    const feedback=state.feedback;
    if(!feedback) return;
    state.feedback=null;
    if(!feedback.ok) {state.returning=true;return;}
    const gate=rules.current(state);
    const choice=gate.options.find((entry)=>entry.id===feedback.option);
    state.trace.push({gate:gate.id,title:gate.title,choice:choice.label,evidence:state.selected,reason:gate.result,rule:rules.manuals[gate.manual].rule});
    state.selected="";state.position=null;
    if(feedback.finish) {
      const outcomes={A:"優先保留 · 同菌種下呼吸道支持",B:"暫不列入 · 留存呼吸道脈絡",C:"待複核 · 保留群組與物種差距"};
      state.results[state.candidate]={outcome:outcomes[state.candidate],trace:state.trace.map((entry)=>({...entry}))};
      const nextId=order[order.indexOf(state.candidate)+1];
      if(nextId) {state.candidate=nextId;state.index=0;state.trace=[];}
    } else state.index+=1;
  }

  window.BreathMaze={render,mount,choose,next,floorPlan,pathTo};
})();
