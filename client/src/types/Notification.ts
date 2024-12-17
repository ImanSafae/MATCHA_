interface Notification {
    id: number;
    sender: User;
    type: 'NEW_LIKE' | 'NEW_VIEW' | 'NEW_MATCH' | 'NEW_MESSAGE' | 'UNLIKE';
    message: string;
    timestamp: Date;
    read: boolean;
}