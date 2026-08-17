import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '../src/migrations');

function splitStatements(sql: string): string[] {
  return sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'kubagus_com',
    charset: 'utf8mb4',
    multipleStatements: false,
  });

  try {
    await conn.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    const [rows] = await conn.query<mysql.RowDataPacket[]>('SELECT name FROM schema_migrations');
    const applied = new Set(rows.map((r) => r.name as string));

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const pending = files.filter((f) => !applied.has(f));
    if (pending.length === 0) {
      console.log('Tidak ada migrasi baru. Status sudah terbaru.');
      return;
    }

    for (const file of pending) {
      console.log(`Menerapkan ${file}...`);
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      try {
        await conn.query('START TRANSACTION');
        for (const stmt of splitStatements(sql)) {
          await conn.query(stmt);
        }
        await conn.query('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
        await conn.query('COMMIT');
        console.log(`  OK: ${file}`);
      } catch (err) {
        await conn.query('ROLLBACK');
        throw new Error(`Gagal menerapkan ${file}: ${(err as Error).message}`);
      }
    }
    console.log(`Selesai: ${pending.length} migrasi diterapkan.`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
