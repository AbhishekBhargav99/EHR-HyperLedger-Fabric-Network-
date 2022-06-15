const crypto = require('crypto');
const algorithm = 'aes-256-cbc';

const key = (process.env.secretKey);
const IV = (process.env.InitialisationVector);

console.log('Encryption Enabled');


const encrypt = (text) => {
    let iv = Buffer.from(IV, 'hex');
    let cipher = crypto.createCipheriv('aes-256-cbc', (key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    // return { key: (key) ,iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
    return encrypted.toString('hex')
}


const decrypt = (hash) => {
    let iv = Buffer.from(IV, 'hex');
    let encryptedText = Buffer.from(hash, 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', (key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

module.exports = {
    encrypt,
    decrypt
}