(function () {
  "use strict";
  // Original motifs and synthesized instruments, composed for this game.
  const compositions={
    pursuit:{title:"巡邏守衛",bpm:136,wave:"triangle",sustain:.5,
      melody:[50,null,57,53,50,null,56,null,50,null,57,53,49,null,56,null,53,null,60,57,53,null,59,null,49,null,56,53,49,null,48,null],
      bass:[26,26,29,25],chords:[[50,53,57],[50,53,56],[53,57,60],[49,53,56]],arp:true,drive:true},
    night:{title:"肺城夜航",bpm:72,wave:"triangle",sustain:1.6,
      melody:[62,null,65,null,69,null,72,69,67,null,65,null,64,null,62,null,65,null,69,null,74,null,72,69,67,null,64,null,65,null,62,null],
      bass:[38,46,41,43],chords:[[62,65,69],[58,62,65],[60,65,69],[60,64,67]],arp:false},
    archive:{title:"散落的紀錄",bpm:88,wave:"triangle",sustain:.85,
      melody:[77,null,81,79,77,null,74,72,74,77,79,null,81,null,77,null,79,81,84,null,81,79,77,null,74,null,72,74,77,null,76,null],
      bass:[41,38,46,48],chords:[[65,69,72],[62,65,69],[62,65,70],[60,64,67]],arp:true},
    maze:{title:"呼吸道迴廊",bpm:102,wave:"triangle",sustain:.8,
      melody:[74,null,77,76,74,null,69,null,72,74,77,null,76,72,69,null,74,77,81,null,79,77,76,null,72,null,69,72,74,null,76,null],
      bass:[38,43,46,45],chords:[[62,65,69],[62,67,70],[62,65,70],[61,64,69]],arp:true},
    library:{title:"翻頁之間",bpm:74,wave:"sine",sustain:2.2,
      melody:[69,null,null,72,null,null,74,null,77,null,null,76,null,72,null,null,74,null,72,null,69,null,null,65,67,null,69,null,64,null,null,null],
      bass:[38,46,41,48],chords:[[62,65,69],[58,62,65],[60,65,69],[60,64,67]],arp:false},
    debate:{title:"證據交鋒",bpm:128,wave:"triangle",sustain:.72,
      melody:[74,77,81,77,72,76,79,76,74,77,82,77,73,76,81,76,77,81,86,81,76,79,84,79,74,77,81,79,77,76,74,null],
      bass:[38,41,46,45],chords:[[62,65,69],[65,69,72],[62,65,70],[61,64,69]],arp:true,drive:true},
    ending:{title:"裂縫仍在",bpm:64,wave:"sine",sustain:2.5,
      melody:[69,null,null,null,65,null,null,67,69,null,72,null,74,null,null,null,72,null,69,null,65,null,null,64,67,null,69,null,62,null,null,null],
      bass:[38,46,41,43],chords:[[62,65,69],[58,62,65],[60,65,69],[60,65,67]],arp:false}
  };
  const midi=note=>440*Math.pow(2,(note-69)/12);
  function voice(ctx,output,note,time,duration,level,wave="triangle",kick=false) {
    const oscillator=ctx.createOscillator(),gain=ctx.createGain();
    oscillator.type=wave;
    oscillator.frequency.setValueAtTime(kick?120:midi(note),time);
    if(kick)oscillator.frequency.exponentialRampToValueAtTime(48,time+.13);
    gain.gain.setValueAtTime(.0001,time);
    gain.gain.exponentialRampToValueAtTime(level,time+(kick?.005:.015));
    gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
    oscillator.connect(gain);gain.connect(output);
    oscillator.start(time);oscillator.stop(time+duration+.03);
    return {oscillator,gain};
  }
  function arrange(ctx,output,track,step,time) {
    const beat=60/track.bpm/2,index=step%32,chordIndex=Math.floor(index/8),chord=track.chords[chordIndex];
    const nodes=[];
    const add=(note,duration,level,wave,kick=false)=>nodes.push(voice(ctx,output,note,time,duration,level,wave,kick));
    const note=track.melody[index];
    if(note!==null)add(note,beat*track.sustain,.044,track.wave);
    if(index%(track.drive?2:4)===0)add(track.bass[chordIndex],beat*(track.drive?1.25:3.2),.035,"sine");
    if(index%8===0)for(const tone of chord)add(tone,beat*7.5,.008,"sine");
    if(track.arp && index%2===1)add(chord[(index>>1)%3]+12,beat*.55,track.drive?.013:.009,"sine");
    if(track.drive){
      if(index%4===0)add(0,.16,.04,"sine",true);
      if(index%2===1)add(104,.035,.005,"square");
    }
    return nodes;
  }

  let ctx,bus,enabled=true,trackId="night",duck=false,timer=0,nextTime=0,step=0,scheduled=0,targetGain=-1;
  const active=new Set();
  function volume() {
    if(!ctx||!bus)return;
    const target=enabled&&!document.hidden?(duck?.2:.42):0;
    if(target===targetGain)return;
    targetGain=target;
    bus.gain.cancelScheduledValues(ctx.currentTime);
    bus.gain.setTargetAtTime(target,ctx.currentTime,.09);
  }
  function release() {
    if(!ctx)return;
    const now=ctx.currentTime;
    for(const node of active){
      try{
        node.gain.gain.cancelScheduledValues(now);
        node.gain.gain.setTargetAtTime(0,now,.045);
        node.oscillator.stop(now+.2);
      }catch{ /* A voice may have already ended. */ }
    }
  }
  function stopTimer() {if(timer)clearInterval(timer);timer=0;}
  function pump() {
    if(!ctx||ctx.state!=="running"||!enabled||document.hidden)return;
    if(nextTime<ctx.currentTime-.2)nextTime=ctx.currentTime+.04;
    const track=compositions[trackId];
    while(nextTime<ctx.currentTime+.18){
      const nodes=arrange(ctx,bus,track,step,nextTime);
      for(const node of nodes){
        active.add(node);
        node.oscillator.onended=()=>{active.delete(node);node.oscillator.disconnect();node.gain.disconnect();};
      }
      scheduled+=nodes.length;step=(step+1)%32;nextTime+=60/track.bpm/2;
    }
  }
  function start() {
    if(!ctx||!enabled||document.hidden||ctx.state!=="running")return;
    volume();
    if(!timer){nextTime=ctx.currentTime+.06;timer=setInterval(pump,50);pump();}
  }
  function unlock() {
    if(!enabled||document.hidden)return;
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)return;
    try{
      if(!ctx){ctx=new Audio();bus=ctx.createGain();bus.gain.value=0;bus.connect(ctx.destination);}
      if(ctx.state!=="running")ctx.resume().then(start).catch(()=>{});
      else start();
    }catch{ /* Music is optional on browsers without Web Audio. */ }
  }
  function scene(view,chapter,talking=false,danger=false) {
    const next=danger&&view==="labyrinth"?"pursuit":["ending","done","report"].includes(view)?"ending":
      ["intro","title"].includes(view)?"night":["archive","maze","library","debate"][chapter]||"night";
    duck=talking;
    if(next!==trackId){
      trackId=next;step=0;release();
      if(ctx)nextTime=ctx.currentTime+.14;
    }
    volume();
    if(ctx&&enabled)start();
    const button=document.getElementById("music");
    if(button)button.title="背景音樂："+compositions[trackId].title;
  }
  function toggle() {
    enabled=!enabled;
    if(enabled)unlock();else{stopTimer();release();volume();}
    return enabled;
  }
  function state() {
    return {enabled,track:trackId,title:compositions[trackId].title,tempo:compositions[trackId].bpm,
      contextState:ctx?.state||"waiting",scheduledVoices:scheduled,timerRunning:Boolean(timer),activeVoices:active.size,
      targetGain,step};
  }
  const interaction=event=>{if(event.type==="keydown"&&(event.altKey||event.ctrlKey||event.metaKey))return;unlock();};
  document.addEventListener("pointerdown",interaction,{passive:true});
  document.addEventListener("pointerup",interaction,{passive:true});
  document.addEventListener("click",interaction,{passive:true});
  document.addEventListener("keydown",interaction);
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden){stopTimer();volume();release();ctx?.suspend().catch(()=>{});}
    else if(enabled)unlock();
  });
  window.addEventListener("pagehide",()=>{stopTimer();release();});
  window.addEventListener("pageshow",()=>{if(enabled&&ctx)unlock();});
  window.BreathMusic={scene,toggle,unlock,state,compositions,arrange};
})();
