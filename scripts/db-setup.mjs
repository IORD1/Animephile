import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_CONNECTION_URL;
const dbName = process.env.MONGO_DB_NAME || 'animephile';

if (!uri) {
  console.error('MONGO_CONNECTION_URL is not set. Run with: node --env-file=.env.local scripts/db-setup.mjs');
  process.exit(1);
}

const userSchema = {
  bsonType: 'object',
  required: ['firebaseUid', 'email', 'isAdmin', 'preferences', 'stats', 'createdAt', 'updatedAt'],
  properties: {
    firebaseUid: { bsonType: 'string' },
    email: { bsonType: 'string' },
    displayName: { bsonType: ['string', 'null'] },
    photoURL: { bsonType: ['string', 'null'] },
    isAdmin: { bsonType: 'bool' },
    preferences: {
      bsonType: 'object',
      required: ['muted', 'preferredNotificationTime', 'timezone', 'digestFrequency'],
      properties: {
        muted: { bsonType: 'bool' },
        preferredNotificationTime: { bsonType: 'string' },
        timezone: { bsonType: 'string' },
        digestFrequency: { enum: ['per-episode', 'daily', 'weekly'] },
        notifyFinales: { bsonType: 'bool' },
        quietHours: {
          bsonType: 'object',
          properties: {
            enabled: { bsonType: 'bool' },
            start: { bsonType: 'string' },
            end: { bsonType: 'string' },
          },
        },
      },
    },
    stats: {
      bsonType: 'object',
      required: ['emailsSent'],
      properties: {
        emailsSent: { bsonType: 'int' },
        lastNotifiedAt: { bsonType: ['date', 'null'] },
      },
    },
    createdAt: { bsonType: 'date' },
    updatedAt: { bsonType: 'date' },
    lastLoginAt: { bsonType: ['date', 'null'] },
  },
};

const subscriptionSchema = {
  bsonType: 'object',
  required: ['userId', 'malId', 'animeTitle', 'createdAt'],
  properties: {
    userId: { bsonType: 'objectId' },
    malId: { bsonType: 'int' },
    animeTitle: { bsonType: 'string' },
    createdAt: { bsonType: 'date' },
    lastNotifiedEpisodeKey: { bsonType: ['string', 'null'] },
    lastNotifiedAt: { bsonType: ['date', 'null'] },
  },
};

const animeSchema = {
  bsonType: 'object',
  required: ['malId', 'title', 'cachedAt', 'refreshedAt'],
  properties: {
    malId: { bsonType: 'int' },
    title: { bsonType: 'string' },
    titleEnglish: { bsonType: ['string', 'null'] },
    titleJapanese: { bsonType: ['string', 'null'] },
    synopsis: { bsonType: ['string', 'null'] },
    imageUrl: { bsonType: ['string', 'null'] },
    trailerUrl: { bsonType: ['string', 'null'] },
    score: { bsonType: ['double', 'int', 'null'] },
    episodes: { bsonType: ['int', 'null'] },
    status: { bsonType: ['string', 'null'] },
    broadcast: {
      bsonType: 'object',
      properties: {
        day: { bsonType: ['string', 'null'] },
        time: { bsonType: ['string', 'null'] },
        timezone: { bsonType: ['string', 'null'] },
        string: { bsonType: ['string', 'null'] },
      },
    },
    airing: { bsonType: 'bool' },
    genres: { bsonType: 'array', items: { bsonType: 'string' } },
    rawJikan: { bsonType: ['object', 'null'] },
    cachedAt: { bsonType: 'date' },
    refreshedAt: { bsonType: 'date' },
  },
};

const jikanCacheSchema = {
  bsonType: 'object',
  required: ['endpoint', 'data', 'fetchedAt', 'ttlSeconds'],
  properties: {
    endpoint: { bsonType: 'string' },
    data: { bsonType: 'array' },
    fetchedAt: { bsonType: 'date' },
    ttlSeconds: { bsonType: 'int' },
  },
};

const notificationSchema = {
  bsonType: 'object',
  required: ['userId', 'malId', 'email', 'subject', 'status', 'sentAt'],
  properties: {
    userId: { bsonType: 'objectId' },
    malId: { bsonType: 'int' },
    episodeId: { bsonType: ['int', 'null'] },
    email: { bsonType: 'string' },
    subject: { bsonType: 'string' },
    status: { enum: ['sent', 'failed', 'skipped'] },
    error: { bsonType: ['string', 'null'] },
    sentAt: { bsonType: 'date' },
    cronRunId: { bsonType: ['string', 'null'] },
    type: { enum: ['episode', 'finale', 'digest', 'news'] },
    animeTitle: { bsonType: ['string', 'null'] },
    bodyHtml: { bsonType: ['string', 'null'] },
    bodyText: { bsonType: ['string', 'null'] },
    readAt: { bsonType: ['date', 'null'] },
  },
};

const animeEpisodesSchema = {
  bsonType: 'object',
  required: ['malId', 'episodes', 'cachedAt'],
  properties: {
    malId: { bsonType: 'int' },
    episodes: { bsonType: 'array' },
    cachedAt: { bsonType: 'date' },
  },
};

const animeCharactersSchema = {
  bsonType: 'object',
  required: ['malId', 'characters', 'cachedAt'],
  properties: {
    malId: { bsonType: 'int' },
    characters: { bsonType: 'array' },
    cachedAt: { bsonType: 'date' },
  },
};

const mangaSchema = {
  bsonType: 'object',
  required: ['malId', 'title', 'cachedAt'],
  properties: {
    malId: { bsonType: 'int' },
    title: { bsonType: 'string' },
    titleEnglish: { bsonType: ['string', 'null'] },
    titleJapanese: { bsonType: ['string', 'null'] },
    synopsis: { bsonType: ['string', 'null'] },
    background: { bsonType: ['string', 'null'] },
    imageUrl: { bsonType: ['string', 'null'] },
    score: { bsonType: ['double', 'int', 'null'] },
    chapters: { bsonType: ['int', 'null'] },
    volumes: { bsonType: ['int', 'null'] },
    status: { bsonType: ['string', 'null'] },
    publishing: { bsonType: 'bool' },
    published: { bsonType: ['string', 'null'] },
    authors: { bsonType: 'array', items: { bsonType: 'string' } },
    serializations: { bsonType: 'array', items: { bsonType: 'string' } },
    genres: { bsonType: 'array', items: { bsonType: 'string' } },
    themes: { bsonType: 'array', items: { bsonType: 'string' } },
    rawJikan: { bsonType: ['object', 'null'] },
    cachedAt: { bsonType: 'date' },
    refreshedAt: { bsonType: 'date' },
  },
};

const collections = [
  {
    name: 'users',
    schema: userSchema,
    indexes: [
      { keys: { firebaseUid: 1 }, options: { unique: true, name: 'firebaseUid_unique' } },
      { keys: { email: 1 }, options: { unique: true, name: 'email_unique' } },
    ],
  },
  {
    name: 'subscriptions',
    schema: subscriptionSchema,
    indexes: [
      { keys: { userId: 1, malId: 1 }, options: { unique: true, name: 'user_anime_unique' } },
      { keys: { malId: 1 }, options: { name: 'malId_idx' } },
    ],
  },
  {
    name: 'animes',
    schema: animeSchema,
    indexes: [
      { keys: { malId: 1 }, options: { unique: true, name: 'malId_unique' } },
      { keys: { airing: 1 }, options: { name: 'airing_idx' } },
      {
        keys: { title: 'text', titleEnglish: 'text', titleJapanese: 'text', synopsis: 'text' },
        options: {
          name: 'title_text',
          weights: { title: 10, titleEnglish: 10, titleJapanese: 8, synopsis: 1 },
        },
      },
    ],
  },
  {
    name: 'jikanCache',
    schema: jikanCacheSchema,
    indexes: [
      { keys: { endpoint: 1 }, options: { unique: true, name: 'endpoint_unique' } },
    ],
  },
  {
    name: 'notifications',
    schema: notificationSchema,
    indexes: [
      { keys: { userId: 1, malId: 1, episodeId: 1 }, options: { name: 'user_anime_episode' } },
      { keys: { userId: 1, sentAt: -1 }, options: { name: 'user_recent' } },
      { keys: { userId: 1, readAt: 1 }, options: { name: 'user_unread' } },
      { keys: { cronRunId: 1 }, options: { name: 'cronRunId_idx' } },
      { keys: { sentAt: -1 }, options: { name: 'sentAt_desc' } },
    ],
  },
  {
    name: 'animeEpisodes',
    schema: animeEpisodesSchema,
    indexes: [
      { keys: { malId: 1 }, options: { unique: true, name: 'malId_unique' } },
    ],
  },
  {
    name: 'animeCharacters',
    schema: animeCharactersSchema,
    indexes: [
      { keys: { malId: 1 }, options: { unique: true, name: 'malId_unique' } },
    ],
  },
  {
    name: 'mangas',
    schema: mangaSchema,
    indexes: [
      { keys: { malId: 1 }, options: { unique: true, name: 'malId_unique' } },
    ],
  },
];

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const existing = (await db.listCollections().toArray()).map((c) => c.name);

  for (const { name, schema, indexes } of collections) {
    if (!existing.includes(name)) {
      await db.createCollection(name, { validator: { $jsonSchema: schema } });
      console.log(`  created collection: ${name}`);
    } else {
      await db.command({ collMod: name, validator: { $jsonSchema: schema } });
      console.log(`  updated validator: ${name}`);
    }

    for (const { keys, options } of indexes) {
      try {
        await db.collection(name).createIndex(keys, options);
      } catch (err) {
        const conflict =
          err.codeName === 'IndexKeySpecsConflict' ||
          err.codeName === 'IndexOptionsConflict' ||
          err.code === 85 ||
          err.code === 86;
        if (!conflict) throw err;

        // Drop any existing index whose key spec matches ours, regardless of
        // name. Then recreate with our preferred name + options.
        const existing = await db.collection(name).indexes();
        const sameKeys = existing.find(
          (idx) => JSON.stringify(idx.key) === JSON.stringify(keys),
        );
        if (sameKeys) {
          console.log(`  ${name}: redefining ${sameKeys.name} → ${options.name || '(auto)'}`);
          await db.collection(name).dropIndex(sameKeys.name);
        } else if (options?.name) {
          console.log(`  ${name}: redefining ${options.name}`);
          await db.collection(name).dropIndex(options.name).catch(() => {});
        }
        await db.collection(name).createIndex(keys, options);
      }
    }
    console.log(`  ${name}: ready (${indexes.length} indexes)`);
  }

  await client.close();
  console.log('\ndb:setup complete.');
}

main().catch((err) => {
  console.error('db:setup failed:', err);
  process.exit(1);
});
