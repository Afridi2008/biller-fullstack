import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductType, SizeVariant } from '../../types';
import { 
  Plus, 
  Search, 
  Package, 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Sliders, 
  X,
  Layers
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, formatCurrency, settings } = useStore();

  const [typeFilter, setTypeFilter] = useState<'ALL' | ProductType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRowId, setExpandedRowId] = useState<string | null>('prod-6'); // Default expanded standee

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalProdName, setModalProdName] = useState('');
  const [modalProdSubtitle, setModalProdSubtitle] = useState('');
  const [modalProdType, setModalProdType] = useState<ProductType>('area');
  const [modalCostRate, setModalCostRate] = useState<number>(10);
  const [modalSellingRate, setModalSellingRate] = useState<number>(15);
  const [modalUnitLabel, setModalUnitLabel] = useState('Area (Sq.Ft)');
  const [modalVariants, setModalVariants] = useState<SizeVariant[]>([
    { id: 'v-1', name: '6×3 ft (Standard)', costRate: 650, sellingRate: 1200 },
    { id: 'v-2', name: '6×2.5 ft (Narrow)', costRate: 600, sellingRate: 1100 }
  ]);

  const activeCount = products.filter(p => p.status === 'active').length;
  const inactiveCount = products.filter(p => p.status === 'inactive').length;

  // Filter products
  const filteredProducts = products.filter(p => {
    if (typeFilter !== 'ALL' && p.type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.subtitle && p.subtitle.toLowerCase().includes(q));
    }
    return true;
  });

  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalProdName.trim()) return;

    addProduct({
      name: modalProdName,
      subtitle: modalProdSubtitle,
      type: modalProdType,
      costRate: modalCostRate,
      sellingRate: modalSellingRate,
      unitLabel: modalProdType === 'area' ? 'Area (Sq.Ft)' : modalProdType === 'fixed' ? 'Fixed Size' : modalUnitLabel,
      status: 'active',
      variants: modalProdType === 'fixed' ? modalVariants : undefined,
    });

    // Reset & Close
    setModalProdName('');
    setModalProdSubtitle('');
    setShowAddModal(false);
  };

  const getTypeBadge = (type: ProductType) => {
    switch (type) {
      case 'area':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Area (Sq.Ft)</span>;
      case 'fixed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Fixed Size</span>;
      case 'qty':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Quantity</span>;
      case 'custom':
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Custom</span>;
    }
  };

  return (
    <div id="products-view" className="space-y-6">
      {/* Header (Matching Image 11.png) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Products & Materials</h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {products.length} Products ({activeCount} Active, {inactiveCount} Inactive)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure flex media, banners, vinyl sticker rates, unit pricing and fixed standee sizes
          </p>
        </div>

        <button
          id="add-product-btn"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs shadow-blue-600/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Add Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Type Filter Pills */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 overflow-x-auto">
          {(['ALL', 'area', 'qty', 'fixed', 'custom'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                typeFilter === t ? 'bg-white text-blue-600 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              {t === 'ALL' ? 'All Materials' : t === 'area' ? 'Area (Sq.Ft)' : t === 'qty' ? 'Quantity' : t === 'fixed' ? 'Fixed Sizes' : 'Custom'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search material or type..."
            className="block w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Products Table (Matching Image 11.png) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Product / Material</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Cost Rate</th>
                <th className="py-3 px-4 text-right">Selling Rate</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700 font-medium">
              {filteredProducts.map((prod) => {
                const isExpanded = expandedRowId === prod.id;
                const hasVariants = prod.variants && prod.variants.length > 0;

                return (
                  <React.Fragment key={prod.id}>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {hasVariants ? (
                            <button
                              onClick={() => setExpandedRowId(isExpanded ? null : prod.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          ) : (
                            <div className="w-6"></div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900">{prod.name}</div>
                            {prod.subtitle && <div className="text-[11px] text-slate-400">{prod.subtitle}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {getTypeBadge(prod.type)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500 font-medium">
                        {prod.costRate !== undefined ? formatCurrency(prod.costRate) : (hasVariants ? 'Variants' : '-')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {prod.sellingRate !== undefined ? formatCurrency(prod.sellingRate) : (hasVariants ? 'Variants' : '-')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => updateProduct(prod.id, { status: prod.status === 'active' ? 'inactive' : 'active' })}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer ${
                            prod.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {prod.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{prod.status === 'active' ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              const newName = prompt('Edit product name:', prod.name);
                              if (newName) updateProduct(prod.id, { name: newName });
                            }}
                            title="Edit Product"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete product ${prod.name}?`)) deleteProduct(prod.id);
                            }}
                            title="Delete Product"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Size Variants Subtable (Matching Image 11.png) */}
                    {hasVariants && isExpanded && (
                      <tr className="bg-blue-50/40 border-b border-slate-100">
                        <td colSpan={6} className="py-3 px-12">
                          <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs space-y-2">
                            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-blue-600" />
                              <span>Configured Size Variants ({prod.variants?.length})</span>
                            </div>
                            <div className="divide-y divide-slate-100 text-xs">
                              {prod.variants?.map((v) => (
                                <div key={v.id} className="py-1.5 flex items-center justify-between">
                                  <span className="font-semibold text-slate-800">{v.name}</span>
                                  <div className="flex items-center gap-6">
                                    <span className="text-slate-500">Cost: <strong>{formatCurrency(v.costRate)}</strong></span>
                                    <span className="text-slate-900 font-bold">Sell: <strong className="text-blue-700">{formatCurrency(v.sellingRate)}</strong></span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Printing Material</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={modalProdName}
                  onChange={(e) => setModalProdName(e.target.value)}
                  placeholder="e.g. Backlit Flex Banner"
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subtitle / Specifications</label>
                <input
                  type="text"
                  value={modalProdSubtitle}
                  onChange={(e) => setModalProdSubtitle(e.target.value)}
                  placeholder="e.g. 440gsm High Glow"
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pricing Model Type</label>
                  <select
                    value={modalProdType}
                    onChange={(e) => setModalProdType(e.target.value as ProductType)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="area">Area (Sq.Ft)</option>
                    <option value="fixed">Fixed Size Standee</option>
                    <option value="qty">Quantity / Unit</option>
                    <option value="custom">Custom Rate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Label</label>
                  <input
                    type="text"
                    value={modalUnitLabel}
                    onChange={(e) => setModalUnitLabel(e.target.value)}
                    placeholder="e.g. Sq.Ft or Box"
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Rate ({settings.currency})</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={modalCostRate}
                    onChange={(e) => setModalCostRate(parseFloat(e.target.value) || 0)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Rate ({settings.currency})</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={modalSellingRate}
                    onChange={(e) => setModalSellingRate(parseFloat(e.target.value) || 0)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm font-bold text-blue-700"
                  />
                </div>
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
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
