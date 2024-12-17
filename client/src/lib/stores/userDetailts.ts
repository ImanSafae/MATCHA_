import { writable } from "svelte/store";

import { UserDetails } from "../../types/UserDetails";

export const userDetails = writable<UserDetails | null>(null);