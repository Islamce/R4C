import { randomBytes } from "node:crypto";
import { argon2Verify, argon2id } from "hash-wasm";

const ARGON2_OPTIONS = {
  parallelism: 4,
  iterations: 3,
  memorySize: 65_536,
  hashLength: 32,
  outputType: "encoded",
};

export function hashTestPassword(password) {
  return argon2id({
    ...ARGON2_OPTIONS,
    password,
    salt: randomBytes(16),
  });
}

export function verifyTestPassword(hash, password) {
  return argon2Verify({ hash, password });
}
