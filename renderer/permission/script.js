const settingsButton = document.getElementById('settings');
const closeButton = document.getElementById('close');

settingsButton.addEventListener('click', () => {
  window.electronAPI.openSystemSettings();
});

closeButton.addEventListener('click', () => {
  window.electronAPI.closePermissionDialog();
});
