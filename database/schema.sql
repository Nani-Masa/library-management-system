-- ============================================================
-- LibraryOS — PostgreSQL Schema
-- Run: psql -U postgres -d libraryos -f schema.sql
-- ============================================================

-- Drop existing tables (safe re-run)
DROP TABLE IF EXISTS donations CASCADE;
DROP TABLE IF EXISTS study_rooms CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reading_progress CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS reservation_status CASCADE;
DROP TYPE IF EXISTS reading_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS donation_status CASCADE;
DROP TYPE IF EXISTS book_condition CASCADE;

-- ── Enums ───────────────────────────────────────────────────
CREATE TYPE user_role           AS ENUM ('admin', 'librarian', 'student');
CREATE TYPE reservation_status  AS ENUM ('PENDING', 'NOTIFIED', 'FULFILLED', 'CANCELLED');
CREATE TYPE reading_status      AS ENUM ('reading', 'completed', 'want_to_read', 'abandoned');
CREATE TYPE notification_type   AS ENUM ('DUE_DATE', 'RESERVATION_AVAILABLE', 'FINE_APPLIED', 'BOOK_RETURNED', 'GENERAL');
CREATE TYPE donation_status     AS ENUM ('AVAILABLE', 'CLAIMED', 'PENDING');
CREATE TYPE book_condition      AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR');

-- ── Users ───────────────────────────────────────────────────
CREATE TABLE users (
    id            UUID PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          user_role NOT NULL DEFAULT 'student',
    student_id    VARCHAR(50) UNIQUE,
    avatar_url    TEXT,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- ── Books ───────────────────────────────────────────────────
CREATE TABLE books (
    id               UUID PRIMARY KEY,
    isbn             VARCHAR(20) NOT NULL UNIQUE,
    title            VARCHAR(500) NOT NULL,
    author           VARCHAR(255) NOT NULL,
    category         VARCHAR(100) NOT NULL,
    description      TEXT,
    tags             JSONB DEFAULT '[]',
    cover_url        TEXT,
    total_copies     INTEGER NOT NULL DEFAULT 1 CHECK (total_copies > 0),
    available_copies INTEGER NOT NULL DEFAULT 1 CHECK (available_copies >= 0),
    shelf_location   VARCHAR(20),
    floor            INTEGER DEFAULT 1,
    published_year   INTEGER,
    publisher        VARCHAR(255),
    language         VARCHAR(50) DEFAULT 'English',
    pages            INTEGER,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_books_category  ON books(category);
CREATE INDEX idx_books_author    ON books(author);
CREATE INDEX idx_books_isbn      ON books(isbn);
CREATE INDEX idx_books_available ON books(available_copies);
CREATE INDEX idx_books_title_trgm ON books USING gin(to_tsvector('english', title || ' ' || author));

-- ── Transactions (Issue / Return) ────────────────────────────
CREATE TABLE transactions (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    book_id     UUID NOT NULL REFERENCES books(id)  ON DELETE CASCADE,
    issued_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date    TIMESTAMP WITH TIME ZONE NOT NULL,
    returned_at TIMESTAMP WITH TIME ZONE,
    fine_amount DECIMAL(10,2) DEFAULT 0.00,
    notes       TEXT
);
CREATE INDEX idx_transactions_user    ON transactions(user_id);
CREATE INDEX idx_transactions_book    ON transactions(book_id);
CREATE INDEX idx_transactions_due     ON transactions(due_date);
CREATE INDEX idx_transactions_active  ON transactions(user_id, book_id) WHERE returned_at IS NULL;

-- ── Reservations ─────────────────────────────────────────────
CREATE TABLE reservations (
    id           UUID PRIMARY KEY,
    user_id      UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    book_id      UUID NOT NULL REFERENCES books(id)  ON DELETE CASCADE,
    reserved_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status       reservation_status DEFAULT 'PENDING',
    notified_at  TIMESTAMP WITH TIME ZONE,
    fulfilled_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, book_id)
);
CREATE INDEX idx_reservations_book_status ON reservations(book_id, status);

-- ── Reviews ──────────────────────────────────────────────────
CREATE TABLE reviews (
    id         UUID PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    book_id    UUID NOT NULL REFERENCES books(id)  ON DELETE CASCADE,
    rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    content    TEXT,
    helpful    INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, book_id)
);
CREATE INDEX idx_reviews_book ON reviews(book_id);

-- ── Reading Progress ─────────────────────────────────────────
CREATE TABLE reading_progress (
    id           UUID PRIMARY KEY,
    user_id      UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    book_id      UUID NOT NULL REFERENCES books(id)  ON DELETE CASCADE,
    pages_read   INTEGER DEFAULT 0 CHECK (pages_read >= 0),
    total_pages  INTEGER NOT NULL CHECK (total_pages > 0),
    status       reading_status DEFAULT 'reading',
    started_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, book_id)
);
CREATE INDEX idx_progress_user ON reading_progress(user_id);

-- ── Notifications ─────────────────────────────────────────────
CREATE TABLE notifications (
    id         UUID PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    type       notification_type NOT NULL DEFAULT 'GENERAL',
    title      VARCHAR(255) NOT NULL,
    message    TEXT NOT NULL,
    read_at    TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at);

-- ── Study Rooms ───────────────────────────────────────────────
CREATE TABLE study_rooms (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    room_number VARCHAR(20) NOT NULL,
    date        DATE NOT NULL,
    start_time  VARCHAR(5) NOT NULL,  -- "14:00"
    end_time    VARCHAR(5) NOT NULL,  -- "16:00"
    capacity    INTEGER DEFAULT 4,
    notes       TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_rooms_date ON study_rooms(room_number, date);

-- ── Donations / Marketplace ───────────────────────────────────
CREATE TABLE donations (
    id          UUID PRIMARY KEY,
    donor_id    UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    title       VARCHAR(500) NOT NULL,
    author      VARCHAR(255) NOT NULL,
    isbn        VARCHAR(20),
    condition   book_condition DEFAULT 'GOOD',
    description TEXT,
    status      donation_status DEFAULT 'AVAILABLE',
    claimed_by  UUID REFERENCES users(id),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_donations_status ON donations(status);

-- ── Seed Data ─────────────────────────────────────────────────
-- Default admin password: Admin@123
INSERT INTO users (id, name, email, password_hash, role) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'System Administrator',
   'admin@library.edu',
   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCBRoMpT5MlFbYO9YbJOrNO',
   'admin'),
  ('00000000-0000-0000-0000-000000000002',
   'Jane Librarian',
   'librarian@library.edu',
   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCBRoMpT5MlFbYO9YbJOrNO',
   'librarian'),
  ('00000000-0000-0000-0000-000000000003',
   'John Student',
   'student@library.edu',
   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCBRoMpT5MlFbYO9YbJOrNO',
   'student',
   'STU2024001');

-- Seed Books
INSERT INTO books (id, isbn, title, author, category, description, total_copies, available_copies, shelf_location, pages, published_year) VALUES
  (gen_random_uuid(),'9780134685991','Effective Java','Joshua Bloch','Computer Science','Best practices for the Java platform.',5,5,'A-01',412,2018),
  (gen_random_uuid(),'9780132350884','Clean Code','Robert C. Martin','Computer Science','A handbook of agile software craftsmanship.',4,4,'A-03',431,2008),
  (gen_random_uuid(),'9780201485677','The Pragmatic Programmer','David Thomas','Computer Science','From journeyman to master.',3,3,'A-04',352,1999),
  (gen_random_uuid(),'9781492056300','Designing Data-Intensive Applications','Martin Kleppmann','Computer Science','The big ideas behind reliable, scalable systems.',2,2,'A-05',616,2017),
  (gen_random_uuid(),'9780262033848','Introduction to Algorithms','Thomas H. Cormen','Mathematics','Comprehensive introduction to modern algorithms.',6,6,'B-01',1292,2009),
  (gen_random_uuid(),'9781491950296','Python Data Science Handbook','Jake VanderPlas','Data Science','Essential tools for working with data.',3,3,'C-01',548,2016),
  (gen_random_uuid(),'9781789955750','Hands-On Machine Learning','Aurélien Géron','Artificial Intelligence','Concepts, tools, and techniques for ML.',4,4,'C-02',856,2019),
  (gen_random_uuid(),'9780525559474','Life 3.0','Max Tegmark','Artificial Intelligence','Being human in the age of AI.',2,2,'C-03',364,2017),
  (gen_random_uuid(),'9780262038485','AI: A Modern Approach','Stuart Russell','Artificial Intelligence','The leading textbook in AI.',5,5,'C-04',1132,2020),
  (gen_random_uuid(),'9781617292545','Grokking Algorithms','Aditya Bhargava','Computer Science','An illustrated guide to algorithms.',5,5,'A-09',256,2016),
  (gen_random_uuid(),'9781509302765','Sapiens','Yuval Noah Harari','History','A brief history of humankind.',4,4,'D-02',443,2011),
  (gen_random_uuid(),'9780525434290','The Great Alone','Kristin Hannah','Fiction','A powerful story of love and survival.',2,2,'E-01',438,2018),
  (gen_random_uuid(),'9780201633610','Design Patterns','Gang of Four','Computer Science','Elements of reusable object-oriented software.',3,3,'A-02',395,1994),
  (gen_random_uuid(),'9781491901946','Deep Learning','Ian Goodfellow','Artificial Intelligence','The definitive deep learning textbook.',3,3,'C-05',800,2016),
  (gen_random_uuid(),'9780735619678','Code Complete','Steve McConnell','Computer Science','A practical handbook of software construction.',2,2,'A-07',914,2004);

COMMIT;
