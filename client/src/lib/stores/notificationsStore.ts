import { writable } from 'svelte/store';
import type { Notification } from '../types';

export const notifications = writable<Notification[]>([]);

