import React from 'react';
import logoImg from '../assets/ehbl.jpeg';

const InvoiceHeader = () => {
  return (
    <div style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#000', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '10px' }}>
        <img 
          src={logoImg} 
          alt="EHBL Logo" 
          style={{ height: '60px', width: '60px', borderRadius: '50%', objectFit: 'contain' }} 
        />
        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', fontFamily: 'serif' }}>EHBL AND POWER TOOLS SUPPLIERS.</h2>
      </div>
      <p style={{ margin: '0.3rem 0', fontSize: '0.95rem', fontWeight: 'bold' }}>
        Hardware: Hand Tools, Machine Tools, Sanitary, Building,Furniture items,Indian Lock,China lock & Suppliers.
      </p>
      <p style={{ margin: '0.2rem 0', fontSize: '0.85rem' }}>
        Corporate Office: House # 37. (1st Floor) Road # 1/A, Block #3, Gulshan-02, Baridhara R/A, Dhaka -1212.
      </p>
      <p style={{ margin: '0.2rem 0', fontSize: '0.85rem' }}>
        Phone :01744129480,what's up number 01744967226
      </p>
    </div>
  );
};

export default InvoiceHeader;
