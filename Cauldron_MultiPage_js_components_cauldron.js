
export function initCauldron() {
  const container = document.getElementById('cauldronContainer');
  if(!container) return;
  
  container.innerHTML = `
    <svg class="cauldron-svg" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="pGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFD166" /><stop offset="100%" stop-color="#FF6B35" />
        </linearGradient>
      </defs>
      <circle cx="85" cy="75" r="8" fill="#FFD166"><animate attributeName="cy" values="75;55;75" dur="2s" repeatCount="indefinite"/></circle>
      <circle cx="115" cy="80" r="6" fill="#FFAA00"><animate attributeName="cy" values="80;60;80" dur="2.5s" repeatCount="indefinite"/></circle>
      <path d="M40 85 C30 140 50 170 100 170 C150 170 170 140 160 85 Z" fill="url(#pGrad)" />
      <ellipse cx="100" cy="85" rx="60" ry="12" fill="#D35400" />
    </svg>
  `;
  container.onclick = () => alert("✨ Finding magic recipes for your selected items!");
}
