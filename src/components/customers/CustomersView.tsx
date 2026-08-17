import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Customer } from '../../types';
import { 
  Plus, 
  Search, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  Eye, 
  Trash2, 
  Edit3, 
  MessageSquare, 
  X,
  Receipt,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { 
    customers, 
    bills, 
    addCustomer, 
    updateCustomer, 
    deleteCustomer, 
    formatCurrency, 
    viewInvoice, 
    setCurrentTab,
    settings 
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<'ALL' | 'PENDING' | 'CLEARED'>('ALL');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<Customer | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');

  // Filter customers
  const filteredCustomers = customers.filter(c => {
    if (balanceFilter === 'PENDING' && c.pendingBalance <= 0) return false;
    if (balanceFilter === 'CLEARED' && c.pendingBalance > 0) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.companyName && c.companyName.toLowerCase().includes(q)) ||
        c.phone.includes(q)
      );
    }
    return true;
  });

  const getInitials = (nameStr: string) => {
    return nameStr
      .split(' ')
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase() || '')
      .join('');
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-emerald-100 text-emerald-700',
      'bg-purple-100 text-purple-700',
      'bg-amber-100 text-amber-700',
      'bg-rose-100 text-rose-700',
      'bg-indigo-100 text-indigo-700',
    ];
    return colors[index % colors.length];
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    addCustomer({
      name,
      companyName,
      phone,
      email,
      address,
      gstin,
    });

    setName('');
    setCompanyName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setGstin('');
    setShowAddModal(false);
  };

  // Bills for selected customer in detail view
  const customerBills = selectedCustomerDetail 
    ? bills.filter(b => b.customerId === selectedCustomerDetail.id)
    : [];

  return (
    <div id="customers-view" className="space-y-6">
      {/* Header (Matching Image 13.png) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Customer Accounts</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage customer directories, balance ledger, phone contacts, and order histories
          </p>
        </div>

        <button
          id="add-customer-btn"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs shadow-blue-600/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Add Customer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Balance filter tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          {(['ALL', 'PENDING', 'CLEARED'] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBalanceFilter(b)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                balanceFilter === b ? 'bg-white text-blue-600 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              {b === 'ALL' ? 'All Customers' : b === 'PENDING' ? 'With Pending Balance' : 'Zero Balance'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, company, phone..."
            className="block w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Customers Table (Matching Image 13.png) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone & Company</th>
                <th className="py-3 px-4 text-right">Total Purchases</th>
                <th className="py-3 px-4 text-right">Total Paid</th>
                <th className="py-3 px-4 text-right">Pending Balance</th>
                <th className="py-3 px-4">Last Order</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700 font-medium">
              {filteredCustomers.map((cust, idx) => (
                <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Avatar + Name */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarColor(idx)}`}>
                        {getInitials(cust.name)}
                      </div>
                      <div>
                        <div 
                          onClick={() => setSelectedCustomerDetail(cust)}
                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer"
                        >
                          {cust.name}
                        </div>
                        {cust.contactPerson && (
                          <div className="text-[11px] text-slate-400 font-normal">Attn: {cust.contactPerson}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Phone & Company */}
                  <td className="py-3.5 px-4">
                    <div className="text-slate-900 font-semibold">{cust.phone}</div>
                    <div className="text-[11px] text-slate-400 font-normal">{cust.companyName || 'Individual'}</div>
                  </td>

                  {/* Purchases */}
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    {formatCurrency(cust.totalPurchases)}
                  </td>

                  {/* Paid */}
                  <td className="py-3.5 px-4 text-right font-semibold text-emerald-600">
                    {formatCurrency(cust.totalPaid)}
                  </td>

                  {/* Pending Balance (Prominent red badge when > 0) */}
                  <td className="py-3.5 px-4 text-right">
                    {cust.pendingBalance > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {formatCurrency(cust.pendingBalance)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                        Cleared (0.00)
                      </span>
                    )}
                  </td>

                  {/* Last Purchase */}
                  <td className="py-3.5 px-4 text-slate-500 text-xs">
                    {cust.lastPurchaseDate || 'Recent'}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedCustomerDetail(cust)}
                        title="View Ledger"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const cleanPhone = cust.phone.replace(/[^0-9]/g, '');
                          window.open(`https://wa.me/${cleanPhone}`, '_blank');
                        }}
                        title="WhatsApp Message"
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete customer ${cust.name}?`)) deleteCustomer(cust.id);
                        }}
                        title="Delete Customer"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomerDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  {getInitials(selectedCustomerDetail.name)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedCustomerDetail.name}</h3>
                  <p className="text-xs text-slate-500">{selectedCustomerDetail.companyName || 'Individual Customer'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Overview Tiles */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Purchases</span>
                <p className="text-base font-bold text-slate-900 mt-1">{formatCurrency(selectedCustomerDetail.totalPurchases)}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-700 uppercase font-semibold">Total Paid</span>
                <p className="text-base font-bold text-emerald-700 mt-1">{formatCurrency(selectedCustomerDetail.totalPaid)}</p>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-[10px] text-rose-700 uppercase font-semibold">Pending Balance</span>
                <p className="text-base font-bold text-rose-700 mt-1">{formatCurrency(selectedCustomerDetail.pendingBalance)}</p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Phone: <strong>{selectedCustomerDetail.phone}</strong></span>
              </div>
              {selectedCustomerDetail.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email: <strong>{selectedCustomerDetail.email}</strong></span>
                </div>
              )}
              {selectedCustomerDetail.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Address: <strong>{selectedCustomerDetail.address}</strong></span>
                </div>
              )}
            </div>

            {/* Invoices List */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Order & Invoice History</h4>
              <div className="space-y-2">
                {customerBills.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No orders recorded for this customer yet.</p>
                ) : (
                  customerBills.map((b) => (
                    <div key={b.id} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-xs text-blue-600">{b.invoiceNumber}</div>
                        <div className="text-[11px] text-slate-500">{b.date} • {b.itemsSummary}</div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <div className="text-xs font-bold text-slate-900">{formatCurrency(b.totalAmount)}</div>
                          <div className="text-[10px] text-rose-600 font-semibold">Bal: {formatCurrency(b.balanceDue)}</div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedCustomerDetail(null);
                            viewInvoice(b.id);
                          }}
                          className="px-2 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedCustomerDetail(null);
                  setCurrentTab('new_bill');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                + Create New Bill for Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Customer</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Contact Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Corp Designs"
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Studio Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Corp Print Dept."
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 019-8234"
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. accounts@acmecorp.com"
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN / Tax ID</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="e.g. 27AABCA1234F1Z9"
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery / Business Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 45 Commercial Complex, Andheri East"
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
