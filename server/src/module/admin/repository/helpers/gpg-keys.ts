import * as openpgp from "openpgp";
import ApiError from "../../../../err/api-error";
import REPOSITORY_ERRORS from "../error";

export async function verifyRepositoryKey(
  keyUrl: string,
  fingerprint: string,
): Promise<string> {
  const res = await fetch(keyUrl, { signal: AbortSignal.timeout(10000) });

  if (!res.ok) {
    throw new ApiError({
      statusCode: res.status,
      message: "Failed to fetch repository key",
      code: "REPOSITORY_KEY_FETCH_FAILED",
    });
  }

  const keyData = new Uint8Array(await res.arrayBuffer());

  // .asc is text, the others (.gpg, .pgp, .key, .pub) are usually binary
  const text = new TextDecoder().decode(keyData);
  const isArmored = text.trimStart().startsWith("-----BEGIN PGP");

  const keys = isArmored
    ? await openpgp.readKeys({ armoredKeys: text })
    : await openpgp.readKeys({ binaryKeys: keyData });

  // match fingerprint (ignore spaces and upper/lower case)
  const expected = fingerprint.replace(/\s+/g, "").toUpperCase();
  const key = keys.find((k) => k.getFingerprint().toUpperCase() === expected);

  if (!key) {
    throw new ApiError(REPOSITORY_ERRORS.REPOSITORY_KEY_FINGERPRINT_MISMATCH);
  }

  if (await key.isRevoked()) {
    throw new ApiError(REPOSITORY_ERRORS.REPOSITORY_KEY_REVOKED);
  }

  const expiresAt = await key.getExpirationTime();
  if (expiresAt instanceof Date && expiresAt < new Date()) {
    throw new ApiError({
      statusCode: 400,
      message: `Repository key expired on ${expiresAt.toISOString()}`,
      code: "REPOSITORY_KEY_EXPIRED",
    });
  }

  // standard .asc text, ready to store in the DB
  return key.armor();
}
