import 'server-only';

import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import fs from 'fs';
import path from 'path';

export type StoredUser = {
  fullName: string;
  fullNameNormalized: string;
  passwordHash: string;
  classYear?: string;
};

export type UserStoreErrorCode = 'user_exists' | 'invalid_name' | 'invalid_password';

export class UserStoreError extends Error {
  readonly code: UserStoreErrorCode;

  constructor(code: UserStoreErrorCode, message: string) {
    super(message);
    this.name = 'UserStoreError';
    this.code = code;
  }
}

type PasswordHashParts = {
  salt: Buffer;
  hash: Buffer;
};

const PASSWORD_SALT_BYTES = 16;
const PASSWORD_HASH_BYTES = 64;
const PASSWORD_MIN_LENGTH = 8;
const FULL_NAME_MAX_CHARS = 80;

// NOTE: This file-based store is intended for hackathon demos only.
// It is best-effort for low-traffic, single-process usage and is NOT safe for:
// - concurrent signups across multiple Node processes/instances (e.g. serverless)
// - durable, production-grade authentication storage
const SEED_USERS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'users.json');
const LOCAL_USERS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'users.local.json');

const DEMO_MODE_ENABLED = process.env.HOLOCRON_DEMO_MODE === 'true';

if (process.env.NODE_ENV === 'production' && !DEMO_MODE_ENABLED) {
  console.warn(
    '[user-store] File-based auth storage is enabled in production without HOLOCRON_DEMO_MODE=true. This is intended for demos only.'
  );
}

function canonicalizeFullName(value: string): { fullName: string; normalized: string } {
  const fullName = value.trim().slice(0, FULL_NAME_MAX_CHARS);
  return {
    fullName,
    normalized: fullName.toLowerCase(),
  };
}

function parsePasswordHash(value: string): PasswordHashParts | null {
  if (!value.startsWith('scrypt:')) return null;
  const parts = value.split(':');
  if (parts.length !== 3) return null;

  const salt = Buffer.from(parts[1] ?? '', 'base64');
  const hash = Buffer.from(parts[2] ?? '', 'base64');

  if (salt.length !== PASSWORD_SALT_BYTES) return null;
  if (hash.length !== PASSWORD_HASH_BYTES) return null;
  return { salt, hash };
}

export function hashPassword(password: string): string {
  const salt = randomBytes(PASSWORD_SALT_BYTES);
  const hash = scryptSync(password, salt, PASSWORD_HASH_BYTES);
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
      if (!parsePasswordHash(record.passwordHash)) {
        console.warn(`Skipping user with invalid passwordHash in ${path.basename(filePath)}.`, {
          fullName: record.fullName,
        });
        return null;
      }

      const classYear = typeof record.classYear === 'string' ? record.classYear : undefined;
      return {
        fullName: record.fullName,
        fullNameNormalized: record.fullNameNormalized,
        passwordHash: record.passwordHash,
        ...(classYear ? { classYear } : {}),
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
  try {
    const payload = `${JSON.stringify(users, null, 2)}\n`;
    fs.writeFileSync(LOCAL_USERS_FILE_PATH, payload, { mode: 0o600 });
    fs.chmodSync(LOCAL_USERS_FILE_PATH, 0o600);
  } catch (err) {
    console.error('Failed to persist local users file.', err);
    throw err;
  }
}

// NOTE: `createUser` uses sync file I/O, but keeps an async API so it can be
// swapped for a real database-backed implementation without changing callers.
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
  const normalized = canonicalizeFullName(fullName).normalized;
  if (!normalized) return null;

  const users = readUsers();
  return users.find((user) => user.fullNameNormalized === normalized) ?? null;
}

export async function createUser(fullName: string, password: string, classYear?: string): Promise<StoredUser> {
  return withCreateUserLock(() => {
    const { fullName: trimmedFullName, normalized } = canonicalizeFullName(fullName);
    if (!normalized) {
      throw new UserStoreError('invalid_name', 'Full name is required.');
    }

    if (password.trim().length < PASSWORD_MIN_LENGTH) {
      throw new UserStoreError('invalid_password', `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
    }

    const seedUsers = readSeedUsers();
    const localUsers = readLocalUsers();
    if (
      seedUsers.some((user) => user.fullNameNormalized === normalized) ||
      localUsers.some((user) => user.fullNameNormalized === normalized)
    ) {
      throw new UserStoreError('user_exists', 'User already exists.');
    }

    const user: StoredUser = {
      fullName: trimmedFullName,
      fullNameNormalized: normalized,
      passwordHash: hashPassword(password),
      ...(classYear ? { classYear } : {}),
    };

    writeUsers([...localUsers, user]);
    return user;
  });
}
