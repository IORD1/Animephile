import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_CONNECTION_URL;
const dbName = process.env.MONGO_DB_NAME || 'animephile';

if (!uri) {
  throw new Error('MONGO_CONNECTION_URL is not set');
}

let clientPromise;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri).connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = new MongoClient(uri).connect();
}

export async function getDb() {
  const client = await clientPromise;
  return client.db(dbName);
}

export default clientPromise;
