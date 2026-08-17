import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { BillStatus } from '../../types';
import { 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  Eye, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare,
  FileText,
  DollarSign
} from 'lucide-react';

export const BillsListView: React.FC = () => {
  const { 
    bills, 
    setCurrentTab, 
    viewInvoice, 
    deleteBill, 
    formatCurrency, 
    globalSearch, 
    setGlobalSearch 
  } = useStore();

  const [statusFilter, setStatusFilter] = useState<'ALL' | BillStatus>('ALL');
  const [localSearch, setLocalSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter bills
  const filteredBills = bills.filter(b => {
    // Status Filter
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;

    // Search filter
    const q = (localSearch || globalSearch).toLowerCase();
    if (q) {
      return (
        b.invoiceNumber.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerPhone.includes(q) ||
        b.itemsSummary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredBills.length / itemsPerPage) || 1;
  const paginatedBills = filteredBills.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">PAID</span>;
      case 'PARTIAL':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">PARTIAL</span>;
      case 'UNPAID':
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">UNPAID</span>;
    }
  };

  return (
    <div id="bills-list-view" className="space-y-6">
      {/* Header Bar matching Image 9.png */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Bills & Invoices</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Manage all tax invoices, customer billing records, and payment settlements</p>
        </div>

        <button
          id="bills-create-new-btn"
          onClick={() => setCurrentTab('new_bill')}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs shadow-blue-600/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Create New Bill</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 overflow-x-auto">
          {(['ALL', 'PAID', 'PARTIAL', 'UNPAID'] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === st ? 'bg-white text-blue-600 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              {st === 'ALL' ? 'All Bills' : st}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search invoice #, customer..."
            className="block w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Main Bills Table (Matching Image 9.png) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700 font-medium">
              {paginatedBills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p>No invoices found matching current filters.</p>
                  </td>
                </tr>
              ) : (
                paginatedBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-blue-600">
                      <button
                        onClick={() => viewInvoice(bill.id)}
                        className="hover:underline cursor-pointer"
                      >
                        {bill.invoiceNumber}
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{bill.customerName}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{bill.customerPhone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {bill.date}
                    </td>
                    <td className="py-3.5 px-4 max-w-[220px] truncate text-slate-600 text-xs" title={bill.itemsSummary}>
                      {bill.itemsSummary}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(bill.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-600 font-semibold">
                      {formatCurrency(bill.advancePaid)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-rose-600">
                      {formatCurrency(bill.balanceDue)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(bill.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => viewInvoice(bill.id)}
                          title="View Invoice"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            viewInvoice(bill.id);
                            setTimeout(() => window.print(), 200);
                          }}
                          title="Print Invoice"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${bill.invoiceNumber}?`)) {
                              deleteBill(bill.id);
                            }
                          }}
                          title="Delete Bill"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar (Matching Image 9.png) */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
            <strong className="text-slate-800">
              {Math.min(currentPage * itemsPerPage, filteredBills.length)}
            </strong>{' '}
            of <strong className="text-slate-800">{filteredBills.length}</strong> entries
          </div>

          <div className="flex items-center gap-1 self-center sm:self-auto">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold ${
                  currentPage === i + 1
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
