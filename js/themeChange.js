// Check for saved theme preference or use the system preference
const themeToggleBtn = document.getElementById('theme-toggle');

// Function to set the theme
function setTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('color-theme', theme);
}

// Initialize theme
function initializeTheme() {
    // Check for stored theme preference
    const storedTheme = localStorage.getItem('color-theme');
    
    // If theme is stored, use it
    if (storedTheme) {
        setTheme(storedTheme);
    } 
    // Otherwise check system preference
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
    } else {
        setTheme('light');
    }
}

// Toggle theme when button is clicked
themeToggleBtn.addEventListener('click', () => {
    // Toggle theme
    if (document.documentElement.classList.contains('dark')) {
        setTheme('light');
    } else {
        setTheme('dark');
    }
});

// Set initial theme on page load
initializeTheme();

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    const newTheme = e.matches ? 'dark' : 'light';
    // Only update if user hasn't manually set a preference
    if (!localStorage.getItem('color-theme')) {
        setTheme(newTheme);
    }
});