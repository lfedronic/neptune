const textarea = document.getElementById('chat-input');
const status = document.getElementById('status');
let displayInfo;

function adjustHeight() {
  textarea.style.height = 'auto';
  const maxHeight = parseInt(getComputedStyle(textarea).getPropertyValue('max-height'), 10);
  const newHeight = Math.min(maxHeight, textarea.scrollHeight);
  textarea.style.height = `${Math.max(newHeight, 40)}px`;
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
});

textarea.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    captureAndSave();
  }
});

window.electronAPI.onChatOpened(() => {
  status.textContent = '';
  adjustHeight();
  textarea.focus();
});

adjustHeight();
