/**
 * Migration Service for transitioning from localStorage to cloud storage
 * Maintains 100% UI compatibility while enabling cloud features
 */

class MigrationService {
    constructor() {
        this.migrationStatus = {
            completed: false,
            lastSync: null,
            conflicts: [],
            errors: []
        };
    }

    /**
     * Initialize migration process
     */
    async initialize() {
        console.log('Initializing migration service...');
        
        // Check if cloud services are available
        const cloudAvailable = await this.checkCloudAvailability();
        
        if (cloudAvailable) {
            console.log('Cloud services available, starting migration...');
            await this.startMigration();
        } else {
            console.log('Cloud services unavailable, using localStorage mode');
            this.useLocalStorageMode();
        }
    }

    /**
     * Check if cloud services are available
     */
    async checkCloudAvailability() {
        try {
            // Test cloud data service connectivity
            await CloudDataService.testConnection();
            return true;
        } catch (error) {
            console.warn('Cloud services unavailable:', error.message);
            return false;
        }
    }

    /**
     * Start migration process
     */
    async startMigration() {
        try {
            // Step 1: Backup local data
            await this.backupLocalData();
            
            // Step 2: Compare local vs cloud data
            const comparison = await this.compareData();
            
            // Step 3: Resolve conflicts
            await this.resolveConflicts(comparison.conflicts);
            
            // Step 4: Sync data to cloud
            await this.syncToCloud(comparison.localData);
            
            // Step 5: Enable cloud-first mode
            await this.enableCloudFirstMode();
            
            this.migrationStatus.completed = true;
            this.migrationStatus.lastSync = new Date().toISOString();
            
            console.log('Migration completed successfully');
            
        } catch (error) {
            console.error('Migration failed:', error);
            this.migrationStatus.errors.push({
                timestamp: new Date().toISOString(),
                error: error.message
            });
            
            // Fallback to localStorage mode
            this.useLocalStorageMode();
        }
    }

    /**
     * Backup all local data
     */
    async backupLocalData() {
        const backup = {
            timestamp: new Date().toISOString(),
            data: {}
        };

        const keys = [
            'pdv_products',
            'pdv_payment_methods',
            'pdv_categories',
            'pdv_users',
            'pdv_integrations',
            'pdv_sales',
            'pdv_pix_config',
            'pdv_customers',
            'pdv_payables',
            'pdv_payable_categories',
            'pdv_receipt_config',
            'pdv_nfe_config'
        ];

        keys.forEach(key => {
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    backup.data[key] = JSON.parse(data);
                }
            } catch (error) {
                console.warn(`Failed to backup ${key}:`, error);
            }
        });

        // Store backup in cloud
        await CloudDataService.setData('migration_backup', backup);
        
        return backup;
    }

    /**
     * Compare local and cloud data
     */
    async compareData() {
        const localData = this.getLocalData();
        const cloudData = await this.getCloudData();
        
        const conflicts = [];
        
        // Compare each data type
        Object.keys(localData).forEach(key => {
            const local = localData[key];
            const cloud = cloudData[key];
            
            if (this.hasDataChanged(local, cloud)) {
                conflicts.push({
                    key,
                    local: local,
                    cloud: cloud,
                    localTimestamp: this.getDataTimestamp(key, 'local'),
                    cloudTimestamp: this.getDataTimestamp(key, 'cloud')
                });
            }
        });

        return {
            localData,
            cloudData,
            conflicts
        };
    }

    /**
     * Get local data
     */
    getLocalData() {
        const data = {};
        
        try {
            data.products = JSON.parse(localStorage.getItem('pdv_products') || '[]');
            data.paymentMethods = JSON.parse(localStorage.getItem('pdv_payment_methods') || '[]');
            data.categories = JSON.parse(localStorage.getItem('pdv_categories') || '[]');
            data.users = JSON.parse(localStorage.getItem('pdv_users') || '[]');
            data.integrations = JSON.parse(localStorage.getItem('pdv_integrations') || '{}');
            data.sales = JSON.parse(localStorage.getItem('pdv_sales') || '[]');
            data.pixConfig = JSON.parse(localStorage.getItem('pdv_pix_config') || '{}');
            data.customers = JSON.parse(localStorage.getItem('pdv_customers') || '[]');
            data.payables = JSON.parse(localStorage.getItem('pdv_payables') || '[]');
            data.payableCategories = JSON.parse(localStorage.getItem('pdv_payable_categories') || '[]');
            data.receiptConfig = JSON.parse(localStorage.getItem('pdv_receipt_config') || '{}');
            data.nfeConfig = JSON.parse(localStorage.getItem('pdv_nfe_config') || '{}');
        } catch (error) {
            console.error('Error reading local data:', error);
        }

        return data;
    }

    /**
     * Get cloud data
     */
    async getCloudData() {
        const data = {};
        
        try {
            data.products = await CloudDataService.getData('products') || [];
            data.paymentMethods = await CloudDataService.getData('paymentMethods') || [];
            data.categories = await CloudDataService.getData('categories') || [];
            data.users = await CloudDataService.getData('users') || [];
            data.integrations = await CloudDataService.getData('integrations') || {};
            data.sales = await CloudDataService.getData('sales') || [];
            data.pixConfig = await CloudDataService.getData('pixConfig') || {};
            data.customers = await CloudDataService.getData('customers') || [];
            data.payables = await CloudDataService.getData('payables') || [];
            data.payableCategories = await CloudDataService.getData('payableCategories') || [];
            data.receiptConfig = await CloudDataService.getData('receiptConfig') || {};
            data.nfeConfig = await CloudDataService.getData('nfeConfig') || {};
        } catch (error) {
            console.error('Error reading cloud data:', error);
        }

        return data;
    }

    /**
     * Check if data has changed
     */
    hasDataChanged(local, cloud) {
        if (!local && !cloud) return false;
        if (!local || !cloud) return true;
        
        return JSON.stringify(local) !== JSON.stringify(cloud);
    }

    /**
     * Get data timestamp
     */
    getDataTimestamp(key, source) {
        // This is a simplified implementation
        // In a real scenario, you'd track timestamps properly
        return new Date().toISOString();
    }

    /**
     * Resolve data conflicts
     */
    async resolveConflicts(conflicts) {
        for (const conflict of conflicts) {
            // Simple conflict resolution: use the most recent data
            // In a real scenario, you might want more sophisticated logic
            const useLocal = conflict.localTimestamp > conflict.cloudTimestamp;
            
            console.log(`Resolving conflict for ${conflict.key}: using ${useLocal ? 'local' : 'cloud'} data`);
            
            if (useLocal) {
                await CloudDataService.setData(conflict.key.replace('pdv_', ''), conflict.local);
            } else {
                // Update local storage with cloud data
                localStorage.setItem(conflict.key, JSON.stringify(conflict.cloud));
            }
        }
        
        this.migrationStatus.conflicts = conflicts;
    }

    /**
     * Sync data to cloud
     */
    async syncToCloud(data) {
        const syncPromises = [];
        
        // Map local keys to cloud keys
        const keyMapping = {
            'products': 'products',
            'paymentMethods': 'paymentMethods',
            'categories': 'categories',
            'users': 'users',
            'integrations': 'integrations',
            'sales': 'sales',
            'pixConfig': 'pixConfig',
            'customers': 'customers',
            'payables': 'payables',
            'payableCategories': 'payableCategories',
            'receiptConfig': 'receiptConfig',
            'nfeConfig': 'nfeConfig'
        };

        Object.keys(keyMapping).forEach(localKey => {
            const cloudKey = keyMapping[localKey];
            if (data[localKey]) {
                syncPromises.push(
                    CloudDataService.setData(cloudKey, data[localKey])
                );
            }
        });

        await Promise.all(syncPromises);
        console.log('Data sync to cloud completed');
    }

    /**
     * Enable cloud-first mode
     */
    async enableCloudFirstMode() {
        // Configure CloudDataService for cloud-first operation
        CloudDataService.config.useCloud = true;
        CloudDataService.config.offlineMode = false;
        CloudDataService.config.cacheTimeout = 300000; // 5 minutes
        
        console.log('Cloud-first mode enabled');
    }

    /**
     * Use localStorage-only mode
     */
    useLocalStorageMode() {
        CloudDataService.config.useCloud = false;
        CloudDataService.config.offlineMode = true;
        
        console.log('LocalStorage mode enabled');
    }

    /**
     * Get migration status
     */
    getStatus() {
        return this.migrationStatus;
    }

    /**
     * Manual sync trigger
     */
    async triggerSync() {
        console.log('Manual sync triggered');
        
        try {
            const localData = this.getLocalData();
            await this.syncToCloud(localData);
            this.migrationStatus.lastSync = new Date().toISOString();
            
            console.log('Manual sync completed');
        } catch (error) {
            console.error('Manual sync failed:', error);
            this.migrationStatus.errors.push({
                timestamp: new Date().toISOString(),
                error: error.message
            });
        }
    }
}

// Initialize migration service
window.MigrationService = new MigrationService();

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await window.MigrationService.initialize();
});