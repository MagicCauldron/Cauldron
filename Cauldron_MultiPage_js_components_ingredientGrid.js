
import { INGREDIENTS_DB } from '../utils/constants.js';

export function initIngredientGrid(categoryLabel) {
  const subcatTabs = document.getElementById('subcatTabs');
  const grid = document.getElementById('ingredientGrid');
  if(!grid) return;
  
  if(subcatTabs) subcatTabs.innerHTML = '';
  grid.innerHTML = '';

  const categoryData = INGREDIENTS_DB[categoryLabel];
  if (!categoryData) return;

  const subcats = Object.keys(categoryData);
  let activeSubcat = subcats[0];

  if (subcatTabs && subcats.length > 0) {
    subcats.forEach((sub, idx) => {
      const tab = document.createElement('button');
      tab.className = `subcat-tab ${idx === 0 ? 'active' : ''}`;
      tab.innerText = sub;
      tab.onclick = () => {
        document.querySelectorAll('#subcatTabs .subcat-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeSubcat = sub;
        renderItems();
      };
      subcatTabs.appendChild(tab);
    });
  }

  function renderItems() {
    grid.innerHTML = '';
    categoryData[activeSubcat].forEach(item => {
      const card = document.createElement('div');
      card.className = `ing-card ${item.active ? 'active' : 'inactive'}`;
      card.innerHTML = `
        <div class="ing-icon-wrapper">
          <span>${item.icon}</span>
          <div class="check-badge">✓</div>
        </div>
        <div class="ing-label">${item.name}</div>
      `;
      card.onclick = () => {
        item.active = !item.active;
        renderItems();
      };
      grid.appendChild(card);
    });
  }
  renderItems();
}
