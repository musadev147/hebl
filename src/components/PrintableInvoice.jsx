import React from 'react';
import InvoiceHeader from './InvoiceHeader';
import PrintFooter from './PrintFooter';

const PrintableInvoice = ({ sale, customers }) => {
  if (!sale) return null;
  
  const dateStr = sale.date ? new Date(sale.date).toISOString().split('T')[0] : '';
  const customerName = sale.customerName || sale.customerInfo?.name || 'Walk-in Customer';
  
  // Find customer in store to get their due
  const customer = customers?.find(c => c.name === customerName || c.id === sale.customerId);
  
  const totalQty = sale.items ? sale.items.reduce((acc, item) => acc + item.quantity, 0) : sale.cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  
  const currentDue = sale.paymentType === 'Baki' ? sale.total : 0;
  const overallDue = customer?.due || currentDue;
  const actualPreviousDue = Math.max(0, overallDue - currentDue);

  const items = sale.items || sale.cartItems || [];

  return (
    <div style={{ padding: '1.5rem', background: '#fff', color: '#000', fontFamily: 'Arial, sans-serif' }}>
      <InvoiceHeader />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <strong>Code:</strong> 
          <span style={{ borderBottom: '1px dashed #000', minWidth: '150px', display: 'inline-block' }}></span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <strong>Date:</strong> 
          <span style={{ borderBottom: '1px dashed #000', minWidth: '150px', display: 'inline-block' }}>{dateStr}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
            <strong>Buyer's Name:</strong> 
            <span style={{ borderBottom: '1px dashed #000', flex: 1 }}>{customerName}</span>
          </div>
          <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
            <strong>Address:</strong> 
            <span style={{ borderBottom: '1px dashed #000', flex: 1 }}>{sale.customerInfo?.location || customer?.location || ''}</span>
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            <strong>Mobile:</strong> 
            <span style={{ borderBottom: '1px dashed #000', flex: 1 }}>{sale.customerInfo?.phone || customer?.phone || ''}</span>
          </div>
        </div>
        <div style={{ width: '280px', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            <strong>Challan / Invoice ID:</strong> 
            <span style={{ borderBottom: '1px dashed #000', flex: 1 }}>{sale.id || sale.invoiceId}</span>
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            <strong>Seller / Reff:</strong> 
            <span style={{ borderBottom: '1px dashed #000', flex: 1 }}>{sale.salesman?.name || sale.salesmanName || ''}</span>
          </div>
        </div>
      </div>

      <table style={{ width: '100%', fontSize: '0.9rem', marginBottom: '10px', color: '#000', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', width: '40px' }}>SL</th>
            <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'left' }}>Item Name</th>
            <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', width: '60px' }}>Size</th>
            <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', width: '70px' }}>Quantity</th>
            <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', width: '60px' }}>Unit</th>
            <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', width: '80px' }}>Rate</th>
            <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', width: '100px' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const itemPrice = item.isGift ? 0 : (item.price - (item.itemDiscount || 0));
            const itemTotal = itemPrice * item.quantity;
            return (
              <tr key={idx}>
                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ border: '1px solid #000', padding: '4px' }}>{item.name} {item.isGift && '(Gift)'}</td>
                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>0</td>
                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{item.unit || 'pcs'}</td>
                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>{itemPrice.toFixed(2)}</td>
                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>{itemTotal}</td>
              </tr>
            );
          })}
          <tr>
            <td colSpan="2" style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>Totals:-</td>
            <td style={{ border: '1px solid #000', padding: '4px' }}></td>
            <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 'bold' }}>{totalQty}</td>
            <td style={{ border: '1px solid #000', padding: '4px' }}></td>
            <td style={{ border: '1px solid #000', padding: '4px' }}></td>
            <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>{sale.subtotal}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
        <div style={{ width: '40%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #000', marginBottom: '2px' }}>
            <span>Current Due:</span><span>{currentDue}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #000', marginBottom: '2px' }}>
            <span>Previous Due:</span><span>{actualPreviousDue}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', marginBottom: '2px' }}>
            <span>Over all Due:</span><span>{overallDue}</span>
          </div>
        </div>
        
        <div style={{ width: '35%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Total</span><span>{sale.subtotal}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Total Discount</span><span>{sale.invoiceDiscount || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Carrying/Loading</span><span>0</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Net Sales</span><span>{sale.total}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Paid</span><span>{sale.paymentType === 'Cash' ? sale.total : 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Due</span><span>{currentDue}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: '2px' }}>
            <span>Total Tk:</span><span style={{ fontSize: '0.85rem' }}>{sale.total} Taka Only</span>
          </div>
        </div>
      </div>

      <PrintFooter />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        <div style={{ borderTop: '1px solid #000', width: '25%', textAlign: 'center' }}>Customer signature</div>
        <div style={{ borderTop: '1px solid #000', width: '25%', textAlign: 'center' }}>Delivery By</div>
        <div style={{ borderTop: '1px solid #000', width: '25%', textAlign: 'center' }}>Store Incharge</div>
      </div>

    </div>
  );
};

export default PrintableInvoice;
