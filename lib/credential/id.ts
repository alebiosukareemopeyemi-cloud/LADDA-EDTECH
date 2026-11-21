import { randomInt } from "node:crypto";

// Short, URL-safe, and easy to read aloud: no 0, o, 1, l or i.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function newCredentialId(length = 8): string {
  let id = "";
  for (let i = 0; i < length; i++) id += ALPHABET[randomInt(ALPHABET.length)];
  return id;
}

// Anything that could be a real credential id, demo ids included. Used before touching storage.
export const isCredentialIdShape = (id: string) => /^[A-Za-z0-9_-]{1,64}$/.test(id);
