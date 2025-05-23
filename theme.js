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
  
  // Update button styling for the active theme
  updateButtonsForTheme();
});

// Initialize theme based on system preference or stored setting
function initializeTheme() {
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const storedTheme = localStorage.getItem('theme');
  
  // Set initial theme
  if (storedTheme === 'dark' || (storedTheme === null && systemPrefersDark)) {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
  } else {
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
  }
  
  // Add theme toggle to the UI (if not already present)
  createThemeToggle();
  
  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (localStorage.getItem('theme') === null) { // Only auto-switch if user hasn't manually set a preference
      if (e.matches) {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) themeToggle.innerHTML = '☀️';
      } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) themeToggle.innerHTML = '🌙';
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
  
  const container = document.querySelector('.container');
  if (!container) return;
  
  const themeToggle = document.createElement('button');
  themeToggle.id = 'theme-toggle';
  themeToggle.className = 'theme-toggle';
  themeToggle.setAttribute('aria-label', 'Toggle dark/light theme');
  themeToggle.innerHTML = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
  
  // Add click handler to toggle theme
  themeToggle.addEventListener('click', toggleTheme);
  
  // Add to the UI at the top of the container
  container.prepend(themeToggle);
}

// Toggle between dark and light themes
function toggleTheme() {
  const isDarkMode = document.body.classList.contains('dark-mode');
  const themeToggle = document.getElementById('theme-toggle');
  
  if (isDarkMode) {
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
    localStorage.setItem('theme', 'light');
    if (themeToggle) themeToggle.innerHTML = '🌙';
  } else {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
    localStorage.setItem('theme', 'dark');
    if (themeToggle) themeToggle.innerHTML = '☀️';
  }
  
  // Flash animation on theme change
  addThemeChangeAnimation();
}

// Add a subtle flash animation when changing themes
function addThemeChangeAnimation() {
  // Apply transition class to the body
  document.body.classList.add('theme-transition');
  
  // Create transition overlay
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
    overlay.style.transition = 'opacity 0.8s ease';
    overlay.style.opacity = '0';
    
    // Remove the overlay and class after animation completes
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
      document.body.classList.remove('theme-transition');
    }, 800);
  }, 10);
  
  // Update all button stylings
  updateButtonsForTheme();
}

// Update buttons for theme changes
function updateButtonsForTheme() {
  // Find all buttons
  const buttons = document.querySelectorAll('button:not(.tab):not(.theme-toggle)');
  
  // Add appropriate spacing and styling
  buttons.forEach(button => {
    // Make sure buttons have proper margin
    if (window.getComputedStyle(button).margin === '0px') {
      button.style.margin = '4px';
    }
    
    // Ensure proper transitions
    if (window.getComputedStyle(button).transition === 'none') {
      button.style.transition = 'all 0.2s ease';
    }
  });
  
  // Check if dark mode is active
  const isDarkMode = document.body.classList.contains('dark-mode');
  
  // Apply special styling to improve dark mode appearance if needed
  if (isDarkMode) {
    // Ensure buttons have better contrast in dark mode
    document.querySelectorAll('.secondary-button').forEach(btn => {
      if (window.getComputedStyle(btn).backgroundColor === 'transparent') {
        btn.style.backgroundColor = '#333';
      }
    });
  }
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
