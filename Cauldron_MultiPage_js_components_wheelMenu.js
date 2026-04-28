
export function initWheelMenu(categories) {
  const container = document.getElementById('wheelMenu');
  if(!container) return;

  const radius = 145;
  const centerX = 170;
  const centerY = 160;
  const startAngle = Math.PI; 
  const angleStep = Math.PI / (categories.length - 1);

  categories.forEach((cat, index) => {
    const angle = startAngle - (index * angleStep);
    const x = centerX + radius * Math.cos(angle) - 36;
    const y = centerY - radius * Math.sin(angle) - 36;

    const btn = document.createElement('div');
    btn.className = `wheel-btn ${cat.label === 'Vegetables' ? 'active' : ''}`;
    btn.style.left = `${x}px`;
    btn.style.top = `${y}px`;
    btn.style.backgroundColor = cat.color;
    btn.innerHTML = `<span class="icon">${cat.icon}</span><span class="label">${cat.label}</span>`;

    btn.onclick = () => {
      document.querySelectorAll('.wheel-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
    container.appendChild(btn);
  });
}
