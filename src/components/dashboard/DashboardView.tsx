import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Plus, 
  TrendingUp, 
  Wallet, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  ChevronRight, 
  Printer, 
  Eye, 
  UserCheck, 
  Receipt,
  Search,
  Package,
  Users,
  CreditCard
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { 
    bills, 
    customers, 
    products, 
    setCurrentTab, 
    viewInvoice, 
    formatCurrency,
    metrics,
    globalSearch
  } = useStore();

  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('month');

  // Filter bills based on globalSearch or show recent
  const filteredBills = bills.filter(b => {
    if (!globalSearch) return true;
    const q = globalSearch.toLowerCase();
    return (
      b.invoiceNumber.toLowerCase().includes(q) ||
      b.customerName.toLowerCase().includes(q) ||
      b.customerPhone.includes(q)
    );
  });

  const recentBills = filteredBills.slice(0, 5);

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
    <div id="dashboard-view" className="space-y-6">
      {/* Top Welcome & Period Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Overview & Performance</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Real-time flex printing financial metrics and store operations</p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 self-start sm:self-auto">
          {(['today', 'week', 'month', 'quarter', 'year'] as const).map((period) => (
            <button
              key={period}
              id={`period-tab-${period}`}
              onClick={() => setTimeFilter(period)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                timeFilter === period 
                  ? 'bg-white text-blue-600 shadow-xs font-bold' 
                  : 'hover:text-slate-900'
              }`}
            >
              {period === 'today' ? 'Today' : period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : period === 'quarter' ? 'Quarter' : 'This Year'}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Core Metric Cards (Matching Image 3.png) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Revenue */}
        <div id="card-total-revenue" className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(metrics.totalRevenue)}
            </h3>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+12.4% from last month</span>
            </div>
          </div>
        </div>

        {/* Cash Collected */}
        <div id="card-cash-collected" className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cash Collected</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(metrics.cashCollected)}
            </h3>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+8.2% from last month</span>
            </div>
          </div>
        </div>

        {/* Pending Amount */}
        <div id="card-pending-amount" className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Amount</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(metrics.pendingAmount)}
            </h3>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-500 font-medium">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Requires customer follow-up</span>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div id="card-net-profit" className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Profit</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(metrics.netProfit)}
            </h3>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+15.0% margin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Operations Launchpad */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setCurrentTab('new_bill')}
          className="p-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create New Bill</span>
        </button>
        <button
          onClick={() => setCurrentTab('products')}
          className="p-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Package className="w-4 h-4 text-blue-600" />
          <span>Manage Products</span>
        </button>
        <button
          onClick={() => setCurrentTab('customers')}
          className="p-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Users className="w-4 h-4 text-emerald-600" />
          <span>Customer Accounts</span>
        </button>
        <button
          onClick={() => setCurrentTab('payments')}
          className="p-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <CreditCard className="w-4 h-4 text-purple-600" />
          <span>Payments Ledger</span>
        </button>
      </div>

      {/* Recent Bills Table (Matching Image 3.png) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Bills</h3>
            <p className="text-xs text-slate-500 mt-0.5">Latest print orders and billing transactions</p>
          </div>
          <button
            onClick={() => setCurrentTab('bills')}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span>View All Bills</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200/80">
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
              {recentBills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No bills found matching the current search.
                  </td>
                </tr>
              ) : (
                recentBills.map((bill) => (
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
                          title="Quick Print"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
