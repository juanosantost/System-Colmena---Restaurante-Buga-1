import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Supplier, Purchase, InventoryItem, InventoryUnit, PaymentMethod } from '../../types';
import { formatCOP, formatColombiaDateTime } from '../../utils/calculations';
import { generateReplenishmentProposals, validatePurchaseCancellation } from '../../utils/purchasingUtils';
import { useToast } from '../../context/ToastContext';
import { SupplierSelectInput } from '../common/SupplierSelectInput';
import { SuppliersDirectoryView } from './SuppliersDirectoryView';
import { SupplierAdvancesView } from './SupplierAdvancesView';
import { AccountsPayableDirectoryView } from './AccountsPayableDirectoryView';
import { InventoryItemModal } from '../inventory/InventoryItemModal';
import {
  Truck,
  ShoppingBag,
  FileText,
  CreditCard,
  AlertTriangle,
  Plus,
  CheckCircle,
  XCircle,
  Search,
  DollarSign,
  Package,
  ArrowRight,
  TrendingUp,
  Building,
  X,
  BookmarkCheck,
  Calendar,
} from 'lucide-react';

interface PurchasesViewProps {
  initialTab?: 'compras' | 'proveedores' | 'cuentas' | 'anticipos' | 'abastecimiento';
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({ initialTab = 'compras' }) => {
  const {
    suppliers,
    purchases,
    supplierAdvances,
    inventory,
    createPurchase,
    cancelPurchase,
    actionLoading,
  } = useRestaurant();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'compras' | 'proveedores' | 'cuentas' | 'anticipos' | 'abastecimiento'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Formulario Nueva Compra
  const [showPurchaseModal, setShowPurchaseModal] = useState<boolean>(false);
  const [selectedSupplierForPurchase, setSelectedSupplierForPurchase] = useState<Supplier | null>(null);
  const [showCreateItemModal, setShowCreateItemModal] = useState<boolean>(false);

  const [purchaseForm, setPurchaseForm] = useState<{
    date: string;
    documentNumber: string;
    paymentMethod: PaymentMethod | 'credito';
    amountPaid: number;
    observations: string;
    items: Array<{
      ingredientId: string;
      ingredientName: string;
      quantity: number;
      unit: InventoryUnit;
      unitCost: number;
    }>;
  }>({
    date: new Date().toISOString().split('T')[0],
    documentNumber: '',
    paymentMethod: 'transferencia',
    amountPaid: 0,
    observations: '',
    items: [],
  });

  // Agregar Ítem a Compra
  const handleAddPurchaseItem = (ingredient: InventoryItem) => {
    const exists = purchaseForm.items.find((i) => i.ingredientId === ingredient.id);
    if (exists) {
      setPurchaseForm({
        ...purchaseForm,
        items: purchaseForm.items.map((i) =>
          i.ingredientId === ingredient.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    } else {
      setPurchaseForm({
        ...purchaseForm,
        items: [
          ...purchaseForm.items,
          {
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            quantity: 1,
            unit: ingredient.unit,
            unitCost: ingredient.costPerUnit || 0,
          },
        ],
      });
    }
  };

  // Guardar Compra
  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForPurchase) {
      showToast('Seleccione un proveedor para registrar la compra', 'error');
      return;
    }
    if (!purchaseForm.documentNumber.trim()) {
      showToast('El número de factura o remisión es obligatorio', 'error');
      return;
    }
    if (purchaseForm.items.length === 0) {
      showToast('Agregue al menos un insumo o ingrediente a la compra', 'error');
      return;
    }

    try {
      await createPurchase({
        supplierId: selectedSupplierForPurchase.id,
        supplierName: selectedSupplierForPurchase.name,
        date: purchaseForm.date,
        documentNumber: purchaseForm.documentNumber.trim(),
        items: purchaseForm.items,
        paymentMethod: purchaseForm.paymentMethod,
        amountPaid: purchaseForm.amountPaid,
        observations: purchaseForm.observations.trim(),
      });

      showToast(`Compra #${purchaseForm.documentNumber} registrada con éxito`, 'success');
      setShowPurchaseModal(false);
      setPurchaseForm({
        date: new Date().toISOString().split('T')[0],
        documentNumber: '',
        paymentMethod: 'transferencia',
        amountPaid: 0,
        observations: '',
        items: [],
      });
      setSelectedSupplierForPurchase(null);
    } catch (err: any) {
      showToast(err.message || 'Error al guardar la compra', 'error');
    }
  };

  // Anular Compra Completa
  const handleCancelPurchase = async (purchaseId: string) => {
    try {
      await cancelPurchase(purchaseId);
      showToast('Compra anulada y stock recalculado', 'info');
    } catch (err: any) {
      showToast(err.message || 'Error al anular compra', 'error');
    }
  };

  // Navegación desde Ficha de Proveedor
  const handleNavigateToPurchaseWithSupplier = (sup: Supplier) => {
    setSelectedSupplierForPurchase(sup);
    setActiveTab('compras');
    setShowPurchaseModal(true);
  };

  const handleNavigateToAdvanceWithSupplier = (sup: Supplier) => {
    setActiveTab('anticipos');
  };

  const handleNavigateToPayablesWithSupplier = (sup: Supplier) => {
    setActiveTab('cuentas');
  };

  // Totales de Compras
  const totalSubtotal = purchaseForm.items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
  const totalTax = Math.round(totalSubtotal * 0.19);
  const totalPurchase = totalSubtotal + totalTax;

  const confirmedPurchases = purchases.filter((p) => p.status !== 'anulada');
  const totalSpentPurchases = confirmedPurchases.reduce((sum, p) => sum + p.total, 0);
  const totalPendingPayables = confirmedPurchases.reduce((sum, p) => sum + p.balanceDue, 0);
  const totalAvailableAdvances = supplierAdvances
    .filter((a) => a.status !== 'anulado')
    .reduce((sum, a) => sum + (a.availableBalance !== undefined ? a.availableBalance : a.balance), 0);
  const proposals = generateReplenishmentProposals(inventory);

  return (
    <div className="space-y-6">
      
      {/* 1. NAVEGACIÓN DE SECCIONES (5 PESTAÑAS) */}
      <div className="bg-[#181818] border border-[#B77900]/40 rounded-3xl p-4 shadow-xl">
        <div className="flex border-b border-[#2d2d2d] gap-2 overflow-x-auto">
          {[
            { id: 'compras', label: 'Compras & Insumos', icon: Truck, badge: confirmedPurchases.length },
            { id: 'proveedores', label: 'Proveedores & CRM', icon: Building, badge: suppliers.length },
            { id: 'cuentas', label: 'Cuentas por Pagar', icon: CreditCard, badge: confirmedPurchases.filter((p) => p.balanceDue > 0).length, color: 'text-amber-400 font-bold' },
            { id: 'anticipos', label: 'Anticipos a Proveedores', icon: DollarSign, badge: supplierAdvances.filter((a) => (a.availableBalance !== undefined ? a.availableBalance : a.balance) > 0).length, color: 'text-cyan-400 font-bold' },
            { id: 'abastecimiento', label: 'Abastecimiento Sugerido', icon: Package, badge: proposals.length, color: proposals.length > 0 ? 'text-red-400 animate-pulse' : '' },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 font-bold text-xs border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#B77900] text-[#D6A21A] bg-[#292212]/60 rounded-t-xl'
                    : 'border-transparent text-[#a8a29e] hover:text-[#FFFDF5]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-[#121214] border border-[#333333] ${tab.color || 'text-[#FFFDF5]'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CONTENIDO SEGÚN LA PESTAÑA ACTIVA */}

      {/* VISTA 1: COMPRAS & INSUMOS */}
      {activeTab === 'compras' && (
        <div className="space-y-6">
          
          {/* Métricas de Compras */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#181818] border border-[#2d281e] p-4 rounded-3xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-[#a8a29e]">Total Compras Facturadas</span>
              <p className="text-xl font-black text-[#FFFDF5] mt-1">{formatCOP(totalSpentPurchases)}</p>
              <span className="text-xs text-[#a8a29e]">{confirmedPurchases.length} compras en total</span>
            </div>

            <div className="bg-[#181818] border border-[#2d281e] p-4 rounded-3xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-[#a8a29e]">Cuentas por Pagar</span>
              <p className="text-xl font-black text-amber-400 mt-1">{formatCOP(totalPendingPayables)}</p>
              <span className="text-xs text-amber-400 font-bold">obligaciones pendientes</span>
            </div>

            <div className="bg-[#181818] border border-[#2d281e] p-4 rounded-3xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-[#a8a29e]">Anticipos Disponibles</span>
              <p className="text-xl font-black text-cyan-400 mt-1">{formatCOP(totalAvailableAdvances)}</p>
              <span className="text-xs text-cyan-400">saldo por aplicar</span>
            </div>

            <div className="bg-[#181818] border border-[#2d281e] p-4 rounded-3xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-[#a8a29e]">Alertas de Insumos</span>
              <p className="text-xl font-black text-red-400 mt-1">{proposals.length}</p>
              <span className="text-xs text-red-400 font-bold">por debajo del stock mínimo</span>
            </div>
          </div>

          {/* Barra de Filtros y Botón Nueva Compra */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#181818] border border-[#2d281e] p-4 rounded-3xl">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#a8a29e]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por factura, insumo o proveedor..."
                className="w-full bg-[#121214] border border-[#333333] rounded-xl pl-9 pr-3 py-2 text-xs text-[#FFFDF5] focus:outline-none focus:border-[#B77900]"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowPurchaseModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#B77900] to-[#D6A21A] text-[#181818] font-black text-xs inline-flex items-center gap-1.5 hover:brightness-110 shadow-lg cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Nueva Compra</span>
            </button>
          </div>

          {/* Tabla de Compras */}
          {confirmedPurchases.length > 0 ? (
            <div className="bg-[#181818] border border-[#2d281e] rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#FFFDF5]">
                  <thead className="bg-[#121214] text-[#a8a29e] uppercase text-[10px] font-bold border-b border-[#2d2d2d]">
                    <tr>
                      <th className="p-4">Factura / Remisión</th>
                      <th className="p-4">Fecha</th>
                      <th className="p-4">Proveedor</th>
                      <th className="p-4">Ítems de Insumos</th>
                      <th className="p-4 text-right">Total Compra</th>
                      <th className="p-4 text-right">Saldo Pendiente</th>
                      <th className="p-4 text-center">Estado Pago</th>
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#242424]">
                    {confirmedPurchases
                      .filter((p) => {
                        if (!searchQuery.trim()) return true;
                        const term = searchQuery.toLowerCase();
                        return (
                          p.documentNumber.toLowerCase().includes(term) ||
                          p.supplierName.toLowerCase().includes(term) ||
                          p.items.some((i) => i.ingredientName.toLowerCase().includes(term))
                        );
                      })
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-[#1f1e24] transition-colors">
                          <td className="p-4 font-mono font-bold text-[#D6A21A]">
                            #{p.documentNumber}
                          </td>
                          <td className="p-4 text-[#a8a29e]">{p.date}</td>
                          <td className="p-4 font-bold">{p.supplierName}</td>
                          <td className="p-4 text-[#a8a29e]">
                            {p.items.map((i) => `${i.quantity}${i.unit} ${i.ingredientName}`).join(', ')}
                          </td>
                          <td className="p-4 text-right font-mono font-bold">{formatCOP(p.total)}</td>
                          <td className="p-4 text-right font-mono font-bold text-amber-400">
                            {formatCOP(p.balanceDue)}
                          </td>
                          <td className="p-4 text-center">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                p.paymentStatus === 'pagada'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : p.paymentStatus === 'parcial'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-red-950 text-red-300 border border-red-800'
                              }`}
                            >
                              {p.paymentStatus === 'pagada' ? 'PAGADA' : p.paymentStatus === 'parcial' ? 'CON ABONO' : 'PENDIENTE'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleCancelPurchase(p.id)}
                              className="text-[11px] font-bold text-red-400 hover:underline cursor-pointer"
                            >
                              Anular
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-[#181818] border border-[#2d281e] rounded-3xl p-12 text-center text-[#a8a29e]">
              <Truck className="w-12 h-12 mx-auto text-[#B77900] mb-3 opacity-60" />
              <p className="text-base font-bold text-[#FFFDF5]">No hay compras registradas aún</p>
            </div>
          )}

        </div>
      )}

      {/* VISTA 2: PROVEEDORES & CRM INSUMOS */}
      {activeTab === 'proveedores' && (
        <SuppliersDirectoryView
          onNavigateToPurchaseWithSupplier={handleNavigateToPurchaseWithSupplier}
          onNavigateToAdvanceWithSupplier={handleNavigateToAdvanceWithSupplier}
          onNavigateToPayablesWithSupplier={handleNavigateToPayablesWithSupplier}
        />
      )}

      {/* VISTA 3: CUENTAS POR PAGAR */}
      {activeTab === 'cuentas' && <AccountsPayableDirectoryView />}

      {/* VISTA 4: ANTICIPOS A PROVEEDORES */}
      {activeTab === 'anticipos' && <SupplierAdvancesView />}

      {/* VISTA 5: ABASTECIMIENTO SUGERIDO */}
      {activeTab === 'abastecimiento' && (
        <div className="bg-[#181818] border border-[#2d281e] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-4">
            <div>
              <h3 className="text-base font-black text-[#FFFDF5]">Propuestas de Reabastecimiento de Insumos</h3>
              <p className="text-xs text-[#a8a29e]">Alertas automáticas según existencias mínimas de cocina e inventario</p>
            </div>
          </div>

          {proposals.length > 0 ? (
            <div className="divide-y divide-[#242424]">
              {proposals.map((prop) => (
                <div key={prop.itemId} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#FFFDF5] text-sm">{prop.itemName}</span>
                    <p className="text-[#a8a29e] mt-0.5">
                      Stock Actual: <strong className="text-red-400">{prop.currentStock} {prop.unit}</strong> · Mínimo: {prop.minStock} {prop.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-400 font-bold block">Sugerido: +{prop.recommendedQty} {prop.unit}</span>
                    <span className="text-[#a8a29e]">Est: {formatCOP(prop.estimatedCost)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-emerald-400 font-bold">
              <CheckCircle className="w-10 h-10 mx-auto mb-2" />
              <p className="text-sm">¡Todos los insumos e ingredientes cuentan con inventario óptimo!</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL: REGISTRAR NUEVA COMPRA */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-[#181818] border border-[#B77900]/40 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-[#333333] flex items-center justify-between bg-gradient-to-r from-[#181818] to-[#242424]">
              <div className="flex items-center gap-2.5">
                <Truck className="w-6 h-6 text-[#D6A21A]" />
                <div>
                  <h3 className="text-base font-black text-[#FFFDF5]">Registrar Compra de Insumos</h3>
                  <p className="text-xs text-[#a8a29e]">Entrada de mercancía e incremento de costo promedio de inventario</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPurchaseModal(false)}
                className="p-1.5 text-[#a8a29e] hover:text-[#FFFDF5] rounded-xl hover:bg-[#2d2d2d]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Selector de Proveedor con Creación Inline sin perder form */}
              <SupplierSelectInput
                selectedSupplier={selectedSupplierForPurchase}
                onSelectSupplier={setSelectedSupplierForPurchase}
                label="Proveedor"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#d6d3d1] mb-1">
                    No. Factura / Remisión <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={purchaseForm.documentNumber}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, documentNumber: e.target.value })}
                    placeholder="Ej: FAC-8890"
                    required
                    className="w-full bg-[#121214] border border-[#333333] rounded-xl p-3 text-xs text-[#FFFDF5] focus:outline-none focus:border-[#B77900]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#d6d3d1] mb-1">
                    Fecha de la Compra <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={purchaseForm.date}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, date: e.target.value })}
                    required
                    className="w-full bg-[#121214] border border-[#333333] rounded-xl p-3 text-xs text-[#FFFDF5] focus:outline-none focus:border-[#B77900]"
                  />
                </div>
              </div>

              {/* Selección de Insumos para la Compra */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#d6d3d1]">
                    Insumos Comprados ({purchaseForm.items.length}) <span className="text-amber-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCreateItemModal(true)}
                    className="text-[11px] text-[#D6A21A] hover:underline font-bold"
                  >
                    + Crear Insumo Nuevo
                  </button>
                </div>

                {/* Buscador Rápido de Insumo para agregar */}
                <div className="p-3 bg-[#121214] border border-[#2d281e] rounded-2xl space-y-2">
                  <p className="text-[10px] text-[#a8a29e] uppercase font-bold">Seleccionar insumo de inventario:</p>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {inventory.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleAddPurchaseItem(item)}
                        className="px-2.5 py-1 rounded-lg bg-[#242424] hover:bg-[#B77900] hover:text-[#181818] text-[11px] font-bold text-[#FFFDF5] transition-colors cursor-pointer"
                      >
                        + {item.name} ({item.unit})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tabla de Insumos en el Carrito de la Compra */}
                {purchaseForm.items.length > 0 && (
                  <div className="border border-[#2d281e] rounded-2xl overflow-hidden divide-y divide-[#242424]">
                    {purchaseForm.items.map((item, idx) => (
                      <div key={idx} className="p-3 bg-[#121214] flex items-center justify-between gap-3 text-xs">
                        <span className="font-bold text-[#FFFDF5] flex-1">{item.ingredientName}</span>
                        
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0.1}
                            step={0.1}
                            value={item.quantity}
                            onChange={(e) => {
                              const qty = parseFloat(e.target.value) || 0;
                              setPurchaseForm({
                                ...purchaseForm,
                                items: purchaseForm.items.map((i, iIdx) =>
                                  iIdx === idx ? { ...i, quantity: qty } : i
                                ),
                              });
                            }}
                            className="w-16 bg-[#181818] border border-[#333333] rounded-lg p-1 text-center font-mono text-[#FFFDF5]"
                          />
                          <span className="text-[#a8a29e] text-[10px]">{item.unit}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#a8a29e]">Costo/u:</span>
                          <input
                            type="number"
                            min={0}
                            value={item.unitCost}
                            onChange={(e) => {
                              const cost = parseFloat(e.target.value) || 0;
                              setPurchaseForm({
                                ...purchaseForm,
                                items: purchaseForm.items.map((i, iIdx) =>
                                  iIdx === idx ? { ...i, unitCost: cost } : i
                                ),
                              });
                            }}
                            className="w-24 bg-[#181818] border border-[#333333] rounded-lg p-1 text-right font-mono text-[#FFFDF5]"
                          />
                        </div>

                        <span className="font-mono font-bold text-[#D6A21A] w-24 text-right">
                          {formatCOP(item.quantity * item.unitCost)}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setPurchaseForm({
                              ...purchaseForm,
                              items: purchaseForm.items.filter((_, iIdx) => iIdx !== idx),
                            });
                          }}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totales y Forma de Pago */}
              <div className="p-4 bg-[#121214] border border-[#2d281e] rounded-2xl space-y-2">
                <div className="flex justify-between text-xs text-[#a8a29e]">
                  <span>Subtotal Insumos:</span>
                  <span className="font-mono">{formatCOP(totalSubtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-[#a8a29e]">
                  <span>IVA Calculado (19%):</span>
                  <span className="font-mono">{formatCOP(totalTax)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-[#242424] text-[#FFFDF5]">
                  <span>TOTAL COMPRA:</span>
                  <span className="font-mono text-amber-400 text-base">{formatCOP(totalPurchase)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#d6d3d1] mb-1">
                    Forma de Pago
                  </label>
                  <select
                    value={purchaseForm.paymentMethod}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, paymentMethod: e.target.value as any })}
                    className="w-full bg-[#121214] border border-[#333333] rounded-xl p-3 text-xs text-[#FFFDF5] focus:outline-none focus:border-[#B77900]"
                  >
                    <option value="transferencia">Transferencia Bancaria (Pago Total)</option>
                    <option value="efectivo">Efectivo en Caja (Pago Total)</option>
                    <option value="credito">Compra a Crédito (Genera Cuenta por Pagar)</option>
                    <option value="nequi_daviplata">Nequi / Daviplata</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#d6d3d1] mb-1">
                    Pago Inicial en Caja / Transferencia (COP)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={totalPurchase}
                    value={purchaseForm.amountPaid || ''}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, amountPaid: parseFloat(e.target.value) || 0 })}
                    placeholder="0 para crédito total"
                    className="w-full bg-[#121214] border border-[#333333] rounded-xl p-3 text-xs font-mono text-[#FFFDF5] focus:outline-none focus:border-[#B77900]"
                  />
                  <p className="text-[10px] text-amber-400 mt-1">
                    Saldo que quedará como Cuenta por Pagar: <strong>{formatCOP(Math.max(0, totalPurchase - purchaseForm.amountPaid))}</strong>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#d6d3d1] mb-1">
                  Observaciones / Términos
                </label>
                <input
                  type="text"
                  value={purchaseForm.observations}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, observations: e.target.value })}
                  placeholder="Ej: Entrega parcial de insumos, vencimiento a 30 días..."
                  className="w-full bg-[#121214] border border-[#333333] rounded-xl p-3 text-xs text-[#FFFDF5] focus:outline-none focus:border-[#B77900]"
                />
              </div>

              <div className="pt-3 border-t border-[#333333] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#444444] text-[#d6d3d1] text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedSupplierForPurchase || purchaseForm.items.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#B77900] to-[#D6A21A] text-[#181818] font-black text-xs hover:brightness-110 disabled:opacity-50 cursor-pointer"
                >
                  Registrar Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Crear Nuevo Insumo de Inventario */}
      {showCreateItemModal && (
        <InventoryItemModal
          onClose={() => setShowCreateItemModal(false)}
        />
      )}

    </div>
  );
};
