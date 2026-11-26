(function () {
  "use strict";
  const previewTime = 650, shuffleTime = 2400, swapTime = 240;
  const positions = ["左邊", "中間", "右邊"];
  const guided = difficulty => ["quick", "easy"].includes(difficulty);
  const index = (random, length) => Math.min(length - 1, Math.max(0, Math.floor(random() * length)));
  function create(difficulty, landmark, title, random = Math.random, attempt = 1) {
    const pairs = [[0,1], [1,2], [0,2]], swaps = [];
    let previous = -1;
    for (let n = 0; n < shuffleTime / swapTime; n++) {
      const available = [0,1,2].filter(value => value !== previous);
      previous = available[index(random, available.length)];
      swaps.push([...pairs[previous]]);
    }
    return {difficulty, landmark, title, attempt, phase:"preview", elapsed:0, step:0,
      order:[0,1,2], trueCup:index(random, 3), swaps, selected:null, revealed:null, final:null};
  }
  function advance(game, elapsed) {
    if (!["preview", "shuffling"].includes(game.phase)) return;
    game.elapsed = Math.min(previewTime + shuffleTime, game.elapsed + Math.max(0, elapsed));
    if (game.elapsed < previewTime) return;
    game.phase = "shuffling";
    const count = Math.min(game.swaps.length, Math.floor((game.elapsed - previewTime) / swapTime) + 1);
    while (game.step < count) {
      const [a,b] = game.swaps[game.step++];
      [game.order[a], game.order[b]] = [game.order[b], game.order[a]];
    }
    if (game.elapsed >= previewTime + shuffleTime) game.phase = "choose";
  }
  function choose(game, cup) {
    if (game.phase !== "choose" || !Number.isInteger(cup) || !game.order.includes(cup)) return false;
    game.selected = cup;
    if (cup === game.trueCup) { game.phase = "won"; game.final = cup; }
    else if (guided(game.difficulty)) {
      game.revealed = game.order.find(id => id !== cup && id !== game.trueCup);
      game.phase = "rescue";
    } else { game.phase = "failed"; game.final = cup; }
    return true;
  }
  function resolve(game, change) {
    if (game.phase !== "rescue" || !["stay", "switch"].includes(change)) return false;
    game.final = change === "switch" ? game.order.find(id => id !== game.selected && id !== game.revealed) : game.selected;
    game.phase = game.final === game.trueCup ? "won" : "failed";
    return true;
  }
  function intercept(state, id) {
    if (state.dialog || state.complete || state.cupGame) return false;
    const item = window.BreathLabyrinthData.landmarks.find(entry => entry.id === id);
    if (!item || !["key", "record"].includes(item.type)) return false;
    if (state.difficulty === "hard" && item.type !== "key") return false;
    if (state.cupPassed?.includes(id) || state.keys?.includes(id) || state.found[id]) return false;
    if (id === "missing" && !state.found.specimen) return false;
    const title = item.type === "key" ? item.label : id === "specimen" ? "培養紀錄櫃鑰匙" : "證據紀錄櫃鑰匙";
    state.cupGame = create(state.difficulty || "normal", id, title);
    state.dialog = {kind:"key-shuffle"};
    return true;
  }
  function claim(state) {
    const game = state.cupGame;
    if (game?.phase !== "won" || state.dialog?.kind !== "key-shuffle") return null;
    state.cupPassed ||= [];
    if (!state.cupPassed.includes(game.landmark)) state.cupPassed.push(game.landmark);
    state.cupGame = null;
    state.dialog = null;
    return game.landmark;
  }
  function status(game) {
    return {
      preview:["記住金色真鑰匙", "三把鑰匙，只有一把能開鎖。盯緊它藏進哪個紙杯。"],
      shuffling:["別眨眼……", "紙杯正在換位，先別急著選。"],
      choose:["真鑰匙在哪裡？", "點一個紙杯，揭開看看。"],
      rescue:["幫你排除一把假的", "另一個假鑰匙已揭開。維持原選擇，還是換到剩下那杯？"],
      won:["真鑰匙，到手！", "收下鑰匙，繼續查線索。"],
      failed:["這把打不開鎖", "真鑰匙在另一杯。再跟一次就好，不會丟失已收集的線索。"]
    }[game.phase];
  }
  function render(game, button, html) {
    const [title, copy] = status(game);
    const icon = '<svg viewBox="0 0 64 32" aria-hidden="true"><circle cx="14" cy="16" r="9"/><path d="M23 16h33m-8 0v9m-9-9v6"/></svg>';
    return '<section class="labyrinth-message key-shuffle" role="dialog" aria-modal="true" aria-labelledby="labyrinth-message-title">' +
      '<p class="eyebrow">紀錄櫃的把戲 · '+html(game.title)+'</p><h2 id="labyrinth-message-title" tabindex="-1">'+title+'</h2>' +
      '<p class="key-shuffle-copy">'+copy+'</p><div class="cup-stage phase-'+game.phase+'" aria-label="三個紙杯，追蹤真鑰匙">' +
      '<div class="cup-table" aria-hidden="true"></div>' + [0,1,2].map(id => button(
        '<span class="cup-motion"><span class="cup-key">'+icon+'</span><span class="paper-cup"><i></i></span></span>' +
        '<span class="cup-position">'+positions[game.order.indexOf(id)]+'</span><span class="cup-tag"></span>',
        "key-cup", String(id), {kind:"key-cup", attrs:' style="left:'+((game.order.indexOf(id)+.5)*100/3)+'%;" aria-label="選擇'+positions[game.order.indexOf(id)]+'的紙杯"'+(game.phase === "choose" ? "" : " disabled")})).join("") +
      '</div><p class="cup-status" role="status" aria-live="polite">'+(game.phase === "choose" ? "可以選了。" : game.phase === "shuffling" ? "換位約 2.4 秒" : "只有金色鑰匙是真的")+'</p>' +
      '<div class="cup-actions actions">'+
      (game.phase === "rescue" ? button("改選另一杯", "key-switch", "switch", {kind:"primary"}) + button("維持原選擇", "key-switch", "stay") : "") +
      (game.phase === "won" ? button("收下鑰匙，查看線索", "key-claim", "", {kind:"primary"}) : "") +
      (game.phase === "failed" ? button("再洗一次", "key-retry", "", {kind:"primary"}) : "") +
      (game.phase !== "won" ? button("先離開", "key-leave", "", {kind:"quiet small"}) : "")+'</div>' +
      '<p class="cup-footnote">取到鑰匙後，還要讀原始線索。</p></section>';
  }
  function mount(root, game) {
    const panel = root.querySelector(".key-shuffle");
    if (!panel || !game) return {stop() {}};
    const stage = panel.querySelector(".cup-stage"), cups = [...panel.querySelectorAll(".key-cup")];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = performance.now(), raf = 0, stopped = false, phase = "", step = -1;
    const animations = [];
    function paint() {
      const changed = phase !== game.phase;
      phase = game.phase;
      stage.className = "cup-stage phase-"+phase+(reduced ? " reduced-cups" : "");
      const finished = ["won", "failed"].includes(phase);
      for (const cup of cups) {
        const id = Number(cup.dataset.value), slot = game.order.indexOf(id);
        cup.style.left = ((slot+.5)*100/3)+"%";
        cup.disabled = phase !== "choose";
        cup.classList.toggle("true-key", id === game.trueCup);
        cup.classList.toggle("revealed", phase === "preview" || finished || id === game.revealed);
        cup.classList.toggle("selected-cup", id === game.selected);
        cup.classList.toggle("winning-cup", phase === "won" && id === game.trueCup);
        cup.classList.toggle("reduced-guide", reduced && id === game.trueCup);
        cup.querySelector(".cup-position").textContent = positions[slot];
        cup.querySelector(".cup-tag").textContent = id === game.revealed ? "假鑰匙" : id === game.final && finished ? (phase === "won" ? "找到了！" : "選到假的") : id === game.selected ? "你的選擇" : "";
        cup.setAttribute("aria-label", "選擇"+positions[slot]+"的紙杯"+(reduced && id === game.trueCup ? "，有金色微光" : ""));
        cup.setAttribute("aria-pressed", String(id === game.selected));
        if (game.step !== step && phase === "shuffling" && !reduced && game.step) {
          const pair = game.swaps[game.step-1], arc = pair.indexOf(slot);
          if (arc >= 0) animations.push(cup.animate([
            {transform:"translate(-50%,0)"}, {transform:"translate(-50%,"+(arc ? 12 : -24)+"px)"}, {transform:"translate(-50%,0)"}
          ], {duration:220, easing:"ease-in-out"}));
        }
      }
      step = game.step;
      if (changed) {
        const [title, copy] = status(game);
        panel.querySelector("h2").textContent = title;
        panel.querySelector(".key-shuffle-copy").textContent = copy;
        panel.querySelector(".cup-status").textContent = phase === "choose" ? (reduced ? "低動態：真鑰匙保留金色微光，可以選了。" : "可以選了。") : phase === "shuffling" ? "換位約 2.4 秒" : phase === "rescue" ? "已排除一把假鑰匙；尚未收進背包。" : phase === "won" ? "真鑰匙已揭開，收下後才會入袋。" : phase === "failed" ? "可以重試，迷宮進度保留。" : "只有金色鑰匙是真的";
        if (phase === "choose") cups.find(cup => Number(cup.dataset.value) === game.order[0])?.focus({preventScroll:true});
      }
    }
    function tick(now) {
      if (stopped) return;
      if (!document.hidden && !document.querySelector("dialog[open]")) advance(game, Math.min(60, now-last));
      last = now;
      paint();
      if (["preview", "shuffling"].includes(game.phase)) raf = requestAnimationFrame(tick);
    }
    const visibility = () => { last = performance.now(); };
    document.addEventListener("visibilitychange", visibility);
    paint();
    if (["preview", "shuffling"].includes(game.phase)) raf = requestAnimationFrame(tick);
    return {stop() {
      stopped = true;cancelAnimationFrame(raf);
      animations.forEach(animation => animation.cancel());
      document.removeEventListener("visibilitychange", visibility);
    }};
  }
  window.BreathKeyShuffle = {create, advance, choose, resolve, intercept, claim, render, mount, previewTime, shuffleTime};
})();
