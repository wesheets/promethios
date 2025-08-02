/**
 * Cryptographic Storage Provider
 * Extends the existing storage provider pattern with cryptographic verification
 * Provides tamper-evident storage with hash chains and digital signatures
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class CryptographicStorageProvider {
  constructor(fallbackProvider = null) {
    this.name = 'cryptographic';
    this.fallbackProvider = fallbackProvider;
    
    // In-memory storage for development (replace with PostgreSQL in production)
    this.storage = new Map();
    this.hashChains = new Map(); // namespace -> chain metadata
    this.verificationKeys = new Map(); // namespace -> keys
    
    // Cryptographic configuration
    this.config = {
      hashAlgorithm: 'sha256',
      signatureAlgorithm: 'ecdsa',
      keySize: 256,
      enableVerification: true,
      enableFallback: true
    };
    
    console.log('🔐 CryptographicStorageProvider initialized');
  }

  /**
   * Check if the cryptographic storage provider is available
   */
  async isAvailable() {
    try {
      // Test cryptographic operations
      const testData = 'availability_test';
      const hash = this.generateHash(testData);
      
      return hash && hash.length > 0;
    } catch (error) {
      console.error('CryptographicStorageProvider availability check failed:', error);
      return false;
    }
  }

  /**
   * Generate cryptographic hash
   */
  generateHash(data) {
    const hash = crypto.createHash(this.config.hashAlgorithm);
    
    if (typeof data === 'object') {
      hash.update(JSON.stringify(this.sortObjectKeys(data)));
    } else {
      hash.update(String(data));
    }
    
    return hash.digest('hex');
  }

  /**
   * Sort object keys for consistent hashing
   */
  sortObjectKeys(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }
    
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj = {};
    
    for (const key of sortedKeys) {
      sortedObj[key] = this.sortObjectKeys(obj[key]);
    }
    
    return sortedObj;
  }

  /**
   * Generate digital signature
   */
  generateSignature(data, privateKey) {
    try {
      const canonicalData = typeof data === 'object' 
        ? JSON.stringify(this.sortObjectKeys(data))
        : String(data);
      
      const sign = crypto.createSign('SHA256');
      sign.update(canonicalData);
      
      return sign.sign(privateKey, 'hex');
    } catch (error) {
      console.error('Error generating signature:', error);
      return null;
    }
  }

  /**
   * Verify digital signature
   */
  verifySignature(data, signature, publicKey) {
    try {
      const canonicalData = typeof data === 'object' 
        ? JSON.stringify(this.sortObjectKeys(data))
        : String(data);
      
      const verify = crypto.createVerify('SHA256');
      verify.update(canonicalData);
      
      return verify.verify(publicKey, signature, 'hex');
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  }

  /**
   * Initialize cryptographic keys for a namespace
   */
  async initializeNamespaceKeys(namespace) {
    if (this.verificationKeys.has(namespace)) {
      return this.verificationKeys.get(namespace);
    }
    
    try {
      // Generate key pair for namespace
      const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
        namedCurve: 'secp256k1',
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });
      
      const keys = {
        keyId: uuidv4(),
        publicKey,
        privateKey,
        namespace,
        createdAt: new Date().toISOString(),
        algorithm: this.config.signatureAlgorithm
      };
      
      this.verificationKeys.set(namespace, keys);
      
      console.log(`🔑 Generated cryptographic keys for namespace: ${namespace}`);
      return keys;
      
    } catch (error) {
      console.error('Error initializing namespace keys:', error);
      throw error;
    }
  }

  /**
   * Get the last hash in the chain for a namespace
   */
  async getLastHashForNamespace(namespace) {
    const chainMetadata = this.hashChains.get(namespace);
    
    if (!chainMetadata || chainMetadata.entryCount === 0) {
      // Genesis hash for new chains
      return this.generateHash(`genesis_${namespace}_${Date.now()}`);
    }
    
    return chainMetadata.lastHash;
  }

  /**
   * Update chain metadata
   */
  async updateChainMetadata(namespace, entry) {
    const metadata = this.hashChains.get(namespace) || {
      namespace,
      createdAt: new Date().toISOString(),
      entryCount: 0,
      lastHash: null,
      lastUpdated: null,
      verificationStatus: 'verified'
    };
    
    metadata.entryCount++;
    metadata.lastHash = entry.cryptographicHash;
    metadata.lastUpdated = entry.timestamp;
    
    this.hashChains.set(namespace, metadata);
  }

  /**
   * Create cryptographic wrapper for stored data
   */
  async createCryptographicEntry(namespace, key, value, options = {}) {
    try {
      // Initialize keys if needed
      const keys = await this.initializeNamespaceKeys(namespace);
      
      // Get previous hash for chain linking
      const previousHash = await this.getLastHashForNamespace(namespace);
      
      // Create entry structure
      const entry = {
        id: uuidv4(),
        namespace,
        key,
        value,
        timestamp: new Date().toISOString(),
        previousHash,
        cryptographicHash: null, // Will be calculated
        signature: null, // Will be calculated
        metadata: {
          ...options.metadata,
          cryptographicVersion: '1.0',
          hashAlgorithm: this.config.hashAlgorithm,
          signatureAlgorithm: this.config.signatureAlgorithm,
          keyId: keys.keyId
        },
        verificationStatus: 'pending'
      };
      
      // Calculate cryptographic hash
      const hashData = {
        id: entry.id,
        namespace: entry.namespace,
        key: entry.key,
        value: entry.value,
        timestamp: entry.timestamp,
        previousHash: entry.previousHash,
        metadata: entry.metadata
      };
      
      entry.cryptographicHash = this.generateHash(hashData);
      
      // Generate digital signature
      entry.signature = this.generateSignature(hashData, keys.privateKey);
      
      // Verify the entry
      const isValid = this.verifySignature(hashData, entry.signature, keys.publicKey);
      entry.verificationStatus = isValid ? 'verified' : 'invalid';
      
      // Update chain metadata
      await this.updateChainMetadata(namespace, entry);
      
      return entry;
      
    } catch (error) {
      console.error('Error creating cryptographic entry:', error);
      throw error;
    }
  }

  /**
   * Verify cryptographic entry integrity
   */
  async verifyCryptographicEntry(entry) {
    try {
      const keys = this.verificationKeys.get(entry.namespace);
      if (!keys) {
        console.error('No verification keys found for namespace:', entry.namespace);
        return false;
      }
      
      // Reconstruct hash data
      const hashData = {
        id: entry.id,
        namespace: entry.namespace,
        key: entry.key,
        value: entry.value,
        timestamp: entry.timestamp,
        previousHash: entry.previousHash,
        metadata: entry.metadata
      };
      
      // Verify hash
      const calculatedHash = this.generateHash(hashData);
      if (calculatedHash !== entry.cryptographicHash) {
        console.error('Hash verification failed for entry:', entry.id);
        return false;
      }
      
      // Verify signature
      const signatureValid = this.verifySignature(hashData, entry.signature, keys.publicKey);
      if (!signatureValid) {
        console.error('Signature verification failed for entry:', entry.id);
        return false;
      }
      
      return true;
      
    } catch (error) {
      console.error('Error verifying cryptographic entry:', error);
      return false;
    }
  }

  /**
   * Get value with cryptographic verification
   */
  async get(key) {
    try {
      const entry = this.storage.get(key);
      
      if (!entry) {
        // Try fallback provider if available
        if (this.config.enableFallback && this.fallbackProvider) {
          return await this.fallbackProvider.get(key);
        }
        return null;
      }
      
      // Verify cryptographic integrity if enabled
      if (this.config.enableVerification) {
        const isValid = await this.verifyCryptographicEntry(entry);
        if (!isValid) {
          console.warn('Cryptographic verification failed for key:', key);
          
          // Try fallback provider
          if (this.config.enableFallback && this.fallbackProvider) {
            return await this.fallbackProvider.get(key);
          }
          
          throw new Error('Cryptographic verification failed');
        }
      }
      
      return entry.value;
      
    } catch (error) {
      console.error('Error getting value:', error);
      
      // Try fallback provider
      if (this.config.enableFallback && this.fallbackProvider) {
        try {
          return await this.fallbackProvider.get(key);
        } catch (fallbackError) {
          console.error('Fallback provider also failed:', fallbackError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Set value with cryptographic protection
   */
  async set(key, value, options = {}) {
    try {
      // Extract namespace from key (format: namespace.actualKey)
      const [namespace, ...keyParts] = key.split('.');
      const actualKey = keyParts.join('.');
      
      if (!namespace || !actualKey) {
        throw new Error('Invalid key format. Expected: namespace.key');
      }
      
      // Create cryptographic entry
      const entry = await this.createCryptographicEntry(namespace, actualKey, value, options);
      
      // Store the entry
      this.storage.set(key, entry);
      
      // Also store in fallback provider if available
      if (this.config.enableFallback && this.fallbackProvider) {
        try {
          await this.fallbackProvider.set(key, value, options);
        } catch (fallbackError) {
          console.warn('Fallback provider set failed:', fallbackError);
        }
      }
      
      console.log(`🔐 Cryptographically stored: ${key}`);
      
    } catch (error) {
      console.error('Error setting value:', error);
      
      // Try fallback provider
      if (this.config.enableFallback && this.fallbackProvider) {
        try {
          await this.fallbackProvider.set(key, value, options);
          console.warn('Used fallback provider for set operation');
        } catch (fallbackError) {
          console.error('Fallback provider also failed:', fallbackError);
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Delete value with cryptographic logging
   */
  async delete(key) {
    try {
      // Log deletion event
      const [namespace] = key.split('.');
      if (namespace) {
        await this.createCryptographicEntry(namespace, key, null, {
          metadata: {
            operation: 'delete',
            deletedAt: new Date().toISOString()
          }
        });
      }
      
      // Delete from storage
      const deleted = this.storage.delete(key);
      
      // Also delete from fallback provider if available
      if (this.config.enableFallback && this.fallbackProvider) {
        try {
          await this.fallbackProvider.delete(key);
        } catch (fallbackError) {
          console.warn('Fallback provider delete failed:', fallbackError);
        }
      }
      
      return deleted;
      
    } catch (error) {
      console.error('Error deleting value:', error);
      throw error;
    }
  }

  /**
   * Clear all values with cryptographic logging
   */
  async clear() {
    try {
      // Log clear operation for all namespaces
      for (const namespace of this.hashChains.keys()) {
        await this.createCryptographicEntry(namespace, 'clear_operation', null, {
          metadata: {
            operation: 'clear',
            clearedAt: new Date().toISOString(),
            entriesCleared: this.storage.size
          }
        });
      }
      
      // Clear storage
      this.storage.clear();
      
      // Also clear fallback provider if available
      if (this.config.enableFallback && this.fallbackProvider) {
        try {
          await this.fallbackProvider.clear();
        } catch (fallbackError) {
          console.warn('Fallback provider clear failed:', fallbackError);
        }
      }
      
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  /**
   * Get all keys
   */
  async keys() {
    try {
      const cryptographicKeys = Array.from(this.storage.keys());
      
      // Also get keys from fallback provider if available
      if (this.config.enableFallback && this.fallbackProvider) {
        try {
          const fallbackKeys = await this.fallbackProvider.keys();
          // Merge and deduplicate
          const allKeys = [...new Set([...cryptographicKeys, ...fallbackKeys])];
          return allKeys;
        } catch (fallbackError) {
          console.warn('Fallback provider keys failed:', fallbackError);
        }
      }
      
      return cryptographicKeys;
      
    } catch (error) {
      console.error('Error getting keys:', error);
      throw error;
    }
  }

  /**
   * Get storage size
   */
  async size() {
    try {
      return this.storage.size;
    } catch (error) {
      console.error('Error getting storage size:', error);
      return 0;
    }
  }

  /**
   * Get cryptographic verification status for a namespace
   */
  async getVerificationStatus(namespace) {
    try {
      const chainMetadata = this.hashChains.get(namespace);
      
      if (!chainMetadata) {
        return {
          namespace,
          status: 'no_chain',
          entryCount: 0,
          lastVerification: null
        };
      }
      
      // Verify recent entries
      let verifiedEntries = 0;
      let totalEntries = 0;
      
      for (const [key, entry] of this.storage.entries()) {
        if (entry.namespace === namespace) {
          totalEntries++;
          const isValid = await this.verifyCryptographicEntry(entry);
          if (isValid) {
            verifiedEntries++;
          }
        }
      }
      
      return {
        namespace,
        status: verifiedEntries === totalEntries ? 'verified' : 'compromised',
        entryCount: totalEntries,
        verifiedEntries,
        integrityPercentage: totalEntries > 0 ? (verifiedEntries / totalEntries) * 100 : 100,
        lastVerification: new Date().toISOString(),
        chainMetadata
      };
      
    } catch (error) {
      console.error('Error getting verification status:', error);
      return {
        namespace,
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Export cryptographic data for a namespace
   */
  async exportNamespaceData(namespace, includeVerification = true) {
    try {
      const entries = [];
      
      for (const [key, entry] of this.storage.entries()) {
        if (entry.namespace === namespace) {
          const exportEntry = { ...entry };
          
          if (includeVerification) {
            exportEntry.verificationResult = await this.verifyCryptographicEntry(entry);
          }
          
          entries.push(exportEntry);
        }
      }
      
      const verificationStatus = await this.getVerificationStatus(namespace);
      
      return {
        namespace,
        exportTimestamp: new Date().toISOString(),
        entryCount: entries.length,
        entries,
        verificationStatus,
        cryptographicProof: {
          exportHash: this.generateHash(entries),
          signature: null // Would need namespace keys to sign
        }
      };
      
    } catch (error) {
      console.error('Error exporting namespace data:', error);
      throw error;
    }
  }
}

module.exports = CryptographicStorageProvider;

