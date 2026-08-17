import mysql from 'mysql2/promise';
import { env } from './env.js';

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: 'Z',
});

type QueryValues = Parameters<typeof pool.query>[1];

/** Untuk SELECT — mengembalikan array baris. */
export async function query<T extends mysql.RowDataPacket = mysql.RowDataPacket>(
  sql: string,
  params?: QueryValues,
): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

/** Untuk INSERT/UPDATE/DELETE — mengembalikan ResultSetHeader. */
export async function execute(sql: string, params?: QueryValues): Promise<mysql.ResultSetHeader> {
  const [result] = await pool.query(sql, params);
  return result as mysql.ResultSetHeader;
}