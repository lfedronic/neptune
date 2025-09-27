const textarea = document.getElementById('chat-input');
const status = document.getElementById('status');
const sendButton = document.getElementById('send-button');
const collapseButton = document.getElementById('collapse-chat');
const insightCard = document.querySelector('.insight-card');
const insightLabel = document.getElementById('insight-label');
const insightTitle = document.getElementById('insight-title');
const insightDescription = document.getElementById('insight-description');
const insightSteps = document.getElementById('insight-steps');
const insightCounter = document.getElementById('insight-counter');
const prevButton = document.getElementById('insight-prev');
const nextButton = document.getElementById('insight-next');

let displayInfo;
let currentSlide = 0;

const slides = [
  {
    id: 'overview',
    label: 'Overview',
    title: 'All systems ready',
    description:
      'Neptune keeps a floating eye on your canvas. Capture a moment and the copilot will weave the story, complete with highlights and ready-to-share context.'
  },
  {
    id: 'steps',
    label: 'Next Steps',
    title: 'Your next moves',
    description: 'Follow these luminous steps to get the most out of your next capture.',
    steps: [
      {
        title: 'Mark what matters',
        detail: 'Point the glowing cursor at the area you need the copilot to analyze first.'
      },
      {
        title: 'Let Neptune annotate',
        detail: 'We layer in guidance, callouts, and next actions while you stay focused on the task.'
      },
      {
        title: 'Share the walkthrough',
        detail: 'Send polished highlights to your team or replay them anytime from your capture log.'
      }
    ]
  }
];

function padIndex(value) {
  return String(value).padStart(2, '0');
}

function updateInsight(index) {
  const slide = slides[index];
  if (!slide) {
    return;
  }

  currentSlide = index;
  insightLabel.textContent = slide.label;
  insightTitle.textContent = slide.title;
  insightDescription.textContent = slide.description;
  insightCard.dataset.state = slide.steps ? 'steps' : 'overview';

  insightSteps.innerHTML = '';
  if (slide.steps) {
    slide.steps.forEach((step) => {
      const item = document.createElement('li');
      const heading = document.createElement('strong');
      heading.textContent = step.title;
      const detail = document.createElement('span');
      detail.textContent = step.detail;
      item.append(heading, detail);
      insightSteps.appendChild(item);
    });
  }

  insightCounter.textContent = `${padIndex(index + 1)} / ${padIndex(slides.length)}`;
  prevButton.disabled = index === 0;
  nextButton.disabled = index === slides.length - 1;

  insightCard.classList.remove('enter');
  void insightCard.offsetWidth;
  insightCard.classList.add('enter');
}

function adjustHeight() {
  textarea.style.height = 'auto';
  const maxHeight = parseInt(getComputedStyle(textarea).getPropertyValue('max-height'), 10);
  const newHeight = Math.min(maxHeight, textarea.scrollHeight);
  textarea.style.height = `${Math.max(newHeight, 56)}px`;
}

function updateSendButtonState() {
  const hasText = textarea.value.trim().length > 0;
  sendButton.classList.toggle('is-ready', hasText);
}

async function ensureDisplayInfo() {
  if (!displayInfo) {
    displayInfo = await window.electronAPI.getPrimaryDisplay();
  }
  return displayInfo;
}

async function captureAndSave() {
  const text = textarea.value.trim();
  if (!text) {
    status.textContent = 'Type a message before submitting.';
    updateSendButtonState();
    return;
  }

  status.textContent = 'Capturing screen…';

  const display = await ensureDisplayInfo();
  const capture = await window.captureAPI.capturePrimaryDisplay(
    display.id,
    display.width * display.scaleFactor,
    display.height * display.scaleFactor
  );

  if (!capture.ok) {
    status.textContent = 'Screen capture unavailable. Please grant permission.';
    window.electronAPI.showPermissionDialog();
    return;
  }

  try {
    const downscaled = await downscaleDataUrl(capture.dataURL, 0.5);
    await window.electronAPI.saveCapture({ dataURL: downscaled });
    textarea.value = '';
    adjustHeight();
    updateSendButtonState();
    status.textContent = '';
    window.electronAPI.hideChat();
    window.electronAPI.startCursorAnimation();
  } catch (error) {
    console.error(error);
    status.textContent = 'Failed to save capture. Please try again.';
  }
}

async function downscaleDataUrl(dataUrl, scale) {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

textarea.addEventListener('input', () => {
  adjustHeight();
  status.textContent = '';
  updateSendButtonState();
});

textarea.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    captureAndSave();
  }
});

sendButton.addEventListener('click', (event) => {
  event.preventDefault();
  captureAndSave();
});

collapseButton.addEventListener('click', () => {
  window.electronAPI.hideChat();
});

prevButton.addEventListener('click', () => {
  updateInsight(Math.max(0, currentSlide - 1));
});

nextButton.addEventListener('click', () => {
  updateInsight(Math.min(slides.length - 1, currentSlide + 1));
});

window.electronAPI.onChatOpened(() => {
  status.textContent = '';
  adjustHeight();
  textarea.focus();
  updateInsight(currentSlide);
  updateSendButtonState();
});

window.electronAPI.onChatClosed(() => {
  textarea.blur();
});

updateInsight(0);
adjustHeight();
updateSendButtonState();
