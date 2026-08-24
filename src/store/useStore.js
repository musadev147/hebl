import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // App State
      user: null, // { id, name, role: 'Admin' | 'Salesman' }
      theme: 'dark',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      login: (userData) => set({ user: userData }),
      logout: () => set({ user: null }),

      // Core Data Tables (Initialized with Mock Data for demonstration)
      inventory: [
        { id: '10001', name: 'Premium Rice 50kg', category: 'Grocery', stock: 150, unit: 'Bag', price: 3500, dateAdded: new Date().toISOString() },
        { id: '10002', name: 'Refined Oil 5L', category: 'Grocery', stock: 45, unit: 'Bottle', price: 850, dateAdded: new Date().toISOString() },
        { id: '10003', name: 'Dal 1kg', category: 'Grocery', stock: 200, unit: 'Packet', price: 120, dateAdded: new Date().toISOString() },
      ],
      customers: [
        { id: 'C001', name: 'Karim Rahman', phone: '01711000000', location: 'Dhaka', due: 1500 },
        { id: 'C002', name: 'Abdul Alim', phone: '01811000000', location: 'Chittagong', due: 0 },
      ],
      suppliers: [
        { id: 'S001', name: 'Rahim Traders', phone: '01911000000', due: 12000 },
        { id: 'S002', name: 'Global Impex', phone: '01611000000', due: 0 },
      ],
      sales: [],      // Retail Sales & Gifts History
      purchases: [],  // Supplier Purchases History
      returns: [],    // Customer returns & Supplier rejects
      settlements: [], // Due settlement history
      expenses: [
        { id: 1, date: new Date().toISOString().split('T')[0], category: 'Transport', amount: 350, description: 'Van rent for rice delivery' },
        { id: 2, date: new Date().toISOString().split('T')[0], category: 'Staff Cost', amount: 200, description: 'Lunch for staff' },
      ],

      // HR & Payroll State
      staff: [
        { id: 'ST001', name: 'Rahim', role: 'Salesman', baseSalary: 12000, joinDate: '2023-01-15' },
        { id: 'ST002', name: 'Karim', role: 'Salesman', baseSalary: 12000, joinDate: '2023-02-10' },
      ],
      attendance: [], // { id, date, staffId, status: 'Present' | 'Absent' | 'Late' | 'Leave' }
      leaves: [],     // { id, date, staffId, type: 'Casual' | 'Sick', reason, status: 'Pending' | 'Approved' | 'Rejected' }
      payrolls: [],   // { id, month, year, staffId, presentDays, baseSalary, bonus, netPay, paymentDate }

      // Cart State (Temporary, not persisted to DB logically but kept in Zustand)
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

      // INVENTORY LOGIC
      addInventoryItem: (item) => set((state) => ({
        inventory: [{ ...item, dateAdded: item.dateAdded || new Date().toISOString() }, ...state.inventory]
      })),
      updateInventoryItem: (id, updates) => set((state) => ({
        inventory: state.inventory.map(item => item.id === id ? { ...item, ...updates } : item)
      })),
      deleteInventoryItem: (id) => set((state) => ({
        inventory: state.inventory.filter(item => item.id !== id)
      })),

      // DUE MANAGEMENT
      settleCustomerDue: (customerId, amount, dateStr) => set((state) => {
        const date = dateStr || new Date().toISOString();
        const settlementRecord = { id: 'STL' + Date.now(), targetId: customerId, type: 'Customer', amount, date };
        return {
          customers: state.customers.map(c => 
            c.id === customerId ? { ...c, due: Math.max(0, c.due - amount) } : c
          ),
          settlements: [settlementRecord, ...(state.settlements || [])]
        };
      }),
      settleSupplierDue: (supplierId, amount, dateStr) => set((state) => {
        const date = dateStr || new Date().toISOString();
        const settlementRecord = { id: 'STL' + Date.now(), targetId: supplierId, type: 'Supplier', amount, date };
        return {
          suppliers: state.suppliers.map(s => 
            s.id === supplierId ? { ...s, due: Math.max(0, s.due - amount) } : s
          ),
          settlements: [settlementRecord, ...(state.settlements || [])]
        };
      }),

      // BUSINESS LOGIC ACTIONS

      processSale: ({ cartItems, paymentType, customerInfo, invoiceDiscount, salesman }) => set((state) => {
        const newInventory = [...state.inventory];
        let subtotal = 0;
        let isGiftInvoice = false;

        cartItems.forEach(cartItem => {
          // Adjust Inventory (Deduct stock)
          const invIndex = newInventory.findIndex(i => i.id === cartItem.id);
          if (invIndex !== -1) {
            newInventory[invIndex] = { ...newInventory[invIndex], stock: newInventory[invIndex].stock - cartItem.quantity };
          }
          if (!cartItem.isGift) {
            subtotal += (cartItem.price - cartItem.itemDiscount) * cartItem.quantity;
          } else {
            isGiftInvoice = true;
          }
        });

        const total = Math.max(0, subtotal - invoiceDiscount);
        
        // Handle Baki (Due)
        const newCustomers = [...state.customers];
        let customerId = null;

        if (customerInfo.name) {
          const existingCustIndex = newCustomers.findIndex(c => c.phone === customerInfo.phone || c.name === customerInfo.name);
          if (existingCustIndex !== -1) {
            customerId = newCustomers[existingCustIndex].id;
            if (paymentType === 'Baki') {
              newCustomers[existingCustIndex] = { ...newCustomers[existingCustIndex], due: newCustomers[existingCustIndex].due + total };
            }
          } else {
            customerId = 'C' + Date.now();
            newCustomers.push({
              id: customerId,
              name: customerInfo.name,
              phone: customerInfo.phone || '',
              location: customerInfo.location || '',
              due: paymentType === 'Baki' ? total : 0
            });
          }
        }

        const saleRecord = {
          id: 'INV' + Date.now(),
          date: new Date().toISOString(),
          items: cartItems,
          subtotal,
          invoiceDiscount,
          total,
          paymentType,
          customerId,
          customerName: customerInfo.name || 'Walk-in Customer',
          salesmanId: salesman?.id || 'Admin',
          salesmanName: salesman?.name || 'Admin',
          isGift: isGiftInvoice && total === 0
        };

        return {
          inventory: newInventory,
          customers: newCustomers,
          sales: [saleRecord, ...state.sales],
          cart: [] // clear cart on success
        };
      }),

      processPurchase: ({ items, supplierId, supplierName, paymentType, total, paidAmount }) => set((state) => {
        const newInventory = [...state.inventory];
        
        items.forEach(item => {
          const invIndex = newInventory.findIndex(i => i.name.toLowerCase() === item.name.toLowerCase());
          if (invIndex !== -1) {
            newInventory[invIndex] = { ...newInventory[invIndex], stock: newInventory[invIndex].stock + item.quantity };
          } else {
            // Add new product
            newInventory.push({
              id: 'P' + Date.now() + Math.floor(Math.random()*100),
              name: item.name,
              category: 'Uncategorized',
              variant: item.variant || '',
              unit: 'Pcs',
              stock: item.quantity,
              price: item.price // Note: this is purchase price, not retail, but simplified here
            });
          }
        });

        const dueAmount = total - paidAmount;
        const newSuppliers = [...state.suppliers];
        
        if (dueAmount > 0) {
          const supIndex = newSuppliers.findIndex(s => s.id === supplierId);
          if (supIndex !== -1) {
            newSuppliers[supIndex] = { ...newSuppliers[supIndex], due: newSuppliers[supIndex].due + dueAmount };
          }
        }

        const purchaseRecord = {
          id: 'PUR' + Date.now(),
          date: new Date().toISOString(),
          items,
          supplierId,
          supplierName,
          paymentType,
          total,
          paidAmount,
          dueAmount
        };

        return {
          inventory: newInventory,
          suppliers: newSuppliers,
          purchases: [purchaseRecord, ...state.purchases]
        };
      }),

      processReturn: ({ returnType, productId, quantity, reason }) => set((state) => {
        const newInventory = [...state.inventory];
        const invIndex = newInventory.findIndex(i => i.id === productId);
        
        if (invIndex !== -1) {
          if (returnType === 'Customer') {
            // Customer returned to us -> increase stock
            newInventory[invIndex] = { ...newInventory[invIndex], stock: newInventory[invIndex].stock + quantity };
          } else {
            // We rejected to supplier -> decrease stock
            newInventory[invIndex] = { ...newInventory[invIndex], stock: newInventory[invIndex].stock - quantity };
          }
        }

        const returnRecord = {
          id: 'RET' + Date.now(),
          date: new Date().toISOString(),
          returnType, // 'Customer' | 'Supplier'
          productId,
          quantity,
          reason
        };

        return {
          inventory: newInventory,
          returns: [returnRecord, ...state.returns]
        };
      }),

      payCustomerDue: (customerId, amount) => set((state) => ({
        customers: state.customers.map(c => c.id === customerId ? { ...c, due: Math.max(0, c.due - amount) } : c)
      })),

      paySupplierDue: (supplierId, amount) => set((state) => ({
        suppliers: state.suppliers.map(s => s.id === supplierId ? { ...s, due: Math.max(0, s.due - amount) } : s)
      })),

      addSupplier: (supplierData) => set((state) => ({
        suppliers: [...state.suppliers, { id: 'SUP' + Date.now(), due: 0, ...supplierData }]
      })),

      updateSupplier: (supplierId, updates) => set((state) => ({
        suppliers: state.suppliers.map(s => s.id === supplierId ? { ...s, ...updates } : s)
      })),

      addExpense: (expense) => set((state) => ({
        expenses: [{ id: Date.now(), ...expense }, ...state.expenses]
      })),

      // HR ACTIONS
      addStaff: (staffData) => set((state) => ({
        staff: [...state.staff, { id: 'ST' + Date.now(), ...staffData }]
      })),
      
      markAttendance: (staffId, date, status) => set((state) => {
        const existingIndex = state.attendance.findIndex(a => a.staffId === staffId && a.date === date);
        if (existingIndex !== -1) {
          const newAttendance = [...state.attendance];
          newAttendance[existingIndex] = { ...newAttendance[existingIndex], status };
          return { attendance: newAttendance };
        } else {
          return {
            attendance: [...state.attendance, { id: Date.now() + Math.random(), staffId, date, status }]
          };
        }
      }),

      addLeaveRequest: (leaveData) => set((state) => ({
        leaves: [{ id: Date.now(), ...leaveData, status: 'Pending' }, ...state.leaves]
      })),

      updateLeaveStatus: (leaveId, status) => set((state) => ({
        leaves: state.leaves.map(l => l.id === leaveId ? { ...l, status } : l)
      })),

      generatePayslip: (payrollData) => set((state) => {
        // Automatically add to expenses
        const expenseEntry = {
          id: Date.now() + 1,
          date: new Date().toISOString().split('T')[0],
          category: 'Staff Cost',
          amount: payrollData.netPay,
          description: `Salary for ${payrollData.staffName} (${payrollData.month} ${payrollData.year})`
        };

        return {
          payrolls: [{ id: 'PR' + Date.now(), ...payrollData, paymentDate: new Date().toISOString() }, ...state.payrolls],
          expenses: [expenseEntry, ...state.expenses]
        };
      }),

      loadDummyData: () => set((state) => {
        const todayStr = new Date().toISOString();
        const justDate = todayStr.split('T')[0];
        return {
          inventory: [
            { id: '10001', name: 'Premium Rice 50kg', category: 'Grocery', stock: 150, unit: 'Bag', price: 3500, dateAdded: todayStr },
            { id: '10002', name: 'Refined Oil 5L', category: 'Grocery', stock: 45, unit: 'Bottle', price: 850, dateAdded: todayStr },
            { id: '10003', name: 'Dal 1kg', category: 'Grocery', stock: 200, unit: 'Packet', price: 120, dateAdded: todayStr },
            { id: '10004', name: 'Sugar 1kg', category: 'Grocery', stock: 100, unit: 'Packet', price: 140, dateAdded: todayStr },
          ],
          customers: [
            { id: 'C001', name: 'Karim Rahman', phone: '01711000000', location: 'Dhaka', due: 1500 },
            { id: 'C002', name: 'Abdul Alim', phone: '01811000000', location: 'Chittagong', due: 0 },
          ],
          suppliers: [
            { id: 'S001', name: 'Rahim Traders', phone: '01911000000', due: 12000 },
            { id: 'S002', name: 'Global Impex', phone: '01611000000', due: 0 },
          ],
          staff: [
            { id: 'ST001', name: 'Rahim', role: 'Salesman', baseSalary: 12000, joinDate: '2023-01-15' },
            { id: 'ST002', name: 'Karim', role: 'Salesman', baseSalary: 12000, joinDate: '2023-02-10' },
          ],
          sales: [
            { id: 'INV1001', date: todayStr, items: [{id: '10001', name: 'Premium Rice 50kg', quantity: 2, price: 3500, isGift: false}], subtotal: 7000, invoiceDiscount: 100, total: 6900, paymentType: 'Cash', customerName: 'Karim Rahman', salesmanName: 'Rahim', isGift: false },
            { id: 'INV1002', date: todayStr, items: [{id: '10002', name: 'Refined Oil 5L', quantity: 1, price: 850, isGift: false}], subtotal: 850, invoiceDiscount: 0, total: 850, paymentType: 'Baki', customerName: 'Abdul Alim', salesmanName: 'Karim', isGift: false },
          ],
          purchases: [
            { id: 'PUR2001', date: todayStr, items: [{name: 'Premium Rice 50kg', quantity: 50}], supplierName: 'Rahim Traders', paymentType: 'Baki', total: 150000 }
          ],
          expenses: [
            { id: 1, date: justDate, category: 'Transport', amount: 350, description: 'Van rent' },
            { id: 2, date: justDate, category: 'Electricity', amount: 1200, description: 'Monthly bill' },
          ],
          returns: [
            { id: 'RET3001', date: todayStr, returnType: 'Customer', productId: '10001', quantity: 1, reason: 'Damaged packaging' },
            { id: 'RET3002', date: todayStr, returnType: 'Supplier', productId: '10002', quantity: 2, reason: 'Expired product' }
          ],
          payrolls: [
            { id: 'PR4001', staffId: 'ST001', staffName: 'Rahim', month: justDate.substring(0, 7), presentDays: 28, baseSalary: 12000, bonus: 1000, netPay: 12200, paymentDate: todayStr }
          ]
        };
      }),

    }),
    {
      name: 'retail-shop-storage', // key in localStorage
    }
  )
);

export default useStore;
