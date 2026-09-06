"""One-shot script to recreate and reseed the database from CSVs."""
import sys, os, sqlite3
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.database import init_db, DB_PATH

# Remove empty/broken DB so init_db seeds fresh
if os.path.exists(DB_PATH):
    os.remove(DB_PATH)
    print(f"Removed old DB: {DB_PATH}")

init_db()
print("init_db() completed")

conn = sqlite3.connect(DB_PATH)
tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print(f"Tables created: {[t[0] for t in tables]}")
for t in tables:
    count = conn.execute(f"SELECT COUNT(*) FROM {t[0]}").fetchone()[0]
    print(f"  {t[0]}: {count} rows")
conn.close()
print("\nDatabase ready.")
