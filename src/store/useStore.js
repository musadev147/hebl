import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

const useStore = create(
  persist(
    (set, get) => ({
      // User & Auth
      user: null,
      token: null,
      theme: 'dark',
      activeThemeClass: 'theme-forest',
      isLoading: false,

      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setThemeClass: (className) => set({ activeThemeClass: className }),

      login: async (credentials) => {
        try {
          const res = await apiClient.post(ENDPOINTS.LOGIN, {
            username: credentials.username,
            password: credentials.password,
            role: credentials.role || 'Admin',
          });
          const token = res.access || res.token;
          if (token) {
            localStorage.setItem('ehbl_token', token);
          }
          const userData = {
            id: res.user?.id || 1,
            username: res.user?.username || credentials.username,
            name: res.user?.name || res.user?.first_name || credentials.username,
            role: res.user?.role || credentials.role || 'Admin',
            email: res.user?.email || '',
          };
          set({ user: userData, token });
          // Synchronize all data from backend
          get().fetchAllData();
          return { success: true, user: userData };
        } catch (err) {
          console.error('Backend login failed:', err);
          const msg = (err?.response?.data && (err.response.data.non_field_errors?.[0] || err.response.data.detail || err.response.data.error || Object.values(err.response.data)[0])) || 'Invalid username or password.';
          return { success: false, error: typeof msg === 'string' ? msg : JSON.stringify(msg) };
        }
      },

      logout: () => {
        localStorage.removeItem('ehbl_token');
        set({ user: null, token: null });
      },

      // Core State
      inventory: [],
      categories: [],
      units: [],
      customers: [],
      suppliers: [],
      sales: [],
      purchases: [],
      returns: [],
      settlements: [],
      expenses: [],
      staff: [],
      attendance: [],
      leaves: [],
      payrolls: [],
      smsHistory: [],

      // Fetch all data from Django Backend
      fetchAllData: async () => {
        set({ isLoading: true });
        try {
          const [
            invRes,
            catRes,
            unitRes,
            custRes,
            supRes,
            salesRes,
            purRes,
            retRes,
            settleRes,
            expRes,
            staffRes,
            attRes,
            leaveRes,
            payRes,
            smsRes,
          ] = await Promise.allSettled([
            apiClient.get(ENDPOINTS.PRODUCTS),
            apiClient.get(ENDPOINTS.CATEGORIES),
            apiClient.get(ENDPOINTS.UNITS),
            apiClient.get(ENDPOINTS.CUSTOMERS),
            apiClient.get(ENDPOINTS.SUPPLIERS),
            apiClient.get(ENDPOINTS.SALES),
            apiClient.get(ENDPOINTS.PURCHASES),
            apiClient.get(ENDPOINTS.RETURNS),
            apiClient.get(ENDPOINTS.SETTLEMENTS),
            apiClient.get(ENDPOINTS.EXPENSES),
            apiClient.get(ENDPOINTS.STAFF),
            apiClient.get(ENDPOINTS.ATTENDANCE),
            apiClient.get(ENDPOINTS.LEAVES),
            apiClient.get(ENDPOINTS.PAYROLLS),
            apiClient.get(ENDPOINTS.SMS_HISTORY),
          ]);

          const updates = {};
          if (invRes.status === 'fulfilled' && Array.isArray(invRes.value)) updates.inventory = invRes.value;
          if (catRes.status === 'fulfilled' && Array.isArray(catRes.value)) updates.categories = catRes.value;
          if (unitRes.status === 'fulfilled' && Array.isArray(unitRes.value)) updates.units = unitRes.value;
          if (custRes.status === 'fulfilled' && Array.isArray(custRes.value)) updates.customers = custRes.value;
          if (supRes.status === 'fulfilled' && Array.isArray(supRes.value)) updates.suppliers = supRes.value;
          if (salesRes.status === 'fulfilled' && Array.isArray(salesRes.value)) updates.sales = salesRes.value;
          if (purRes.status === 'fulfilled' && Array.isArray(purRes.value)) updates.purchases = purRes.value;
          if (retRes.status === 'fulfilled' && Array.isArray(retRes.value)) updates.returns = retRes.value;
          if (settleRes.status === 'fulfilled' && Array.isArray(settleRes.value)) updates.settlements = settleRes.value;
          if (expRes.status === 'fulfilled' && Array.isArray(expRes.value)) updates.expenses = expRes.value;
          if (staffRes.status === 'fulfilled' && Array.isArray(staffRes.value)) updates.staff = staffRes.value;
          if (attRes.status === 'fulfilled' && Array.isArray(attRes.value)) updates.attendance = attRes.value;
          if (leaveRes.status === 'fulfilled' && Array.isArray(leaveRes.value)) updates.leaves = leaveRes.value;
          if (payRes.status === 'fulfilled' && Array.isArray(payRes.value)) updates.payrolls = payRes.value;
          if (smsRes.status === 'fulfilled' && Array.isArray(smsRes.value)) updates.smsHistory = smsRes.value;

          set({ ...updates, isLoading: false });
        } catch (err) {
          console.error('Error fetching data from backend:', err);
          set({ isLoading: false });
        }
      },

      // Cart State (In-memory POS state)
      cart: [],
      addToCart: (product) => set((state) => {
        const existing = state.cart.find((item) => item.id === product.id);
        if (existing) {
          return {
            cart: state.cart.map((item) =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ),
          };
        }
        return { cart: [...state.cart, { ...product, quantity: 1, isGift: false, itemDiscount: 0 }] };
      }),
      removeFromCart: (productId) => set((state) => ({
        cart: state.cart.filter((item) => item.id !== productId)
      })),
      updateCartItem: (productId, updates) => set((state) => ({
        cart: state.cart.map((item) =>
          item.id === productId ? { ...item, ...updates } : item
        )
      })),
      clearCart: () => set({ cart: [] }),

      // CATEGORY & UNIT ACTIONS
      addCategory: async (categoryName) => {
        try {
          const res = await apiClient.post(ENDPOINTS.CATEGORIES, { name: categoryName });
          const newCat = res || { id: Date.now(), name: categoryName };
          set((state) => ({ categories: [...state.categories.filter(c => (c.name || c) !== categoryName), newCat] }));
          return newCat;
        } catch (err) {
          console.error('Failed to add category:', err);
          const fallback = { id: Date.now(), name: categoryName };
          set((state) => ({ categories: [...state.categories, fallback] }));
          return fallback;
        }
      },
      addUnit: async (unitName) => {
        try {
          const res = await apiClient.post(ENDPOINTS.UNITS, { name: unitName });
          const newU = res || { id: Date.now(), name: unitName };
          set((state) => ({ units: [...state.units.filter(u => (u.name || u) !== unitName), newU] }));
          return newU;
        } catch (err) {
          console.error('Failed to add unit:', err);
          const fallback = { id: Date.now(), name: unitName };
          set((state) => ({ units: [...state.units, fallback] }));
          return fallback;
        }
      },

      // INVENTORY ACTIONS (Async API + Store update)
      addInventoryItem: async (item) => {
        try {
          const res = await apiClient.post(ENDPOINTS.PRODUCTS, item);
          const savedItem = res || item;
          set((state) => ({
            inventory: [savedItem, ...state.inventory.filter((i) => i.id !== savedItem.id)]
          }));
          return savedItem;
        } catch (err) {
          console.error('Failed to add product to backend:', err);
          const fallback = { ...item, dateAdded: item.dateAdded || new Date().toISOString() };
          set((state) => ({ inventory: [fallback, ...state.inventory] }));
          return fallback;
        }
      },

      updateInventoryItem: async (id, updates) => {
        try {
          const res = await apiClient.patch(ENDPOINTS.PRODUCT_DETAILS(id), updates);
          const updated = res || updates;
          set((state) => ({
            inventory: state.inventory.map((item) => (item.id === id ? { ...item, ...updated } : item))
          }));
        } catch (err) {
          console.error('Failed to update product on backend:', err);
          set((state) => ({
            inventory: state.inventory.map((item) => (item.id === id ? { ...item, ...updates } : item))
          }));
        }
      },

      deleteInventoryItem: async (id) => {
        try {
          await apiClient.delete(ENDPOINTS.PRODUCT_DETAILS(id));
          set((state) => ({
            inventory: state.inventory.filter((item) => item.id !== id)
          }));
        } catch (err) {
          console.error('Failed to delete product on backend:', err);
          set((state) => ({
            inventory: state.inventory.filter((item) => item.id !== id)
          }));
        }
      },

      // CONTACTS (Customers & Suppliers)
      addCustomer: async (customerData) => {
        try {
          const res = await apiClient.post(ENDPOINTS.CUSTOMERS, customerData);
          const saved = res || customerData;
          set((state) => ({
            customers: [saved, ...state.customers]
          }));
          return saved;
        } catch (err) {
          console.error('Failed to add customer on backend:', err);
          const fallback = { id: 'C' + Date.now(), due: 0, ...customerData };
          set((state) => ({ customers: [...state.customers, fallback] }));
          return fallback;
        }
      },

      addSupplier: async (supplierData) => {
        try {
          const res = await apiClient.post(ENDPOINTS.SUPPLIERS, supplierData);
          const saved = res || supplierData;
          set((state) => ({
            suppliers: [saved, ...state.suppliers]
          }));
          return saved;
        } catch (err) {
          console.error('Failed to add supplier on backend:', err);
          const fallback = { id: 'SUP' + Date.now(), due: 0, ...supplierData };
          set((state) => ({ suppliers: [...state.suppliers, fallback] }));
          return fallback;
        }
      },

      updateSupplier: async (supplierId, updates) => {
        try {
          await apiClient.patch(ENDPOINTS.SUPPLIER_DETAILS(supplierId), updates);
        } catch (err) {
          console.error('Failed to update supplier on backend:', err);
        }
        set((state) => ({
          suppliers: state.suppliers.map((s) => (s.id === supplierId ? { ...s, ...updates } : s))
        }));
      },

      // DUE SETTLEMENT
      settleCustomerDue: async (customerId, amount, dateStr) => {
        try {
          const res = await apiClient.post(ENDPOINTS.SETTLE_DUE, {
            targetId: customerId,
            type: 'Customer',
            amount: parseFloat(amount),
            date: dateStr,
          });
          const settlementRecord = res?.settlement || {
            id: 'STL' + Date.now(),
            targetId: customerId,
            type: 'Customer',
            amount,
            date: dateStr || new Date().toISOString()
          };
          set((state) => ({
            customers: state.customers.map((c) =>
              c.id === customerId ? { ...c, due: Math.max(0, parseFloat(c.due || 0) - amount) } : c
            ),
            settlements: [settlementRecord, ...(state.settlements || [])]
          }));
        } catch (err) {
          console.error('Failed to settle customer due on backend:', err);
          const settlementRecord = { id: 'STL' + Date.now(), targetId: customerId, type: 'Customer', amount, date: dateStr || new Date().toISOString() };
          set((state) => ({
            customers: state.customers.map((c) =>
              c.id === customerId ? { ...c, due: Math.max(0, (c.due || 0) - amount) } : c
            ),
            settlements: [settlementRecord, ...(state.settlements || [])]
          }));
        }
      },

      settleSupplierDue: async (supplierId, amount, dateStr) => {
        try {
          const res = await apiClient.post(ENDPOINTS.SETTLE_DUE, {
            targetId: supplierId,
            type: 'Supplier',
            amount: parseFloat(amount),
            date: dateStr,
          });
          const settlementRecord = res?.settlement || {
            id: 'STL' + Date.now(),
            targetId: supplierId,
            type: 'Supplier',
            amount,
            date: dateStr || new Date().toISOString()
          };
          set((state) => ({
            suppliers: state.suppliers.map((s) =>
              s.id === supplierId ? { ...s, due: Math.max(0, parseFloat(s.due || 0) - amount) } : s
            ),
            settlements: [settlementRecord, ...(state.settlements || [])]
          }));
        } catch (err) {
          console.error('Failed to settle supplier due on backend:', err);
          const settlementRecord = { id: 'STL' + Date.now(), targetId: supplierId, type: 'Supplier', amount, date: dateStr || new Date().toISOString() };
          set((state) => ({
            suppliers: state.suppliers.map((s) =>
              s.id === supplierId ? { ...s, due: Math.max(0, (s.due || 0) - amount) } : s
            ),
            settlements: [settlementRecord, ...(state.settlements || [])]
          }));
        }
      },

      // POS SALES ACTION
      processSale: async (salePayload) => {
        try {
          const res = await apiClient.post(ENDPOINTS.SALES, salePayload);
          const savedSale = res || {
            id: 'INV' + Date.now(),
            date: new Date().toISOString(),
            ...salePayload,
          };
          // Re-sync inventory & customers to get exact updated stock and dues from backend
          get().fetchAllData();
          return savedSale;
        } catch (err) {
          console.error('Failed to process sale on backend:', err);
          // Local fallback
          const saleRecord = {
            id: 'INV' + Date.now(),
            date: new Date().toISOString(),
            items: salePayload.cartItems,
            subtotal: salePayload.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
            invoiceDiscount: salePayload.invoiceDiscount || 0,
            total: salePayload.total || 0,
            paymentType: salePayload.paymentType,
            customerId: salePayload.customerInfo?.id,
            customerName: salePayload.customerInfo?.name,
            salesmanId: get().user?.id,
            salesmanName: get().user?.name,
            isGift: false,
          };
          set((state) => ({
            sales: [saleRecord, ...state.sales],
            cart: []
          }));
          return saleRecord;
        }
      },

      // PURCHASES ACTION
      processPurchase: async (purchasePayload) => {
        try {
          const res = await apiClient.post(ENDPOINTS.PURCHASES, purchasePayload);
          get().fetchAllData();
          return res;
        } catch (err) {
          console.error('Failed to process purchase on backend:', err);
          const purchaseRecord = {
            id: 'PUR' + Date.now(),
            date: new Date().toISOString(),
            ...purchasePayload,
          };
          set((state) => ({
            purchases: [purchaseRecord, ...state.purchases]
          }));
          return purchaseRecord;
        }
      },

      // RETURNS ACTION
      processReturn: async ({ returnType, productId, quantity, reason }) => {
        try {
          const res = await apiClient.post(ENDPOINTS.RETURNS, {
            returnType,
            productId,
            quantity: parseInt(quantity) || 1,
            reason,
          });
          get().fetchAllData();
          return res;
        } catch (err) {
          console.error('Failed to process return on backend:', err);
          const returnRecord = {
            id: 'RET' + Date.now(),
            date: new Date().toISOString(),
            returnType,
            productId,
            quantity,
            reason
          };
          set((state) => ({
            returns: [returnRecord, ...state.returns]
          }));
          return returnRecord;
        }
      },

      // EXPENSES
      addExpense: async (expense) => {
        try {
          const res = await apiClient.post(ENDPOINTS.EXPENSES, expense);
          const saved = res || expense;
          set((state) => ({
            expenses: [saved, ...state.expenses]
          }));
          return saved;
        } catch (err) {
          console.error('Failed to add expense to backend:', err);
          const fallback = { id: Date.now(), ...expense };
          set((state) => ({ expenses: [fallback, ...state.expenses] }));
          return fallback;
        }
      },

      // HR & PAYROLL
      addStaff: async (staffData) => {
        try {
          const res = await apiClient.post(ENDPOINTS.STAFF, staffData);
          set((state) => ({
            staff: [res || staffData, ...state.staff]
          }));
        } catch (err) {
          console.error('Failed to add staff to backend:', err);
          set((state) => ({
            staff: [...state.staff, { id: 'ST' + Date.now(), ...staffData }]
          }));
        }
      },

      markAttendance: async (staffId, date, status) => {
        try {
          await apiClient.post(ENDPOINTS.MARK_ATTENDANCE, { staffId, date, status });
        } catch (err) {
          console.error('Failed to mark attendance on backend:', err);
        }
        set((state) => {
          const existingIndex = state.attendance.findIndex((a) => a.staffId === staffId && a.date === date);
          if (existingIndex !== -1) {
            const newAttendance = [...state.attendance];
            newAttendance[existingIndex] = { ...newAttendance[existingIndex], status };
            return { attendance: newAttendance };
          }
          return {
            attendance: [...state.attendance, { id: Date.now(), staffId, date, status }]
          };
        });
      },

      addLeaveRequest: async (leaveData) => {
        try {
          const res = await apiClient.post(ENDPOINTS.LEAVES, leaveData);
          get().fetchAllData();
          return res;
        } catch (err) {
          console.error('Failed to add leave request to backend:', err);
          set((state) => ({
            leaves: [{ id: Date.now(), ...leaveData, status: 'Pending' }, ...state.leaves]
          }));
        }
      },

      updateLeaveStatus: async (leaveId, status) => {
        try {
          await apiClient.post(`/hr/leaves/${leaveId}/status/`, { status });
          get().fetchAllData();
        } catch (err) {
          console.error('Failed to update leave status on backend:', err);
          set((state) => ({
            leaves: state.leaves.map((l) => (l.id === leaveId ? { ...l, status } : l))
          }));
        }
      },

      generatePayslip: async (payrollData) => {
        try {
          const res = await apiClient.post(ENDPOINTS.GENERATE_PAYSLIP, payrollData);
          get().fetchAllData();
          return res;
        } catch (err) {
          console.error('Failed to generate payslip on backend:', err);
          const expenseEntry = {
            id: Date.now() + 1,
            date: new Date().toISOString().split('T')[0],
            category: 'Staff Cost',
            amount: payrollData.netPay,
            description: `Salary for ${payrollData.staffName} (${payrollData.month} ${payrollData.year})`
          };
          set((state) => ({
            payrolls: [{ id: 'PR' + Date.now(), ...payrollData, paymentDate: new Date().toISOString() }, ...state.payrolls],
            expenses: [expenseEntry, ...state.expenses]
          }));
        }
      },

      // SMS
      addSmsToHistory: async (smsData) => {
        try {
          const res = await apiClient.post(ENDPOINTS.SMS_SEND, {
            message: smsData.message,
            customerIds: smsData.receivers?.map((r) => r.id) || smsData.selectedCustomers || [],
            numbers: smsData.numbers || []
          });
          get().fetchAllData();
          return res;
        } catch (err) {
          console.error('Failed to send SMS on backend:', err);
          set((state) => ({
            smsHistory: [{ id: 'SMS' + Date.now(), date: new Date().toISOString(), ...smsData }, ...state.smsHistory]
          }));
        }
      },

      // Compatibility helper
      loadDummyData: () => {
        get().fetchAllData();
      }
    }),
    {
      name: 'retail-shop-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        theme: state.theme,
        activeThemeClass: state.activeThemeClass,
        cart: state.cart,
      }),
    }
  )
);

export default useStore;
