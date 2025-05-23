/**
 * Theme management for Foundry Local with Browser Automation
 * 
 * This script handles theme toggling (dark/light mode) and UI animations.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme from system preference
  initializeTheme();
  
  // Initialize animations
  initializeAnimations();
});

// Initialize theme based on system preference or stored setting
function initializeTheme() {
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const storedTheme = localStorage.getItem('theme');
  
  // Set initial theme
  if (storedTheme === 'dark' || (storedTheme === null && systemPrefersDark)) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  
  // Add theme toggle to the UI (if not already present)
  createThemeToggle();
  
  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (localStorage.getItem('theme') === null) { // Only auto-switch if user hasn't manually set a preference
      if (e.matches) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    }
  });
}

// Create theme toggle button in the UI
function createThemeToggle() {
  // Check if toggle already exists
  if (document.getElementById('theme-toggle')) {
    return;
  }
  
  const header = document.querySelector('header');
  if (!header) return;
  
  const themeToggle = document.createElement('button');
  themeToggle.id = 'theme-toggle';
  themeToggle.className = 'theme-toggle';
  themeToggle.setAttribute('aria-label', 'Toggle dark/light theme');
  themeToggle.innerHTML = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
  
  // Style the toggle button
  themeToggle.style.background = 'transparent';
  themeToggle.style.border = 'none';
  themeToggle.style.fontSize = '1.2rem';
  themeToggle.style.cursor = 'pointer';
  themeToggle.style.marginLeft = '15px';
  themeToggle.style.opacity = '0.8';
  themeToggle.style.transition = 'all 0.3s ease';
  
  // Add hover effect
  themeToggle.addEventListener('mouseover', () => {
    themeToggle.style.opacity = '1';
    themeToggle.style.transform = 'scale(1.1)';
  });
  
  themeToggle.addEventListener('mouseout', () => {
    themeToggle.style.opacity = '0.8';
    themeToggle.style.transform = 'scale(1)';
  });
  
  // Add click handler to toggle theme
  themeToggle.addEventListener('click', toggleTheme);
  
  // Add to the UI
  header.appendChild(themeToggle);
}

// Toggle between dark and light themes
function toggleTheme() {
  const isDarkMode = document.body.classList.contains('dark-mode');
  const themeToggle = document.getElementById('theme-toggle');
  
  if (isDarkMode) {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light');
    if (themeToggle) themeToggle.innerHTML = '🌙';
  } else {
    document.body.classList.add('dark-mode');
    localStorage.setItem('theme', 'dark');
    if (themeToggle) themeToggle.innerHTML = '☀️';
  }
  
  // Flash animation on theme change
  addThemeChangeAnimation();
}

// Add a subtle flash animation when changing themes
function addThemeChangeAnimation() {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.right = '0';
  overlay.style.bottom = '0';
  overlay.style.backgroundColor = document.body.classList.contains('dark-mode') ? '#000' : '#fff';
  overlay.style.opacity = '0.1';
  overlay.style.zIndex = '9999';
  overlay.style.pointerEvents = 'none';
  document.body.appendChild(overlay);
  
  // Animate and remove
  setTimeout(() => {
    overlay.style.transition = 'opacity 1s ease';
    overlay.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(overlay);
    }, 1000);
  }, 10);
}

// Initialize animations for UI elements
function initializeAnimations() {
  // Add entry animation to cards
  const cards = document.querySelectorAll('.card');
  cards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 100 + index * 100);
  });
  
  // Add hover effects to buttons if not already in CSS
  const buttons = document.querySelectorAll('button:not(.tab):not(.theme-toggle)');
  buttons.forEach(button => {
    button.addEventListener('mouseenter', () => {
      if (!button.disabled) {
        button.style.transform = 'translateY(-2px)';
        button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
      }
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = '';
      button.style.boxShadow = '';
    });
  });
}
