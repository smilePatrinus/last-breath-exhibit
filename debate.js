(function () {
  "use strict";
  const data=window.BreathDebateData;
  function reducedMotion(state) {
    return state.motion === "reduced";
  }
  function render(state,button,html) {
    if(state.phase==="complete") return '<section class="panel debate-complete"><p class="eyebrow">議論結束 · 四段推論已核對</p>'+
      '<h2>讓證據能說到的地方，成為報告的界線。</h2><ol>'+state.results.map(item=>'<li><strong>'+
      html(item.title)+'</strong><p>'+html(item.correction)+'</p></li>').join("")+'</ol><div class="actions">'+
      button("組成調查報告","debate-report","",{kind:"primary"})+'</div></section>';
    const round=data.current(state),selected=state.cards.find(item=>item.id===state.selected);
    const ammo=round.ammo.map(id=>state.cards.find(item=>item.id===id)).filter(Boolean);
    const ready=state.phase==="ready";
    const mode=round.mode==="agree"?"同意":"反駁";
    let overlay="";
    if(ready) overlay='<section class="debate-ready"><p class="eyebrow">第 '+(state.index+1)+' 段 · '+mode+
      '</p><h2>'+html(round.title)+'</h2><p>'+html(round.mission)+'</p><p class="hint">'+
      (selected?'已裝填「'+html(selected.short)+'」。議論開始後仍能切換。':"先從下方選一枚言彈。點「查看證據」可讀原始資料。")+
      '</p>'+button("開始議論","debate-start","",{kind:"primary",attrs:selected?"":" disabled"})+'</section>';
    if(state.drawer && selected) overlay='<section class="debate-drawer" role="region" aria-label="言彈原始資料">'+
      '<div class="panel-top"><h2>'+html(selected.title)+'</h2>'+button("回到議論","debate-close","",{kind:"quiet small"})+
      '</div><p class="eyebrow">'+html(selected.label)+'</p><h3>'+html(selected.subtitle)+'</h3><p class="debate-source-body">'+
      html(selected.body)+'</p><p class="hint">'+html(selected.source)+'</p><p class="reference">裝填的言彈會用這份紀錄對照發言。</p></section>';
    if(state.feedback) {
      const feedback=state.feedback,card=state.cards.find(item=>item.id===feedback.evidence);
      overlay='<section class="debate-feedback '+(feedback.ok?"success "+round.mode:"retry")+
        '" role="alertdialog" aria-modal="true" aria-labelledby="debate-feedback-title">'+
        '<div class="debate-cut-in" aria-hidden="true"></div><p class="eyebrow">'+(feedback.ok?"偵探 · 提出證據":"偵探 · 心想")+
        '</p><h2 id="debate-feedback-title">'+html(feedback.title)+'</h2><p>'+html(feedback.body)+'</p>'+
        (feedback.ok?'<div class="debate-hit-pair"><span>言彈 · '+html(card.title)+'</span><span>命中 · '+html(feedback.target)+
          '</span></div><blockquote>'+html(feedback.correction)+'</blockquote><p class="debate-doctor"><b>醫師</b>「'+
          html(feedback.doctor)+'」</p>':"")+
        '<div class="actions">'+button(feedback.ok?(state.index===state.rounds.length-1?"收起議論紀錄":"接續下一段議論"):"再聽一次",
          "debate-next","",{kind:"primary"})+'</div></section>';
    }
    return '<section class="debate-mission"><div><p class="eyebrow">言彈議論 · '+(state.index+1)+' / '+state.rounds.length+
      '</p><h2>'+html(round.title)+'</h2><p>'+html(round.mission)+'</p></div><span class="debate-mode '+round.mode+'">'+
      (round.mode==="agree"?"藍色 · 提出支持":"黃色 · 指出矛盾")+'</span></section>'+
      '<section class="debate-board '+round.mode+' motion-'+(reducedMotion(state)?"reduced":"full")+'" aria-label="言彈議論">'+
      '<div class="debate-arena'+(ready?' is-ready':'')+'" tabindex="0" aria-label="議論舞台，Q E 切換言彈，空白鍵集中，Enter 對目前標記發射">'+
        '<div class="debate-ring" aria-hidden="true"></div><div class="debate-detective" aria-hidden="true"></div>'+
        '<div class="debate-projection" aria-hidden="true"><i></i><i></i><i></i></div>'+
        '<div class="debate-speed-lines" aria-hidden="true"></div><div class="debate-echo" aria-hidden="true"></div>'+
        '<div class="debate-speaker"><span class="debate-voice">案卷回聲</span><div class="debate-flow-tools"><span class="debate-flow-label">自動議論 · 可重聽</span>'+
        button(reducedMotion(state)?"動態：低":"動態：強","debate-motion","",{kind:"debate-motion",attrs:' aria-label="切換強動態與低動態"'})+'</div></div>'+
        '<div class="debate-utterance" aria-live="polite" aria-atomic="true"></div>'+
        '<p class="debate-aim-hint">裝填證據，瞄準'+(round.mode==="agree"?"藍色":"黃色")+'片語</p>'+
        '<div class="debate-crosshair" aria-hidden="true"></div>'+
        '<div class="debate-projectile" aria-hidden="true"></div>'+
        '<div class="debate-shots" aria-hidden="true"><span></span><span></span></div>'+
        '<p class="debate-pause-label" hidden>議論已暫停 · 仍可對片語提出證據</p>'+overlay+'</div>'+
      '<div class="debate-console"><div class="debate-ammo" aria-label="可裝填的言彈">'+ammo.map(card=>
        button('<span>'+html(card.short)+'</span><small>'+html(card.label)+'</small>',"debate-ammo",card.id,{
          kind:"debate-bullet"+(state.selected===card.id?" loaded":""),
          attrs:' aria-pressed="'+(state.selected===card.id)+'"'+(state.feedback?' disabled':"")
        })).join("")+'</div>'+
        '<div class="debate-controls"><div class="debate-loaded"><span>已裝填</span><strong>'+
          (selected?html(selected.title):"尚未選擇")+'</strong></div><div class="debate-control-buttons">'+
          button("查看證據","debate-evidence","",{kind:"quiet small",attrs:!selected||state.feedback?' disabled':""})+
          button("集中 · 慢速","debate-focus","",{kind:"quiet small",attrs:' aria-pressed="'+state.focus+'"'+
            (ready||state.feedback||state.drawer?' disabled':"")})+
          button("暫停","debate-pause","",{kind:"quiet small",attrs:ready||state.feedback||state.drawer?' disabled':""})+
          button("重聽本段","debate-replay","",{kind:"quiet small",attrs:ready||state.feedback||state.drawer?' disabled':""})+
        '</div></div><p class="debate-key-hint">點言彈切換，再點流動片語發射。鍵盤可用 Q／E 切換、按住空白集中、Enter 發射。</p>'+
        '<p class="debate-live-note" role="status" aria-live="polite"></p></div></section>';
  }

  function mount(root,state,onHit,onAmmo) {
    const arena=root.querySelector(".debate-arena");
    if(!arena) return null;
    const utterance=root.querySelector(".debate-utterance");
    const focusButton=root.querySelector('[data-action="debate-focus"]');
    const pauseButton=root.querySelector('[data-action="debate-pause"]');
    const status=root.querySelector(".debate-live-note");
    const aim=root.querySelector(".debate-crosshair");
    const pausedLabel=root.querySelector(".debate-pause-label");
    const board=root.querySelector(".debate-board");
    const echo=root.querySelector(".debate-echo");
    const motionButton=root.querySelector('[data-action="debate-motion"]');
    const round=data.current(state);
    let last=0,raf=0,stopped=false,shown=-1,held=false,shotTimer=0,impactTimer=0;
    const locked=()=>state.phase!=="running" || state.feedback || state.drawer || state.shotPending || document.querySelector("dialog[open]");
    function updateLine() {
      const index=data.lineIndex(state);
      if(index===shown) return;
      shown=index;
      const statement=round.lines[index];
      const previous=round.lines[(index+round.lines.length-1)%round.lines.length];
      echo.textContent=previous.before+previous.target+previous.after;
      utterance.replaceChildren(document.createTextNode(statement.before));
      if(statement.target) {
        const target=document.createElement("button");
        target.type="button";target.className="debate-weak "+statement.tone;
        target.dataset.action="debate-hit";target.dataset.value=statement.id;
        target.textContent=statement.target;
        target.setAttribute("aria-label",(statement.tone==="agree"?"支持":"反駁")+"片語："+statement.target);
        utterance.append(target);
      }
      utterance.append(document.createTextNode(statement.after));
      arena.dataset.line=statement.id;
      arena.dataset.statement=String(index+1);
    }
    function draw(now) {
      if(stopped) return;
      const delta=last?Math.min(now-last,80):0;last=now;
      if(!locked() && !state.paused && !document.hidden) state.elapsed+=delta*((held||state.focus)?0.25:1);
      updateLine();
      const progress=(state.elapsed%4800)/4800;
      const reduced=reducedMotion(state);
      const width=arena.clientWidth,height=arena.clientHeight;
      const textWidth=utterance.offsetWidth,textHeight=utterance.offsetHeight;
      const direction=shown%2 ? -1 : 1;
      const travel=Math.max(12,(width-textWidth)/2-14);
      const outside=(width+textWidth)/2+45;
      let drift,scale,opacity;
      if(progress<0.15) {
        const t=progress/0.15,ease=1-Math.pow(1-t,3);
        drift=outside+(travel-outside)*ease;scale=1.13-0.13*ease;opacity=Math.min(1,t*3);
      } else if(progress<0.84) {
        const t=(progress-0.15)/0.69;
        drift=travel*(1-2*t);scale=1;opacity=1;
      } else {
        const t=(progress-0.84)/0.16;
        drift=-travel-(outside-travel)*t*t;scale=1-0.08*t;opacity=1-t;
      }
      const angle=[-2.5,2,-1.5,2.5][shown];
      const lane=[0.38,0.54,0.36,0.48][shown];
      const top=Math.max(74,Math.min(height-textHeight-76,height*lane-textHeight/2));
      const playing=state.phase==="running";
      const visual=reduced||!playing?0:drift*direction;
      const hint=!playing?"待開始":state.feedback?"已命中":state.drawer?"查看證據":state.paused?"已暫停":
        reduced?"低動態":held||state.focus?"集中慢速":"流動中";
      root.querySelector(".debate-flow-label").textContent=hint+" · "+(shown+1)+" / "+round.lines.length+
        (state.elapsed>=4800*round.lines.length?" · 重播":"");
      board.classList.toggle("motion-reduced",reduced);
      board.classList.toggle("motion-full",!reduced);
      if(motionButton) motionButton.textContent=reduced?"動態：低":"動態：強";
      utterance.style.top=(reduced?height*.32:top)+"px";
      utterance.style.setProperty("--tilt",(reduced?0:angle)+"deg");
      utterance.style.setProperty("--text-scale",reduced?1:scale);
      utterance.style.setProperty("--drift",visual+"px");
      utterance.style.opacity=String(reduced||!playing?1:opacity);
      echo.style.opacity=String(!reduced&&playing&&state.elapsed>=4800?Math.max(0,0.2-progress*.65):0);
      echo.style.transform="translate("+(-direction*(width*.15+progress*width)) +"px,0) rotate("+(-angle)+"deg)";
      echo.style.top=(height*(shown%2?.26:.66))+"px";
      arena.style.setProperty("--rush",!reduced&&playing&&!state.paused&&!locked()?0.12+(progress<.15||progress>.84?.2:0):0);
      arena.style.setProperty("--scene-shift",(reduced?0:-visual*.025)+"px");
      arena.classList.toggle("concentrating",Boolean(held||state.focus));
      focusButton?.setAttribute("aria-pressed",String(Boolean(held||state.focus)));
      if(focusButton) focusButton.textContent=held||state.focus?"集中中 · 慢速":"集中 · 慢速";
      if(pauseButton) pauseButton.textContent=state.paused?"繼續議論":"暫停";
      if(pausedLabel) pausedLabel.hidden=!state.paused || Boolean(locked());
      raf=requestAnimationFrame(draw);
    }
    function showShot(x,y) {
      const rect=arena.getBoundingClientRect();
      arena.style.setProperty("--shot-x",(x-rect.left)+"px");
      arena.style.setProperty("--shot-y",(y-rect.top)+"px");
      arena.classList.remove("firing");
      void arena.offsetWidth;
      arena.classList.add("firing");
      clearTimeout(shotTimer);
      shotTimer=setTimeout(()=>arena.classList.remove("firing"),300);
    }
    const pointer=(event)=>{
      if(locked()) return;
      const rect=arena.getBoundingClientRect();
      aim.style.left=(event.clientX-rect.left)+"px";aim.style.top=(event.clientY-rect.top)+"px";
      arena.classList.add("aiming");
    };
    const leave=()=>arena.classList.remove("aiming");
    const click=(event)=>{
      if(locked() || event.target.closest("button,.debate-ready,.debate-feedback,.debate-drawer")) return;
      showShot(event.clientX,event.clientY);
      status.textContent="沒有命中標記片語。集中放慢，瞄準有底色的那一段。";
    };
    const down=(event)=>{
      if(event.ctrlKey || event.altKey || event.metaKey || event.target.closest("input,textarea") || locked()) return;
      if(event.code==="Space" && !event.target.closest("button,a")) {event.preventDefault();held=true;}
      if(event.repeat) return;
      if(["KeyQ","KeyE"].includes(event.code)) {
        event.preventDefault();
        const available=round.ammo.filter(id=>state.cards.some(card=>card.id===id));
        const at=available.indexOf(state.selected);
        const next=available[(at+(event.code==="KeyE"?1:-1)+available.length)%available.length];
        onAmmo(next,true);
      }
      if(event.code==="Enter" && event.target===arena) {
        event.preventDefault();
        const current=round.lines[data.lineIndex(state)];
        if(current.target) onHit(current.id);
        else status.textContent="目前這句沒有標記片語。等下一句出現再瞄準。";
      }
    };
    const up=(event)=>{if(event.code==="Space")held=false;};
    const blur=()=>{held=false;last=0;};
    document.addEventListener("keydown",down);document.addEventListener("keyup",up);
    document.addEventListener("visibilitychange",blur);window.addEventListener("blur",blur);
    arena.addEventListener("pointermove",pointer);arena.addEventListener("pointerleave",leave);
    arena.addEventListener("click",click);
    updateLine();raf=requestAnimationFrame(draw);
    return {
      canAim(id){
        const target=utterance.querySelector('[data-value="'+id+'"]');
        if(!target) return false;
        const box=arena.getBoundingClientRect(),rect=target.getBoundingClientRect();
        const visibleWidth=Math.min(box.right,rect.right)-Math.max(box.left,rect.left);
        const visibleHeight=Math.min(box.bottom,rect.bottom)-Math.max(box.top,rect.top);
        const visible=visibleWidth>=Math.min(34,rect.width*.4) && visibleHeight>=Math.min(24,rect.height*.5);
        if(!visible)status.textContent="等標記片語進入畫面，再瞄準發射。";
        return visible;
      },
      impact(id,resolve){
        const target=utterance.querySelector('[data-value="'+id+'"]');
        if(!target || reducedMotion(state)) {resolve();return;}
        const box=arena.getBoundingClientRect(),rect=target.getBoundingClientRect();
        const from={x:box.width*.1,y:box.height*.9};
        const to={x:rect.x+rect.width/2-box.x,y:rect.y+rect.height/2-box.y};
        const projectile=root.querySelector('.debate-projectile');
        projectile.style.left=from.x+'px';projectile.style.top=from.y+'px';
        projectile.style.setProperty('--flight-x',(to.x-from.x)+'px');
        projectile.style.setProperty('--flight-y',(to.y-from.y)+'px');
        projectile.style.setProperty('--flight-angle',Math.atan2(to.y-from.y,to.x-from.x)+'rad');
        arena.style.setProperty('--impact-x',to.x+'px');arena.style.setProperty('--impact-y',to.y+'px');
        arena.classList.add('impact');
        target.classList.add('target-hit');
        impactTimer=setTimeout(resolve,420);
      },
      focus(){if(!locked())state.focus=!state.focus;},
      motion(){if(!state.shotPending && !state.feedback)state.motion=reducedMotion(state)?"full":"reduced";},
      pause(){if(!locked())state.paused=!state.paused;},
      replay(){if(!locked()){state.elapsed=0;state.paused=false;status.textContent="從本段第一句重新播放。";}},
      stop(){
        stopped=true;cancelAnimationFrame(raf);clearTimeout(shotTimer);clearTimeout(impactTimer);
        document.removeEventListener("keydown",down);document.removeEventListener("keyup",up);
        document.removeEventListener("visibilitychange",blur);window.removeEventListener("blur",blur);
        arena.removeEventListener("pointermove",pointer);arena.removeEventListener("pointerleave",leave);
        arena.removeEventListener("click",click);
      }
    };
  }
  window.BreathDebate={render,mount};
})();
