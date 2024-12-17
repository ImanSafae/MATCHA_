const NOTIFICATION_TYPES = {
    NEW_VIEW: 'NEW_VIEW',
    NEW_LIKE: 'NEW_LIKE',
    NEW_MATCH: 'NEW_MATCH',
    NEW_MESSAGE: 'NEW_MESSAGE',
    UNLIKE: 'UNLIKE'
};

const NOTIFICATION_MESSAGES = {
    NEW_VIEW: ' has viewed your profile.',
    NEW_LIKE: ' has liked your profile.',
    NEW_MATCH: ' has matched with you!',
    NEW_MESSAGE: ' has sent you a message.',
    UNLIKE: ' has unliked your profile.',
};

const EVENT_TYPES = {
    VIEW: 'VIEW',
    LIKE: 'LIKE',
    MATCH: 'MATCH',
    UNLIKE: 'UNLIKE',
    UNMATCH: 'UNMATCH',
    REPORT: 'REPORT',
    BLOCK: 'BLOCK'
};


module.exports = {
    NOTIFICATION_TYPES,
    NOTIFICATION_MESSAGES,
    EVENT_TYPES
}