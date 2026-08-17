import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Search, 
  Plus, 
  Menu, 
  Bell, 
  HelpCircle, 
  Building2, 
  Sparkles,
  CheckCircle2,
  Database,
  RefreshCw,
  Server
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileSidebar }) => {
  const { 
    setCurrentTab, 
    settings, 
    globalSearch, 
    setGlobalSearch,
    bills,
    dbStatus,
    isSyncing,
    syncNow,
    pythonEngine
  } = useStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showDbPopover, setShowDbPopover] = useState(false);

  const pendingBillsCount = bills.filter(b => b.status === 'UNPAID' || b.status === 'PARTIAL').length;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 no-print">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            id="global-search-input"
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search bills, customers, phone, products..."
            className="block w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Real-time MongoDB & Python Status Badge */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowDbPopover(!showDbPopover);
              setShowNotifications(false);
              setShowHelp(false);
            }}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              dbStatus.status === 'connected'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
            }`}
          >
            <div className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                dbStatus.status === 'connected' ? 'bg-emerald-400' : 'bg-blue-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                dbStatus.status === 'connected' ? 'bg-emerald-600' : 'bg-blue-600'
              }`}></span>
            </div>
            <Database className="w-3 h-3" />
            <span className="hidden md:inline">
              {dbStatus.status === 'connected' ? `MongoDB Active` : 'Realtime DB'}
            </span>
            {isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-blue-600 ml-0.5" />}
          </button>

          {/* Database Info Popover */}
          {showDbPopover && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>Real-time MongoDB Engine</span>
                </div>
                <button
                  onClick={syncNow}
                  disabled={isSyncing}
                  className="p-1 text-slate-500 hover:text-blue-600 rounded"
                  title="Sync with Database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-500 font-medium">Status:</span>
                  <span className="font-bold text-emerald-700 capitalize flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {dbStatus.status === 'connected' ? 'Connected (Atlas / Live)' : 'Active (Offline Fallback & Auto-Sync)'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-500 font-medium">Database Name:</span>
                  <span className="font-mono text-slate-800 font-semibold">{dbStatus.dbName}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-500 font-medium">Python Engine:</span>
                  <span className="font-semibold text-purple-700 flex items-center gap-1">
                    <Server className="w-3 h-3" />
                    <span>{pythonEngine.engine || 'Python 3.10 Engine'}</span>
                  </span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowDbPopover(false);
                    setCurrentTab('settings');
                  }}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Configure MongoDB URI →
                </button>
                <button
                  onClick={syncNow}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold"
                >
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Shop Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-100/80 rounded-lg border border-slate-200 text-xs font-medium text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-slate-500" />
          <span className="truncate max-w-[140px]">{settings.shopName}</span>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            id="header-notifications-btn"
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowHelp(false);
              setShowDbPopover(false);
            }}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            {pendingBillsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Store Notifications</h4>
                <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                  {pendingBillsCount} Pending
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-blue-50/50 border border-blue-100 flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-800">Auto Calculations Ready</p>
                    <p className="text-[11px] text-slate-500">Square footage, eyelet finishing, and UPI invoices enabled.</p>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-800">Real-time DB Active</p>
                    <p className="text-[11px] text-slate-500">MongoDB collections synced with Python analytical verification.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Help Modal Trigger */}
        <button
          id="header-help-btn"
          type="button"
          onClick={() => {
            setShowHelp(!showHelp);
            setShowNotifications(false);
            setShowDbPopover(false);
          }}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors hidden sm:block"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {showHelp && (
          <div className="absolute right-16 top-14 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Keyboard & Quick Help</h4>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li>• Click <strong>+ New Bill</strong> to generate square foot & custom flex prints.</li>
              <li>• Click any Invoice number to open the high-res printable invoice.</li>
              <li>• Share directly to WhatsApp with prefilled format.</li>
              <li>• Real-time MongoDB synchronization is running in the background.</li>
            </ul>
          </div>
        )}

        {/* Primary Action: + New Bill */}
        <button
          id="header-new-bill-btn"
          type="button"
          onClick={() => setCurrentTab('new_bill')}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-lg shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Bill</span>
        </button>
      </div>
    </header>
  );
};
