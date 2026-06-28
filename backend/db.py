import sqlite3
from datetime import datetime, timezone

DB_PATH = "audit_log.db"

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS audit_log (
                content_id        TEXT UNIQUE,
                creator_id        TEXT,
                timestamp         TEXT,
                attribution       TEXT,
                confidence        REAL,
                status            TEXT,
                text              TEXT,
                creator_reasoning TEXT
            )
        """)
        # Migrate existing databases that predate the text column
        try:
            conn.execute("ALTER TABLE audit_log ADD COLUMN text TEXT")
        except sqlite3.OperationalError:
            pass
        # Migrate existing databases that predate the unique constraint
        try:
            conn.execute(
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_content_id ON audit_log(content_id)"
            )
        except (sqlite3.OperationalError, sqlite3.IntegrityError):
            pass
        # Migrate existing databases that predate the creator_reasoning column
        try:
            conn.execute("ALTER TABLE audit_log ADD COLUMN creator_reasoning TEXT")
        except sqlite3.OperationalError:
            pass

def log_event(entry):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO audit_log "
            "(content_id, creator_id, timestamp, attribution, confidence, status, text) "
            "VALUES (:content_id, :creator_id, :timestamp, :attribution, :confidence, :status, :text)",
            {**entry, "timestamp": datetime.now(timezone.utc).isoformat()},
        )

def log_appeal(content_id, creator_reasoning):
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute(
            "UPDATE audit_log "
            "SET status = 'under_review', creator_reasoning = ? "
            "WHERE content_id = ?",
            (creator_reasoning, content_id),
        )
    return cursor.rowcount > 0

def read_appeals():
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT * FROM audit_log WHERE creator_reasoning IS NOT NULL ORDER BY timestamp DESC"
        ).fetchall()
    return [dict(row) for row in rows]

def read_log(limit=20):
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?", (limit,)
        ).fetchall()
    return [dict(row) for row in rows]
