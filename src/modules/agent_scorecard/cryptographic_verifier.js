/**
 * Cryptographic Verifier
 * 
 * Responsible for cryptographically signing and verifying agent scorecards
 * and trust lineage records, ensuring their integrity and authenticity.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class CryptographicVerifier {
  constructor(config = {}) {
    this.config = {
      keyDir: path.join(process.cwd(), 'data', 'keys'),
      algorithm: 'ed25519',
      merkleVerification: true,
      ...config
    };

    // Ensure key directory exists
    if (!fs.existsSync(this.config.keyDir)) {
      fs.mkdirSync(this.config.keyDir, { recursive: true });
    }

    // Initialize keys if they don't exist
    this._initializeKeys();
  }

  /**
   * Sign a scorecard
   * @param {Object} scorecard - The scorecard to sign
   * @returns {Object} - The signed scorecard
   */
  async signScorecard(scorecard) {
    // Create a copy of the scorecard to avoid modifying the original
    const scorecardCopy = JSON.parse(JSON.stringify(scorecard));
    
    // Remove existing signature for signing
    const cryptoProof = scorecardCopy.cryptographic_proof;
    const originalSignature = cryptoProof.signature;
    cryptoProof.signature = '';
    
    // Calculate Merkle root if enabled
    if (this.config.merkleVerification) {
      cryptoProof.merkle_root = this._calculateMerkleRoot(scorecardCopy);
    } else {
      cryptoProof.merkle_root = this._calculateHash(JSON.stringify(scorecardCopy));
    }
    
    // Sign the scorecard
    const dataToSign = JSON.stringify(scorecardCopy);
    const signature = this._sign(dataToSign);
    
    // Update the cryptographic proof
    cryptoProof.signature = signature;
    cryptoProof.public_key_id = this._getPublicKeyId();
    cryptoProof.timestamp = new Date().toISOString();
    cryptoProof.algorithm = this.config.algorithm;
    
    return scorecardCopy;
  }

  /**
   * Verify a scorecard's signature
   * @param {Object} scorecard - The scorecard to verify
   * @returns {boolean} - Whether the scorecard is valid
   */
  async verifyScorecard(scorecard) {
    // Create a copy of the scorecard
    const scorecardCopy = JSON.parse(JSON.stringify(scorecard));
    
    // Extract cryptographic proof
    const cryptoProof = scorecardCopy.cryptographic_proof;
    const signature = cryptoProof.signature;
    const publicKeyId = cryptoProof.public_key_id;
    const merkleRoot = cryptoProof.merkle_root;
    
    // Remove signature for verification
    cryptoProof.signature = '';
    
    // Verify Merkle root if enabled
    if (this.config.merkleVerification) {
      const calculatedRoot = this._calculateMerkleRoot(scorecardCopy);
      if (calculatedRoot !== merkleRoot) {
        return false;
      }
    }
    
    // Verify signature
    const dataToVerify = JSON.stringify(scorecardCopy);
    const isValid = this._verify(dataToVerify, signature, publicKeyId);
    
    // Restore original signature
    cryptoProof.signature = signature;
    
    return isValid;
  }

  /**
   * Sign a trust lineage record
   * @param {Object} lineageRecord - The lineage record to sign
   * @returns {Object} - The signed lineage record
   */
  async signLineageRecord(lineageRecord) {
    // Create a copy of the lineage record
    const lineageCopy = JSON.parse(JSON.stringify(lineageRecord));
    
    // Remove existing signature for signing
    const cryptoProof = lineageCopy.cryptographic_proof;
    const originalSignature = cryptoProof.signature;
    cryptoProof.signature = '';
    
    // Sign the lineage record
    const dataToSign = JSON.stringify(lineageCopy);
    const signature = this._sign(dataToSign);
    
    // Update the cryptographic proof
    cryptoProof.signature = signature;
    cryptoProof.public_key_id = this._getPublicKeyId();
    cryptoProof.timestamp = new Date().toISOString();
    cryptoProof.algorithm = this.config.algorithm;
    
    return lineageCopy;
  }

  /**
   * Verify a lineage record's signature
   * @param {Object} lineageRecord - The lineage record to verify
   * @returns {boolean} - Whether the lineage record is valid
   */
  async verifyLineageRecord(lineageRecord) {
    // Create a copy of the lineage record
    const lineageCopy = JSON.parse(JSON.stringify(lineageRecord));
    
    // Extract cryptographic proof
    const cryptoProof = lineageCopy.cryptographic_proof;
    const signature = cryptoProof.signature;
    const publicKeyId = cryptoProof.public_key_id;
    
    // Remove signature for verification
    cryptoProof.signature = '';
    
    // Verify signature
    const dataToVerify = JSON.stringify(lineageCopy);
    const isValid = this._verify(dataToVerify, signature, publicKeyId);
    
    // Restore original signature
    cryptoProof.signature = signature;
    
    return isValid;
  }

  /**
   * Initialize cryptographic keys
   * @private
   */
  _initializeKeys() {
    const keyPairPath = path.join(this.config.keyDir, `${this.config.algorithm}.json`);
    
    // Check if keys already exist
    if (fs.existsSync(keyPairPath)) {
      return;
    }
    
    // Generate new key pair
    let keyPair;
    if (this.config.algorithm === 'ed25519') {
      keyPair = crypto.generateKeyPairSync('ed25519');
    } else if (this.config.algorithm === 'rsa-pss-sha256') {
      keyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });
    } else if (this.config.algorithm === 'ecdsa-p256') {
      keyPair = crypto.generateKeyPairSync('ec', {
        namedCurve: 'prime256v1',
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });
    } else {
      throw new Error(`Unsupported algorithm: ${this.config.algorithm}`);
    }
    
    // Store key pair
    const keyData = {
      algorithm: this.config.algorithm,
      publicKey: keyPair.publicKey.export ? 
                 keyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString() : 
                 keyPair.publicKey,
      privateKey: keyPair.privateKey.export ? 
                  keyPair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() : 
                  keyPair.privateKey,
      id: this._calculateKeyId(keyPair.publicKey),
      created: new Date().toISOString()
    };
    
    fs.writeFileSync(keyPairPath, JSON.stringify(keyData, null, 2));
  }

  /**
   * Sign data with private key
   * @private
   */
  _sign(data) {
    const keyPairPath = path.join(this.config.keyDir, `${this.config.algorithm}.json`);
    const keyData = JSON.parse(fs.readFileSync(keyPairPath, 'utf8'));
    
    let signature;
    if (this.config.algorithm === 'ed25519') {
      const privateKey = crypto.createPrivateKey({
        key: Buffer.from(keyData.privateKey, 'hex'),
        format: 'der',
        type: 'pkcs8'
      });
      
      signature = crypto.sign(null, Buffer.from(data), privateKey);
      return signature.toString('hex');
    } else if (this.config.algorithm === 'rsa-pss-sha256') {
      const privateKey = crypto.createPrivateKey(keyData.privateKey);
      signature = crypto.sign('sha256', Buffer.from(data), {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING
      });
      return signature.toString('hex');
    } else if (this.config.algorithm === 'ecdsa-p256') {
      const privateKey = crypto.createPrivateKey(keyData.privateKey);
      signature = crypto.sign('sha256', Buffer.from(data), privateKey);
      return signature.toString('hex');
    } else {
      throw new Error(`Unsupported algorithm: ${this.config.algorithm}`);
    }
  }

  /**
   * Verify signature with public key
   * @private
   */
  _verify(data, signature, publicKeyId) {
    const keyPairPath = path.join(this.config.keyDir, `${this.config.algorithm}.json`);
    const keyData = JSON.parse(fs.readFileSync(keyPairPath, 'utf8'));
    
    // Verify key ID matches
    if (keyData.id !== publicKeyId) {
      return false;
    }
    
    let isValid;
    if (this.config.algorithm === 'ed25519') {
      const publicKey = crypto.createPublicKey({
        key: Buffer.from(keyData.publicKey, 'hex'),
        format: 'der',
        type: 'spki'
      });
      
      isValid = crypto.verify(
        null,
        Buffer.from(data),
        publicKey,
        Buffer.from(signature, 'hex')
      );
    } else if (this.config.algorithm === 'rsa-pss-sha256') {
      const publicKey = crypto.createPublicKey(keyData.publicKey);
      isValid = crypto.verify(
        'sha256',
        Buffer.from(data),
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING
        },
        Buffer.from(signature, 'hex')
      );
    } else if (this.config.algorithm === 'ecdsa-p256') {
      const publicKey = crypto.createPublicKey(keyData.publicKey);
      isValid = crypto.verify(
        'sha256',
        Buffer.from(data),
        publicKey,
        Buffer.from(signature, 'hex')
      );
    } else {
      throw new Error(`Unsupported algorithm: ${this.config.algorithm}`);
    }
    
    return isValid;
  }

  /**
   * Calculate a hash for data
   * @private
   */
  _calculateHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Calculate Merkle root for a scorecard
   * @private
   */
  _calculateMerkleRoot(scorecard) {
    // In a real implementation, this would build a Merkle tree from scorecard fields
    // For simplicity, we'll just hash the entire scorecard
    return this._calculateHash(JSON.stringify(scorecard));
  }

  /**
   * Calculate ID for a public key
   * @private
   */
  _calculateKeyId(publicKey) {
    const keyString = typeof publicKey === 'string' ? 
                      publicKey : 
                      publicKey.export({ type: 'spki', format: 'pem' }).toString();
    
    return this._calculateHash(keyString);
  }

  /**
   * Get current public key ID
   * @private
   */
  _getPublicKeyId() {
    const keyPairPath = path.join(this.config.keyDir, `${this.config.algorithm}.json`);
    const keyData = JSON.parse(fs.readFileSync(keyPairPath, 'utf8'));
    
    return keyData.id;
  }
}

module.exports = CryptographicVerifier;
