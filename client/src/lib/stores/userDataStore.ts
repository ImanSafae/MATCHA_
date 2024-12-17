import { writable } from "svelte/store";
import { browser } from "$app/environment";

let initialUser: User | null = null;

if (browser) {
    const persistedUser = sessionStorage.getItem('userData');
    
    if (persistedUser) {
        try {
            initialUser = JSON.parse(persistedUser);
        } catch (error) {
            // console.error('Failed to parse persisted user data:', error);
        }
    }
}

export const userData = writable<User | null>(initialUser);

if (browser) {
    userData.subscribe((value: any) => {
        if (value !== null) {
            sessionStorage.setItem('userData', JSON.stringify(value));
        }
    });
}

export function addLikedProfile(id: number) {
    userData.update(currentData => {
        // Vérifiez que currentData n'est pas null
        if (!currentData) {
            // console.error("User data is null");
            return currentData; // Ne rien faire si currentData est null
        }

        // Vérifiez que likedProfiles est bien un tableau
        if (!Array.isArray(currentData.likedProfiles)) {
            currentData.likedProfiles = [];
        }

        // Ajoutez le profil aimé
        if (!currentData.likedProfiles.includes(id)) {
            return {
                ...currentData,
                likedProfiles: [...currentData.likedProfiles, id]
            };
        }

        return currentData;
    });
}

export function addMatchedProfile(id: number | undefined) {
    if (!id) {
        // console.error("Couldn't add matched profile: id is undefined");
        return ;
    }
    userData.update(currentData => {
        // Vérifiez que currentData n'est pas null
        if (!currentData) {
            // console.error("User data is null");
            return currentData; // Ne rien faire si currentData est null
        }

        // Vérifiez que likedProfiles est bien un tableau
        if (!Array.isArray(currentData.matched)) {
            currentData.matched = [];
        }

        // Ajoutez le profil aimé
        if (!currentData.matched.includes(id)) {
            return {
                ...currentData,
                matched: [...currentData.matched, id]
            };
        }

        return currentData;
    });
}

export function removeLikedProfile(id: number) {
    userData.update(currentData => {
        // Vérifiez que currentData n'est pas null
        if (!currentData) {
            // console.error("User data is null");
            return currentData; // Ne rien faire si currentData est null
        }

        // Vérifiez que likedProfiles est bien un tableau
        if (!Array.isArray(currentData.likedProfiles)) {
            currentData.likedProfiles = [];
        }

        // Retirez le profil aimé
        return {
            ...currentData,
            likedProfiles: currentData.likedProfiles.filter(profileId => profileId !== id)
        };
    });
}

export function removeMatchedProfile(id: number) {
    userData.update(currentData => {
        // Vérifiez que currentData n'est pas null
        if (!currentData) {
            // console.error("User data is null");
            return currentData; // Ne rien faire si currentData est null
        }

        // Vérifiez que likedProfiles est bien un tableau
        if (!Array.isArray(currentData.matched)) {
            currentData.matched = [];
        }

        // Retirez le profil aimé
        return {
            ...currentData,
            matched: currentData.matched.filter(profileId => profileId !== id)
        };
    });
}

export function addBlockedProfile(id: number) {
    userData.update(currentData => {
        // Vérifiez que currentData n'est pas null
        if (!currentData) {
            // console.error("User data is null");
            return currentData; // Ne rien faire si currentData est null
        }

        // Vérifiez que blocked est bien un tableau
        if (!Array.isArray(currentData.blocked)) {
            currentData.blocked = [];
        }

        // Ajoutez le profil bloqué
        if (!currentData.blocked.includes(id)) {
            return {
                ...currentData,
                blocked: [...currentData.blocked, id]
            };
        }

        return currentData;
    });
}

export function removeBlockedProfile(id: number) {
    userData.update(currentData => {
        // Vérifiez que currentData n'est pas null
        if (!currentData) {
            // console.error("User data is null");
            return currentData; // Ne rien faire si currentData est null
        }

        // Vérifiez que blocked est bien un tableau
        if (!Array.isArray(currentData.blocked)) {
            currentData.blocked = [];
        }

        // Retirez le profil bloqué
        return {
            ...currentData,
            blocked: currentData.blocked.filter(profileId => profileId !== id)
        };
    });
}
