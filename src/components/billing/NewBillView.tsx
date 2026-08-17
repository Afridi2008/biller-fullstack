import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  BillItem, 
  ProductType, 
  PaymentMethod,
  BillStatus,
  Product 
} from '../../types';
import { 
  Plus, 
  Trash2, 
  Calculator, 
  User, 
  Phone, 
  CreditCard, 
  Printer, 
  ArrowLeft, 
  CheckCircle2,
  Sparkles,
  Layers,
  Box,
  Sliders,
  FileEdit,
  X
} from 'lucide-react';

export const NewBillView: React.FC = () => {
  const { 
    customers, 
    products, 
    bills, 
    addBill, 
    addCustomer, 
    setCurrentTab, 
    viewInvoice, 
    formatCurrency, 
    settings 
  } = useStore();

  // Generate next draft/invoice number
  const nextInvoiceNumber = useMemo(() => {
    const nextNum = bills.length + 1;
    const year = new Date().getFullYear();
    const pad = String(nextNum).padStart(3, '0');
    return `INV-${year}-${pad}`;
  }, [bills]);

  // Bill Meta
  const [invoiceNumber, setInvoiceNumber] = useState(nextInvoiceNumber);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  // Customer Selection
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustCompany, setNewCustCompany] = useState('');

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
const [items, setItems] = useState<BillItem[]>([]);

  // Item Builder State
  const [itemType, setItemType] = useState<ProductType>('area');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [itemWidth, setItemWidth] = useState<number>(0);
const [itemHeight, setItemHeight] = useState<number>(0);
const [itemQuantity, setItemQuantity] = useState<number>(1);
const [itemRate, setItemRate] = useState<number>(0);
const [itemFinishing, setItemFinishing] = useState<string>('');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [customDescription, setCustomDescription] = useState<string>('');

  // Update item rate when product changes
  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const prod = products.find(p => p.id === productId);
    if (prod) {
      setItemType(prod.type);
      if (prod.sellingRate) {
        setItemRate(prod.sellingRate);
      }
      if (prod.variants && prod.variants.length > 0) {
        setSelectedVariantId(prod.variants[0].id);
        setItemRate(prod.variants[0].sellingRate);
      }
    }
  };

  // Live calculated subtotal for currently edited item
  const currentItemCalc = useMemo(() => {
    if (itemType === 'area') {
      const sqft = (itemWidth || 0) * (itemHeight || 0) * (itemQuantity || 1);
      const amt = sqft * (itemRate || 0);
      return { sqft, amount: amt };
    } else if (itemType === 'fixed') {
      const amt = (itemQuantity || 1) * (itemRate || 0);
      return { sqft: 0, amount: amt };
    } else {
      const amt = (itemQuantity || 1) * (itemRate || 0);
      return { sqft: 0, amount: amt };
    }
  }, [itemType, itemWidth, itemHeight, itemQuantity, itemRate]);

  // Add Item to Bill
  const handleAddItem = () => {
    const prod = products.find(p => p.id === selectedProductId);
    const variant = prod?.variants?.find(v => v.id === selectedVariantId);

    let name = prod?.name || 'Custom Item';
    let specs = '';
    let sqft = 0;
    let amt = currentItemCalc.amount;

    if (itemType === 'area') {
      sqft = (itemWidth || 0) * (itemHeight || 0) * (itemQuantity || 1);
      specs = `Size: ${itemWidth} × ${itemHeight} ft (${sqft} sq.ft)${itemFinishing ? ` | Finishing: ${itemFinishing}` : ''}`;
    } else if (itemType === 'fixed') {
      name = `${prod?.name || 'Item'} - ${variant?.name || 'Standard'}`;
      specs = `Variant: ${variant?.name || 'Fixed'}`;
    } else if (itemType === 'qty') {
      specs = `Quantity: ${itemQuantity} ${prod?.unitLabel || 'units'}`;
    } else {
      name = customDescription || 'Custom Print Service';
      specs = `Custom specification | Qty: ${itemQuantity}`;
    }

    const newItem: BillItem = {
      id: `it-${Date.now()}`,
      productId: selectedProductId,
      productName: name,
      specs,
      type: itemType,
      width: itemType === 'area' ? itemWidth : undefined,
      height: itemType === 'area' ? itemHeight : undefined,
      sqft: itemType === 'area' ? sqft : undefined,
      quantity: itemQuantity,
      rate: itemRate,
      costRate: prod?.costRate || (itemRate * 0.65),
      amount: amt,
      finishing: itemType === 'area' ? itemFinishing : undefined,
    };

    setItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Bill Financial Computations
  const subtotal = useMemo(() => items.reduce((acc, it) => acc + (it.amount || 0), 0), [items]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [applyGst, setApplyGst] = useState<boolean>(true);

  const discountAmount = useMemo(() => (subtotal * (discountPercent || 0)) / 100, [subtotal, discountPercent]);
  const taxableAmount = Math.max(0, subtotal - discountAmount);

  const cgstPercent = applyGst ? settings.defaultCgstPercent : 0;
  const sgstPercent = applyGst ? settings.defaultSgstPercent : 0;
  const cgstAmount = (taxableAmount * cgstPercent) / 100;
  const sgstAmount = (taxableAmount * sgstPercent) / 100;
  const taxAmount = cgstAmount + sgstAmount;

  const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

  // Payments & Balance
  const [advancePaid, setAdvancePaid] = useState<number>(totalAmount);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [notes, setNotes] = useState<string>('');

  // Keep advance updated to full paid by default unless user edits
  const balanceDue = Math.max(0, Math.round((totalAmount - (advancePaid || 0)) * 100) / 100);

  const billStatus: BillStatus = balanceDue <= 0.01 ? 'PAID' : (advancePaid > 0 ? 'PARTIAL' : 'UNPAID');

  // Handle Save Customer Quick Form
  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) return;
    const created = addCustomer({
      name: newCustName,
      companyName: newCustCompany,
      phone: newCustPhone,
      address: 'Shop / Delivery Address',
    });
    setSelectedCustomerId(created.id);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustCompany('');
    setShowAddCustomerModal(false);
  };

  // Finalize & Create Bill
  const handleCreateBill = (printImmediately = true) => {
    if (items.length === 0) {
      alert('Please add at least one item to the bill.');
      return;
    }

    if (!selectedCustomer) {
      alert('Please select or register a customer.');
      return;
    }

    const itemsSummary = items.map(i => i.productName).join(', ');

    const newBill = addBill({
      invoiceNumber: invoiceNumber || nextInvoiceNumber,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      customerAddress: selectedCustomer.address,
      customerGstin: selectedCustomer.gstin,
      date,
      dueDate,
      items,
      itemsSummary,
      subtotal,
      discountPercent,
      discountAmount,
      cgstPercent,
      cgstAmount,
      sgstPercent,
      sgstAmount,
      taxAmount,
      totalAmount,
      advancePaid,
      balanceDue,
      paymentMethod,
      status: billStatus,
      notes,
    });

    viewInvoice(newBill.id);
    if (printImmediately) {
      setTimeout(() => {
        window.print();
      }, 300);
    }
  };

  return (
    <div id="new-bill-view" className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header bar matching Image 5.png */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentTab('bills')}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create New Bill</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                Draft: {invoiceNumber}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Add square footage items, finishing specs, customer details and payment</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setCurrentTab('bills')}
            className="px-4 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleCreateBill(false)}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold transition-colors"
          >
            Save Draft
          </button>
          <button
            id="create-bill-print-btn"
            type="button"
            onClick={() => handleCreateBill(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs shadow-blue-600/20 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Create Bill & Print</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Customer & Item Builder (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Customer Selection Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Customer Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Customer</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Customer</label>
                <select
                  id="select-customer-dropdown"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ''} - {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Bill Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium"
                />
              </div>
            </div>

            {/* Selected Customer Preview Pill */}
            {selectedCustomer && (
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-slate-900">{selectedCustomer.name}</span>
                  {selectedCustomer.companyName && (
                    <span className="text-slate-500 ml-1.5">({selectedCustomer.companyName})</span>
                  )}
                  <div className="text-slate-500 font-normal mt-0.5 flex items-center gap-3">
                    <span>📞 {selectedCustomer.phone}</span>
                    {selectedCustomer.gstin && <span>GST: {selectedCustomer.gstin}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-500">Previous Balance:</div>
                  <div className={`font-bold ${selectedCustomer.pendingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatCurrency(selectedCustomer.pendingBalance)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Item Builder Card (Matching Image 5.png) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Add Item to Bill</h3>
              </div>
              
              {/* 4 Mode Toggles */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold text-slate-600">
                {(['area', 'qty', 'fixed', 'custom'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setItemType(t)}
                    className={`px-2.5 py-1 rounded-md capitalize transition-all ${
                      itemType === t ? 'bg-white text-blue-600 shadow-xs font-bold' : 'hover:text-slate-900'
                    }`}
                  >
                    {t === 'area' ? 'Area (Sq.Ft)' : t === 'qty' ? 'Quantity' : t === 'fixed' ? 'Fixed Size' : 'Custom'}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Material / Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.subtitle ? `(${p.subtitle})` : ''} - {p.unitLabel || p.type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Sub-inputs based on itemType */}
              {itemType === 'area' && (
                <>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Width (ft)</label>
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={itemWidth}
                      onChange={(e) => setItemWidth(parseFloat(e.target.value) || 0)}
                      className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Height (ft)</label>
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={itemHeight}
                      onChange={(e) => setItemHeight(parseFloat(e.target.value) || 0)}
                      className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                      className="w-full py-2 px-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 text-center"
                    />
                  </div>
                </>
              )}

              {itemType === 'fixed' && (
                <>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Size Variant</label>
                    <select
                      value={selectedVariantId}
                      onChange={(e) => {
                        setSelectedVariantId(e.target.value);
                        const prod = products.find(p => p.id === selectedProductId);
                        const v = prod?.variants?.find(item => item.id === e.target.value);
                        if (v) setItemRate(v.sellingRate);
                      }}
                      className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      {products.find(p => p.id === selectedProductId)?.variants?.map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({formatCurrency(v.sellingRate)})</option>
                      )) || <option value="">Standard Size</option>}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                      className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 text-center"
                    />
                  </div>
                </>
              )}

              {(itemType === 'qty' || itemType === 'custom') && (
                <>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Rate</label>
                    <input
                      type="number"
                      value={itemRate}
                      onChange={(e) => setItemRate(parseFloat(e.target.value) || 0)}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Area Type Extra Finishing & Rate Input */}
            {itemType === 'area' && (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Finishing / Eyelets</label>
                  <select
                    value={itemFinishing}
                    onChange={(e) => setItemFinishing(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                  >
                    <option value="Eyelets">Metal Eyelets (All Corners)</option>
                    <option value="Gloss Lamination">Gloss UV Lamination</option>
                    <option value="Matte Lamination">Matte Lamination</option>
                    <option value="Pocket / Pipe Stitching">Pocket / Pipe Stitching</option>
                    <option value="None">None (Cut to Size)</option>
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Rate per Sq.Ft ({settings.currency})</label>
                  <input
                    type="number"
                    min={1}
                    value={itemRate}
                    onChange={(e) => setItemRate(parseFloat(e.target.value) || 0)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900"
                  />
                </div>
                <div className="sm:col-span-5 flex items-center justify-between bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 mt-5 sm:mt-0">
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Square Feet</div>
                    <div className="text-sm font-extrabold text-blue-700">{currentItemCalc.sqft} sq.ft</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Item Total</div>
                    <div className="text-sm font-extrabold text-slate-900">{formatCurrency(currentItemCalc.amount)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Description text box if Custom type */}
            {itemType === 'custom' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Custom Work Description</label>
                <input
                  type="text"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="e.g. Acrylic LED 3D Letter Signboard with installation"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            )}

            {/* Add to Bill Button */}
            <div className="pt-2 flex justify-end">
              <button
                id="add-item-to-bill-btn"
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item to Bill</span>
              </button>
            </div>
          </div>

          {/* Current Bill Items Table (Matching Image 5.png) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Bill Items ({items.length})</h3>
              <span className="text-xs text-slate-500">Subtotal: <strong className="text-slate-900">{formatCurrency(subtotal)}</strong></span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200/80">
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Description & Specs</th>
                    <th className="py-2.5 px-4 text-center">Type / Qty</th>
                    <th className="py-2.5 px-4 text-right">Rate</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.productName}</div>
                        <div className="text-[11px] text-slate-500 font-normal">{item.specs}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-medium">
                        {item.type === 'area' ? `${item.sqft} sq.ft (${item.quantity}x)` : `${item.quantity} units`}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {formatCurrency(item.rate)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Financial Summary & Payments (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
              Payment & Summary
            </h3>

            {/* Calculations Breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>

              {/* Discount control */}
              <div className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span>Discount</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                    className="w-12 py-0.5 px-1 bg-slate-50 border border-slate-200 rounded text-center text-xs font-semibold"
                  />
                  <span>%</span>
                </div>
                <span className="font-semibold text-emerald-600">-{formatCurrency(discountAmount)}</span>
              </div>

              {/* GST Toggle & calculation */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <label className="flex items-center justify-between text-slate-700 font-semibold cursor-pointer">
                  <span>Include GST / Tax ({settings.defaultCgstPercent + settings.defaultSgstPercent}%)</span>
                  <input
                    type="checkbox"
                    checked={applyGst}
                    onChange={(e) => setApplyGst(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                </label>

                {applyGst && (
                  <>
                    <div className="flex items-center justify-between text-slate-500 pl-2">
                      <span>CGST ({settings.defaultCgstPercent}%)</span>
                      <span>{formatCurrency(cgstAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 pl-2">
                      <span>SGST ({settings.defaultSgstPercent}%)</span>
                      <span>{formatCurrency(sgstAmount)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-sm">
                <span className="font-extrabold text-slate-900">Grand Total</span>
                <span className="text-lg font-black text-blue-700">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {/* Payment Details Form */}
            <div className="pt-3 border-t border-slate-200 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Method</label>
                <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
                  {(['Cash', 'UPI', 'Card', 'Bank Tx'] as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-2 rounded-lg border text-center transition-all ${
                        paymentMethod === method
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Advance Paid</label>
                  <button
                    type="button"
                    onClick={() => setAdvancePaid(totalAmount)}
                    className="text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    Set Full Paid
                  </button>
                </div>
                <input
                  id="advance-paid-input"
                  type="number"
                  min={0}
                  step={0.01}
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(parseFloat(e.target.value) || 0)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              {/* Status & Balance Due Pill */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Balance Due</div>
                  <div className={`text-base font-extrabold ${balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatCurrency(balanceDue)}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                    billStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                    billStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {billStatus}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Order Notes / Delivery Details</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Action Button */}
              <button
                id="create-bill-main-btn"
                type="button"
                onClick={() => handleCreateBill(true)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Create Bill & Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Register New Customer</h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Contact Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Studio Name</label>
                <input
                  type="text"
                  value={newCustCompany}
                  onChange={(e) => setNewCustCompany(e.target.value)}
                  placeholder="e.g. Apex Media Agency"
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
