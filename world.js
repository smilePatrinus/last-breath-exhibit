(function () {
  "use strict";
  const bounds = {left:0.065, right:0.93, top:0.583, bottom:0.717};
  const lane = 0.66;
  const stations = [
    {x:0.221,y:0.614},
    {x:0.421,y:0.614},
    {x:0.626,y:0.614},
    {x:0.828,y:0.614}
  ];
  const entry = {x:0.086,y:lane};
  const moves = {
    ArrowUp:"up", KeyW:"up", ArrowDown:"down", KeyS:"down", ArrowLeft:"left", KeyA:"left", ArrowRight:"right", KeyD:"right"
  };
  const vector = {up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  const spriteRow = {down:0,left:1,right:2,up:3};
  const stride = [0,1,2,1];

  function mount(root, chapter, savedPosition, onArrive) {
    const viewport = root.querySelector(".map-viewport");
    const camera = root.querySelector(".map-camera");
    const actor = root.querySelector(".map-actor");
    const sprite = root.querySelector(".map-sprite");
    const target = stations[chapter];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const position = {...(savedPosition || entry)};
    const pressed = new Set();
    let route = [], raf = 0, last = 0, phase = 0, facing = "right";
    let closed = false, arrived = false, ratio = 1, worldWidth;
    let stickInput = null;
    const joystick = window.BreathTouchControls.mount(viewport, {
      move(input) { stickInput = input; pressed.clear(); route = []; },
      end() { stickInput = null; },
      locked: () => closed || arrived || Boolean(document.querySelector("dialog[open]"))
    });
    const clamp = (value, min, max) => Math.min(max,Math.max(min,value));
    const rangeTo = (point) => Math.hypot((point.x-position.x)*ratio,point.y-position.y);

    function place() {
      const maxScroll = worldWidth - viewport.clientWidth;
      camera.style.transform = "translateX(" +
        (-clamp(position.x * worldWidth - viewport.clientWidth * 0.44, 0, maxScroll)) + "px)";
      actor.style.left = position.x * 100 + "%";
      actor.style.top = position.y * 100 + "%";
    }

    function layout() {
      if (!viewport.clientHeight) return;
      worldWidth = Math.max(viewport.clientWidth, Math.round(viewport.clientHeight * 1.78));
      ratio = worldWidth / viewport.clientHeight;
      camera.style.width = worldWidth + "px";
      place();
    }

    function enter() {
      if (arrived || closed) return;
      arrived = true;
      onArrive({...position});
    }

    function tick(now) {
      if (closed || arrived) return;
      const elapsed = last ? Math.min(35,now-last) : 0;
      last = now;
      if (document.querySelector("dialog[open]")) {
        pressed.clear();
        joystick.reset();
        raf = requestAnimationFrame(tick);
        return;
      }
      let dx = 0, dy = 0;
      for (const key of pressed) {
        dx += vector[key][0];
        dy += vector[key][1];
      }
      if (stickInput) { dx = stickInput.x; dy = stickInput.y; }
      if (!stickInput && !pressed.size && route.length) {
        const focus = route[0];
        const distance = rangeTo(focus);
        if (distance < 0.014) {
          Object.assign(position,focus);
          route.shift();
        } else {
          dx = (focus.x-position.x)*ratio;
          dy = focus.y-position.y;
        }
      }
      const length = Math.hypot(dx,dy);
      if (length) {
        facing = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
        const speed = Math.min(elapsed*0.00067*(stickInput ? length : 1), route.length ? rangeTo(route[0]) : Infinity);
        const nextX = clamp(position.x + dx / length * speed / ratio,bounds.left,bounds.right);
        const nextY = clamp(position.y + dy / length * speed,bounds.top,bounds.bottom);
        const moved = Math.hypot((nextX-position.x)*ratio,nextY-position.y);
        phase += moved * 23;
        position.x = nextX;
        position.y = nextY;
        if (moved) place();
        sprite.style.setProperty("--walk-x", (stride[Math.floor(phase)%stride.length]*50)+"%");
      } else {
        sprite.style.setProperty("--walk-x","50%");
      }
      sprite.style.setProperty("--walk-y",(spriteRow[facing]*100/3)+"%");
      if (rangeTo(target) < 0.037) { enter(); return; }
      raf = requestAnimationFrame(tick);
    }

    function walkTo(point = target) {
      joystick.reset();
      pressed.clear();
      const destination = {
        x:clamp(point.x,bounds.left,bounds.right), y:clamp(point.y,bounds.top,bounds.bottom)
      };
      if (reducedMotion.matches) {
        Object.assign(position,destination);
        place();
        if (rangeTo(target) < 0.037) enter();
        return;
      }
      route = Math.abs(position.x-destination.x) > 0.08 ?
        [{x:position.x,y:lane},{x:destination.x,y:lane},destination] : [destination];
    }

    function step(direction) {
      const [dx,dy] = vector[direction];
      walkTo({x:position.x+dx*0.068/ratio,y:position.y+dy*0.068});
    }

    function keyDown(event) {
      if (event.altKey || event.metaKey || event.ctrlKey || document.querySelector("dialog[open]")) return;
      const direction = moves[event.code];
      if (!direction) return;
      event.preventDefault();
      joystick.reset();
      route = [];
      pressed.add(direction);
    }

    const keyUp = (event) => {
      if (moves[event.code]) pressed.delete(moves[event.code]);
    };
    const clearKeys = () => pressed.clear();
    const point = (event) => {
      if (event.target.closest("button,.touch-joystick")) return;
      const area = camera.getBoundingClientRect();
      walkTo({x:(event.clientX-area.left)/area.width,y:(event.clientY-area.top)/area.height});
    };

    const resize = new ResizeObserver(layout);
    resize.observe(viewport);
    document.addEventListener("keydown",keyDown);
    document.addEventListener("keyup",keyUp);
    window.addEventListener("blur",clearKeys);
    viewport.addEventListener("click",point);
    layout();
    raf = requestAnimationFrame(tick);

    function stop() {
      closed = true;
      joystick.stop();
      cancelAnimationFrame(raf);
      resize.disconnect();
      pressed.clear();
      document.removeEventListener("keydown",keyDown);
      document.removeEventListener("keyup",keyUp);
      window.removeEventListener("blur",clearKeys);
      viewport.removeEventListener("click",point);
    }

    return {stop, walkTo, step};
  }

  window.BreathWorld = {stations,mount};
})();


