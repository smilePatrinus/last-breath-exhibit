(function () {
  "use strict";
  const script = window.BreathStory;
  const roles = {doctor:"醫師",detective:"偵探",thought:"偵探・心想",narrator:""};
  const modeOf = (state) => state.view === "brief" ? "call" : state.view;

  function sceneOf(mode, state, beat) {
    return beat.scene || (mode === "call" ? window.BreathContent.chapter[state.chapter].scene : "room");
  }

  function lines(state) {
    if (state.view === "ending") return script.ending(state.kept);
    if (state.view === "brief") return script.chapter(state).script;
    return script.intro;
  }

  function shell() {
    return '<section class="cinematic" data-scene-mode><div class="cinematic-bg" aria-hidden="true"></div>' +
      '<div class="cinematic-shade" aria-hidden="true"></div><div class="fracture" aria-hidden="true"></div>' +
      '<div class="actors" aria-hidden="true"><div class="cast detective"></div><div class="cast doctor"></div></div>' +
      '<p class="cinematic-location"></p><div class="scene-prop" aria-hidden="true"></div>' +
      '<div class="cinematic-dialogue"><div class="speaker-line"><p class="story-speaker"></p><p class="voice-tag">通話中</p></div>' +
      '<p class="story-line" tabindex="-1" data-focus></p><div class="scene-actions"></div></div></section>';
  }

  function update(root, state, button, html) {
    const current = lines(state);
    const line = current[state.beat];
    const mode = modeOf(state);
    const scene = sceneOf(mode,state,line);
    const last = state.beat === current.length-1;
    const chapter = script.chapter(state);
    const label = line.label || (mode === "call" && last ? chapter.label : "繼續");
    const actor = line.role === "thought" ? "detective" : line.role;
    const location = mode === "call" ? window.BreathContent.chapter[state.chapter].place :
      scene === "world" ? "肺城・結案桌" : "醫院・深夜診療室";
    const {candidates} = window.BreathContent;
    const report = '<div class="signal-paper"><span>D07 · L02 BAL · mNGS 報告節錄</span><div class="signal-head">' +
      '<b>候選學名</b><b>讀數</b></div>' + Object.values(candidates).sort((a,b) => b.reads-a.reads).map((item) =>
        '<div class="signal-row' + (item.id === "B" ? ' signal-focus' : '') + '"><em>' +
        html(item.scientific) + '</em><b>' + item.reads.toLocaleString("zh-TW") + '</b></div>').join("") + '</div>';

    root.dataset.sceneMode = mode;
    root.dataset.station = state.chapter;
    root.dataset.motion = line.motion || "";
    root.dataset.scene = scene;
    root.dataset.voice = line.role;
    root.classList.toggle("has-report",Boolean(line.report));
    root.classList.toggle("has-lesson",Boolean(line.lesson));
    root.dataset.lesson = line.lesson || "";
    root.classList.toggle("has-rift",Boolean(line.rift));
    root.classList.toggle("has-trace",Boolean(line.trace));
    root.classList.toggle("quiet-opening",mode === "intro" && state.beat === 0);
    root.querySelector(".cinematic-location").textContent = location;
    for (const name of ["detective","doctor"]) {
      const cast = root.querySelector(".cast." + name);
      const prior = current.slice(0,state.beat+1).reverse().find((entry) =>
        sceneOf(mode,state,entry) === scene && (entry.role === name || (entry.role === "thought" && name === "detective")));
      const leaving = name === "doctor" && current.slice(0,state.beat).some((entry) => entry.motion === "exit-doctor");
      const offPhone = mode === "call" && name === "doctor" && line.role !== "doctor";
      cast.classList.toggle("on-stage",Boolean(prior) && !leaving && !offPhone);
      cast.classList.toggle("speaking",name === actor);
      cast.style.setProperty("--face",(prior?.face || 0)*50 + "%");
    }
    const prop = root.querySelector(".scene-prop");
    prop.innerHTML = (line.prop ? '<p class="prop-label">' + html(line.prop) + '</p>' : "") + (line.report ? report : "");
    if (line.lesson) prop.innerHTML = window.BreathIntroVisuals.render(line.lesson);
    prop.hidden = !line.prop && !line.report && !line.lesson;
    prop.setAttribute("aria-hidden",line.lesson ? "false" : "true");
    root.querySelector(".story-speaker").textContent = roles[line.role];
    const spoken = line.body.replace("{summary}",state.kept.length ?
      "我留下了 " + state.kept.length + " 篇和本案可對照的文獻，限制也一起寫進去了。" :
      "這一輪的案卷沒有留文獻。關於 K. variicola，我只能交回院端的群組線索。");
    root.querySelector(".story-line").innerHTML = window.BreathDialogue.render(spoken,line.emphasis);
    root.querySelector(".scene-actions").innerHTML =
      '<span class="beat-count">' + (state.beat+1) + ' / ' + current.length + '</span>' +
      (mode === "intro" && state.beat > 0 ? button("上一句", "rewind-intro", "", {kind:"quiet small"}) : "") +
      (mode === "intro" ? button("略過序章", "skip", "", {kind:"quiet small"}) : "") +
      button(html(label) + ' <span aria-hidden="true">›</span>',"advance","",{kind:"primary"});
  }

  function map(state, button) {
    const content = window.BreathContent.chapter;
    const chapter = script.chapter(state);
    const stations = window.BreathWorld.stations.map((station,index) => {
      const marker = '<span class="gate-pin" aria-hidden="true">' + (index < state.chapter ? "✓" : content[index].num) +
        '</span><span class="gate-name">' + script.chapter(state,index).target + '</span>';
      return '<div class="map-station ' + (index === state.chapter ? "goal" : "") + '" style="--gate-x:' +
        station.x*100 + '%;--gate-y:' + station.y*100 + '%">' +
        (index === state.chapter ? button(marker,"walk-goal","",{kind:"map-gate",attrs:' aria-label="走向'+chapter.target+'"'}) :
          '<span class="map-gate inactive">' + marker + '</span>') + '</div>';
    }).join("");
    return '<section class="overworld"><header class="map-heading"><div><p class="eyebrow">肺城</p>' +
      '<h1 tabindex="-1" data-focus>' + content[state.chapter].name + '</h1><p>' + chapter.objective +
      '</p></div><span class="destination">目的地 · ' + chapter.target + '</span></header>' +
      '<div class="map-viewport" aria-label="肺城地圖"><div class="map-camera"><div class="map-floor"></div>' +
      stations + '<div class="map-actor" aria-hidden="true"><i></i><div class="map-sprite"></div></div></div></div>' +
      '<footer class="map-controls"><p>方向鍵、WASD 或點地圖移動。</p><div class="map-buttons">' +
      '<div class="dpad" aria-label="方向控制">' +
      [["left","←","左"],["up","↑","上"],["down","↓","下"],["right","→","右"]].map(([key,symbol,label]) =>
        button(symbol,"walk-step",key,{attrs:' aria-label="向'+label+'移動"'})).join("") +
      '</div>' + button("走到" + chapter.target + " →","walk-goal","",{kind:"primary"}) + '</div></footer></section>';
  }

  window.BreathStages = {shell,update,lines,map};
})();
