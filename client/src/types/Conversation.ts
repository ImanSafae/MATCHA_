interface Conversation {
    id: number;
    user_1: User;
    user_2: User;
    latestMessage: string;
    messages: Message[];
}