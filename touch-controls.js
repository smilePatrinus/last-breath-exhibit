(function () {
  "use strict";
  const mobile = () => window.matchMedia("(any-pointer: coarse), (max-width: 800px)").matches;
  function render() {
    return '<div class="touch-joystick" role="group" aria-label="移動搖桿，按住拖曳移動，放開停止">' +
      '<span class="stick-direction north" aria-hidden="true">▲</span><span class="stick-direction south" aria-hidden="true">▼</span>' +
      '<span class="stick-direction west" aria-hidden="true">◀</span><span class="stick-direction east" aria-hidden="true">▶</span>' +
      '<span class="stick-knob" aria-hidden="true"></span><span class="stick-label" aria-hidden="true">按住拖曳</span></div>';
  }
  function mount(viewport, {move, end, locked = () => false}) {
    const stick = viewport.querySelector(".touch-joystick");
    if (!stick) return {reset() {}, stop() {}};
    let pointer = null, direction = null, disposed = false;
    const neutral = () => {
      direction = null;
      stick.classList.remove("is-active");
      stick.style.setProperty("--stick-x", "0px");
      stick.style.setProperty("--stick-y", "0px");
      delete stick.dataset.direction;
    };
    function reset() {
      const prior = pointer;
      pointer = null;
      neutral();
      if (prior !== null) {
        if (stick.hasPointerCapture(prior)) stick.releasePointerCapture(prior);
        end();
      }
    }
    function update(event) {
      if (locked()) { reset(); return; }
      const rect = stick.getBoundingClientRect();
      const radius = rect.width * .31;
      const dx = event.clientX - rect.left - rect.width / 2;
      const dy = event.clientY - rect.top - rect.height / 2;
      const distance = Math.hypot(dx, dy);
      const fraction = distance ? Math.min(distance, radius) / distance : 0;
      stick.style.setProperty("--stick-x", dx * fraction + "px");
      stick.style.setProperty("--stick-y", dy * fraction + "px");
      const strength = Math.max(0, Math.min(1, (distance / radius - .22) / .78));
      if (!strength) direction = null;
      else {
        // A small diagonal margin keeps a nearly straight drag from flickering between axes.
        const horizontal = direction === "left" || direction === "right";
        const useX = direction ? Math.abs(dx) > Math.abs(dy) * (horizontal ? .82 : 1.18) : Math.abs(dx) >= Math.abs(dy);
        direction = useX ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
      }
      if (direction) stick.dataset.direction = direction;
      else delete stick.dataset.direction;
      move({x: distance ? dx / distance * strength : 0, y: distance ? dy / distance * strength : 0, direction});
    }
    function down(event) {
      if (disposed || pointer !== null || event.button !== 0 || !event.isPrimary || locked()) return;
      event.preventDefault();
      event.stopPropagation();
      pointer = event.pointerId;
      stick.setPointerCapture(pointer);
      stick.classList.add("is-active");
      update(event);
    }
    function drag(event) {
      if (event.pointerId !== pointer) return;
      event.preventDefault();
      event.stopPropagation();
      update(event);
    }
    function release(event) { if (event.pointerId === pointer) reset(); }
    function visibility() { if (document.hidden) reset(); }
    function click(event) { event.preventDefault(); event.stopPropagation(); }
    stick.addEventListener("pointerdown", down);
    stick.addEventListener("pointermove", drag);
    stick.addEventListener("pointerup", release);
    stick.addEventListener("pointercancel", release);
    stick.addEventListener("lostpointercapture", release);
    stick.addEventListener("click", click);
    window.addEventListener("blur", reset);
    window.addEventListener("resize", reset);
    document.addEventListener("visibilitychange", visibility);
    return {reset, stop() {
      disposed = true;
      reset();
      stick.removeEventListener("pointerdown", down);
      stick.removeEventListener("pointermove", drag);
      stick.removeEventListener("pointerup", release);
      stick.removeEventListener("pointercancel", release);
      stick.removeEventListener("lostpointercapture", release);
      stick.removeEventListener("click", click);
      window.removeEventListener("blur", reset);
      window.removeEventListener("resize", reset);
      document.removeEventListener("visibilitychange", visibility);
    }};
  }
  const target = fallback => mobile() ? ".touch-joystick" : fallback;
  window.BreathTouchControls = {render, mount, mobile, target};
})();
