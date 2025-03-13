import { writable } from 'svelte/store';

// Get initial theme from localStorage or default to 'dark'
const storedTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') || 'dark' : 'dark';

export const theme = writable(storedTheme);

// Subscribe to theme changes and update localStorage and body class
theme.subscribe(value => {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('theme', value);
        document.body.classList.remove('light', 'dark');
        document.body.classList.add(value);
    }
});
