import { RememberedPerson } from '../types';

const DB_NAME = 'OptiReadDB';
const DB_VERSION = 1;
const STORE_NAME = 'people';
const SPEECH_RATE_KEY = 'optiread_speech_rate';


let db: IDBDatabase | null = null;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error:', (event.target as IDBRequest).error);
      reject('Database error');
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

export const addPerson = async (person: Omit<RememberedPerson, 'id'>): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(person);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      console.error('Error adding person:', (event.target as IDBRequest).error);
      reject('Error adding person');
    };
  });
};

export const getAllPeople = async (): Promise<RememberedPerson[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (event) => {
      console.error('Error getting all people:', (event.target as IDBRequest).error);
      reject('Error getting all people');
    };
  });
};

export const saveSpeechRate = (rate: number): void => {
  try {
    localStorage.setItem(SPEECH_RATE_KEY, JSON.stringify(rate));
  } catch (error) {
    console.error('Error saving speech rate to localStorage:', error);
  }
};

export const getSpeechRate = (): number | null => {
  try {
    const savedRate = localStorage.getItem(SPEECH_RATE_KEY);
    if (savedRate) {
      const rate = parseFloat(savedRate);
      if (!isNaN(rate)) {
        return rate;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting speech rate from localStorage:', error);
    return null;
  }
};