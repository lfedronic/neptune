const button = document.getElementById('overlay-button');
let chatOpen = false;

const updateState = () => {
  button.setAttribute('aria-pressed', chatOpen ? 'true' : 'false');
  button.classList.toggle('active', chatOpen);
};

button.addEventListener('click', () => {
  if (chatOpen) {
    window.electronAPI.hideChat();
  } else {
    window.electronAPI.openChat();
  }
});

window.electronAPI.onChatOpened(() => {
  chatOpen = true;
  updateState();
});

window.electronAPI.onChatClosed(() => {
  chatOpen = false;
  updateState();
});

updateState();
