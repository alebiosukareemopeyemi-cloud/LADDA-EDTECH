import { getPublicKeyAsync, signAsync, verifyAsync } from "@noble/ed25519";
import type { CredentialPayload } from "../contract/credential.ts";
import { base64ToBytes, bytesToBase64, hexToBytes, payloadBytes } from "./encoding.ts";

// Server only: reads the private key. Never log it or send it anywhere.
function privateKey(): Uint8Array {
  const priv = process.env.CREDENTIAL_PRIVATE_KEY;
  if (!priv) throw new Error("CREDENTIAL_PRIVATE_KEY is not set");
  return hexToBytes(priv);
}

export async function signPayload(payload: CredentialPayload) {
  const priv = privateKey();
  const signature = await signAsync(payloadBytes(payload), priv);
  const publicKey = await getPublicKeyAsync(priv);
  return { signature: bytesToBase64(signature), publicKey: bytesToBase64(publicKey) };
}

// The public half only. Safe to send to the browser.
export async function publicKeyBase64(): Promise<string> {
  return bytesToBase64(await getPublicKeyAsync(privateKey()));
}

// The same check the browser runs: the signature must match these exact bytes.
export async function verifyPayload(payload: unknown, signatureB64: string, publicKeyB64: string): Promise<boolean> {
  try {
    return await verifyAsync(base64ToBytes(signatureB64), payloadBytes(payload), base64ToBytes(publicKeyB64));
  } catch {
    return false;
  }
}
