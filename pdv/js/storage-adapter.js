// Storage Adapter - Mantém compatibilidade com código existente
const StorageAdapter = {
  // Storage keys mapping
  KEYS: {
    products: 'pdv_products',
    paymentMethods: 'pdv_payment',
    categories: 'pdv_categories',
    users: 'pdv_users',
    integrations: 'pdv_integrations',
    sales: 'pdv_sales',
    pixConfig: 'pdv_pix',
    customers: 'pdv_customers',
    payables: 'pdv_payables',
    payableCategories: 'pdv_payable_categories',
    receiptConfig: 'pdv_receipt',
    nfeConfig: 'pdv_nfe'
  },

  // Initialize adapter
  init() {
    // Check if cloud is enabled
    const cloudConfig = localStorage.getItem('cloud_config');
    if (cloudConfig) {
      const config = JSON.parse(cloudConfig);
      CloudDataService.setUseCloud(config.useCloud !== false);
    }
  },

  // Get data (maintains existing interface)
  async getItem(key) {
    const mappedKey = this.KEYS[key] || key;
    const data = await CloudDataService.getData(mappedKey);
    return data;
  },

  // Set data (maintains existing interface)
  async setItem(key, value) {
    const mappedKey = this.KEYS[key] || key;
    await CloudDataService.setData(mappedKey, value);
  },

  // Remove data (maintains existing interface)
  async removeItem(key) {
    const mappedKey = this.KEYS[key] || key;
    await CloudDataService.deleteData(mappedKey);
  },

  // Batch operations for performance
  async getMultipleItems(keys) {
    const results = {};
    for (const key of keys) {
      results[key] = await this.getItem(key);
    }
    return results;
  },

  async setMultipleItems(items) {
    for (const [key, value] of Object.entries(items)) {
      await this.setItem(key, value);
    }
  },

  // Cloud-specific methods
  enableCloud() {
    CloudDataService.setUseCloud(true);
  },

  disableCloud() {
    CloudDataService.setUseCloud(false);
  },

  isCloudEnabled() {
    return CloudDataService.getConfig().useCloud;
  },

  getSyncStatus() {
    const config = CloudDataService.getConfig();
    return {
      useCloud: config.useCloud,
      isOnline: CloudDataService.isOnline,
      offlineMode: config.offlineMode,
      syncQueueSize: CloudDataService.syncQueue.length
    };
  },

  // Migration helpers
  async migrateToCloud() {
    const keys = Object.values(this.KEYS);
    const migrationData = {};

    // Collect all local data
    for (const key of keys) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          migrationData[key] = JSON.parse(data);
        }
      } catch (error) {
        console.error(`Error migrating ${key}:`, error);
      }
    }

    // Enable cloud and sync data
    this.enableCloud();

    // Sync all data to cloud
    for (const [key, data] of Object.entries(migrationData)) {
      await CloudDataService.setData(key, data);
    }

    return migrationData;
  },

  async migrateFromCloud() {
    this.disableCloud();
    // Data remains in localStorage for offline access
    return true;
  }
};

// Global storage functions (maintains existing interface)
window.storage = {
  getItem: (key) => StorageAdapter.getItem(key),
  setItem: (key, value) => StorageAdapter.setItem(key, value),
  removeItem: (key) => StorageAdapter.removeItem(key)
};

// Initialize adapter
document.addEventListener('DOMContentLoaded', () => {
  StorageAdapter.init();
});