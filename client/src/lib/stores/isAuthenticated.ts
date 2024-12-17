import { httpGET } from '$lib/httpRequests';
import { writable } from 'svelte/store';
import { initializeSocket } from "$lib/socket";

export const isAuthenticated = writable(false);

export async function checkAuth() {
  try {
    const response = await httpGET('/account/check-auth');
    const data = await response.json();
    isAuthenticated.set(data.authenticated);
    if (data.authenticated) {
      const token = sessionStorage.getItem('token');
      if (token) {
        initializeSocket();
      }
    }
  } catch (error) {
    // console.error('Erreur d\'authentification :', error);
    isAuthenticated.set(false);
  }
}
