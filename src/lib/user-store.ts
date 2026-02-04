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

// NOTE: This file-based store is intended for hackathon demos only.
// It is not safe for concurrent or multi-instance deployments.
const SEED_USERS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'users.json');
const LOCAL_USERS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'users.local.json');

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

function readUsersFile(filePath: string, { required }: { required: boolean }): StoredUser[] {
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    const code = typeof (err as { code?: unknown }).code === 'string' ? (err as { code: string }).code : null;
    if (!required && code === 'ENOENT') {
      return [];
    }
    throw err;
  }

  const data = JSON.parse(raw) as unknown;
  if (!Array.isArray(data)) {
    throw new Error(`Invalid ${path.basename(filePath)} format. Expected an array.`);
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

function readSeedUsers(): StoredUser[] {
  return readUsersFile(SEED_USERS_FILE_PATH, { required: true });
}

function readLocalUsers(): StoredUser[] {
  return readUsersFile(LOCAL_USERS_FILE_PATH, { required: false });
}

export function readUsers(): StoredUser[] {
  const users = new Map<string, StoredUser>();

  for (const user of readSeedUsers()) {
    users.set(user.fullNameNormalized, user);
  }

  for (const user of readLocalUsers()) {
    users.set(user.fullNameNormalized, user);
  }

  return Array.from(users.values());
}

export function writeUsers(users: StoredUser[]): void {
  fs.writeFileSync(LOCAL_USERS_FILE_PATH, `${JSON.stringify(users, null, 2)}\n`);
}

let createUserQueue: Promise<void> = Promise.resolve();

function withCreateUserLock<T>(fn: () => T): Promise<T> {
  const next = createUserQueue.then(fn);
  createUserQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

export function findUser(fullName: string): StoredUser | null {
  const normalized = normalizeFullName(fullName);
  if (!normalized) return null;

  const users = readUsers();
  return users.find((user) => user.fullNameNormalized === normalized) ?? null;
}

export async function createUser(fullName: string, password: string): Promise<StoredUser> {
  return withCreateUserLock(() => {
    const trimmedFullName = fullName.trim().slice(0, 80);
    const normalized = normalizeFullName(trimmedFullName);
    if (!normalized) {
      throw new Error('Full name is required.');
    }

    const seedUsers = readSeedUsers();
    const localUsers = readLocalUsers();
    if (
      seedUsers.some((user) => user.fullNameNormalized === normalized) ||
      localUsers.some((user) => user.fullNameNormalized === normalized)
    ) {
      throw new Error('User already exists.');
    }

    const user: StoredUser = {
      fullName: trimmedFullName,
      fullNameNormalized: normalized,
      passwordHash: hashPassword(password),
    };

    writeUsers([...localUsers, user]);
    return user;
  });
}
