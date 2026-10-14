/**
 * Copies imported Scripture and reference data from one PostgreSQL database to another
 * (e.g. local development → a new hosted production database), without re-downloading sources.
 *
 *   TARGET_DATABASE_URL=... npm run copy:bible -w @cp/db -- --confirm
 * The source defaults to DATABASE_URL from the repository .env; set SOURCE_DATABASE_URL to override.
 *
 * Safety: insert-only (ON CONFLICT DO NOTHING), never deletes or updates, refuses identical
 * source/target, requires --confirm, and expects `prisma migrate deploy` to have run on the target.
 * Generated search columns are skipped; the target computes them itself.
 * Licensing travels with the text: bible_license rows (attribution, display/download rights) are copied first.
 */
import { PrismaClient } from "@prisma/client";

// Parent tables before children so foreign keys are satisfied.
const TABLES: { name: string; key: string; batch: number }[] = [
  { name: "bible_license", key: "id", batch: 100 },
  { name: "bible_translation", key: "id", batch: 100 },
  { name: "bible_book", key: "id", batch: 100 },
  { name: "bible_chapter", key: `"translationId", "bookId", chapter`, batch: 2000 },
  { name: "bible_verse", key: `"translationId", "bookId", chapter, verse`, batch: 2000 },
  { name: "cross_reference", key: "id", batch: 5000 },
];

const source = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;
const target = process.env.TARGET_DATABASE_URL;
if (!source || !target) throw new Error("Set TARGET_DATABASE_URL (and DATABASE_URL or SOURCE_DATABASE_URL for the source).");
const host = (url: string) => {
  const u = new URL(url);
  return `${u.hostname}:${u.port || 5432}${u.pathname}`;
};
if (host(source) === host(target)) throw new Error("Source and target are the same database; refusing to run.");
if (!process.argv.includes("--confirm")) {
  console.log(`Dry run. Would copy ${TABLES.map((t) => t.name).join(", ")}\n  from ${host(source)}\n  to   ${host(target)}\nRe-run with --confirm.`);
  process.exit(0);
}

const from = new PrismaClient({ datasourceUrl: source });
const to = new PrismaClient({ datasourceUrl: target });

/** Non-generated columns with their exact SQL types, read from the source catalog. */
async function columns(table: string) {
  return from.$queryRawUnsafe<{ name: string; type: string }[]>(
    `SELECT a.attname AS name, format_type(a.atttypid, a.atttypmod) AS type
       FROM pg_attribute a
      WHERE a.attrelid = $1::regclass AND a.attnum > 0 AND NOT a.attisdropped AND a.attgenerated = ''
      ORDER BY a.attnum`,
    `public."${table}"`,
  );
}

async function main() {
  for (const table of TABLES) {
    const cols = await columns(table.name);
    const list = cols.map((c) => `"${c.name}"`).join(", ");
    const recordset = cols.map((c) => `"${c.name}" ${c.type}`).join(", ");
    const total = (await from.$queryRawUnsafe<{ total: bigint }[]>(`SELECT count(*)::bigint AS total FROM "${table.name}"`))[0]?.total ?? 0n;
    let copied = 0;
    let inserted = 0;
    for (let offset = 0; offset < Number(total); offset += table.batch) {
      const rows = await from.$queryRawUnsafe<unknown[]>(
        `SELECT coalesce(json_agg(t), '[]'::json)::text AS json FROM (SELECT ${list} FROM "${table.name}" ORDER BY ${table.key} OFFSET ${offset} LIMIT ${table.batch}) t`,
      );
      const json = (rows[0] as { json: string }).json;
      inserted += await to.$executeRawUnsafe(
        `INSERT INTO "${table.name}" (${list}) SELECT ${list} FROM json_to_recordset($1::json) AS x(${recordset}) ON CONFLICT DO NOTHING`,
        json,
      );
      copied = Math.min(Number(total), offset + table.batch);
      process.stdout.write(`\r${table.name}: ${copied}/${total}`);
    }
    console.log(`\r${table.name}: ${total} read, ${inserted} inserted (existing rows skipped)`);
  }
  // Keep the autoincrement sequence ahead of copied ids.
  await to.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('cross_reference', 'id'), GREATEST((SELECT max(id) FROM cross_reference), 1))`);
  const verses = (await to.$queryRawUnsafe<{ verses: bigint }[]>(`SELECT count(*)::bigint AS verses FROM bible_verse`))[0]?.verses ?? 0n;
  console.log(`Done. Target now has ${verses} verses.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => Promise.all([from.$disconnect(), to.$disconnect()]));
