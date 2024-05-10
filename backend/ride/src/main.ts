import crypto from 'crypto';
import mysql2 from 'mysql2/promise';
require('dotenv').config();

export function validateCpf(cpf: string) {
  if (!cpf) return false;
  cpf = clean(cpf);
  if (isInvalidLength(cpf)) return false;
  if (allDigitsAreTheSame(cpf)) return false;
  const dg1 = calculateDigit(cpf, 10);
  const dg2 = calculateDigit(cpf, 11);
  return extractCheckDigit(cpf) === `${dg1}${dg2}`;
}

function clean(cpf: string) {
  return cpf.replace(/\D/g, '');
}

function isInvalidLength(cpf: string) {
  return cpf.length !== 11;
}

function allDigitsAreTheSame(cpf: string) {
  return cpf.split('').every((c) => c === cpf[0]);
}

function calculateDigit(cpf: string, factor: number) {
  let total = 0;
  for (const digit of cpf) {
    if (factor > 1) total += parseInt(digit) * factor--;
  }
  const rest = total % 11;
  return rest < 2 ? 0 : 11 - rest;
}

function extractCheckDigit(cpf: string) {
  return cpf.slice(9);
}

export async function signup(input: any): Promise<any> {
  const connection = mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
  });
  try {
    const accountId = crypto.randomUUID();
    const [[account]] = await connection.query<any>('select * from account where email = ?', [input.email]);
    if (account) throw new Error('Duplicated account');
    if (isInvalidName(input.name)) throw new Error('Invalid name');
    if (isInvalidEmail(input.email)) throw new Error('Invalid email');
    if (!validateCpf(input.cpf)) throw new Error('Invalid cpf');
    if (input.isDriver && isInvalidCarPlate(input.carPlate)) throw new Error('Invalid car plate');
    await connection.query<any>('insert into account (account_id, name, email, cpf, car_plate, is_passenger, is_driver) values (?, ?, ?, ?, ?, ?, ?)', [
      accountId,
      input.name,
      input.email,
      input.cpf,
      input.carPlate,
      !!input.isPassenger,
      !!input.isDriver,
    ]);
    return {
      accountId,
    };
  } finally {
    await connection.end();
  }
}

function isInvalidName(name: string) {
  return !name.match(/[a-zA-Z] [a-zA-Z]+/);
}

function isInvalidEmail(email: string) {
  return !email.match(/^(.+)@(.+)$/);
}

function isInvalidCarPlate(carPlate: string) {
  return !carPlate.match(/[A-Z]{3}[0-9]{4}/);
}

export async function getAccount(accountId: string) {
  const connection = mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
  });
  const [[account]] = await connection.query<any>('select * from account where account_id = ?', [accountId]);
  await connection.end();
  return account;
}
