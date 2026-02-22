// Firestore Service
const FirestoreService = {
  // Collections
  productsCol: db.collection('products'),
  salesCol: db.collection('sales'),
  customersCol: db.collection('customers'),
  usersCol: db.collection('users'),

  // Listeners
  listenProducts(callback) {
    return this.productsCol.onSnapshot(snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(data);
    }, err => console.error(err));
  },

  listenSales(callback) {
    return this.salesCol.orderBy('date', 'desc').onSnapshot(snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(data);
    }, err => console.error(err));
  },

  listenCustomers(callback) {
    return this.customersCol.onSnapshot(snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(data);
    }, err => console.error(err));
  },

  // CRUD Operations
  async addProduct(product) {
    return this.productsCol.add(product);
  },

  async updateProduct(id, data) {
    return this.productsCol.doc(id).update(data);
  },

  async deleteProduct(id) {
    return this.productsCol.doc(id).delete();
  },

  async addSale(sale) {
    return this.salesCol.add(sale);
  },

  async addCustomer(customer) {
    return this.customersCol.add(customer);
  },

  async updateCustomer(id, data) {
    return this.customersCol.doc(id).update(data);
  },

  // Migration Helper
  async migrateFromLocalStorage() {
    console.log('Starting Migration...');
    const localProducts = JSON.parse(localStorage.getItem('pdv_products') || '[]');
    const localSales = JSON.parse(localStorage.getItem('pdv_sales') || '[]');
    const localCustomers = JSON.parse(localStorage.getItem('pdv_customers') || '[]');

    const batch = db.batch();

    localProducts.forEach(p => {
      const ref = this.productsCol.doc(); // Auto ID
      batch.set(ref, p);
    });

    localSales.forEach(s => {
      const ref = this.salesCol.doc();
      batch.set(ref, s);
    });

    localCustomers.forEach(c => {
      const ref = this.customersCol.doc();
      batch.set(ref, c);
    });

    await batch.commit();
    console.log('Migration Completed');
    localStorage.setItem('migrated_to_firebase', 'true');
  }
};
