export interface ConversationSummary {
    id?: number;

    otherUser: User | null;

    latestMessage: string;

    user_1: User | null;

    user_2: User | null;
}

export function mapConversationSummaryFromApi(conversation: any) : ConversationSummary[] {
    return conversation.map((c: any) => {
        return {
            id: c.id,
            otherUser: c.otherUser,
            latestMessage: c.latest_message?.content,
            user_1: c.user_1,
            user_2: c.user_2
        }
    })
}
