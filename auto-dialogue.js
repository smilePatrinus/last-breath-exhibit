(function () {
  "use strict";
  const preferences={easy:true,quick:true};
  const scenes=new Set(["intro","brief","ending"]);
  let current=null,frame=0,generation=0,focused=true;
  const supported=mode=>Object.prototype.hasOwnProperty.call(preferences,mode);
  const enabled=mode=>supported(mode)&&preferences[mode];
  function toggle(mode){if(!supported(mode))return false;preferences[mode]=!preferences[mode];return true;}
  function delay(text,line={}){
    const length=[...String(text).replace(/\s/g,"")].length;
    const reading=Math.max(2400,Math.min(10500,1250+length*95));
    return line.lesson?Math.max(6500,Math.min(14000,reading+2500)):reading;
  }
  function control(state,button){
    if(!supported(state.difficulty))return "";
    const on=enabled(state.difficulty);
    return button("自動對話："+(on?"開":"關")+'<span class="auto-dialogue-meter" aria-hidden="true"><i></i></span>',"auto-dialogue","",{
      kind:"quiet small auto-dialogue",attrs:' aria-pressed="'+on+'" title="依文字長度自動換句；可隨時關閉"'
    });
  }
  function blocked(){
    const selection=window.getSelection();
    return document.hidden||!focused||Boolean(document.querySelector("dialog[open]"))||
      Boolean(selection&&!selection.isCollapsed&&document.querySelector(".cinematic-dialogue")?.contains(selection.anchorNode));
  }
  function update(state,next){
    cancelAnimationFrame(frame);frame=0;
    const token=++generation;
    if(!scenes.has(state.view)||!enabled(state.difficulty)){current=null;return;}
    const line=window.BreathStages.lines(state)[state.beat];
    if(!line){current=null;return;}
    const text=document.querySelector(".story-line")?.textContent||line.body;
    const key=[state.difficulty,state.view,state.chapter,state.beat,text].join("|");
    if(current?.key!==key){
      const duration=delay(text,line);current={key,duration,remaining:duration,paused:false};
      if(!line.lesson&&window.matchMedia("(max-width: 620px)").matches)
        document.querySelector(".cinematic-dialogue")?.scrollIntoView({block:"nearest"});
    }
    let last=performance.now();
    const button=document.querySelector('[data-action="auto-dialogue"]');
    const meter=button?.querySelector('.auto-dialogue-meter i');
    function paint(){
      if(meter)meter.style.transform="scaleX("+Math.max(0,current.remaining/current.duration)+")";
      if(button)button.dataset.paused=String(current.paused);
    }
    function tick(now){
      if(token!==generation||current?.key!==key)return;
      if(blocked()){current.paused=true;last=now;paint();frame=requestAnimationFrame(tick);return;}
      // Restart this sentence after returning, so it cannot disappear as soon as focus comes back.
      if(current.paused){current.remaining=current.duration;current.paused=false;last=now;}
      current.remaining-=Math.max(0,Math.min(250,now-last));last=now;paint();
      if(current.remaining<=0){frame=0;current=null;next();return;}
      frame=requestAnimationFrame(tick);
    }
    paint();frame=requestAnimationFrame(tick);
  }
  window.addEventListener("blur",()=>{focused=false;});
  window.addEventListener("focus",()=>{focused=true;});
  document.addEventListener("visibilitychange",()=>{if(current)current.paused=true;});
  window.BreathAutoDialogue={enabled,supported,toggle,delay,control,update};
})();
