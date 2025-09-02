// ESM-safe PayU client instance
import { createRequire } from "module";
import dotenv from "dotenv";
dotenv.config();

const require = createRequire(import.meta.url);

let PayU;
try {
  const mod = await import("payu-websdk");
  PayU = mod?.default ?? mod;
} catch {
  PayU = require("payu-websdk");
}

const { PAYU_KEY, PAYU_SALT, PAYU_MODE = "TEST" } = process.env;

if (!PAYU_KEY || !PAYU_SALT) {
  console.warn("[PayU] Missing PAYU_KEY or PAYU_SALT in environment variables.");
}

export const payuClient = new PayU({ key: PAYU_KEY, salt: PAYU_SALT }, PAYU_MODE);
export const PAYU_ENV = { PAYU_KEY, PAYU_SALT, PAYU_MODE };
