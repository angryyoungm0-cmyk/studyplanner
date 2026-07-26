import { openDB } from 'idb';

const DB_NAME = 'studyplanner';
const DB_VERSION = 1;
const STORE_NAME = 'appdata';

let dbInstance = null;

async function getDB() {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    }
  });
  return dbInstance;
}

export async function loadData() {
  try {
    const db = await getDB();
    const data = await db.get(STORE_NAME, 'data');
    return data || null;
  } catch {
    return null;
  }
}

export async function saveData(data) {
  try {
    const db = await getDB();
    await db.put(STORE_NAME, data, 'data');
  } catch (err) {
    console.warn('IndexedDB save failed, falling back to localStorage', err);
    localStorage.setItem('studyPlanner', JSON.stringify(data));
  }
}

export async function clearData() {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, 'data');
  } catch {
    localStorage.removeItem('studyPlanner');
  }
}