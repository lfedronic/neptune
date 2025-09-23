const cursor = document.getElementById('cursor');
const tooltip = document.getElementById('tooltip');
const tooltipText = document.getElementById('tooltip-text');

let animationFrame;

function setCursorPosition(x, y) {
  cursor.style.left = `${x}px`;
  cursor.style.top = `${y}px`;
}

function setTooltipPosition(x, y, message) {
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
  tooltipText.textContent = message;
}

function animatePoints(points) {
  if (!points || points.length === 0) {
    window.electronAPI.animationComplete();
    return;
  }

  cursor.style.opacity = '1';
  tooltip.classList.remove('hidden');
  tooltip.classList.add('visible');

  let currentIndex = 0;
  let currentPosition = { x: points[0].x, y: points[0].y };
  setCursorPosition(currentPosition.x, currentPosition.y);
  setTooltipPosition(currentPosition.x, currentPosition.y, points[0].message);

  const travelDuration = 750;
  const dwellDuration = 700;

  const moveToNext = () => {
    if (currentIndex >= points.length - 1) {
      finishAnimation();
      return;
    }

    const start = { ...currentPosition };
    const target = points[currentIndex + 1];
    const startTime = performance.now();

    const step = (now) => {
      const progress = Math.min((now - startTime) / travelDuration, 1);
      const eased = easeOutCubic(progress);
      const x = start.x + (target.x - start.x) * eased;
      const y = start.y + (target.y - start.y) * eased;
      currentPosition = { x, y };
      setCursorPosition(x, y);
      setTooltipPosition(x, y, target.message);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      } else {
        currentIndex += 1;
        setTimeout(moveToNext, dwellDuration);
      }
    };

    animationFrame = requestAnimationFrame(step);
  };

  setTimeout(() => {
    if (points.length === 1) {
      finishAnimation();
    } else {
      moveToNext();
    }
  }, dwellDuration);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function finishAnimation() {
  cancelAnimationFrame(animationFrame);
  cursor.style.opacity = '0';
  tooltip.classList.remove('visible');
  tooltip.classList.add('hidden');
  window.electronAPI.animationComplete();
}

window.electronAPI.onStartAnimation((points) => {
  cursor.style.opacity = '0';
  tooltip.classList.add('hidden');
  tooltip.classList.remove('visible');
  animatePoints(points);
});
