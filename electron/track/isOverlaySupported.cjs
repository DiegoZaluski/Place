/**
 * Checks if the current system supports transparent overlay windows.
 * 
 * @returns {boolean} True if overlay windows are supported, false otherwise.
 */
function isOverlaySupported() {
  if (process.platform === 'win32') return true;
  if (process.platform === 'darwin') return false;
  
  if (process.platform === 'linux') {
    const desktop = (process.env.XDG_CURRENT_DESKTOP || '').toLowerCase();
    
    if (desktop.includes('gnome') || desktop.includes('ubuntu') || 
        desktop.includes('pop') || desktop.includes('pantheon')) {
      return false;
    }
    
    if (desktop.includes('kde') || desktop.includes('plasma') ||
        desktop.includes('xfce') || desktop.includes('mate') ||
        desktop.includes('lxqt') || desktop.includes('cinnamon')) {
      return true;
    }
    
    return false;
  }
  
  return false;
}

module.exports = isOverlaySupported;