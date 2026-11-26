(function () {
  "use strict";
  const directions=[[1,0],[-1,0],[0,1],[0,-1]], key=p=>p.x+","+p.y;
  const profiles={
    easy:{warmup:9000,steps:12,interval:30000,speed:245,warning:2400,vision:5,lost:5200,duration:16000,hide:3600,grace:20000,maxClosets:8},
    normal:{warmup:7000,steps:10,interval:24000,speed:175,warning:1800,vision:7,lost:6500,duration:20000,hide:5200,grace:14000,maxClosets:12},
    hard:{warmup:5500,steps:12,interval:16000,speed:142,warning:1400,vision:9,lost:8000,duration:26000,hide:6500,grace:11000,maxClosets:34}
  };
  const overlay=p=>Boolean(p&&["intro","hidden","safe","caught"].includes(p.phase));
  const active=p=>Boolean(p&&["warning","chasing"].includes(p.phase));
  function distances(grid,start) {
    const map=new Map(),queue=[];
    if(!grid[start.y]?.[start.x])return map;
    map.set(key(start),0);queue.push(start);
    for(let n=0;n<queue.length;n++){
      const at=queue[n],distance=map.get(key(at));
      for(const [dx,dy] of directions){const next={x:at.x+dx,y:at.y+dy},id=key(next);
        if(grid[next.y]?.[next.x]&&!map.has(id)){map.set(id,distance+1);queue.push(next);}}
    }
    return map;
  }
  function sight(grid,from,to,radius=Infinity) {
    if(!from||Math.hypot(to.x-from.x,to.y-from.y)>radius)return false;
    let x=Math.round(from.x),y=Math.round(from.y),tx=Math.round(to.x),ty=Math.round(to.y);
    const dx=Math.abs(tx-x),dy=-Math.abs(ty-y),sx=x<tx?1:-1,sy=y<ty?1:-1;
    let error=dx+dy;
    while(true){
      if(!grid[y]?.[x])return false;
      if(x===tx&&y===ty)return true;
      const priorX=x,priorY=y;
      const twice=2*error;
      if(twice>=dy){error+=dy;x+=sx;}
      if(twice<=dx){error+=dx;y+=sy;}
      if(x!==priorX&&y!==priorY&&(!grid[priorY]?.[x]||!grid[y]?.[priorX]))return false;
    }
  }
  function closetsFor(data,profile) {
    const grid=data.floorPlan({found:Object.fromEntries(data.gates.map(g=>[g.id,true]))});
    const forbidden=new Set([...data.landmarks,...data.gates,data.spawn].map(key));
    const candidates=[];
    grid.forEach((row,y)=>row.forEach((floor,x)=>{
      if(floor&&!forbidden.has(x+","+y)&&directions.some(([dx,dy])=>!grid[y+dy]?.[x+dx]))candidates.push({x,y});
    }));
    const chosen=[],nearest=new Map();
    function add(point){
      if(!point||chosen.some(p=>key(p)===key(point)))return;
      chosen.push(point);
      for(const [id,distance] of distances(grid,point))nearest.set(id,Math.min(nearest.get(id)??Infinity,distance));
    }
    const fromSpawn=distances(grid,data.spawn);
    add(candidates.filter(p=>(fromSpawn.get(key(p))??Infinity)<=4).sort((a,b)=>Math.abs((fromSpawn.get(key(a))||0)-3)-Math.abs((fromSpawn.get(key(b))||0)-3))[0]);
    for(const landmark of data.landmarks.filter(l=>["key","record"].includes(l.type))){
      const near=distances(grid,landmark);
      add(candidates.filter(p=>!chosen.some(c=>key(c)===key(p))&&(near.get(key(p))??Infinity)>=2&&(near.get(key(p))??Infinity)<=5)
        .sort((a,b)=>Math.abs(near.get(key(a))-3)-Math.abs(near.get(key(b))-3))[0]);
    }
    while(chosen.length<profile.maxClosets){
      const far=candidates.filter(p=>!chosen.some(c=>key(c)===key(p))).sort((a,b)=>(nearest.get(key(b))||0)-(nearest.get(key(a))||0))[0];
      if(!far||(nearest.get(key(far))||0)<9)break;
      add(far);
    }
    return chosen.map((p,n)=>({...p,id:"closet"+(n+1)}));
  }
  function create(mode,data) {
    if(!profiles[mode])return null;
    return {mode,phase:"intro",closets:closetsFor(data,profiles[mode]),checkpoint:{...data.spawn},
      travelled:0,stepsSince:0,wait:profiles[mode].warmup,enemy:null,travel:null,lastSeen:null,lost:0,
      chaseTime:0,warningLeft:0,hideTime:0,closet:null,exposed:false,catches:0,escapes:0,encounters:0,
      trail:[{...data.spawn}],cooldown:false,reason:"",shield:0};
  }
  function ensure(state) {
    const mode=window.BreathModes?.id()||state.difficulty||"normal";
    if(mode==="quick")return null;
    if(!state.pursuit)state.pursuit=create(mode,window.BreathLabyrinthData);
    return state.pursuit;
  }
  function start(p){if(p?.phase!=="intro")return false;p.phase="idle";return true;}
  function moved(p,position){
    if(!p||overlay(p))return;
    p.travelled++;p.stepsSince++;p.trail.push({...position});if(p.trail.length>180)p.trail.shift();
  }
  function checkpoint(state){if(state.pursuit)state.pursuit.checkpoint={...state.position};}
  function nearest(p,position,grid){
    if(!p)return null;
    const found=p.closets.filter(c=>Math.abs(c.x-position.x)+Math.abs(c.y-position.y)<=1&&grid[c.y]?.[c.x]);
    return found.sort((a,b)=>Math.abs(a.x-position.x)+Math.abs(a.y-position.y)-Math.abs(b.x-position.x)-Math.abs(b.y-position.y))[0]||null;
  }
  function spawn(p,grid,player){
    const reachable=distances(grid,player),trail=new Set(p.trail.map(key));
    const options=[...reachable].filter(([,distance])=>distance>=9&&distance<=18)
      .map(([id,distance])=>{const [x,y]=id.split(",").map(Number);return {x,y,distance,id};})
      .sort((a,b)=>(trail.has(a.id)?0:10)+Math.abs(a.distance-13)-(trail.has(b.id)?0:10)-Math.abs(b.distance-13));
    const spot=options[0];if(!spot)return false;
    p.enemy={x:spot.x,y:spot.y};p.origin={...p.enemy};p.travel=null;p.lastSeen={...player};
    p.phase="warning";p.warningLeft=profiles[p.mode].warning;p.chaseTime=0;p.lost=0;p.encounters++;p.shield=0;
    return true;
  }
  function enemyVisual(p){
    if(!p?.enemy)return null;
    if(!p.travel)return p.enemy;
    const t=Math.min(1,p.travel.elapsed/profiles[p.mode].speed);
    return {x:p.enemy.x+(p.travel.to.x-p.enemy.x)*t,y:p.enemy.y+(p.travel.to.y-p.enemy.y)*t};
  }
  function moveEnemy(p,dt,grid,target){
    if(!p.enemy||!target)return;
    if(p.travel){
      p.travel.elapsed+=dt;
      if(p.travel.elapsed>=profiles[p.mode].speed){p.enemy={...p.travel.to};p.travel=null;}
    }
    if(!p.travel){
      const next=window.BreathMaze.pathTo(grid,p.enemy,target)[0];
      if(next)p.travel={to:next,elapsed:0};
    }
  }
  function calm(p){
    p.phase="idle";p.enemy=null;p.travel=null;p.stepsSince=0;p.wait=profiles[p.mode].interval;
    p.cooldown=true;p.escapes++;p.lost=0;
  }
  function caught(p,reason){p.phase="caught";p.travel=null;p.reason=reason;p.catches++;}
  function hide(p,id,player,grid){
    if(!p||!["idle","warning","chasing"].includes(p.phase))return false;
    const closet=nearest(p,player,grid);
    if(!closet||closet.id!==id)return false;
    p.exposed=p.mode!=="easy"&&p.phase==="chasing"&&sight(grid,enemyVisual(p),player,profiles[p.mode].vision);
    const paths=distances(grid,closet);
    const far=[...paths].sort((a,b)=>b[1]-a[1])[0]?.[0];
    const [rx,ry]=(far||key(closet)).split(",").map(Number);
    p.retreat=p.origin&&(paths.get(key(p.origin))||0)>=6?{...p.origin}:{x:rx,y:ry};
    p.retreatSteps=paths.get(key(p.retreat))||0;
    p.hiddenFrom=p.phase;p.closet=closet;p.hideTime=0;p.phase="hidden";return true;
  }
  function leave(p){
    if(!p||!["hidden","safe"].includes(p.phase))return false;
    if(p.phase==="safe"||!p.enemy){
      p.phase="idle";p.enemy=null;p.travel=null;p.stepsSince=0;p.wait=profiles[p.mode].interval;
      p.checkpoint={x:p.closet.x,y:p.closet.y};p.cooldown=true;
    }else{p.phase="chasing";p.lastSeen={x:p.closet.x,y:p.closet.y};p.lost=0;p.shield=p.mode==="easy"?900:180;}
    p.closet=null;return true;
  }
  function retry(state){
    const p=state.pursuit;if(p?.phase!=="caught")return false;
    state.position={...p.checkpoint};p.phase="idle";p.enemy=null;p.travel=null;p.closet=null;
    p.wait=profiles[p.mode].grace;p.stepsSince=0;p.cooldown=true;p.shield=0;return true;
  }
  function advance(p,dt,grid,player,visual=player,paused=false){
    if(!p||paused||["intro","caught","safe"].includes(p.phase))return false;
    const before=p.phase,cfg=profiles[p.mode];dt=Math.max(0,Math.min(80,dt));
    if(p.phase==="idle"){
      p.wait=Math.max(0,p.wait-dt);
      if(!p.wait&&p.stepsSince>=cfg.steps&&!spawn(p,grid,player))p.wait=3000;
    }else if(p.phase==="warning"){
      p.warningLeft-=dt;if(p.warningLeft<=0)p.phase="chasing";
    }else if(p.phase==="chasing"){
      p.shield=Math.max(0,p.shield-dt);p.chaseTime+=dt;
      const visible=sight(grid,enemyVisual(p),player,cfg.vision);
      if(visible){p.lastSeen={...player};p.lost=0;}else p.lost+=dt;
      moveEnemy(p,dt,grid,p.lastSeen);
      const at=enemyVisual(p),distance=Math.hypot(at.x-visual.x,at.y-visual.y);
      if(!p.shield&&distance<.68)caught(p,"守衛追上了你。下次先記住轉角和躲藏櫃的位置。");
      else if((p.lost>=cfg.lost&&distance>=4)||(p.chaseTime>=cfg.duration&&!visible&&distance>=3))calm(p);
    }else if(p.phase==="hidden"){
      p.hideTime+=dt;
      if(p.exposed&&p.hideTime>=1250)caught(p,"牠看見你躲進來了！先用轉角或牆壁擋住視線，再進櫃子。");
      else if(!p.enemy&&p.hideTime>=650){p.phase="safe";}
      else if(p.enemy){
        const retreat=p.hideTime>=cfg.hide*.55;
        moveEnemy(p,dt,grid,retreat?p.retreat:{x:p.closet.x,y:p.closet.y});
        const at=enemyVisual(p),distance=Math.hypot(at.x-p.closet.x,at.y-p.closet.y);
        const aroundCorner=!p.travel&&p.enemy.x===p.retreat.x&&p.enemy.y===p.retreat.y&&p.retreatSteps>=4&&!sight(grid,at,p.closet);
        if(p.hideTime>=cfg.hide&&(distance>=4||aroundCorner)){p.phase="safe";p.enemy=null;p.travel=null;p.escapes++;}
      }
    }
    return before!==p.phase;
  }
  function creatureSvg(){
    return '<svg viewBox="0 0 64 72" class="macrophage-art" aria-hidden="true" shape-rendering="crispEdges">'+
      '<path fill="#142b32" d="M18 0h27v6h9v9h6v12h4v24h-6v12h-9v6H15v-6H6V51H0V27h5V15h7V6h6z"/>'+
      '<path fill="#749a75" d="M20 5h22v7h9v12h7v24h-7v12H42v7H20v-7H11V48H6V27h7V15h7z"/>'+
      '<path fill="#acc28b" d="M20 7h21v7H22v9H14v20H8V28h6V16h6z"/>'+
      '<path fill="#527a70" d="M49 24h8v23h-8v12H39v7H20v-7h21V47h8z"/>'+
      '<path fill="#746286" d="M24 34h16v6h7v16h-7v6H25v-5h-8V41h7z"/>'+
      '<path fill="#4c4764" d="M29 39h10v7h5v8H31v5h-7v-8h5z"/>'+
      '<path fill="#dbe7ae" d="M17 23h12v9H17zm20 0h12v9H37z"/>'+
      '<path fill="#1a3434" d="M23 24h6v8h-6zm14 0h6v8h-6zM16 19h14v4H16zm21 0h14v4H37z"/>'+
      '<path fill="#e2c78c" d="M13 46h8v5h-8zM47 36h6v6h-6z"/></svg>';
  }
  function modal(p,button){
    if(!overlay(p))return "";
    if(p.phase==="intro")return '<section class="pursuit-modal pursuit-intro" role="dialog" aria-modal="true" aria-labelledby="pursuit-title">'+
      '<div class="intro-cell">'+creatureSvg()+'</div><p class="eyebrow">肺城・巡邏守衛</p><h2 id="pursuit-title" tabindex="-1">聽到腳步，先找退路。</h2>'+
      '<p>巨噬細胞守衛把你當成外來者了。'+(p.mode==="easy"?'簡單模式：牠走得比較慢，也較容易躲過。':'先利用轉角擋住視線；被看見躲進櫃子，仍會被抓到。')+'</p>'+
      '<ol class="pursuit-lesson"><li><b>找櫃子</b><span>青色櫃子可躲藏，靠近後按 E 或「躲進櫃子」。</span></li><li><b>從櫃縫觀察</b><span>進櫃後切第一人稱，等腳步遠去再離開。</span></li><li><b>線索會保留</b><span>被抓到回安全點，鑰匙、開門與證據進度保留。</span></li></ol>'+
      '<div class="actions">'+button("記住了，開始探路","pursuit-start","",{kind:"primary"})+'</div></section>';
    if(p.phase==="caught")return '<section class="pursuit-modal pursuit-caught" role="dialog" aria-modal="true" aria-labelledby="pursuit-title">'+
      '<div class="caught-cell">'+creatureSvg()+'</div><p class="eyebrow">被巡邏守衛發現了</p><h2 id="pursuit-title" tabindex="-1">這次沒躲過。</h2><p>'+p.reason+'</p>'+
      '<p class="pursuit-retain">鑰匙、已開的大門與原始證據都還在。</p><div class="actions">'+button("回安全點，再試一次","pursuit-retry","",{kind:"primary"})+'</div></section>';
    const safe=p.phase==="safe";
    return '<section class="pursuit-modal closet-view'+(safe?' is-safe':'')+'" role="dialog" aria-modal="true" aria-labelledby="pursuit-title">'+
      '<div class="closet-world" aria-hidden="true"><div class="closet-floor"></div><div class="closet-shadow">'+creatureSvg()+'</div></div>'+
      '<div class="closet-door closet-left" aria-hidden="true"></div><div class="closet-door closet-right" aria-hidden="true"></div><div class="closet-vignette" aria-hidden="true"></div>'+
      '<header class="closet-caption"><p class="eyebrow">第一人稱・躲藏櫃內</p><h2 id="pursuit-title" tabindex="-1">'+(safe?'腳步聲遠去了。':'先別動……')+'</h2><p class="closet-observation" role="status" aria-live="polite">'+(safe?'櫃外已安靜，可以離開。':'透過櫃縫，留意守衛的影子與腳步。')+'</p></header>'+
      '<div class="closet-hands" aria-hidden="true"><i></i><i></i></div><footer class="closet-exit"><p>'+(safe?'現在出去，繼續調查。':'守衛尚未離開。提早出去可能再被追上。')+'</p>'+
      button(safe?'打開櫃門，回到迷宮':'現在離開（牠可能還在）',"pursuit-leave","",{kind:safe?"primary":"quiet"})+'</footer></section>';
  }
  function hud(p,button){
    if(!p)return "";
    return '<div class="pursuit-hud" data-pursuit-phase="'+p.phase+'"><p class="pursuit-status" role="status" aria-live="polite">留意青色躲藏櫃；靠近可按 E 躲藏。</p><span class="pursuit-distance"></span></div>'+
      button("躲進櫃子 · E","pursuit-hide","",{kind:"pursuit-hide",attrs:' hidden'});
  }
  function minimap(p,explored){
    if(!p)return "";const known=new Set(explored||[]);
    return p.closets.map(c=>'<rect data-closet-mini="'+c.id+'" class="closet-mini'+(known.has(key(c))?'':' undiscovered')+'" x="'+(c.x+.1)+'" y="'+(c.y+.1)+'" width=".8" height=".8"/>').join("");
  }
  function draw(ctx,p,size,now,player){
    if(!p)return;
    for(const c of p.closets){
      const x=c.x*size,y=c.y*size;
      ctx.fillStyle="#0c3436";ctx.fillRect(x+5,y-8,22,38);ctx.fillStyle="#76b5a5";ctx.fillRect(x+7,y-6,18,33);
      ctx.fillStyle="#214b48";ctx.fillRect(x+10,y-3,12,27);ctx.fillStyle="#beceaa";ctx.fillRect(x+11,y+1,10,2);ctx.fillRect(x+11,y+6,10,2);
      ctx.fillStyle="#e3cf8f";ctx.fillRect(x+19,y+15,3,4);
      if(Math.abs(c.x-player.x)+Math.abs(c.y-player.y)<=1){ctx.strokeStyle="#bce8c4";ctx.lineWidth=2;ctx.strokeRect(x+3,y-10,26,42);}
    }
    const at=enemyVisual(p);if(!at||!["warning","chasing"].includes(p.phase))return;
    const px=(at.x+.5)*size,py=(at.y+1)*size,bob=Math.sin(now/90)*2;
    ctx.save();ctx.translate(px-27,py-55+bob);ctx.scale(.85,.85);
    ctx.fillStyle="#122c33";ctx.fillRect(12,0,39,12);ctx.fillRect(5,12,53,45);ctx.fillRect(12,57,39,9);
    ctx.fillStyle="#83a87e";ctx.fillRect(16,5,30,8);ctx.fillRect(10,13,46,35);ctx.fillRect(17,47,30,15);
    ctx.fillStyle="#bbce91";ctx.fillRect(14,16,8,25);ctx.fillRect(22,8,21,8);
    ctx.fillStyle="#726586";ctx.fillRect(23,36,21,23);ctx.fillRect(17,42,31,10);
    ctx.fillStyle="#e0e9b4";ctx.fillRect(20,23,11,9);ctx.fillRect(38,23,11,9);
    ctx.fillStyle="#183935";ctx.fillRect(25,23,6,9);ctx.fillRect(38,23,6,9);ctx.fillRect(18,19,15,4);ctx.fillRect(37,19,15,4);
    ctx.restore();
  }
  function paint(root,p,player,grid){
    if(!p)return;
    const hudNode=root.querySelector('.pursuit-hud'),near=nearest(p,player,grid);
    if(hudNode){
      hudNode.dataset.pursuitPhase=p.phase;
      const message=p.phase==="warning"?'牆後有腳步聲……先找轉角或躲藏櫃！':p.phase==="chasing"?'守衛正在追你！先甩開視線，再躲進櫃子。':p.cooldown?'腳步聲遠了，繼續找線索。':'留意青色躲藏櫃；靠近可按 E 躲藏。';
      const statusNode=hudNode.querySelector('.pursuit-status');if(statusNode.textContent!==message)statusNode.textContent=message;
      const at=enemyVisual(p),distance=at?Math.hypot(at.x-player.x,at.y-player.y):Infinity;
      hudNode.querySelector('.pursuit-distance').textContent=active(p)?distance<4?'腳步很近':distance<8?'腳步靠近':'遠處有聲音':'';
    }
    const control=root.querySelector('.pursuit-hide');
    if(control){control.hidden=!near||overlay(p)||Boolean(root.querySelector('.labyrinth-message'));control.dataset.value=near?.id||'';}
    const view=root.querySelector('.closet-view');
    if(view&&p.phase==="hidden"){
      const at=enemyVisual(p),distance=at?Math.hypot(at.x-p.closet.x,at.y-p.closet.y):Infinity;
      view.style.setProperty('--cell-visible',distance<=3&&sight(grid,at,p.closet,3)?'1':'0');
      view.style.setProperty('--cell-x',(50+Math.sin(p.hideTime/800)*15)+'%');
      const copy=p.exposed?'牠好像看見你躲進來了……':distance<2?'影子停在櫃外。先別開門。':p.hideTime<profiles[p.mode].hide*.55?'腳步正在靠近……':'腳步正在遠去，等安靜再走。';
      const node=view.querySelector('.closet-observation');if(node.textContent!==copy)node.textContent=copy;
    }
  }
  window.BreathPursuit={profiles,create,ensure,overlay,active,distances,sight,start,moved,checkpoint,nearest,spawn,enemyVisual,hide,leave,retry,advance,modal,hud,minimap,draw,paint,creatureSvg};
})();
