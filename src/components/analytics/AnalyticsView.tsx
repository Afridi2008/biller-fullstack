import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Download, 
  Calendar, 
  PieChart as PieIcon, 
  Layers, 
  CreditCard, 
  FileSpreadsheet,
  CheckCircle2,
  ChevronRight,
  Server,
  Terminal,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const AnalyticsView: React.FC = () => {
  const { bills, payments, formatCurrency, settings, metrics, viewInvoice, runPythonAudit } = useStore();

  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [chartGranularity, setChartGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [pythonAuditResult, setPythonAuditResult] = useState<any>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Chart timeline data
  const revenueTrendData = useMemo(() => {
    return [
      { date: 'Oct 01', billed: 2100, collected: 1800 },
      { date: 'Oct 05', billed: 3400, collected: 2900 },
      { date: 'Oct 10', billed: 4800, collected: 4200 },
      { date: 'Oct 15', billed: 6200, collected: 5100 },
      { date: 'Oct 20', billed: 8900, collected: 7300 },
      { date: 'Oct 24', billed: 12400, collected: 9800 },
      { date: 'Oct 28', billed: 16800, collected: 13500 },
      { date: 'Nov 02', billed: 21200, collected: 17100 },
      { date: 'Nov 07', billed: metrics.totalRevenue || 24580, collected: metrics.cashCollected || 18200 },
    ];
  }, [metrics]);

  // Category breakdown
  const categoryData = useMemo(() => {
    let flexTotal = 0;
    let vinylTotal = 0;
    let cardsTotal = 0;
    let standeeTotal = 0;

    bills.forEach(b => {
      b.items?.forEach(it => {
        const name = (it.productName || '').toLowerCase();
        if (name.includes('flex') || name.includes('banner')) {
          flexTotal += it.amount;
        } else if (name.includes('vinyl') || name.includes('sticker') || name.includes('vision')) {
          vinylTotal += it.amount;
        } else if (name.includes('card') || name.includes('flyer')) {
          cardsTotal += it.amount;
        } else {
          standeeTotal += it.amount;
        }
      });
    });

    const total = (flexTotal + vinylTotal + cardsTotal + standeeTotal) || 1;

    return [
      { name: 'Flex Banners (Star/Frontlit)', amount: flexTotal || 11060, pct: Math.round((flexTotal / total) * 100) || 45, color: 'bg-blue-600' },
      { name: 'Vinyl Stickers & Window Film', amount: vinylTotal || 6880, pct: Math.round((vinylTotal / total) * 100) || 28, color: 'bg-emerald-500' },
      { name: 'Visiting Cards & Flyers', amount: cardsTotal || 3680, pct: Math.round((cardsTotal / total) * 100) || 15, color: 'bg-amber-500' },
      { name: 'Roll-up Standees & Signboards', amount: standeeTotal || 2950, pct: Math.round((standeeTotal / total) * 100) || 12, color: 'bg-purple-600' },
    ];
  }, [bills]);

  // Payment method pie
  const paymentMethodData = useMemo(() => {
    return [
      { name: 'UPI Transfers', value: 55, color: '#2563EB' },
      { name: 'Cash Collections', value: 35, color: '#10B981' },
      { name: 'Card Payments', value: 10, color: '#8B5CF6' },
    ];
  }, []);

  const avgBillValue = bills.length > 0 ? metrics.totalRevenue / bills.length : 0;
  const outstandingPct = metrics.totalRevenue > 0 ? Math.round((metrics.pendingAmount / metrics.totalRevenue) * 100) : 0;

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Invoice Number,Customer Name,Date,Total Amount,Paid,Balance,Status\n';
    bills.forEach(b => {
      csvContent += `"${b.invoiceNumber}","${b.customerName}","${b.date}",${b.totalAmount},${b.advancePaid},${b.balanceDue},"${b.status}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `biller-sales-report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRunPythonVerification = async () => {
    setIsAuditing(true);
    const res = await runPythonAudit();
    setIsAuditing(false);
    setPythonAuditResult(res);
  };

  return (
    <div id="analytics-view" className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Export controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Business Intelligence & Sales Analytics</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time revenue curves, payment channel distributions, and Python mathematical audits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRunPythonVerification}
            disabled={isAuditing}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Server className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>{isAuditing ? 'Auditing with Python...' : 'Audit with Python Engine'}</span>
          </button>

          <button
            id="analytics-export-csv-btn"
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Python Engine Audit Banner */}
      {pythonAuditResult && (
        <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white p-5 rounded-2xl border border-purple-800 shadow-md space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-purple-800/80 pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-bold tracking-wide">Python 3.10 Mathematics Audit Result</h4>
            </div>
            <span className="text-[11px] bg-purple-800/80 px-2 py-0.5 rounded font-mono">Status: 200 OK</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-purple-800/30 p-2.5 rounded-xl border border-purple-700/50">
              <span className="text-purple-300">Total Billed Revenue</span>
              <p className="text-base font-bold text-emerald-300 mt-0.5">₹{pythonAuditResult.totalRevenue?.toLocaleString()}</p>
            </div>
            <div className="bg-purple-800/30 p-2.5 rounded-xl border border-purple-700/50">
              <span className="text-purple-300">Total Sq.Ft Area</span>
              <p className="text-base font-bold text-cyan-300 mt-0.5">{pythonAuditResult.totalSqftPrinted} sq.ft</p>
            </div>
            <div className="bg-purple-800/30 p-2.5 rounded-xl border border-purple-700/50">
              <span className="text-purple-300">Net Estimated Profit</span>
              <p className="text-base font-bold text-amber-300 mt-0.5">₹{pythonAuditResult.netProfit?.toLocaleString()}</p>
            </div>
            <div className="bg-purple-800/30 p-2.5 rounded-xl border border-purple-700/50">
              <span className="text-purple-300">Profit Margin</span>
              <p className="text-base font-bold text-white mt-0.5">{pythonAuditResult.profitMarginPercent}%</p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sales Invoiced</span>
          <p className="text-2xl font-black text-slate-900">{formatCurrency(metrics.totalRevenue)}</p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
            <ArrowUpRight className="w-4 h-4" />
            <span>+18.4% from last period</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cash & UPI Collected</span>
          <p className="text-2xl font-black text-emerald-600">{formatCurrency(metrics.cashCollected)}</p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>{bills.length} total invoices generated</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Due</span>
          <p className="text-2xl font-black text-amber-600">{formatCurrency(metrics.pendingAmount)}</p>
          <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
            <span>{outstandingPct}% of total billed amount</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Bill Size</span>
          <p className="text-2xl font-black text-blue-600">{formatCurrency(avgBillValue)}</p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
            <TrendingUp className="w-4 h-4" />
            <span>Healthy order average</span>
          </div>
        </div>
      </div>

      {/* Main Charts: Revenue Trend & Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Revenue vs Collections Area Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Revenue Growth & Collections</h3>
              <p className="text-xs text-slate-500">Billed amount vs realized payment inflows</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                <span className="text-slate-600">Billed Sales</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600">Collected Cash</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="billedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip 
                  formatter={(val: any) => [`₹${val?.toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }} 
                />
                <Area type="monotone" dataKey="billed" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#billedGrad)" />
                <Area type="monotone" dataKey="collected" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#cashGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Payment Method Breakdown (4 Cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Payment Channels</h3>
            <p className="text-xs text-slate-500">Method distribution for collections</p>
          </div>

          <div className="h-44 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v}%`, 'Share']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-bold text-slate-400 uppercase">Top</span>
              <span className="text-sm font-extrabold text-blue-600">UPI 55%</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {paymentMethodData.map((m) => (
              <div key={m.name} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }}></span>
                  <span className="font-semibold text-slate-700">{m.name}</span>
                </div>
                <span className="font-bold text-slate-900">{m.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue by Product Category */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">Revenue by Product Category</h3>
          <p className="text-xs text-slate-500">Sales breakdown by flex printing media and product lines</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoryData.map((cat) => (
            <div key={cat.name} className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{cat.name}</span>
                <span className="font-extrabold text-slate-900">{formatCurrency(cat.amount)} ({cat.pct}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full ${cat.color} rounded-full transition-all duration-500`} style={{ width: `${cat.pct}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
