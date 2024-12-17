interface User {
    id: number;
    username: string;
    likedProfiles?: number[];
    matched?: number[];
    blocked?: number[];
    profilePic?: boolean;
}