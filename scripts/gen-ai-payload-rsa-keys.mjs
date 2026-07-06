import crypto from 'crypto';

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const esc = (pem) => pem.trim().replace(/\n/g, '\\n');
console.log(`AI_PAYLOAD_RSA_PRIVATE_KEY=${esc(privateKey)}`);
console.log(`NEXT_PUBLIC_AI_PAYLOAD_RSA_PUBLIC_KEY=${esc(publicKey)}`);
