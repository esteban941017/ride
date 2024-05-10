import mysql2 from 'mysql2/promise';

export default class Connection {
  connection: mysql2.Connection;

  constructor() {
    this.connection = mysql2.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
    });
  }

  async query(statement: string, data?: any[]): Promise<any> {
    if (data) return this.connection.query(statement, data);
    return this.connection.query(statement);
  }

  async close(): Promise<void> {
    return this.connection.end();
  }
}
