(() => {
  'use strict';

  const duration = 880;
  const stripCount = 24;
  const depth = .64;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const smooth = (value) => value * value * (3 - 2 * value);

  function makeFace(leaf, offset, width, side) {
    const face = document.createElement('div');
    face.className = `curl-face curl-${side}`;
    const content = leaf.cloneNode(true);
    content.style.width = `${width}px`;
    content.style.left = `${-offset}px`;
    face.append(content);
    return face;
  }

  function play({sheet, rest, front, back, width, direction, onContact, onFinish}) {
    const step = width / stripCount;
    const shadow = document.createElement('div');
    shadow.className = 'curl-shadow';
    shadow.style.width = `${width * .68}px`;

    const strips = [];
    for (let i = 0; i < stripCount; i++) {
      const start = i * step;
      const reverseStart = width - (i + 1) * step;
      const strip = document.createElement('div');
      strip.className = 'curl-strip';
      strip.style.width = `${step + (i === stripCount - 1 ? 0 : .48)}px`;
      strip.append(
        makeFace(front, direction > 0 ? start : reverseStart, width, 'front'),
        makeFace(back, direction > 0 ? reverseStart : start, width, 'back')
      );
      strips.push(strip);
    }
    sheet.append(shadow, ...strips);

    function render(elapsed) {
      // A slowly lifting free edge leads the turn. Adjacent strip hinges
      // meet along one continuous cross-section from the spine to the tip.
      const p = smooth(elapsed);
      const phase = Math.PI * p;
      const bend = Math.sin(phase);
      const landing = smooth(clamp((elapsed - .70) / .30, 0, 1));
      let x = 0;
      let z = 0;
      let y = 0;

      for (let i = 0; i < stripCount; i++) {
        const strip = strips[i];
        const u = (i + .5) / stripCount;
        const airAngle = clamp(phase + 2.32 * bend * (u - .46), 0, Math.PI);
        // The inner part settles first, with a slight curl left at the tip.
        const contactAngle = Math.PI - .19 * (1 - landing) * u ** 2;
        const angle = airAngle + (contactAngle - airAngle) * landing;
        const dx = direction * step * Math.cos(angle);
        const dz = depth * step * Math.sin(angle);
        const nextY = -10 * bend * (1 - landing) * ((i + 1) / stripCount) ** 2;
        const dy = nextY - y;
        const reverse = angle > Math.PI / 2;
        // Each face keeps its text upright. The switch happens edge-on,
        // when that strip has virtually no visible width.
        const along = direction * (reverse ? -1 : 1);
        const vx = along * dx / step;
        const vy = along * dy / step;
        const vz = along * dz / step;
        const fromEnd = along < 0;
        const originX = x + (fromEnd ? dx : 0);
        const originY = fromEnd ? nextY : y;
        const originZ = z + (fromEnd ? dz : 0);
        strip.style.transform = `matrix3d(${vx},${vy},${vz},0,0,1,0,0,${-vz},0,${vx},0,${originX},${originY},${originZ},1)`;
        strip.toggleAttribute('data-reverse', reverse);
        const shade = bend * (.05 + .28 * Math.sin(angle) ** 2);
        strip.style.setProperty('--shade', shade.toFixed(3));
        x += dx;
        y = nextY;
        z += dz;
      }

      const height = clamp(z / (width * .5), 0, 1);
      const falloff = .08 + .92 * Math.sqrt(height);
      const center = x * (.48 + landing * .43);
      const visible = smooth(clamp(elapsed / .12, 0, 1)) * (1 - smooth(clamp((elapsed - .94) / .06, 0, 1)));
      shadow.style.transform = `translate3d(${center - width * .34}px,0,0) scaleX(${falloff})`;
      shadow.style.opacity = ((.52 - height * .25) * visible).toFixed(3);
      rest.style.opacity = (1 - clamp((elapsed - .59) / .26, 0, 1)).toFixed(3);
    }

    let frame;
    let started;
    let contacted = false;
    function tick(now) {
      started ??= now;
      const elapsed = (now - started) / duration;
      if (elapsed >= 1) {
        onFinish();
        return;
      }
      render(elapsed);
      if (!contacted && elapsed >= .84) {
        contacted = true;
        onContact();
      }
      frame = requestAnimationFrame(tick);
    }

    render(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }

  window.HarstokCurl = {play};
})();
