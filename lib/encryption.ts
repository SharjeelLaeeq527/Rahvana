import CryptoJS from "crypto-js";

const SECRET = process.env.PORTAL_WALLET_SECRET!;

export function encrypt(text: string) {
  return CryptoJS.AES.encrypt(text, SECRET).toString();
}

export function decrypt(cipher: string) {
  const bytes = CryptoJS.AES.decrypt(cipher, SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
}
