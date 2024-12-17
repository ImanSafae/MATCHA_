interface MessageToSend {
    conversationId?: number;
    to: User;
    content: string;
    timestamp: Date;
}
