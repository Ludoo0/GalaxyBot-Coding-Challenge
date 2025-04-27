// db.ts
import sqlite3 from 'sqlite3';

// Optional: Improve verbose output during development
sqlite3.verbose();

// Create and export the database connection
export const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to SQLite database.');
  }
});