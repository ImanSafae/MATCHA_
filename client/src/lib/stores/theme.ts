import { writable } from "svelte/store";
import type { Theme } from "$lib/themes";
import { themes } from "$lib/themes";

export const theme = writable<Theme>(themes[0]);