// Cloud Data Service - Interface unificada para dados local/nuvem
const CloudDataService = {
  // Configuration
  config: {
    useCloud: true,
    offlineMode: false,
    syncInterval: 30000, // 30 seconds
    cacheTimeout: 600000 // 10 minutes
  },

  // Cache management
  cache: new Map(),
  syncQueue: [],
  isOnline: navigator.onLine,

  // Initialize service
  init() {
    this.setupOnlineListeners();
    this.startSyncInterval();
    this.loadFromCache();
  },

  // Online/Offline detection
  setupOnlineListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.config.offlineMode = false;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.config.offlineMode = true;
    });
  },

  // Unified data access methods
  async getData(key) {
    if (!this.config.useCloud) {
      return this.getLocalData(key);
    }

    // Try cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
      return cached.data;
    }

    // Try cloud if online
    if (this.isOnline && !this.config.offlineMode) {
      try {
        const data = await this.getCloudData(key);
        this.cache.set(key, { data, timestamp: Date.now() });
        return data;
      } catch (error) {
        console.warn('Cloud fetch failed, falling back to local:', error);
      }
    }

    // Fallback to local
    return this.getLocalData(key);
  },

  async setData(key, data) {
    if (!this.config.useCloud) {
      this.setLocalData(key, data);
      return;
    }

    // Update cache
    this.cache.set(key, { data, timestamp: Date.now() });

    // Update local storage for offline access
    this.setLocalData(key, data);

    // Try to sync to cloud
    if (this.isOnline && !this.config.offlineMode) {
      try {
        await this.setCloudData(key, data);
      } catch (error) {
        console.warn('Cloud sync failed, queued for later:', error);
        this.addToSyncQueue('set', key, data);
      }
    } else {
      this.addToSyncQueue('set', key, data);
    }
  },

  async deleteData(key) {
    if (!this.config.useCloud) {
      this.deleteLocalData(key);
      return;
    }

    // Remove from cache
    this.cache.delete(key);

    // Remove from local storage
    this.deleteLocalData(key);

    // Try to sync to cloud
    if (this.isOnline && !this.config.offlineMode) {
      try {
        await this.deleteCloudData(key);
      } catch (error) {
        console.warn('Cloud delete failed, queued for later:', error);
        this.addToSyncQueue('delete', key);
      }
    } else {
      this.addToSyncQueue('delete', key);
    }
  },

  // Local storage methods (maintain compatibility)
  getLocalData(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading local data:', error);
      return null;
    }
  },

  setLocalData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error writing local data:', error);
    }
  },

  deleteLocalData(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error deleting local data:', error);
    }
  },

  // Cloud data methods
  async getCloudData(key) {
    const collection = this.getCollectionForKey(key);
    if (!collection) throw new Error(`No collection mapping for key: ${key}`);

    const snapshot = await collection.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async setCloudData(key, data) {
    const collection = this.getCollectionForKey(key);
    if (!collection) throw new Error(`No collection mapping for key: ${key}`);

    // For arrays, we need to update individual documents
    if (Array.isArray(data)) {
      const batch = db.batch();
      
      // Clear existing data
      const existing = await collection.get();
      existing.docs.forEach(doc => batch.delete(doc.ref));

      // Add new data
      data.forEach(item => {
        const ref = collection.doc();
        batch.set(ref, item);
      });

      await batch.commit();
    } else {
      // For single objects, update the document
      const doc = collection.doc('config');
      await doc.set(data);
    }
  },

  async deleteCloudData(key) {
    const collection = this.getCollectionForKey(key);
    if (!collection) throw new Error(`No collection mapping for key: ${key}`);

    const snapshot = await collection.get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  },

  // Collection mapping
  getCollectionForKey(key) {
    const mapping = {
      'pdv_products': FirestoreService.productsCol,
      'pdv_sales': FirestoreService.salesCol,
      'pdv_customers': FirestoreService.customersCol,
      'pdv_users': FirestoreService.usersCol,
      'pdv_payment_methods': db.collection('paymentMethods'),
      'pdv_categories': db.collection('categories'),
      'pdv_integrations': db.collection('integrations'),
      'pdv_receipt_config': db.collection('config').doc('receipt'),
      'pdv_pix_config': db.collection('config').doc('pix'),
      'pdv_nfe_config': db.collection('config').doc('nfe')
    };

    return mapping[key];
  },

  // Sync queue management
  addToSyncQueue(operation, key, data = null) {
    this.syncQueue.push({
      operation,
      key,
      data,
      timestamp: Date.now()
    });
    this.saveSyncQueue();
  },

  async processSyncQueue() {
    if (this.syncQueue.length === 0) return;

    const queue = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of queue) {
      try {
        switch (item.operation) {
          case 'set':
            await this.setCloudData(item.key, item.data);
            break;
          case 'delete':
            await this.deleteCloudData(item.key);
            break;
        }
      } catch (error) {
        console.error('Sync queue item failed:', error);
        // Re-add to queue if it fails
        this.syncQueue.push(item);
      }
    }

    this.saveSyncQueue();
  },

  saveSyncQueue() {
    try {
      localStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  },

  loadSyncQueue() {
    try {
      const queue = localStorage.getItem('sync_queue');
      if (queue) {
        this.syncQueue = JSON.parse(queue);
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
    }
  },

  // Cache management
  loadFromCache() {
    try {
      const cache = localStorage.getItem('data_cache');
      if (cache) {
        const parsed = JSON.parse(cache);
        this.cache = new Map(parsed);
      }
    } catch (error) {
      console.error('Error loading cache:', error);
    }
  },

  saveCache() {
    try {
      localStorage.setItem('data_cache', JSON.stringify(Array.from(this.cache.entries())));
    } catch (error) {
      console.error('Error saving cache:', error);
    }
  },

  // Sync interval
  startSyncInterval() {
    setInterval(() => {
      if (this.isOnline && !this.config.offlineMode && this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
      this.saveCache();
    }, this.config.syncInterval);
  },

  // Configuration methods
  setUseCloud(useCloud) {
    this.config.useCloud = useCloud;
    localStorage.setItem('cloud_config', JSON.stringify(this.config));
  },

  getConfig() {
    return { ...this.config };
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  CloudDataService.init();
});