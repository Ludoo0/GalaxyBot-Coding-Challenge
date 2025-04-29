// db.ts
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
sqlite3.verbose();


export async function openDb () {
  return open({
    filename: './database.db',
    driver: sqlite3.Database
  })
}