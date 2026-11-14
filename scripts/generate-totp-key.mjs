// scripts/generate-totp-key.mjs
import QRCode from "qrcode";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function generateBase32Secret(byteLength = 20) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

const args = process.argv.slice(2);
const nameIndex = args.indexOf("--name");
const username =
  nameIndex !== -1 && args[nameIndex + 1] ? args[nameIndex + 1].trim().toLowerCase() : "team-member";

const secret = generateBase32Secret(20);
const label = encodeURIComponent(`Rahvana Staging:${username}`);
const issuer = encodeURIComponent("Rahvana Staging");
const otpUri = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

console.log("\n========================================================");
console.log(`🔐 Staging Authenticator Key for: ${username}`);
console.log("========================================================\n");
console.log(`Secret Key (Manual Entry): ${secret}`);
console.log(`Config String to add to STAGING_TOTP_KEYS:`);
console.log(`\n  ${username}:${secret}\n`);

QRCode.toString(otpUri, { type: "terminal", small: true }, (err, qr) => {
  if (!err) {
    console.log("Scan this QR code with Google Authenticator or Microsoft Authenticator:\n");
    console.log(qr);
  }
  console.log("========================================================\n");
});
