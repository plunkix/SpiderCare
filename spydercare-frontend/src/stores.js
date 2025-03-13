import { writable } from 'svelte/store';

// Initialize with values from localStorage if available
const storedProfile = localStorage.getItem('userProfile');
const initialProfile = storedProfile ? JSON.parse(storedProfile) : {
    profilePicUrl: '',
    theme: 'dark'
};

export const userProfile = writable(initialProfile);

// Subscribe to changes and update localStorage
userProfile.subscribe(value => {
    localStorage.setItem('userProfile', JSON.stringify(value));
}); 