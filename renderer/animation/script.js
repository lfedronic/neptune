const cursor = document.getElementById('cursor');
const tooltip = document.getElementById('tooltip');
const tooltipText = document.getElementById('tooltip-text');

let animationFrame;
let dwellTimeout;

function setCursorPosition(x, y) {
  cursor.style.left = `${x}px`;
  cursor.style.top = `${y}px`;
}

function setTooltipPosition(x, y, message) {
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
  tooltipText.textContent = message;
}

function animatePoints(payload) {
  const { points = [], origin = null } = Array.isArray(payload)
    ? { points: payload, origin: null }
    : payload || {};

  if (!Array.isArray(points) || points.length === 0) {
    window.electronAPI.animationComplete();
    return;
  }

  cancelAnimationFrame(animationFrame);
  clearTimeout(dwellTimeout);

  const sequence = points.map((point) => ({ ...point }));
  const travelDuration = 750;
  const dwellDuration = 700;
  const entryDuration = 520;

  let currentIndex = 0;

  const queueNext = () => {
    clearTimeout(dwellTimeout);
    if (currentIndex >= sequence.length - 1) {
      dwellTimeout = setTimeout(finishAnimation, dwellDuration);
    } else {
      dwellTimeout = setTimeout(moveToNext, dwellDuration);
    }
  };

  const startAtFirstPoint = () => {
    const first = sequence[0];
    currentIndex = 0;
    setCursorPosition(first.x, first.y);
    setTooltipPosition(first.x, first.y, first.message);
    tooltip.classList.remove('hidden');
    tooltip.classList.add('visible');
    queueNext();
  };

  const moveToNext = () => {
    if (currentIndex >= sequence.length - 1) {
      finishAnimation();
      return;
    }

    const start = sequence[currentIndex];
    const target = sequence[currentIndex + 1];
    const startTime = performance.now();

    const step = (now) => {
      const progress = Math.min((now - startTime) / travelDuration, 1);
      const eased = easeOutCubic(progress);
      const x = start.x + (target.x - start.x) * eased;
      const y = start.y + (target.y - start.y) * eased;
      setCursorPosition(x, y);
      setTooltipPosition(x, y, target.message);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      } else {
        currentIndex += 1;
        queueNext();
      }
    };

    animationFrame = requestAnimationFrame(step);
  };

  cursor.style.opacity = '1';

  if (origin) {
    tooltip.classList.add('hidden');
    tooltip.classList.remove('visible');
    const entryStart = performance.now();
    const entryOrigin = { x: origin.x, y: origin.y };
    const first = sequence[0];

    const entryStep = (now) => {
      const progress = Math.min((now - entryStart) / entryDuration, 1);
      const eased = easeOutCubic(progress);
      const x = entryOrigin.x + (first.x - entryOrigin.x) * eased;
      const y = entryOrigin.y + (first.y - entryOrigin.y) * eased;
      setCursorPosition(x, y);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(entryStep);
      } else {
        startAtFirstPoint();
      }
    };

    animationFrame = requestAnimationFrame(entryStep);
  } else {
    startAtFirstPoint();
  }
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function finishAnimation() {
  cancelAnimationFrame(animationFrame);
  clearTimeout(dwellTimeout);
  cursor.style.opacity = '0';
  tooltip.classList.remove('visible');
  tooltip.classList.add('hidden');
  window.electronAPI.animationComplete();
}

window.electronAPI.onStartAnimation((payload) => {
  cursor.style.opacity = '0';
  tooltip.classList.add('hidden');
  tooltip.classList.remove('visible');
  animatePoints(payload);
});
