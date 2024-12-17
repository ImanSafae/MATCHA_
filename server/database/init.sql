CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('man', 'woman')) NOT NULL,
    date_of_birth DATE NOT NULL,
    sexual_pref VARCHAR(20) CHECK (sexual_pref IN ('homosexual', 'heterosexual', 'bisexual')) DEFAULT 'bisexual',
    biography TEXT CHECK (LENGTH(biography) <= 500) DEFAULT NULL,
    fame_rating FLOAT CHECK (fame_rating >= 0 AND fame_rating <= 5) DEFAULT 1,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    matched INT[] DEFAULT '{}',
    blocked INT[] DEFAULT '{}',
    location GEOGRAPHY(POINT, 4326)
);

CREATE TABLE IF NOT EXISTS pending_users (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) NOT NULL UNIQUE,
    expiration_date TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('man', 'woman')) NOT NULL,
    sexual_pref VARCHAR(20) CHECK (sexual_pref IN ('homosexual', 'heterosexual', 'bisexual')) DEFAULT 'bisexual',
    biography TEXT CHECK (LENGTH(biography) <= 500) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS uuid (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    expiration_date TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    detail VARCHAR(255) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS user_tags (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, tag_id)
);

CREATE TABLE picture (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    pict_type VARCHAR(10) NOT NULL CHECK (pict_type IN ('PROFILE', 'ADDITIONAL')),
    path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION validate_messages(messages JSONB[])
RETURNS BOOLEAN AS $$
DECLARE
    msg JSONB;
BEGIN
    IF array_length(messages, 1) IS NULL OR array_length(messages, 1) = 0 THEN
        RETURN TRUE;
    END IF;
    
    FOREACH msg IN ARRAY messages LOOP
        IF NOT (msg ? 'sender' AND msg ? 'content' AND msg ? 'timestamp') THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    user_1 INTEGER NOT NULL REFERENCES users(id),
    user_2 INTEGER NOT NULL REFERENCES users(id),
    messages JSONB[],
    CONSTRAINT messages_check CHECK (
        validate_messages(messages)
    )
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS views (
    id SERIAL PRIMARY KEY, 
    viewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY, 
    liker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    liked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

