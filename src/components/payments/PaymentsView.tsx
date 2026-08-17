import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { PaymentMethod } from '../../types';
import {
  Plus,
  Search,
  CreditCard,
  Wallet,
  QrCode,
  Building2,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';

export const PaymentsView: React.FC = () => {
  const {
    payments,
    bills,
    customers,
    recordPayment,
    viewInvoice,
    formatCurrency,
    metrics,
    settings,
    user,
  } = useStore();

  const [periodFilter, setPeriodFilter] = useState<
    'today' | 'yesterday' | 'week' | 'month' | 'all'
  >('today');

  const [methodFilter, setMethodFilter] =
    useState<'ALL' | PaymentMethod>('ALL');

  const [searchQuery, setSearchQuery] = useState('');

  // Record Payment Modal
  const [showRecordModal, setShowRecordModal] = useState(false);

  const [modalCustomerId, setModalCustomerId] = useState(
    customers[0]?.id || ''
  );

  const [modalInvoiceId, setModalInvoiceId] = useState('');

  const [modalAmount, setModalAmount] = useState<number>(500);

  const [modalMethod, setModalMethod] =
    useState<PaymentMethod>('UPI');

  const [modalRef, setModalRef] = useState(
    `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`
  );

  const [paymentError, setPaymentError] = useState('');

  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // ------------------------------------------------------------
  // Filter payments
  // ------------------------------------------------------------

  const filteredPayments = payments.filter((p) => {
    if (methodFilter !== 'ALL' && p.method !== methodFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();

      return (
        p.invoiceNumber.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        (p.refTxnId &&
          p.refTxnId.toLowerCase().includes(q))
      );
    }

    return true;
  });

  // ------------------------------------------------------------
  // Record Payment
  // ------------------------------------------------------------

  const handleRecordSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setPaymentError('');

    if (!modalCustomerId) {
      setPaymentError('Please select a customer.');
      return;
    }

    if (modalAmount <= 0) {
      setPaymentError(
        'Payment amount must be greater than zero.'
      );
      return;
    }

    if (!modalInvoiceId) {
      setPaymentError(
        'Please select an invoice for this payment.'
      );
      return;
    }

    const cust = customers.find(
      (c) => c.id === modalCustomerId
    );

    const bill = bills.find(
      (b) => b.id === modalInvoiceId
    );

    if (!bill) {
      setPaymentError(
        'Selected invoice could not be found.'
      );
      return;
    }

    if (bill.customerId !== modalCustomerId) {
      setPaymentError(
        'Selected invoice does not belong to the selected customer.'
      );
      return;
    }

    if (bill.balanceDue <= 0) {
      setPaymentError(
        'This invoice has no outstanding balance.'
      );
      return;
    }

    if (modalAmount > bill.balanceDue + 0.01) {
      setPaymentError(
        `Payment cannot exceed the remaining balance of ${formatCurrency(
          bill.balanceDue
        )}.`
      );
      return;
    }

    const now = new Date();

    try {
      setIsSavingPayment(true);

      await recordPayment({
        date: now.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),

        time: now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),

        invoiceId: modalInvoiceId,

        invoiceNumber: bill.invoiceNumber,

        customerId: modalCustomerId,

        customerName:
          cust?.name || 'Walk-in Customer',

        customerType: cust?.companyName
          ? 'Corp Account'
          : 'Direct Retail',

        method: modalMethod,

        amount: modalAmount,

        collectedBy: user?.name || 'Staff',

        refTxnId: modalRef,

        status: 'Success',
      });

      // Close modal
      setShowRecordModal(false);

      // Reset form
      setModalAmount(500);

      setModalInvoiceId('');

      setModalRef(
        `TXN-${Math.floor(
          10000000 + Math.random() * 90000000
        )}`
      );

      setPaymentError('');
    } catch (error: any) {
      console.error(
        '[BILLER] Failed to record payment:',
        error
      );

      setPaymentError(
        error?.message ||
          'Failed to record payment. Please try again.'
      );
    } finally {
      setIsSavingPayment(false);
    }
  };

  // ------------------------------------------------------------
  // Payment Method Badge
  // ------------------------------------------------------------

  const getMethodIcon = (
    method: PaymentMethod
  ) => {
    switch (method) {
      case 'Cash':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Wallet className="w-3.5 h-3.5" />
            <span>Cash</span>
          </span>
        );

      case 'UPI':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <QrCode className="w-3.5 h-3.5" />
            <span>UPI</span>
          </span>
        );

      case 'Card':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Card</span>
          </span>
        );

      case 'Bank Tx':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Building2 className="w-3.5 h-3.5" />
            <span>Bank Tx</span>
          </span>
        );
    }
  };

  // ------------------------------------------------------------
  // Open Record Payment Modal
  // ------------------------------------------------------------

  const openRecordPaymentModal = () => {
    setPaymentError('');

    if (!modalCustomerId && customers.length > 0) {
      setModalCustomerId(customers[0].id);
    }

    setModalInvoiceId('');

    setModalAmount(500);

    setModalMethod('UPI');

    setModalRef(
      `TXN-${Math.floor(
        10000000 + Math.random() * 90000000
      )}`
    );

    setShowRecordModal(true);
  };

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  return (
    <div
      id="payments-view"
      className="space-y-6"
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Payments & Transactions
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time cash flow monitoring, UPI settlement
            reconciliation and payment history
          </p>
        </div>

        <button
          id="record-payment-btn"
          onClick={openRecordPaymentModal}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs shadow-blue-600/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />

          <span>+ Record Payment</span>
        </button>
      </div>

      {/* ======================================================
          SUMMARY METRICS
      ====================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Today's Total */}

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Today's Total
          </span>

          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(
                metrics.todayPaymentsTotal
              )}
            </h3>

            <p className="text-xs text-slate-500 mt-1">
              {
                payments.filter(
                  (p) => p.status === 'Success'
                ).length
              }{' '}
              total transactions
            </p>
          </div>
        </div>

        {/* Cash Collection */}

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Cash Collection
          </span>

          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight">
              {formatCurrency(metrics.todayCash)}
            </h3>

            <p className="text-xs text-slate-500 mt-1">
              {metrics.todayCashCount} transactions
            </p>
          </div>
        </div>

        {/* UPI Transfers */}

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            UPI Transfers
          </span>

          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-blue-700 tracking-tight">
              {formatCurrency(metrics.todayUpi)}
            </h3>

            <p className="text-xs text-slate-500 mt-1">
              {metrics.todayUpiCount} transactions
            </p>
          </div>
        </div>

        {/* Card Payments */}

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Card Payments
          </span>

          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-purple-700 tracking-tight">
              {formatCurrency(metrics.todayCard)}
            </h3>

            <p className="text-xs text-slate-500 mt-1">
              {metrics.todayCardCount} transactions
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================
          FILTER BAR
      ====================================================== */}

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Period Pills */}

        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 overflow-x-auto">
          {(
            [
              'today',
              'yesterday',
              'week',
              'month',
              'all',
            ] as const
          ).map((p) => (
            <button
              key={p}
              onClick={() =>
                setPeriodFilter(p)
              }
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                periodFilter === p
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              {p === 'today'
                ? 'Today'
                : p === 'yesterday'
                ? 'Yesterday'
                : p === 'week'
                ? 'Last 7 Days'
                : p === 'month'
                ? 'This Month'
                : 'All Time'}
            </button>
          ))}
        </div>

        {/* Method Filter + Search */}

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={methodFilter}
            onChange={(e) =>
              setMethodFilter(
                e.target.value as
                  | 'ALL'
                  | PaymentMethod
              )
            }
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="ALL">
              All Payment Methods
            </option>

            <option value="UPI">
              UPI Only
            </option>

            <option value="Cash">
              Cash Only
            </option>

            <option value="Card">
              Card Only
            </option>

            <option value="Bank Tx">
              Bank Transfer
            </option>
          </select>

          <div className="relative flex-1 md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
              placeholder="Search txn ID, invoice..."
              className="block w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* ======================================================
          PAYMENTS TABLE
      ====================================================== */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">
                  Date & Time
                </th>

                <th className="py-3 px-4">
                  Invoice #
                </th>

                <th className="py-3 px-4">
                  Customer
                </th>

                <th className="py-3 px-4">
                  Method
                </th>

                <th className="py-3 px-4 text-right">
                  Amount
                </th>

                <th className="py-3 px-4">
                  Collected By
                </th>

                <th className="py-3 px-4">
                  Ref / Txn ID
                </th>

                <th className="py-3 px-4 text-center">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700 font-medium">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-slate-400"
                  >
                    No payment transactions found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Date */}

                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-semibold text-slate-900">
                        {p.date}
                      </div>

                      <div className="text-[11px] text-slate-400">
                        {p.time}
                      </div>
                    </td>

                    {/* Invoice */}

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => {
                          const b =
                            bills.find(
                              (item) =>
                                item.invoiceNumber ===
                                  p.invoiceNumber ||
                                item.id ===
                                  p.invoiceId
                            );

                          if (b) {
                            viewInvoice(b.id);
                          }
                        }}
                        className="font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        {p.invoiceNumber}
                      </button>
                    </td>

                    {/* Customer */}

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {p.customerName}
                      </div>

                      <div className="text-[11px] text-slate-400">
                        {p.customerType ||
                          'Retail'}
                      </div>
                    </td>

                    {/* Method */}

                    <td className="py-3.5 px-4">
                      {getMethodIcon(p.method)}
                    </td>

                    {/* Amount */}

                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 text-sm">
                      {formatCurrency(p.amount)}
                    </td>

                    {/* Collected By */}

                    <td className="py-3.5 px-4 text-slate-600 text-xs font-semibold">
                      {p.collectedBy}
                    </td>

                    {/* Reference */}

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {p.refTxnId || '-'}
                    </td>

                    {/* Status */}

                    <td className="py-3.5 px-4 text-center">
                      {p.status === 'Success' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />

                          <span>Success</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3" />

                          <span>Failed</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================
          RECORD PAYMENT MODAL
      ====================================================== */}

      {showRecordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Record Direct Payment
              </h3>

              <button
                type="button"
                onClick={() => {
                  if (!isSavingPayment) {
                    setShowRecordModal(false);
                    setPaymentError('');
                  }
                }}
                disabled={isSavingPayment}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleRecordSubmit}
              className="space-y-3.5"
            >
              {/* ==================================================
                  CUSTOMER
              ================================================== */}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer *
                </label>

                <select
                  value={modalCustomerId}
                  onChange={(e) => {
                    setModalCustomerId(
                      e.target.value
                    );

                    // Reset invoice when customer changes
                    setModalInvoiceId('');

                    setPaymentError('');
                  }}
                  required
                  disabled={isSavingPayment}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="">
                    Select customer *
                  </option>

                  {customers.map((customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.name}
                      {customer.companyName
                        ? ` - ${customer.companyName}`
                        : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* ==================================================
                  SINGLE INVOICE DROPDOWN
              ================================================== */}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Apply to Invoice *
                </label>

                <select
                  value={modalInvoiceId}
                  onChange={(e) => {
                    setModalInvoiceId(
                      e.target.value
                    );

                    setPaymentError('');

                    // Automatically adjust amount
                    // to selected invoice balance
                    const selectedBill =
                      bills.find(
                        (b) =>
                          b.id ===
                          e.target.value
                      );

                    if (
                      selectedBill &&
                      selectedBill.balanceDue > 0
                    ) {
                      setModalAmount(
                        Math.min(
                          500,
                          selectedBill.balanceDue
                        )
                      );
                    }
                  }}
                  required
                  disabled={
                    isSavingPayment ||
                    !modalCustomerId
                  }
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="">
                    Select an invoice *
                  </option>

                  {bills
                    .filter(
                      (b) =>
                        b.customerId ===
                          modalCustomerId &&
                        b.balanceDue > 0
                    )
                    .map((b) => (
                      <option
                        key={b.id}
                        value={b.id}
                      >
                        {b.invoiceNumber} - Due:{' '}
                        {formatCurrency(
                          b.balanceDue
                        )}
                      </option>
                    ))}
                </select>

                {modalCustomerId &&
                  bills.filter(
                    (b) =>
                      b.customerId ===
                        modalCustomerId &&
                      b.balanceDue > 0
                  ).length === 0 && (
                    <p className="text-[11px] text-amber-600 mt-1">
                      This customer has no
                      outstanding invoices.
                    </p>
                  )}
              </div>

              {/* ==================================================
                  AMOUNT + METHOD
              ================================================== */}

              <div className="grid grid-cols-2 gap-3">
                {/* Amount */}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount ({settings.currency}) *
                  </label>

                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    required
                    value={modalAmount}
                    onChange={(e) =>
                      setModalAmount(
                        parseFloat(
                          e.target.value
                        ) || 0
                      )
                    }
                    disabled={isSavingPayment}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 disabled:bg-slate-100"
                  />

                  {modalInvoiceId &&
                    (() => {
                      const selectedBill =
                        bills.find(
                          (b) =>
                            b.id ===
                            modalInvoiceId
                        );

                      if (!selectedBill) {
                        return null;
                      }

                      return (
                        <p className="text-[11px] text-slate-500 mt-1">
                          Outstanding:{' '}
                          <span className="font-semibold text-slate-700">
                            {formatCurrency(
                              selectedBill.balanceDue
                            )}
                          </span>
                        </p>
                      );
                    })()}
                </div>

                {/* Payment Method */}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Method
                  </label>

                  <select
                    value={modalMethod}
                    onChange={(e) =>
                      setModalMethod(
                        e.target
                          .value as PaymentMethod
                      )
                    }
                    disabled={isSavingPayment}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm font-semibold bg-white disabled:bg-slate-100"
                  >
                    <option value="UPI">
                      UPI
                    </option>

                    <option value="Cash">
                      Cash
                    </option>

                    <option value="Card">
                      Card
                    </option>

                    <option value="Bank Tx">
                      Bank Transfer
                    </option>
                  </select>
                </div>
              </div>

              {/* ==================================================
                  TRANSACTION REFERENCE
              ================================================== */}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Txn / UTR / Reference ID
                </label>

                <input
                  type="text"
                  value={modalRef}
                  onChange={(e) =>
                    setModalRef(
                      e.target.value
                    )
                  }
                  disabled={isSavingPayment}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm font-mono text-xs disabled:bg-slate-100"
                />
              </div>

              {/* ==================================================
                  ERROR
              ================================================== */}

              {paymentError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700">
                  {paymentError}
                </div>
              )}

              {/* ==================================================
                  ACTION BUTTONS
              ================================================== */}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (!isSavingPayment) {
                      setShowRecordModal(false);
                      setPaymentError('');
                    }
                  }}
                  disabled={isSavingPayment}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingPayment}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingPayment
                    ? 'Saving...'
                    : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};