import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Building2, 
  Percent, 
  FileText, 
  RotateCcw, 
  Save, 
  CheckCircle2,
  Database,
  RefreshCw,
  Server,
  Terminal,
  Activity,
  ArrowRight,
  HardDrive
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    resetToDefaults, 
    dbStatus, 
    connectMongoUri, 
    syncNow, 
    isSyncing,
    pythonEngine,
    runPythonAudit 
  } = useStore();

  const [activeTab, setActiveTab] = useState<'business' | 'database' | 'python'>('business');

  // Business settings state
  const [shopName, setShopName] = useState(settings.shopName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [address, setAddress] = useState(settings.address);
  const [city, setCity] = useState(settings.city);
  const [state, setState] = useState(settings.state);
  const [pincode, setPincode] = useState(settings.pincode);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [gstin, setGstin] = useState(settings.gstin);
  const [currency, setCurrency] = useState(settings.currency);
  const [defaultCgstPercent, setDefaultCgstPercent] = useState(settings.defaultCgstPercent);
  const [defaultSgstPercent, setDefaultSgstPercent] = useState(settings.defaultSgstPercent);
  const [termsStr, setTermsStr] = useState(settings.terms.join('\n'));

  // Database settings state
  const [customMongoUri, setCustomMongoUri] = useState('');
  const [customDbName, setCustomDbName] = useState('biller_db');
  const [dbConnecting, setDbConnecting] = useState(false);
  const [dbConnectMessage, setDbConnectMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Python audit state
  const [pythonTesting, setPythonTesting] = useState(false);
  const [pythonOutput, setPythonOutput] = useState<any>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      shopName,
      tagline,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      gstin,
      currency,
      defaultCgstPercent,
      defaultSgstPercent,
      terms: termsStr.split('\n').filter(t => t.trim().length > 0),
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleConnectMongo = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbConnecting(true);
    setDbConnectMessage(null);
    const res = await connectMongoUri(customMongoUri, customDbName);
    setDbConnecting(false);
    if (res.success) {
      setDbConnectMessage({ text: `Successfully connected to MongoDB (${customDbName})!` });
    } else {
      setDbConnectMessage({ text: res.error || 'Connection failed. Switched to standby fallback storage.', isError: true });
    }
  };

  const handleTestPython = async () => {
    setPythonTesting(true);
    const result = await runPythonAudit();
    setPythonTesting(false);
    setPythonOutput(result);
  };

  return (
    <div id="settings-view" className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">System & Business Settings</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage store branding, tax rules, real-time MongoDB connections, and Python backend services
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('business')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'business'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-blue-600" />
          <span>Shop & Tax Info</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'database'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-600" />
          <span>Real-time MongoDB</span>
          {dbStatus.status === 'connected' && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('python')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'python'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Server className="w-4 h-4 text-purple-600" />
          <span>Python + FastAPI</span>
        </button>
      </div>

      {/* 1. Business Branding & Tax Tab */}
      {activeTab === 'business' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Store & Business Details</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Printing Shop Name *</label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline / Subtitle</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN / Tax ID</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Shop Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Tax rates */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Percent className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Currency & Tax Rates</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-600"
                >
                  <option value="₹">₹ (INR - Indian Rupee)</option>
                  <option value="$">$ (USD - US Dollar)</option>
                  <option value="€">€ (EUR - Euro)</option>
                  <option value="£">£ (GBP - British Pound)</option>
                  <option value="AED">AED (UAE Dirham)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default CGST (%)</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={defaultCgstPercent}
                  onChange={(e) => setDefaultCgstPercent(parseFloat(e.target.value) || 0)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default SGST (%)</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={defaultSgstPercent}
                  onChange={(e) => setDefaultSgstPercent(parseFloat(e.target.value) || 0)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Invoice Terms & Policy</h3>
            </div>

            <div>
              <textarea
                rows={4}
                value={termsStr}
                onChange={(e) => setTermsStr(e.target.value)}
                placeholder="Enter one term per line"
                className="w-full py-2 px-3 border border-slate-300 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                if (confirm('Reset all demo data back to initial state?')) {
                  resetToDefaults();
                  alert('Database restored to default demo state.');
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Demo Database</span>
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      )}

      {/* 2. MongoDB Real-time Database Tab */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Status Banner */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Real-time MongoDB Engine</h3>
              </div>
              <button
                type="button"
                onClick={syncNow}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Collections Now'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-medium text-slate-500">Engine Mode</span>
                <p className="text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    dbStatus.status === 'connected' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}></span>
                  {dbStatus.status === 'connected' ? 'MongoDB Cluster' : 'Active Realtime DB'}
                </p>
                <span className="text-[11px] text-slate-500">
                  {dbStatus.status === 'connected' ? 'Atlas / Remote Live' : 'Auto-Sync & Local Storage'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-medium text-slate-500">Database Name</span>
                <p className="text-base font-mono font-bold text-slate-900 mt-1">
                  {dbStatus.dbName || 'biller_db'}
                </p>
                <span className="text-[11px] text-slate-500">Collections: bills, products, customers, payments</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-medium text-slate-500">Sync Status</span>
                <p className="text-base font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  <span>Real-time Active</span>
                </p>
                <span className="text-[11px] text-slate-500">SSE Event Stream connected</span>
              </div>
            </div>
          </div>

          {/* Connect MongoDB Cluster Form */}
          <form onSubmit={handleConnectMongo} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <HardDrive className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Connect Custom MongoDB (Atlas / Cluster)</h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Enter your MongoDB connection string (e.g. from MongoDB Atlas or local daemon). The full-stack Express server will automatically connect, ping the database, and synchronize all invoices, customers, and payment logs in real-time.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">MongoDB Connection URI</label>
                <input
                  type="text"
                  placeholder="mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority"
                  value={customMongoUri}
                  onChange={(e) => setCustomMongoUri(e.target.value)}
                  className="w-full py-2.5 px-3 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="w-full sm:w-1/2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Database Name</label>
                <input
                  type="text"
                  value={customDbName}
                  onChange={(e) => setCustomDbName(e.target.value)}
                  placeholder="biller_db"
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            {dbConnectMessage && (
              <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                dbConnectMessage.isError
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}>
                {dbConnectMessage.isError ? <Activity className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{dbConnectMessage.text}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setCustomMongoUri('');
                  connectMongoUri('');
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 underline cursor-pointer"
              >
                Use Built-in Local Standby DB
              </button>

              <button
                type="submit"
                disabled={dbConnecting}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Database className="w-4 h-4" />
                <span>{dbConnecting ? 'Testing Connection...' : 'Connect & Sync MongoDB'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Python & FastAPI Engine Tab */}
      {activeTab === 'python' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Python & FastAPI High-Performance Engine</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-mono font-bold">
                  FastAPI + Uvicorn
                </span>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-mono font-bold">
                  PyMongo 4.17
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              The backend is powered by <strong>Python 3.10 and FastAPI</strong> (<code className="bg-slate-100 px-1 py-0.5 rounded text-purple-700 font-mono">backend/main.py</code> and <code className="bg-slate-100 px-1 py-0.5 rounded text-purple-700 font-mono">backend/database.py</code>), providing async endpoints, Pydantic v2 data models, MongoDB collection synchronization, and mathematical auditing for square footage & margin analysis.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 py-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Frontend</span>
                <p className="text-xs font-bold text-blue-700 mt-0.5">React JS + Vite</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">API Framework</span>
                <p className="text-xs font-bold text-purple-700 mt-0.5">FastAPI (ASGI)</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Runtime Engine</span>
                <p className="text-xs font-bold text-purple-800 mt-0.5">Python 3.10</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Database</span>
                <p className="text-xs font-bold text-emerald-700 mt-0.5">MongoDB / PyMongo</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleTestPython}
                disabled={pythonTesting}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
              >
                <Terminal className="w-4 h-4" />
                <span>{pythonTesting ? 'Running FastAPI Analytics...' : 'Run Live Python & FastAPI Audit'}</span>
              </button>
            </div>
          </div>

          {/* Python Execution Results */}
          {pythonOutput && (
            <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-lg space-y-3 font-mono text-xs animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Python Engine Output (200 OK)</span>
                </div>
                <span className="text-[11px] text-slate-400">Calculated by: {pythonOutput.calculatedBy || 'Python 3.10'}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase">Verified Revenue</span>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">₹{pythonOutput.totalRevenue?.toLocaleString()}</p>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase">Total Sq.Ft Printed</span>
                  <p className="text-sm font-bold text-blue-400 mt-0.5">{pythonOutput.totalSqftPrinted} sq.ft</p>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase">Net Margin</span>
                  <p className="text-sm font-bold text-purple-400 mt-0.5">{pythonOutput.profitMarginPercent}%</p>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase">Net Profit</span>
                  <p className="text-sm font-bold text-amber-400 mt-0.5">₹{pythonOutput.netProfit?.toLocaleString()}</p>
                </div>
              </div>

              <pre className="bg-slate-950 p-3 rounded-lg text-slate-300 text-[11px] overflow-x-auto">
                {JSON.stringify(pythonOutput, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
