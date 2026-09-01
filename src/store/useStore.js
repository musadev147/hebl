import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // App State
      user: null, // { id, name, role: 'Admin' | 'Salesman' }
      theme: 'dark',
      activeThemeClass: 'theme-forest',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setThemeClass: (className) => set({ activeThemeClass: className }),
      login: (userData) => {
        // Simple mock authentication logic
        if (userData.username === 'admin' && userData.password === 'admin') {
           set({ user: userData });
           return { success: true };
        } else if (userData.username && userData.password) {
           // Allow any valid dummy login for now, or you can restrict it
           set({ user: userData });
           return { success: true };
        }
        return { success: false };
      },
      logout: () => set({ user: null }),

      // Core Data Tables
      inventory: [
        { id: '10001', name: 'Bosch Impact Drill 13mm', category: 'Power Tools', stock: 15, unit: 'pcs', price: 3500, dateAdded: new Date().toISOString() },
        { id: '10002', name: 'Steel Wire Brush 4x16', category: 'Hand Tools', stock: 120, unit: 'pcs', price: 35, dateAdded: new Date().toISOString() },
        { id: '10003', name: 'Indian Lock Heavy Duty', category: 'Hardware', stock: 50, unit: 'pcs', price: 450, dateAdded: new Date().toISOString() },
        { id: '10004', name: 'Angle Grinder 4 inch', category: 'Machine Tools', stock: 25, unit: 'pcs', price: 2200, dateAdded: new Date().toISOString() },
      ],
      customers: [
        { id: 'C001', name: 'Fahim Traders', phone: '01719563699', location: 'Kotchandpur', due: 1020 },
        { id: 'C002', name: 'Zaman Hardware', phone: '01811000000', location: 'Dhaka', due: 5000 },
      ],
      suppliers: [
        { id: 'S001', name: 'Bosch Tools BD', phone: '01911000000', due: 15000 },
        { id: 'S002', name: 'China Impex Ltd', phone: '01611000000', due: 50000 },
      ],
      sales: [
        { id: 'INV' + (Date.now() - 86400000), date: new Date(Date.now() - 86400000).toISOString(), items: [{id: '10001', name: 'Bosch Impact Drill 13mm', quantity: 1, price: 3500, isGift: false}], subtotal: 3500, invoiceDiscount: 100, total: 3400, paymentType: 'Cash', customerId: 'C002', customerName: 'Zaman Hardware', salesmanId: 'ST001', salesmanName: 'Rashed', isGift: false },
        { id: 'INV' + Date.now(), date: new Date().toISOString(), items: [{id: '10002', name: 'Steel Wire Brush 4x16', quantity: 12, price: 35, isGift: false}], subtotal: 420, invoiceDiscount: 0, total: 420, paymentType: 'Baki', customerId: 'C001', customerName: 'Fahim Traders', salesmanId: 'ST002', salesmanName: 'Hasan', isGift: false }
      ],
      purchases: [
        { id: 'PUR' + (Date.now() - 172800000), date: new Date(Date.now() - 172800000).toISOString(), items: [{name: 'Indian Lock Heavy Duty', quantity: 50, price: 350}], supplierId: 'S002', supplierName: 'China Impex Ltd', paymentType: 'Baki', total: 17500, paidAmount: 5000, dueAmount: 12500 }
      ],
      returns: [
        { id: 'RET' + Date.now(), date: new Date().toISOString(), returnType: 'Customer', productId: '10004', quantity: 1, reason: 'Motor issue' }
      ],
      settlements: [
        { id: 'STL' + Date.now(), targetId: 'C001', type: 'Customer', amount: 500, date: new Date().toISOString() }
      ],
      expenses: [
        { id: 1, date: new Date().toISOString().split('T')[0], category: 'Transport', amount: 500, description: 'Carrying Loading for tools' },
        { id: 2, date: new Date().toISOString().split('T')[0], category: 'Utility', amount: 1200, description: 'Electricity Bill' },
      ],

      // HR & Payroll State
      staff: [
        { id: 'ST001', name: 'Rashed', role: 'Store Incharge', baseSalary: 15000, joinDate: '2022-05-10' },
        { id: 'ST002', name: 'Hasan', role: 'Delivery', baseSalary: 12000, joinDate: '2023-01-15' },
      ],
      attendance: [
        { id: 1, staffId: 'ST001', date: new Date().toISOString().split('T')[0], status: 'Present' },
        { id: 2, staffId: 'ST002', date: new Date().toISOString().split('T')[0], status: 'Late' }
      ],
      leaves: [
        { id: 1, staffId: 'ST002', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], type: 'Sick', reason: 'Fever', status: 'Pending' }
      ],
      payrolls: [
        { id: 'PR' + Date.now(), staffId: 'ST001', staffName: 'Rashed', month: new Date().toISOString().substring(0, 7), presentDays: 28, baseSalary: 15000, bonus: 2000, netPay: 17000, paymentDate: new Date().toISOString() }
      ],

      // SMS History
      smsHistory: [
        { id: 'SMS1', date: new Date().toISOString(), numbers: ['01719563699'], message: 'Dear Fahim Traders, your due amount is 1020 TK. Please clear it soon.', status: 'Sent' }
      ],
      addSmsToHistory: (smsData) => set((state) => ({
        smsHistory: [{ id: 'SMS' + Date.now(), date: new Date().toISOString(), ...smsData }, ...state.smsHistory]
      })),


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

      addCustomer: (customerData) => set((state) => ({
        customers: [...state.customers, { id: 'C' + Date.now(), due: 0, ...customerData }]
      })),

      updateSupplier: (supplierId, updates) => set((state) => ({
        suppliers: state.suppliers.map(s => s.id === supplierId ? { ...s, ...updates } : s)
      })),

      addExpense: (expense) => set((state) => ({
        expenses: [{ id: Date.now(), ...expense }, ...state.expenses]
      })),

      // SR SETTLEMENTS
      srSettlements: [],
      issueProductsToSR: (settlementData) => set((state) => {
        const newInventory = [...state.inventory];
        settlementData.items.forEach(item => {
          const invIndex = newInventory.findIndex(i => i.id === item.productId);
          if (invIndex !== -1) {
            newInventory[invIndex] = { ...newInventory[invIndex], stock: newInventory[invIndex].stock - item.quantity };
          }
        });
        return {
          inventory: newInventory,
          srSettlements: [{ ...settlementData, id: 'SR' + Date.now(), status: 'Pending' }, ...(state.srSettlements || [])]
        };
      }),
      updateSRSettlement: (id, updates) => set((state) => ({
        srSettlements: (state.srSettlements || []).map(s => s.id === id ? { ...s, ...updates } : s)
      })),
      settleSRAccount: (id, cashReceived, returnItems = []) => set((state) => {
        const newInventory = [...state.inventory];
        returnItems.forEach(item => {
           const invIndex = newInventory.findIndex(i => String(i.id) === String(item.productId));
           if (invIndex !== -1) {
             newInventory[invIndex] = { ...newInventory[invIndex], stock: newInventory[invIndex].stock + (item.returnQty || 0) };
           }
        });

        const settlement = (state.srSettlements || []).find(s => s.id === id);
        let dueAmount = 0;
        if (settlement) {
           const finalSales = returnItems.reduce((acc, item) => acc + ((item.issuedQty - item.returnQty) * item.price), 0);
           dueAmount = Math.max(0, finalSales - cashReceived);
        }

        const newStaff = [...(state.staff || [])];
        if (settlement && dueAmount > 0) {
           const staffIndex = newStaff.findIndex(s => String(s.id) === String(settlement.salesmanId));
           if (staffIndex !== -1) {
              newStaff[staffIndex] = { ...newStaff[staffIndex], due: (newStaff[staffIndex].due || 0) + dueAmount };
           }
        }

        return {
          inventory: newInventory,
          staff: newStaff,
          srSettlements: (state.srSettlements || []).map(s => s.id === id ? { ...s, status: 'Settled', cashReceived, returnItems } : s)
        };
      }),
      payStaffDue: (staffId, amount, dateStr) => set((state) => {
        const date = dateStr || new Date().toISOString();
        const settlementRecord = { id: 'STL' + Date.now(), targetId: staffId, type: 'Staff', amount, date };
        return {
          staff: state.staff.map(s => String(s.id) === String(staffId) ? { ...s, due: Math.max(0, (s.due || 0) - amount) } : s),
          settlements: [settlementRecord, ...(state.settlements || [])]
        };
      }),

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
            { id: '10001', name: 'Bosch Impact Drill 13mm', category: 'Power Tools', stock: 15, unit: 'pcs', price: 3500, dateAdded: todayStr },
            { id: '10002', name: 'Steel Wire Brush 4x16', category: 'Hand Tools', stock: 120, unit: 'pcs', price: 35, dateAdded: todayStr },
            { id: '10003', name: 'Indian Lock Heavy Duty', category: 'Hardware', stock: 50, unit: 'pcs', price: 450, dateAdded: todayStr },
            { id: '10004', name: 'Angle Grinder 4 inch', category: 'Machine Tools', stock: 25, unit: 'pcs', price: 2200, dateAdded: todayStr },
          ],
          customers: [
            { id: 'C001', name: 'Fahim Traders', phone: '01719563699', location: 'Kotchandpur', due: 1020 },
            { id: 'C002', name: 'Zaman Hardware', phone: '01811000000', location: 'Dhaka', due: 5000 },
          ],
          suppliers: [
            { id: 'S001', name: 'Bosch Tools BD', phone: '01911000000', due: 15000 },
            { id: 'S002', name: 'China Impex Ltd', phone: '01611000000', due: 50000 },
          ],
          staff: [
            { id: 'ST001', name: 'Rashed', role: 'Store Incharge', baseSalary: 15000, joinDate: '2022-05-10' },
            { id: 'ST002', name: 'Hasan', role: 'Delivery', baseSalary: 12000, joinDate: '2023-01-15' },
          ],
          sales: [
            { id: 'INV' + (Date.now() - 86400000), date: new Date(Date.now() - 86400000).toISOString(), items: [{id: '10001', name: 'Bosch Impact Drill 13mm', quantity: 1, price: 3500, isGift: false}], subtotal: 3500, invoiceDiscount: 100, total: 3400, paymentType: 'Cash', customerId: 'C002', customerName: 'Zaman Hardware', salesmanId: 'ST001', salesmanName: 'Rashed', isGift: false },
            { id: 'INV' + Date.now(), date: todayStr, items: [{id: '10002', name: 'Steel Wire Brush 4x16', quantity: 12, price: 35, isGift: false}], subtotal: 420, invoiceDiscount: 0, total: 420, paymentType: 'Baki', customerId: 'C001', customerName: 'Fahim Traders', salesmanId: 'ST002', salesmanName: 'Hasan', isGift: false }
          ],
          purchases: [
            { id: 'PUR' + (Date.now() - 172800000), date: new Date(Date.now() - 172800000).toISOString(), items: [{name: 'Indian Lock Heavy Duty', quantity: 50, price: 350}], supplierId: 'S002', supplierName: 'China Impex Ltd', paymentType: 'Baki', total: 17500, paidAmount: 5000, dueAmount: 12500 }
          ],
          returns: [
            { id: 'RET' + Date.now(), date: todayStr, returnType: 'Customer', productId: '10004', quantity: 1, reason: 'Motor issue' }
          ],
          settlements: [
            { id: 'STL' + Date.now(), targetId: 'C001', type: 'Customer', amount: 500, date: todayStr }
          ],
          expenses: [
            { id: 1, date: justDate, category: 'Transport', amount: 500, description: 'Carrying Loading for tools' },
            { id: 2, date: justDate, category: 'Utility', amount: 1200, description: 'Electricity Bill' },
          ],
          attendance: [
            { id: 1, staffId: 'ST001', date: justDate, status: 'Present' },
            { id: 2, staffId: 'ST002', date: justDate, status: 'Late' }
          ],
          leaves: [
            { id: 1, staffId: 'ST002', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], type: 'Sick', reason: 'Fever', status: 'Pending' }
          ],
          payrolls: [
            { id: 'PR' + Date.now(), staffId: 'ST001', staffName: 'Rashed', month: justDate.substring(0, 7), presentDays: 28, baseSalary: 15000, bonus: 2000, netPay: 17000, paymentDate: todayStr }
          ],
          smsHistory: [
            { id: 'SMS1', date: todayStr, numbers: ['01719563699'], message: 'Dear Fahim Traders, your due amount is 1020 TK. Please clear it soon.', status: 'Sent' }
          ],
          srSettlements: [
            {
              id: 'SR_DUMMY_1',
              date: justDate,
              salesmanId: 'ST001',
              salesmanName: 'Rashed',
              items: [
                { productId: '10001', name: 'Bosch Impact Drill 13mm', quantity: 2, price: 3500 },
                { productId: '10002', name: 'Steel Wire Brush 4x16', quantity: 10, price: 35 }
              ],
              totalIssuedValue: 7350,
              totalSalesValue: 7350,
              cashReceived: 0,
              status: 'Pending'
            }
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
