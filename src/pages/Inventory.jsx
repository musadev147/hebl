import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import Barcode from 'react-barcode';
import { Plus, Search, Printer, Edit, Trash2, Download } from 'lucide-react';
import useStore from '../store/useStore';
import { downloadAsPDF } from '../utils/pdfGenerator';
import InvoiceHeader from '../components/InvoiceHeader';
import PrintFooter from '../components/PrintFooter';
import './Inventory.css';

const Inventory = () => {
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('All Time');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [printQuantity, setPrintQuantity] = useState(21); // Default to 21 (3x7 grid)

  const [newProduct, setNewProduct] = useState({
    id: '', name: '', category: 'Grocery', unit: 'Bag', variant: '', stock: 0, price: 0
  });
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('action') === 'add') {
      setShowAddModal(true);
    } else {
      setShowAddModal(false);
    }
  }, [location.search]);

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!newProduct.id || !newProduct.name) {
      alert('ID and Name are required!');
      return;
    }
    
    if (editingProduct) {
      updateInventoryItem(editingProduct.id, newProduct);
    } else {
      addInventoryItem(newProduct);
    }
    
    closeModal();
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setNewProduct({ ...product });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
    setNewProduct({ id: '', name: '', category: 'Grocery', unit: 'Bag', variant: '', stock: 0, price: 0 });
  };

  const handlePrintBarcode = (product) => {
    setSelectedProduct(product);
    setShowBarcodeModal(true);
  };

  const filteredInventory = inventory.filter(item => {
    // 1. Text Search Filter
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.includes(searchTerm);
    if (!matchesSearch) return false;

    // 2. Date Filter
    if (filterDate === 'All Time') return true;
    
    if (!item.dateAdded) return true; // If no date, just include it to be safe
    
    const itemDate = new Date(item.dateAdded);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (filterDate === 'Today') {
      return itemDate >= today;
    } else if (filterDate === 'Weekly') {
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      return itemDate >= lastWeek;
    } else if (filterDate === 'Monthly') {
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return itemDate >= lastMonth;
    } else if (filterDate === 'Custom' && customDateRange.start && customDateRange.end) {
      const start = new Date(customDateRange.start);
      const end = new Date(customDateRange.end);
      end.setHours(23,59,59,999);
      return itemDate >= start && itemDate <= end;
    }
    
    return true;
  });

  const totalItems = filteredInventory.reduce((sum, item) => sum + item.stock, 0);
  const totalValue = filteredInventory.reduce((sum, item) => sum + (item.stock * item.price), 0);

  const handlePrintInventoryList = () => {
    const printContents = document.getElementById('printable-inventory-list').innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = '<div id="print-wrapper">' + printContents + '</div>';
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); 
  };

  return (
    <div className="inventory-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Inventory Management</h1>
          <p className="text-muted">Manage your stock, categories, and generate barcodes.</p>
        </div>
        <div className="flex-align-gap">
          <button className="btn-outline flex-align-gap" onClick={handlePrintInventoryList}>
            <Printer size={18} /> Print List
          </button>
          <button className="btn-outline flex-align-gap text-info" onClick={() => downloadAsPDF('printable-inventory-list', 'Inventory_List.pdf')}>
            <Download size={18} /> Download PDF
          </button>
          <button className="btn-primary flex-align-gap" style={{ width: 'fit-content', whiteSpace: 'nowrap' }} onClick={() => setShowAddModal(true)}>
            <Plus size={18} /> Add New Product
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-toolbar">
          <div className="search-bar">
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="toolbar-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select 
              className="w-full" 
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: 'auto' }}
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            >
              <option value="All Time">All Time</option>
              <option value="Today">Today</option>
              <option value="Weekly">Last 7 Days</option>
              <option value="Monthly">Last 30 Days</option>
              <option value="Custom">Custom Date</option>
            </select>
            
            {filterDate === 'Custom' && (
              <div className="flex-align-gap" style={{ background: 'var(--surface-color)', padding: '0.2rem', borderRadius: '8px' }}>
                <input 
                  type="date" 
                  style={{ padding: '0.4rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange({...customDateRange, start: e.target.value})}
                />
                <span className="text-muted">to</span>
                <input 
                  type="date" 
                  style={{ padding: '0.4rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange({...customDateRange, end: e.target.value})}
                />
              </div>
            )}
            <button className="btn-outline">Categories</button>
            <button className="btn-outline">Units</button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID/Barcode</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Variant</th>
                <th>Unit</th>
                <th>Stock</th>
                <th>Price (BDT)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map(item => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.variant || '-'}</td>
                  <td>{item.unit}</td>
                  <td>
                    <span className={`stock-badge ${item.stock < 50 ? 'warning' : 'success'}`}>
                      {item.stock}
                    </span>
                  </td>
                  <td>৳{item.price}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" title="Print Barcode" onClick={() => handlePrintBarcode(item)}>
                        <Printer size={16} />
                      </button>
                      <button className="btn-icon text-info" title="Edit" onClick={() => openEditModal(item)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn-icon text-danger" title="Delete" onClick={() => deleteInventoryItem(item.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden Printable Inventory List (Excel Style) */}
      <div id="printable-inventory-list" style={{ display: 'none' }}>
        <div style={{ padding: '2rem', background: '#fff', color: '#000' }}>
          <InvoiceHeader />
          <p style={{ textAlign: 'center', fontSize: '1rem', marginBottom: '0.5rem', color: '#333' }}>Inventory Stock List</p>
          <p style={{ textAlign: 'center', fontSize: '0.9rem', marginBottom: '1.5rem', color: '#666' }}>
            Date Filter: {filterDate} {filterDate === 'Custom' ? `(${customDateRange.start} to ${customDateRange.end})` : ''}
          </p>
          
          <table style={{ width: '100%', fontSize: '0.85rem', color: '#000', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{border: '1px solid #ccc', padding: '0.4rem', textAlign: 'left'}}>Barcode / ID</th>
                <th style={{border: '1px solid #ccc', padding: '0.4rem', textAlign: 'left'}}>Product Name</th>
                <th style={{border: '1px solid #ccc', padding: '0.4rem', textAlign: 'left'}}>Category</th>
                <th style={{border: '1px solid #ccc', padding: '0.4rem', textAlign: 'left'}}>Variant</th>
                <th style={{border: '1px solid #ccc', padding: '0.4rem', textAlign: 'center'}}>Stock</th>
                <th style={{border: '1px solid #ccc', padding: '0.4rem', textAlign: 'center'}}>Unit</th>
                <th style={{border: '1px solid #ccc', padding: '0.4rem', textAlign: 'right'}}>Price (BDT)</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length > 0 ? filteredInventory.map((item, idx) => (
                <tr key={idx}>
                  <td style={{border: '1px solid #ccc', padding: '0.4rem'}}>{item.id}</td>
                  <td style={{border: '1px solid #ccc', padding: '0.4rem'}}>{item.name}</td>
                  <td style={{border: '1px solid #ccc', padding: '0.4rem'}}>{item.category}</td>
                  <td style={{border: '1px solid #ccc', padding: '0.4rem'}}>{item.variant || '-'}</td>
                  <td style={{border: '1px solid #ccc', padding: '0.4rem', textAlign: 'center', fontWeight: 'bold'}}>{item.stock}</td>
                  <td style={{border: '1px solid #ccc', padding: '0.4rem', textAlign: 'center'}}>{item.unit}</td>
                  <td style={{border: '1px solid #ccc', padding: '0.4rem', textAlign: 'right'}}>৳{item.price.toLocaleString()}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" style={{border: '1px solid #ccc', padding: '1rem', textAlign: 'center'}}>No items found.</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8f9fa', fontWeight: 'bold' }}>
                <td colSpan="4" style={{border: '1px solid #ccc', padding: '0.5rem', textAlign: 'right'}}>Totals:</td>
                <td style={{border: '1px solid #ccc', padding: '0.5rem', textAlign: 'center'}}>{totalItems}</td>
                <td style={{border: '1px solid #ccc', padding: '0.5rem', textAlign: 'center'}}>-</td>
                <td style={{border: '1px solid #ccc', padding: '0.5rem', textAlign: 'right'}}>৳{totalValue.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
          <PrintFooter />
        </div>
      </div>

      {/* Barcode Drawer */}
      {showBarcodeModal && selectedProduct && createPortal(
        <div className="drawer-overlay">
          <div className="drawer-container">
            <div className="drawer-header">
              <h2>Generate Barcode</h2>
              <button className="drawer-close-btn" onClick={() => setShowBarcodeModal(false)}>
                <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
            <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              
              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label>Number of Stickers:</label>
                <input 
                  type="number" 
                  value={printQuantity} 
                  onChange={(e) => setPrintQuantity(Math.max(1, parseInt(e.target.value) || 1))} 
                  style={{ width: '80px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>

              <div id="printable-barcode" style={{ background: '#fff', padding: '1rem', borderRadius: '12px', width: '100%' }}>
                {/* A4 Sheet grid emulation for printing */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {Array.from({ length: printQuantity }).map((_, i) => (
                    <div key={i} style={{ border: '1px dashed #ccc', padding: '1rem', textAlign: 'center' }}>
                      <Barcode value={selectedProduct.id} width={1.5} height={40} fontSize={14} />
                      <p style={{ margin: '0.2rem 0 0 0', fontWeight: 'bold', fontSize: '0.9rem', color: '#000' }}>
                        {selectedProduct.name}
                      </p>
                      {selectedProduct.variant && (
                         <p style={{ margin: '0', fontSize: '0.8rem', color: '#333' }}>Var: {selectedProduct.variant}</p>
                      )}
                      <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1rem', color: '#000' }}>৳{selectedProduct.price}</p>
                    </div>
                  ))}
                </div>
                <PrintFooter />
              </div>
            </div>
            <div className="drawer-footer" style={{ justifyContent: 'center', gap: '1rem' }}>
              <button className="btn-primary flex-align-gap" style={{ padding: '0.75rem 2rem', fontSize: '0.9rem', borderRadius: '99px' }} onClick={() => {
                const printContents = document.getElementById('printable-barcode').innerHTML;
                const originalContents = document.body.innerHTML;
                document.body.innerHTML = `<div style="background: white;">${printContents}</div>`;
                window.print();
                document.body.innerHTML = originalContents;
                window.location.reload();
              }}>
                <Printer size={20} /> Print Labels ({printQuantity})
              </button>
              <button className="btn-outline flex-align-gap text-info" style={{ padding: '0.75rem 2rem', fontSize: '0.9rem', borderRadius: '99px' }} onClick={() => downloadAsPDF('printable-barcode', `Barcode_${selectedProduct.name}.pdf`)}>
                <Download size={20} /> Download PDF
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add Product Drawer */}
      {showAddModal && createPortal(
        <div className="drawer-overlay">
          <div className="drawer-container">
            <div className="drawer-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="drawer-close-btn" onClick={closeModal}>
                <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
            <div className="drawer-body">
              <form id="add-product-form" onSubmit={handleSaveProduct}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                  <div>
                    <label className="text-muted text-sm block mb-1">Product ID / Barcode *</label>
                    <input type="text" className="w-full" value={newProduct.id} onChange={e => setNewProduct({...newProduct, id: e.target.value})} required placeholder="e.g. 10004" disabled={!!editingProduct} />
                  </div>
                  <div>
                    <label className="text-muted text-sm block mb-1">Product Name *</label>
                    <input type="text" className="w-full" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required placeholder="e.g. Sugar 1kg" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="text-muted text-sm block mb-1">Category</label>
                      <input type="text" className="w-full" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} placeholder="e.g. Grocery" />
                    </div>
                    <div>
                      <label className="text-muted text-sm block mb-1">Variant (Optional)</label>
                      <input type="text" className="w-full" value={newProduct.variant} onChange={e => setNewProduct({...newProduct, variant: e.target.value})} placeholder="e.g. Red, XL, 500gm" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="text-muted text-sm block mb-1">Unit</label>
                      <select className="w-full" value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})}>
                        <option value="Bag">Bag</option>
                        <option value="Bottle">Bottle</option>
                        <option value="Packet">Packet</option>
                        <option value="Pcs">Pcs</option>
                        <option value="Kg">Kg</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-muted text-sm block mb-1">Initial Stock</label>
                      <input type="number" className="w-full" min="0" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value) || 0})} />
                    </div>
                  </div>
                  <div>
                    <label className="text-muted text-sm block mb-1">Price (BDT)</label>
                    <input type="number" className="w-full" min="0" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
              </form>
            </div>
            <div className="drawer-footer">
              <button type="button" className="btn-outline" onClick={closeModal}>Cancel</button>
              <button type="submit" form="add-product-form" className="btn-primary flex-align-gap">
                {editingProduct ? <Edit size={18} /> : <Plus size={18} />} 
                {editingProduct ? 'Update Product' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Inventory;
