
import { NAV_ITEMS } from '../utils/constants.js';

export function initNavBar() {
  const navContainer = document.getElementById('bottomNav');
  if (!navContainer) return;
  navContainer.innerHTML = '';

  const path = window.location.pathname;

  NAV_ITEMS.forEach((item) => {
    const isHome = (item.id === 'home' && (path.endsWith('index.html') || path.endsWith('/')));
    const isActive = isHome || path.includes(item.id);

    const link = document.createElement('a');
    link.href = item.id === 'home' ? 'index.html' : `${item.id}.html`;
    link.style.textDecoration = 'none';
    
    const div = document.createElement('div');
    div.className = `nav-item ${isActive ? 'active' : ''}`;
    div.innerHTML = `<span class="nav-icon">${item.icon}</span><span>${item.label}</span>`;
    
    link.appendChild(div);
    navContainer.appendChild(link);
  });
}
