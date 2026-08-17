import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Printer, 
  Download, 
  Share2, 
  ArrowLeft, 
  Plus, 
  MessageSquare, 
  Mail, 
  CheckCircle2, 
  Copy,
  Building,
  ExternalLink,
  DollarSign,
  X
} from 'lucide-react';

export const InvoicePreviewView: React.FC = () => {
  const { 
    bills, 
    selectedInvoiceId, 
    setCurrentTab, 
    settings, 
    formatCurrency, 
    updateBillStatus 
  } = useStore();

  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMethod, setCollectMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Bank Tx'>('UPI');

  // Find active bill or fallback to first
  const bill = bills.find(b => b.id === selectedInvoiceId) || bills[0];

  if (!bill) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-500 mb-4">No invoice found.</p>
        <button
          onClick={() => setCurrentTab('bills')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold"
        >
          Back to Bills
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Hello ${bill.customerName},\n\n` +
      `Here is your invoice *${bill.invoiceNumber}* from *${settings.shopName}*.\n` +
      `Total: *${formatCurrency(bill.totalAmount)}*\n` +
      `Paid: *${formatCurrency(bill.advancePaid)}*\n` +
      `Balance Due: *${formatCurrency(bill.balanceDue)}*\n\n` +
      `Thank you for your business!`
    );
    const cleanPhone = bill.customerPhone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${text}`;
    window.open(url, '_blank');
  };

  const handleCopyInvoiceLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRecordAdditionalPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (collectAmount <= 0) return;
    updateBillStatus(bill.id, collectAmount, collectMethod);
    setShowPaymentModal(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">PAID</span>;
      case 'PARTIAL':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300">PARTIAL PAYMENT</span>;
      case 'UNPAID':
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300">UNPAID</span>;
    }
  };

  return (
    <div id="invoice-preview-view" className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Action Bar (Matching Image 7.png) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs no-print">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTab('bills')}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Bills</span>
          </button>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-bold text-slate-700">Invoice #{bill.invoiceNumber}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {bill.balanceDue > 0 && (
            <button
              onClick={() => {
                setCollectAmount(bill.balanceDue);
                setShowPaymentModal(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Collect Balance ({formatCurrency(bill.balanceDue)})</span>
            </button>
          )}

          <button
            id="invoice-share-wa-btn"
            onClick={handleWhatsAppShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Share WhatsApp</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Invoice</span>
          </button>

          <button
            onClick={() => setCurrentTab('new_bill')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Bill</span>
          </button>
        </div>
      </div>

      {/* Invoice Paper Document (Matching Image 7.png exactly) */}
      <div 
        id="printable-invoice"
        className="invoice-paper bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-lg text-slate-800 max-w-4xl mx-auto space-y-8 print:border-none print:shadow-none print:p-0"
      >
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-200 pb-8">
          
          {/* Shop / Company Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-base print:bg-blue-600">
                B
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{settings.shopName}</h2>
            </div>
            <div className="text-xs text-slate-500 space-y-0.5 font-medium">
              <p>{settings.address}</p>
              <p>{settings.city}, {settings.state} - {settings.pincode}</p>
              <p>Phone: {settings.phone} | Email: {settings.email}</p>
              <p className="font-semibold text-slate-700">GSTIN: {settings.gstin}</p>
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="sm:text-right space-y-2">
            <div className="flex sm:justify-end items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">TAX INVOICE</h1>
              {getStatusBadge(bill.status)}
            </div>
            <div className="text-xs space-y-1 text-slate-600 font-medium">
              <p>Invoice No: <strong className="text-slate-900 font-bold">{bill.invoiceNumber}</strong></p>
              <p>Invoice Date: <strong className="text-slate-900 font-semibold">{bill.date}</strong></p>
              <p>Due Date: <strong className="text-slate-900 font-semibold">{bill.dueDate}</strong></p>
            </div>
          </div>
        </div>

        {/* Billed To Customer Section (Matching Image 7.png) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/70 p-5 rounded-xl border border-slate-100 print:bg-transparent print:border-slate-300">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Billed To</span>
            <h3 className="text-sm font-bold text-slate-900">{bill.customerName}</h3>
            <div className="text-xs text-slate-500 space-y-0.5 mt-1">
              {bill.customerAddress && <p>{bill.customerAddress}</p>}
              <p>Phone: {bill.customerPhone}</p>
              {bill.customerGstin && <p className="font-semibold text-slate-700">Customer GSTIN: {bill.customerGstin}</p>}
            </div>
          </div>

          <div className="sm:text-right flex flex-col justify-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Payment Channel</span>
            <div className="text-xs font-semibold text-slate-700">
              Method: <span className="text-blue-700 font-bold">{bill.paymentMethod}</span>
            </div>
            {bill.notes && (
              <div className="text-[11px] text-slate-500 mt-1 italic">
                Note: {bill.notes}
              </div>
            )}
          </div>
        </div>

        {/* Detailed Items Table (Matching Image 7.png) */}
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-3 w-8">#</th>
                <th className="py-2.5 px-4">Item Description & Specs</th>
                <th className="py-2.5 px-3 text-center">Qty / Sq.Ft</th>
                <th className="py-2.5 px-4 text-right">Rate ({settings.currency})</th>
                <th className="py-2.5 px-4 text-right">Amount ({settings.currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {bill.items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 text-slate-400 font-bold">{idx + 1}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{item.productName}</div>
                    <div className="text-[11px] text-slate-500 font-normal mt-0.5">{item.specs}</div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {item.type === 'area' ? `${item.sqft} sq.ft` : `${item.quantity}`}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">
                    {formatCurrency(item.rate)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculations & Totals (Matching Image 7.png) */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-2">
          {/* Terms & Conditions on Left */}
          <div className="sm:col-span-7 space-y-2 text-xs text-slate-500">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Terms & Conditions:</h4>
            <ol className="list-decimal list-inside space-y-1 text-[11px]">
              {settings.terms.map((term, index) => (
                <li key={index}>{term}</li>
              ))}
            </ol>
            <div className="pt-4">
              <div className="text-[11px] text-slate-400 italic">
                This is a computer generated invoice and does not require physical stamp.
              </div>
            </div>
          </div>

          {/* Financial Breakdown on Right */}
          <div className="sm:col-span-5 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 py-1">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(bill.subtotal)}</span>
            </div>

            {bill.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 py-1">
                <span>Discount ({bill.discountPercent}%):</span>
                <span className="font-semibold">-{formatCurrency(bill.discountAmount)}</span>
              </div>
            )}

            {bill.cgstAmount > 0 && (
              <div className="flex justify-between text-slate-600 py-1">
                <span>CGST ({bill.cgstPercent}%):</span>
                <span className="font-semibold">{formatCurrency(bill.cgstAmount)}</span>
              </div>
            )}

            {bill.sgstAmount > 0 && (
              <div className="flex justify-between text-slate-600 py-1">
                <span>SGST ({bill.sgstPercent}%):</span>
                <span className="font-semibold">{formatCurrency(bill.sgstAmount)}</span>
              </div>
            )}

            <div className="flex justify-between py-2 border-t-2 border-slate-800 text-sm font-black text-slate-900">
              <span>Total Amount:</span>
              <span className="text-base text-blue-700">{formatCurrency(bill.totalAmount)}</span>
            </div>

            <div className="flex justify-between text-emerald-700 font-semibold py-1">
              <span>Advance Paid:</span>
              <span>{formatCurrency(bill.advancePaid)}</span>
            </div>

            <div className="flex justify-between py-2 border-t border-slate-200 font-bold bg-slate-50 px-3 rounded-lg">
              <span className="text-slate-900">Balance Due:</span>
              <span className={`text-base ${bill.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatCurrency(bill.balanceDue)}
              </span>
            </div>
          </div>
        </div>

        {/* Signatory Footer */}
        <div className="pt-8 border-t border-slate-200 flex items-end justify-between">
          <div className="text-xs text-slate-400 font-medium">
            Thank you for choosing {settings.shopName}!
          </div>
          <div className="text-right">
            <div className="w-40 border-b border-slate-400 mb-1"></div>
            <div className="text-[11px] font-bold text-slate-700 uppercase">Authorized Signatory</div>
          </div>
        </div>
      </div>

      {/* Collect Balance Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Record Payment for {bill.invoiceNumber}</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordAdditionalPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Amount to Collect ({settings.currency})</label>
                <input
                  type="number"
                  min={1}
                  max={bill.balanceDue}
                  step={0.01}
                  required
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(parseFloat(e.target.value) || 0)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  {(['UPI', 'Cash', 'Card', 'Bank Tx'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCollectMethod(m)}
                      className={`py-2 px-2 rounded-lg border text-center transition-all ${
                        collectMethod === m
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
                >
                  Confirm & Update Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
