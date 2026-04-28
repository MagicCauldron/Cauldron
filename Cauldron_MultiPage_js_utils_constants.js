
export const CATEGORIES = [
  { label: 'Meat', icon: '🥩', color: '#E05252' },
  { label: 'Vegetables', icon: '🥦', color: '#52B356' },
  { label: 'Fruits', icon: '🍎', color: '#F5C542' },
  { label: 'Dairy', icon: '🥛', color: '#4BAEE8' },
  { label: 'Spices', icon: '🌶️', color: '#F4883E' },
  { label: 'Other', icon: '🧴', color: '#9B6EC8' }
];

export const INGREDIENTS_DB = {
  'Vegetables': {
    'Leafy': [
      { name: 'Spinach', icon: '🥬', active: true },
      { name: 'Kale', icon: '🥬', active: false }
    ],
    'Root': [
      { name: 'Carrots', icon: '🥕', active: true },
      { name: 'Potatoes', icon: '🥔', active: true },
      { name: 'Onions', icon: '🧅', active: true }
    ]
  },
  'Fruits': {
    'Apples': [
      { name: 'Red Apple', icon: '🍎', active: true },
      { name: 'Green Apple', icon: '🍏', active: false }
    ],
    'Berries': [
      { name: 'Strawberry', icon: '🍓', active: true },
      { name: 'Blueberry', icon: '🫐', active: false }
    ]
  },
  'Meat': {
    'Poultry': [{ name: 'Chicken', icon: '🍗', active: true }],
    'Red': [{ name: 'Beef', icon: '🥩', active: false }]
  }
};

// Ensure all categories have a skeleton if not in DB
CATEGORIES.forEach(c => {
  if (!INGREDIENTS_DB[c.label]) INGREDIENTS_DB[c.label] = { 'All': [{name: 'Sample', icon: c.icon, active: false}] };
});

export const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'pantry', label: 'Pantry', icon: '🥫' },
  { id: 'shopping', label: 'List', icon: '🛒' },
  { id: 'profile', label: 'Settings', icon: '⚙️' }
];
