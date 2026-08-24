import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Users, Calendar, DollarSign, Award, Plus, Check, X, Eye, Printer, Download } from 'lucide-react';
import useStore from '../store/useStore';
import { downloadAsPDF } from '../utils/pdfGenerator';
import InvoiceHeader from '../components/InvoiceHeader';

const HR = () => {
  const [activeTab, setActiveTab] = useState('Staff');
  const { staff, attendance, leaves, payrolls, addStaff, markAttendance, addLeaveRequest, updateLeaveStatus, generatePayslip } = useStore();

  // Modals state
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', role: 'Salesman', baseSalary: '', phone: '', address: '', bankAccount: '', username: '', password: '' });

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [newLeave, setNewLeave] = useState({ staffId: '', type: 'Casual', reason: '', date: new Date().toISOString().split('T')[0] });

  const [selectedStaff, setSelectedStaff] = useState(null);

  // Bonus state for payroll
  const [bonuses, setBonuses] = useState({});

  // Dates
  const todayStr = new Date().toISOString().split('T')[0];
  const [attDate, setAttDate] = useState(todayStr);
  const [payrollMonth, setPayrollMonth] = useState(todayStr.substring(0, 7)); // YYYY-MM

  // Handlers
  const handleAddStaff = (e) => {
    e.preventDefault();
    addStaff({
      ...newStaff,
      baseSalary: parseFloat(newStaff.baseSalary),
      joinDate: todayStr
    });
    setShowAddStaffModal(false);
    setNewStaff({ name: '', role: 'Salesman', baseSalary: '', phone: '', address: '', bankAccount: '', username: '', password: '' });
  };

  const handleApplyLeave = (e) => {
    e.preventDefault();
    if (!newLeave.staffId) return alert('Please select a staff');
    addLeaveRequest({
      ...newLeave
    });
    setShowLeaveModal(false);
    setNewLeave({ staffId: '', type: 'Casual', reason: '', date: todayStr });
  };

  const handleGeneratePayslip = (staffMember, presentDays, bonus) => {
    const dailyRate = staffMember.baseSalary / 30;
    const netPay = Math.round((dailyRate * presentDays) + bonus);

    // Check if already paid
    const alreadyPaid = payrolls.some(p => p.staffId === staffMember.id && p.month === payrollMonth);
    if (alreadyPaid) return alert('Payslip already generated for this month!');

    generatePayslip({
      month: payrollMonth,
      year: payrollMonth.split('-')[0],
      staffId: staffMember.id,
      staffName: staffMember.name,
      presentDays,
      baseSalary: staffMember.baseSalary,
      bonus,
      netPay
    });
    alert(`Payslip generated for ${staffMember.name}. Amount: ৳${netPay}`);
  };

  return (
    <div className="hr-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>HR & Payroll Management</h1>
          <p className="text-muted">Manage staff, attendance, leave, salary, and bonuses.</p>
        </div>
        {activeTab === 'Staff' && (
          <button className="btn-primary flex-align-gap" onClick={() => setShowAddStaffModal(true)}>
            <Plus size={18} /> Add Staff
          </button>
        )}
        {activeTab === 'Leave' && (
          <button className="btn-primary flex-align-gap" onClick={() => setShowLeaveModal(true)}>
            <Plus size={18} /> Apply Leave
          </button>
        )}
      </div>

      <div className="card glass">
        <div className="card-toolbar" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', overflowX: 'auto' }}>
          <div className="return-type-selector">
            <button className={`type-btn ${activeTab === 'Staff' ? 'active' : ''}`} onClick={() => setActiveTab('Staff')}>
              <Users size={18} className="inline-block mr-2" /> Staff List
            </button>
            <button className={`type-btn ${activeTab === 'Attendance' ? 'active' : ''}`} onClick={() => setActiveTab('Attendance')}>
              <Calendar size={18} className="inline-block mr-2" /> Attendance
            </button>
            <button className={`type-btn ${activeTab === 'Leave' ? 'active' : ''}`} onClick={() => setActiveTab('Leave')}>
              <Users size={18} className="inline-block mr-2" /> Leave Requests
            </button>
            <button className={`type-btn ${activeTab === 'Payroll' ? 'active' : ''}`} onClick={() => setActiveTab('Payroll')}>
              <DollarSign size={18} className="inline-block mr-2" /> Payroll & Bonus
            </button>
          </div>
        </div>

        <div className="tab-content mt-4">
          {activeTab === 'Staff' && (
            <div>
              <h3>All Staff</h3>
              {staff.length === 0 ? <p className="text-muted mt-4">No staff added yet.</p> : (
                <div className="table-responsive">
                  <table className="data-table mt-4">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Phone</th>
                        <th>Bank Account</th>
                        <th>Base Salary (BDT)</th>
                        <th>Join Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staff.map(s => (
                        <tr key={s.id}>
                          <td>{s.id}</td>
                          <td>{s.name}</td>
                          <td>{s.role}</td>
                          <td>{s.phone || 'N/A'}</td>
                          <td>{s.bankAccount || 'N/A'}</td>
                          <td>৳{s.baseSalary}</td>
                          <td>{s.joinDate}</td>
                          <td>
                            <button className="btn-icon" title="View & Print" onClick={() => setSelectedStaff(s)}>
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Attendance' && (
            <div>
              <div className="flex-align-gap mb-4" style={{ justifyContent: 'space-between' }}>
                <h3>Daily Attendance</h3>
                <input
                  type="date"
                  className="p-2 bg-input border border-gray-700 rounded text-main"
                  value={attDate}
                  onChange={(e) => setAttDate(e.target.value)}
                />
              </div>
              {staff.length === 0 ? <p className="text-muted">No staff found. Please add staff first.</p> : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Staff ID</th>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staff.map(s => {
                        const existingAtt = attendance.find(a => a.staffId === s.id && a.date === attDate);
                        const status = existingAtt ? existingAtt.status : '';
                        return (
                          <tr key={s.id}>
                            <td>{s.id}</td>
                            <td>{s.name}</td>
                            <td>{s.role}</td>
                            <td>
                              <select
                                className="p-2 bg-input border border-gray-700 rounded"
                                value={status}
                                onChange={(e) => markAttendance(s.id, attDate, e.target.value)}
                              >
                                <option value="" disabled>Mark Status</option>
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                                <option value="Late">Late</option>
                                <option value="Leave">On Leave</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Leave' && (
            <div>
              <h3>Leave Requests</h3>
              {leaves.length === 0 ? <div className="text-center text-muted py-8">No leave requests.</div> : (
                <div className="table-responsive">
                  <table className="data-table mt-4">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Staff Name</th>
                        <th>Type</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaves.map(l => {
                        const staffMember = staff.find(s => s.id === l.staffId);
                        return (
                          <tr key={l.id}>
                            <td>{l.date}</td>
                            <td>{staffMember ? staffMember.name : 'Unknown'}</td>
                            <td>{l.type}</td>
                            <td>{l.reason}</td>
                            <td>
                              <span className={`badge ${l.status === 'Approved' ? 'bg-success text-white px-2 py-1 rounded' : l.status === 'Rejected' ? 'bg-danger text-white px-2 py-1 rounded' : 'bg-warning text-black px-2 py-1 rounded'}`}>
                                {l.status}
                              </span>
                            </td>
                            <td>
                              {l.status === 'Pending' && (
                                <div className="flex-align-gap">
                                  <button className="btn-outline text-success" style={{ padding: '0.2rem 0.5rem' }} onClick={() => updateLeaveStatus(l.id, 'Approved')}><Check size={16} /></button>
                                  <button className="btn-outline text-danger" style={{ padding: '0.2rem 0.5rem' }} onClick={() => updateLeaveStatus(l.id, 'Rejected')}><X size={16} /></button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Payroll' && (
            <div>
              <div className="flex-align-gap mb-4" style={{ justifyContent: 'space-between' }}>
                <h3>Monthly Payroll Summary</h3>
                <input
                  type="month"
                  className="p-2 bg-input border border-gray-700 rounded text-main"
                  value={payrollMonth}
                  onChange={(e) => setPayrollMonth(e.target.value)}
                />
              </div>
              {staff.length === 0 ? <p className="text-muted">No staff to generate payroll.</p> : (
                <div className="table-responsive">
                  <table className="data-table mt-4">
                    <thead>
                      <tr>
                        <th>Staff Name</th>
                        <th>Days Present</th>
                        <th>Base Salary</th>
                        <th>Bonus</th>
                        <th>Net Pay</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staff.map(s => {
                        const presentDays = attendance.filter(a => a.staffId === s.id && a.status === 'Present' && a.date.startsWith(payrollMonth)).length;
                        const dailyRate = s.baseSalary / 30;
                        const bonus = bonuses[s.id] || 0;
                        const netPay = Math.round((dailyRate * presentDays) + bonus);

                        const isPaid = payrolls.some(p => p.staffId === s.id && p.month === payrollMonth);

                        return (
                          <tr key={s.id}>
                            <td>{s.name}</td>
                            <td>{presentDays} / 30</td>
                            <td>৳{s.baseSalary}</td>
                            <td>
                              {isPaid ? (
                                <span>৳{payrolls.find(p => p.staffId === s.id && p.month === payrollMonth).bonus}</span>
                              ) : (
                                <div className="flex-align-gap">
                                  <Award size={14} className="text-warning" />
                                  <input
                                    type="number"
                                    value={bonus}
                                    onChange={(e) => setBonuses({ ...bonuses, [s.id]: parseFloat(e.target.value) || 0 })}
                                    style={{ width: '80px', padding: '0.25rem', backgroundColor: 'var(--bg-input)' }}
                                  />
                                </div>
                              )}
                            </td>
                            <td className="text-primary font-bold">
                              ৳{isPaid ? payrolls.find(p => p.staffId === s.id && p.month === payrollMonth).netPay : netPay}
                            </td>
                            <td>
                              {isPaid ? <span className="text-success font-bold">Paid</span> : <span className="text-warning">Pending</span>}
                            </td>
                            <td>
                              {!isPaid && (
                                <button className="btn-primary" onClick={() => handleGeneratePayslip(s, presentDays, bonus)}>Pay</button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Staff Drawer */}
      {showAddStaffModal && createPortal(
        <div className="drawer-overlay">
          <div className="drawer-container">
            <div className="drawer-header">
              <h2>Add New Staff</h2>
              <button type="button" className="drawer-close-btn" onClick={() => setShowAddStaffModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="drawer-body">
              <form id="add-staff-form" onSubmit={handleAddStaff}>
                <div className="responsive-grid-2">
                  <div className="form-group">
                    <label className="text-muted mb-1 block">Name</label>
                    <input required type="text" className="w-full" placeholder="e.g. Rahim" value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="text-muted mb-1 block">Role</label>
                    <select className="w-full" value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}>
                      <option value="Salesman">Salesman</option>
                      <option value="Manager">Manager</option>
                      <option value="Delivery">Delivery</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="text-muted mb-1 block">Base Salary (BDT)</label>
                    <input required type="number" min="0" className="w-full" placeholder="e.g. 15000" value={newStaff.baseSalary} onChange={e => setNewStaff({ ...newStaff, baseSalary: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="text-muted mb-1 block">Phone</label>
                    <input type="text" className="w-full" placeholder="e.g. 01700000000" value={newStaff.phone} onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="text-muted mb-1 block">Address</label>
                    <input type="text" className="w-full" placeholder="e.g. Dhaka" value={newStaff.address} onChange={e => setNewStaff({ ...newStaff, address: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="text-muted mb-1 block">Bank Account Number</label>
                    <input type="text" className="w-full" placeholder="Account No" value={newStaff.bankAccount} onChange={e => setNewStaff({ ...newStaff, bankAccount: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="text-muted mb-1 block">Username</label>
                    <input type="text" className="w-full" placeholder="Login ID" value={newStaff.username} onChange={e => setNewStaff({ ...newStaff, username: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="text-muted mb-1 block">Password</label>
                    <input type="password" className="w-full" placeholder="Secret" value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} />
                  </div>
                </div>
              </form>
            </div>
            <div className="drawer-footer">
              <button type="button" className="btn-outline" onClick={() => setShowAddStaffModal(false)}>Cancel</button>
              <button type="submit" form="add-staff-form" className="btn-primary">Add Staff</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Apply Leave Drawer */}
      {showLeaveModal && createPortal(
        <div className="drawer-overlay">
          <div className="drawer-container">
            <div className="drawer-header">
              <h2>Apply Leave</h2>
              <button type="button" className="drawer-close-btn" onClick={() => setShowLeaveModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="drawer-body">
              <form id="apply-leave-form" onSubmit={handleApplyLeave}>
                <div className="form-group mb-4">
                  <label>Date</label>
                  <input required type="date" className="w-full" value={newLeave.date} onChange={e => setNewLeave({ ...newLeave, date: e.target.value })} />
                </div>
                <div className="form-group mb-4">
                  <label>Staff</label>
                  <select className="w-full" required value={newLeave.staffId} onChange={e => setNewLeave({ ...newLeave, staffId: e.target.value })}>
                    <option value="" disabled>Select Staff</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group mb-4">
                  <label>Leave Type</label>
                  <select className="w-full" value={newLeave.type} onChange={e => setNewLeave({ ...newLeave, type: e.target.value })}>
                    <option value="Casual">Casual</option>
                    <option value="Sick">Sick</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
                <div className="form-group mb-4">
                  <label>Reason</label>
                  <input required type="text" className="w-full" value={newLeave.reason} onChange={e => setNewLeave({ ...newLeave, reason: e.target.value })} />
                </div>
              </form>
            </div>
            <div className="drawer-footer">
              <button type="button" className="btn-outline" onClick={() => setShowLeaveModal(false)}>Cancel</button>
              <button type="submit" form="apply-leave-form" className="btn-primary">Submit Request</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* View & Print Staff Drawer */}
      {selectedStaff && createPortal(
        <div className="drawer-overlay">
          <div className="drawer-container">
            
            <div className="drawer-header" style={{ borderBottom: 'none', backgroundColor: '#f1f5f9' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Staff Profile Document</h3>
              <button className="drawer-close-btn" onClick={() => setSelectedStaff(null)}>
                <X size={24} />
              </button>
            </div>

            <div className="drawer-body" style={{ padding: '0', backgroundColor: '#fff' }}>
              <div id="printable-single-staff" style={{ padding: '1.5rem', color: '#1e293b' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', borderBottom: '3px solid #e2e8f0', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
                  <InvoiceHeader />
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Staff Details Document</p>
                </div>

                {/* Identity */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', color: '#0f172a' }}>{selectedStaff.name}</h3>
                    <p style={{ margin: 0, color: '#475569', fontSize: '1.2rem', fontWeight: '500' }}>{selectedStaff.role} <span style={{ opacity: 0.5 }}>•</span> ID: {selectedStaff.id}</p>
                  </div>
                  <div style={{ textAlign: 'right', background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: '0 0 0.25rem', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Join Date</p>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#0f172a', fontSize: '1.2rem' }}>{selectedStaff.joinDate}</p>
                  </div>
                </div>

                {/* Table of Details */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3rem', fontSize: '0.9rem' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '1.25rem 0', color: '#64748b', width: '40%' }}>Phone Number</td>
                      <td style={{ padding: '1.25rem 0', fontWeight: '600', textAlign: 'right' }}>{selectedStaff.phone || 'N/A'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '1.25rem 0', color: '#64748b' }}>Address</td>
                      <td style={{ padding: '1.25rem 0', fontWeight: '600', textAlign: 'right' }}>{selectedStaff.address || 'N/A'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '1.25rem 0', color: '#64748b' }}>System Username</td>
                      <td style={{ padding: '1.25rem 0', fontWeight: '600', textAlign: 'right' }}>{selectedStaff.username || 'N/A'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '1.25rem 0', color: '#64748b' }}>System Password</td>
                      <td style={{ padding: '1.25rem 0', fontWeight: '600', textAlign: 'right' }}>{selectedStaff.password ? '••••••••' : 'N/A'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '1.25rem 0', color: '#64748b' }}>Bank Account</td>
                      <td style={{ padding: '1.25rem 0', fontWeight: '600', textAlign: 'right' }}>{selectedStaff.bankAccount || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Salary Highlight */}
                <div style={{ backgroundColor: '#f0fdf4', padding: '1.5rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '2px solid #bbf7d0' }}>
                  <span style={{ color: '#166534', fontWeight: '700', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Monthly Base Salary</span>
                  <span style={{ fontWeight: '900', fontSize: '2.5rem', color: '#14532d' }}>৳{selectedStaff.baseSalary.toLocaleString()}</span>
                </div>

                <div style={{ textAlign: 'center', marginTop: '3rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                  Document Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>

            <div className="drawer-footer" style={{ justifyContent: 'center', gap: '1rem' }}>
              <button className="btn-primary flex-align-gap" style={{ padding: '1rem 3rem', fontSize: '0.9rem', borderRadius: '99px' }} onClick={() => {
                const printContents = document.getElementById('printable-single-staff').innerHTML;
                const originalContents = document.body.innerHTML;
                document.body.innerHTML = '<div id="print-wrapper">' + printContents + '</div>';
                window.print();
                document.body.innerHTML = originalContents;
                window.location.reload();
              }}>
                <Printer size={20} /> Print Document
              </button>
              <button className="btn-outline flex-align-gap text-info" style={{ padding: '1rem 3rem', fontSize: '0.9rem', borderRadius: '99px' }} onClick={() => downloadAsPDF('printable-single-staff', `Staff_${selectedStaff.name}.pdf`)}>
                <Download size={20} /> Download PDF
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default HR;
