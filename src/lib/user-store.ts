import 'server-only';

import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

export type StoredUser = {
  fullName: string;
  fullNameNormalized: string;
  email: string;
  emailNormalized: string;
  passwordHash: string;
  classYear?: string;
};

export type UserStoreErrorCode = 'user_exists' | 'invalid_name' | 'invalid_email' | 'invalid_password';

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
const EMAIL_MAX_CHARS = 200;
const CLASS_YEAR_MAX_CHARS = 80;

function resolveDatabasePath(): string {
  const raw = process.env.HOLOCRON_DB_PATH;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.length > 0) {
      return path.isAbsolute(trimmed) ? trimmed : path.join(process.cwd(), trimmed);
    }
  }

  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), 'holocron-db.json');
  }

  return path.join(process.cwd(), 'src', 'lib', 'db.json');
}

const DB_FILE_PATH = resolveDatabasePath();

function canonicalizeFullName(value: string): { fullName: string; normalized: string } {
  const fullName = value.trim().slice(0, FULL_NAME_MAX_CHARS);
  return {
    fullName,
    normalized: fullName.toLowerCase(),
  };
}

function canonicalizeEmail(value: string): { email: string; normalized: string } {
  const email = value.trim().slice(0, EMAIL_MAX_CHARS);
  return {
    email,
    normalized: email.toLowerCase(),
  };
}

export function isValidEmail(value: string): boolean {
  // Intentionally lightweight validation for hackathon use.
  // We just need a stable identifier and basic typo prevention.
  const normalized = value.trim().toLowerCase();
  if (normalized.length < 3) return false;
  if (normalized.includes(' ')) return false;
  const atIndex = normalized.indexOf('@');
  if (atIndex <= 0 || atIndex === normalized.length - 1) return false;

  const domain = normalized.slice(atIndex + 1);
  const domainParts = domain.split('.');
  if (domainParts.length < 2) return false;
  if (domainParts.some((part) => part.length === 0)) return false;
  return true;
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

type AuthDatabase = {
  users: StoredUser[];
};

function parseDatabase(value: unknown): AuthDatabase {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid db.json format. Expected an object.');
  }

  const users = (value as { users?: unknown }).users;
  if (!Array.isArray(users)) {
    throw new Error('Invalid db.json format. Expected users to be an array.');
  }

  return {
    users: users
      .map((entry): StoredUser | null => {
        if (!entry || typeof entry !== 'object') return null;
        const record = entry as Partial<StoredUser>;
        if (typeof record.fullName !== 'string') return null;
        if (typeof record.fullNameNormalized !== 'string') return null;
        if (typeof record.email !== 'string') return null;
        if (typeof record.emailNormalized !== 'string') return null;
        if (typeof record.passwordHash !== 'string') return null;
        if (!parsePasswordHash(record.passwordHash)) {
          console.warn('Skipping user with invalid passwordHash in db.json.', {
            fullName: record.fullName,
            email: record.email,
          });
          return null;
        }

        const classYear = typeof record.classYear === 'string' ? record.classYear : undefined;
        return {
          fullName: record.fullName,
          fullNameNormalized: record.fullNameNormalized,
          email: record.email,
          emailNormalized: record.emailNormalized,
          passwordHash: record.passwordHash,
          ...(classYear ? { classYear } : {}),
        };
      })
      .filter((user): user is StoredUser => Boolean(user)),
  };
}

function readDatabase(): AuthDatabase {
  let raw: string;
  try {
    raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
  } catch (err) {
    const code = typeof (err as { code?: unknown }).code === 'string' ? (err as { code: string }).code : null;
    if (code === 'ENOENT') {
      return { users: [] };
    }
    throw err;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch (err) {
    console.error('Invalid db.json JSON. Resetting database to empty.', err);
    return { users: [] };
  }

  try {
    return parseDatabase(parsed);
  } catch (err) {
    console.error('Invalid db.json shape. Resetting database to empty.', err);
    return { users: [] };
  }
}

function writeDatabase(database: AuthDatabase): void {
  const payload = `${JSON.stringify(database, null, 2)}\n`;
  const directory = path.dirname(DB_FILE_PATH);
  fs.mkdirSync(directory, { recursive: true });

  const tmpPath = path.join(directory, `.holocron-db.${process.pid}.${randomBytes(6).toString('hex')}.tmp`);
  try {
    fs.writeFileSync(tmpPath, payload, { mode: 0o600 });
    try {
      fs.renameSync(tmpPath, DB_FILE_PATH);
    } catch (err) {
      const code = typeof (err as { code?: unknown }).code === 'string' ? (err as { code: string }).code : null;
      if (code === 'EEXIST' || code === 'EPERM') {
        fs.rmSync(DB_FILE_PATH, { force: true });
        fs.renameSync(tmpPath, DB_FILE_PATH);
        return;
      }
      throw err;
    }
  } finally {
    fs.rmSync(tmpPath, { force: true });
  }
}

export function readUsers(): StoredUser[] {
  return readDatabase().users;
}

export function writeUsers(users: StoredUser[]): void {
  writeDatabase({ users });
}

// NOTE: `createUser` uses sync file I/O, but keeps an async API so it can be
// swapped for a real database-backed implementation without changing callers.
let createUserQueue: Promise<void> = Promise.resolve();

// Best-effort lock for a single Node.js process only.
// It does not provide cross-process safety (e.g. serverless / horizontally scaled deployments).
function withCreateUserLock<T>(fn: () => T): Promise<T> {
  const next = createUserQueue.then(fn);
  createUserQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

export function findUserByEmail(email: string): StoredUser | null {
  const normalized = canonicalizeEmail(email).normalized;
  if (!normalized) return null;

  const users = readUsers();
  return users.find((user) => user.emailNormalized === normalized) ?? null;
}

export async function createUser(
  fullName: string,
  email: string,
  password: string,
  classYear?: string
): Promise<StoredUser> {
  return withCreateUserLock(() => {
    const { fullName: trimmedFullName, normalized } = canonicalizeFullName(fullName);
    if (!normalized) {
      throw new UserStoreError('invalid_name', 'Full name is required.');
    }

    const { email: trimmedEmail, normalized: emailNormalized } = canonicalizeEmail(email);
    if (!isValidEmail(trimmedEmail)) {
      throw new UserStoreError('invalid_email', 'Email is invalid.');
    }

    if (password.trim().length < PASSWORD_MIN_LENGTH) {
      throw new UserStoreError('invalid_password', `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
    }

    const database = readDatabase();
    if (database.users.some((user) => user.emailNormalized === emailNormalized)) {
      throw new UserStoreError('user_exists', 'User already exists.');
    }

    const trimmedClassYear = classYear?.trim().slice(0, CLASS_YEAR_MAX_CHARS);

    const user: StoredUser = {
      fullName: trimmedFullName,
      fullNameNormalized: normalized,
      email: trimmedEmail,
      emailNormalized,
      passwordHash: hashPassword(password),
      ...(trimmedClassYear ? { classYear: trimmedClassYear } : {}),
    };

    writeDatabase({
      users: [...database.users, user],
    });
    return user;
  });
}
