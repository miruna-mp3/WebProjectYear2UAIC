DROP TABLE IF EXISTS friends CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS queries CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS friend_requests CASCADE;
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;

CREATE TABLE users
(
    id bigInt GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    username character varying(30) NOT NULL CHECK (username <> ''),
    password character varying(255) NOT NULL,
    email character varying(40) NOT NULL CHECK (email <> ''),
    CONSTRAINT unique_username UNIQUE (username),
    CONSTRAINT unique_email UNIQUE (email)
);

CREATE TABLE queries
(
    "ownerId" bigint NOT NULL,
    id bigInt GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "jsonData" jsonb NOT NULL,
    name character varying(255) DEFAULT 'Default Query Name',
    CONSTRAINT fk_ownerId FOREIGN KEY ("ownerId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE tickets
(
    id bigInt GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "ownerId" bigint NOT NULL,
    title character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    body text NOT NULL,
    status character varying(30) DEFAULT 'open',
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ownerId FOREIGN KEY ("ownerId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT status_check CHECK (status IN ('open', 'closed', 'resolved', 'report'))
);

CREATE TABLE profiles
(
    id bigInt GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "isAdmin" boolean DEFAULT FALSE,
    "hidden" boolean DEFAULT FALSE,
    "ownerId" bigint NOT NULL,
    "firstName" character varying(30),
    "lastName" character varying(40),
    "phoneNumber" character varying(12),
    address character varying(40),
    country character varying(20),
    city character varying(20),
    "profilePhotoUrl" varchar(255) DEFAULT '../profilePhotos/profil.jpg',
    CONSTRAINT fk_ownerId FOREIGN KEY ("ownerId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE friend_requests
(
    id bigInt GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    id1 bigint NOT NULL,
    id2 bigint NOT NULL,
    CONSTRAINT fk_friend1 FOREIGN KEY (id1) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_friend2 FOREIGN KEY (id2) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_friendRequestPair UNIQUE (id1, id2)
);

CREATE TABLE friends
(
    id bigInt GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    id1 bigint NOT NULL,
    id2 bigint NOT NULL,
    CONSTRAINT fk_friend1 FOREIGN KEY (id1) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_friend2 FOREIGN KEY (id2) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_friendPair UNIQUE (id1, id2)
);

CREATE OR REPLACE FUNCTION create_profile_on_user_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles ("ownerId") VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_create_profile
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_on_user_insert();
    
INSERT INTO users (username, password, email) VALUES
('dudu', '$2y$10$G7cLYmgdQ7xCc.HbBUmW6.lCd8ZZfrKRdfgyUFGnZQyAk674qwqYm', 'dudu@mail.com'),
('user0', '$2y$10$G7cLYmgdQ7xCc.HbBUmW6.lCd8ZZfrKRdfgyUFGnZQyAk674qwqYm', 'user0@mail.com'),
('user1', '$2y$10$G7cLYmgdQ7xCc.HbBUmW6.lCd8ZZfrKRdfgyUFGnZQyAk674qwqYm', 'user1@mail.com');

UPDATE profiles SET "firstName" = 'Alice', "isAdmin" = FALSE, "lastName" = 'Popescu', "phoneNumber" = '0700000001', address = 'Str. Lalelelor 1', country = 'Romania', city = 'Bucharest' WHERE "ownerId" = 2;
UPDATE profiles SET "firstName" = 'Bob', "isAdmin" = FALSE,"lastName" = 'Ionescu', "phoneNumber" = '0700000002', address = 'Str. Lalelelor 2', country = 'Romania', city = 'Cluj' WHERE "ownerId" = 3;
UPDATE profiles SET "isAdmin" = TRUE WHERE "ownerId" = 1;

ALTER TABLE profiles ENABLE TRIGGER ALL;
ALTER TABLE queries ENABLE TRIGGER ALL;
