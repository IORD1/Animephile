import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_CONNECTION_URL;
const dbName = process.env.MONGO_DB_NAME || 'animephile';

if (!uri) {
  console.error('MONGO_CONNECTION_URL is not set. Run with: npm run db:seed');
  process.exit(1);
}

const JIKAN_BASE = 'https://api.jikan.moe/v4';
const REQUEST_DELAY_MS = 400; // ~2.5 req/sec; Jikan caps at 3/sec
const TOP_PAGES = parseInt(process.env.JIKAN_SEED_TOP_PAGES, 10) || 20; // 25/page → 500 anime
const RETRY_LIMIT = 3;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function jikanFetch(path, attempt = 1) {
  const res = await fetch(`${JIKAN_BASE}${path}`);
  if (res.status === 429 && attempt <= RETRY_LIMIT) {
    const wait = 2000 * attempt;
    console.log(`    rate-limited; sleeping ${wait}ms then retrying`);
    await sleep(wait);
    return jikanFetch(path, attempt + 1);
  }
  if (!res.ok) {
    throw new Error(`Jikan ${path} failed: ${res.status}`);
  }
  return res.json();
}

function jikanToAnimeDoc(item) {
  return {
    malId: item.mal_id,
    title: item.title,
    titleEnglish: item.title_english || null,
    titleJapanese: item.title_japanese || null,
    synopsis: item.synopsis || null,
    imageUrl:
      item.images?.webp?.large_image_url ||
      item.images?.jpg?.large_image_url ||
      null,
    trailerUrl: item.trailer?.url || null,
    score: typeof item.score === 'number' ? item.score : null,
    episodes: typeof item.episodes === 'number' ? item.episodes : null,
    status: item.status || null,
    broadcast: {
      day: item.broadcast?.day || null,
      time: item.broadcast?.time || null,
      timezone: item.broadcast?.timezone || null,
      string: item.broadcast?.string || null,
    },
    airing: !!item.airing,
    genres: Array.isArray(item.genres) ? item.genres.map((g) => g.name) : [],
    rawJikan: item,
  };
}

async function upsertMany(animes, items) {
  const now = new Date();
  let inserted = 0;
  let updated = 0;
  for (const item of items) {
    if (typeof item?.mal_id !== 'number') continue;
    const doc = jikanToAnimeDoc(item);
    const result = await animes.updateOne(
      { malId: doc.malId },
      {
        $set: { ...doc, refreshedAt: now },
        $setOnInsert: { cachedAt: now },
      },
      { upsert: true },
    );
    if (result.upsertedCount) inserted += 1;
    else if (result.modifiedCount) updated += 1;
  }
  return { inserted, updated };
}

async function pull(label, path, animes, totals) {
  process.stdout.write(`  ${label} … `);
  const json = await jikanFetch(path);
  const items = Array.isArray(json?.data) ? json.data : [];
  const { inserted, updated } = await upsertMany(animes, items);
  totals.inserted += inserted;
  totals.updated += updated;
  totals.pulled += items.length;
  console.log(`pulled ${items.length} (+${inserted} new, ~${updated} refreshed)`);
  await sleep(REQUEST_DELAY_MS);
}

async function main() {
  console.log(`seeding from Jikan into ${dbName}.animes`);
  console.log(`  top pages:    ${TOP_PAGES}`);
  console.log(`  delay:        ${REQUEST_DELAY_MS}ms between requests\n`);

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const animes = db.collection('animes');

  const totals = { pulled: 0, inserted: 0, updated: 0 };
  const t0 = Date.now();

  try {
    console.log('top anime');
    for (let page = 1; page <= TOP_PAGES; page += 1) {
      await pull(`page ${page}/${TOP_PAGES}`, `/top/anime?page=${page}`, animes, totals);
    }

    console.log('\ncurrent + upcoming seasons');
    await pull('seasons/now',      '/seasons/now',      animes, totals);
    await pull('seasons/upcoming', '/seasons/upcoming', animes, totals);

    console.log('\ntoday + week');
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const day of days) {
      await pull(`schedules/${day}`, `/schedules/${day}`, animes, totals);
    }

    const ms = Date.now() - t0;
    const total = await animes.countDocuments();
    console.log(`\nseed complete in ${(ms / 1000).toFixed(1)}s`);
    console.log(`  pulled:    ${totals.pulled}`);
    console.log(`  inserted:  ${totals.inserted}`);
    console.log(`  refreshed: ${totals.updated}`);
    console.log(`  total animes in cache: ${total}`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error('seed failed:', err);
  process.exit(1);
});
