import 'server-only';

import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import fs from 'fs';
import path from 'path';

export type StoredUser = {
  fullName: string;
  fullNameNormalized: string;
  passwordHash: string;
};

type PasswordHashParts = {
  salt: Buffer;
  hash: Buffer;
};

const USERS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'users.json');

function normalizeFullName(value: string): string {
  return value.trim().toLowerCase();
}

function parsePasswordHash(value: string): PasswordHashParts | null {
  if (!value.startsWith('scrypt:')) return null;
  const parts = value.split(':');
  if (parts.length !== 3) return null;

  const salt = Buffer.from(parts[1] ?? '', 'base64');
  const hash = Buffer.from(parts[2] ?? '', 'base64');

  if (salt.length === 0 || hash.length === 0) return null;
  return { salt, hash };
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString('base64')}:${hash.toString('base64')}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parsed = parsePasswordHash(storedHash);
  if (!parsed) return false;

  const derived = scryptSync(password, parsed.salt, parsed.hash.length);
  return timingSafeEqual(derived, parsed.hash);
}

export function readUsers(): StoredUser[] {
  const raw = fs.readFileSync(USERS_FILE_PATH, 'utf-8');
  const data = JSON.parse(raw) as unknown;
  if (!Array.isArray(data)) {
    throw new Error('Invalid users.json format. Expected an array.');
  }

  return data
    .map((entry): StoredUser | null => {
      if (!entry || typeof entry !== 'object') return null;
      const record = entry as Partial<StoredUser>;
      if (typeof record.fullName !== 'string') return null;
      if (typeof record.fullNameNormalized !== 'string') return null;
      if (typeof record.passwordHash !== 'string') return null;
      return {
        fullName: record.fullName,
        fullNameNormalized: record.fullNameNormalized,
        passwordHash: record.passwordHash,
      };
    })
    .filter((user): user is StoredUser => Boolean(user));
}

export function writeUsers(users: StoredUser[]): void {
  fs.writeFileSync(USERS_FILE_PATH, `${JSON.stringify(users, null, 2)}\n`);
}

export function findUser(fullName: string): StoredUser | null {
  const normalized = normalizeFullName(fullName);
  if (!normalized) return null;

  const users = readUsers();
  return users.find((user) => user.fullNameNormalized === normalized) ?? null;
}

export function createUser(fullName: string, password: string): StoredUser {
  const trimmedFullName = fullName.trim().slice(0, 80);
  const normalized = normalizeFullName(trimmedFullName);
  if (!normalized) {
    throw new Error('Full name is required.');
  }

  const users = readUsers();
  if (users.some((user) => user.fullNameNormalized === normalized)) {
    throw new Error('User already exists.');
  }

  const user: StoredUser = {
    fullName: trimmedFullName,
    fullNameNormalized: normalized,
    passwordHash: hashPassword(password),
  };

  writeUsers([...users, user]);
  return user;
}
