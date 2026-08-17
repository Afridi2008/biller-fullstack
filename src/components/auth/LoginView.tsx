import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Printer, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Zap, 
  Package, 
  CreditCard, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useStore();
  const [emailOrUsername, setEmailOrUsername] = useState('sarah.jenkins');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim()) {
      setErrorMessage('Please enter your email or username');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    setTimeout(() => {
      login(emailOrUsername, password, rememberMe);
      setIsLoading(false);
    }, 450);
  };

  const handleDemoQuickLogin = (roleName: string, userVal: string) => {
    setEmailOrUsername(userVal);
    setPassword('demo12345');
    setIsLoading(true);
    setTimeout(() => {
      login(userVal, 'demo12345', true);
      setIsLoading(false);
    }, 300);
  };

  return (
    <div id="login-container" className="min-h-screen w-full bg-[#0F172A] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200/80">
        
        {/* Left Side: Brand Showcase (Blue gradient) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle watermark circle */}
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40 text-blue-600">
                <Printer className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">BILLER</h1>
                <p className="text-xs text-blue-200 font-medium tracking-wide uppercase">Flex Print Management</p>
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-3 mt-6">
              <h2 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight">
                Smart Billing.<br />Simple Business.
              </h2>
              <p className="text-blue-100 text-sm leading-relaxed">
                The all-in-one platform built specifically for flex printing & signage businesses. Manage orders, square footage calculations, customer balances, and instant UPI payments.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="mt-8 space-y-3.5">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/10 text-xs font-medium text-blue-50">
                <div className="w-6 h-6 rounded-lg bg-blue-500/40 flex items-center justify-center text-blue-200">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <span>Auto Sq.Ft & Finishing Rate Calculations</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/10 text-xs font-medium text-blue-50">
                <div className="w-6 h-6 rounded-lg bg-blue-500/40 flex items-center justify-center text-blue-200">
                  <Package className="w-3.5 h-3.5" />
                </div>
                <span>Flexible Size Variants & Inventory Tracking</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/10 text-xs font-medium text-blue-50">
                <div className="w-6 h-6 rounded-lg bg-blue-500/40 flex items-center justify-center text-blue-200">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <span>WhatsApp Invoices & Real-time Ledger</span>
              </div>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="mt-8 pt-6 border-t border-white/15 flex items-center gap-2 text-xs text-blue-200">
            <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>Encrypted cloud database & active local synchronization</span>
          </div>
        </div>

        {/* Right Side: Sign-in Form */}
        <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-between bg-white">
          <div className="max-w-md w-full mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to your account</h2>
              <p className="text-sm text-slate-500 mt-1">
                Welcome back. Please enter your credentials to access the BILLER workspace.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email / Username Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email or Username
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="login-username"
                    type="text"
                    required
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="email@domain.com"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="**********"
                    className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password reset link sent to registered email.')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md shadow-blue-600/20 transition-all duration-150 disabled:opacity-70 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            
            </div>
          </div>

          {/* Footer notice */}
          <div className="mt-8 text-center text-xs text-slate-400">
            BILLER Enterprise • Secure Multi-Tenant Cloud Architecture
          </div>
        </div>
      </div>
    
  );  
};
