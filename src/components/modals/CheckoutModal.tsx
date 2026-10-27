import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Order, PaymentMethod, PaymentSplit, Payment } from '../../types';
import { formatCOP, splitBillEqually } from '../../utils/calculations';
import {
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Layers,
  Calculator,
  Receipt,
  User,
  CheckCircle,
  Percent,
  Users,
} from 'lucide-react';

interface CheckoutModalProps {
  order: Order;
  onClose: () => void;
  onPaymentComplete: (payment: Payment) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  order,
  onClose,
  onPaymentComplete,
}) => {
  const { closeAndPayOrder, activeShift, actionLoading, paymentMethods } = useRestaurant();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [includeTip, setIncludeTip] = useState<boolean>(order.tip > 0);
  const [customTip, setCustomTip] = useState<number>(order.tip > 0 ? order.tip : Math.round(order.subtotal * 0.10));
  const [cashReceived, setCashReceived] = useState<number>(order.total);
  const [customerName, setCustomerName] = useState<string>(order.customerName || '');
  const [customerNit, setCustomerNit] = useState<string>('222222222222'); // Consumidor final Colombia
  const [splitCount, setSplitCount] = useState<number>(1);
  const [isSplitting, setIsSplitting] = useState<boolean>(false);

  // Split payment configuration (para pagos mixtos: ej. mitad efectivo, mitad tarjeta)
  const [splits, setSplits] = useState<PaymentSplit[]>([
    { method: 'efectivo', amount: Math.round(order.total / 2) },
    { method: 'tarjeta', amount: Math.round(order.total / 2) },
  ]);

  const tipAmount = includeTip ? customTip : 0;
  const grandTotal = order.subtotal + order.tax + tipAmount;

  // Actualizar cashReceived si cambia grandTotal
  React.useEffect(() => {
    setCashReceived(grandTotal);
  }, [grandTotal]);

  const change = Math.max(0, cashReceived - grandTotal);
  const splitAmounts = splitBillEqually(grandTotal, splitCount);

  const handlePay = async () => {
    if (actionLoading) return;

    try {
      const payment = await closeAndPayOrder({
        orderId: order.id,
        method: paymentMethod,
        splits: paymentMethod === 'mixto' ? splits : undefined,
        amountPaid: paymentMethod === 'efectivo' ? cashReceived : grandTotal,
        tipAmount,
        customerName: customerName.trim() || undefined,
        customerNitOrCedula: customerNit.trim() || undefined,
      });

      onPaymentComplete(payment);
    } catch (err) {
      console.error('Error completing payment:', err);
    }
  };

  const methodsList: { id: PaymentMethod; label: string; icon: any; desc: string }[] = useMemo(() => {
    const active = paymentMethods.filter((p) => p.isActive);
    if (active.length === 0) {
      return [
        { id: 'efectivo', label: 'Efectivo', icon: Banknote, desc: 'Cálculo de cambio/vueltas' },
        { id: 'tarjeta', label: 'Tarjeta / Datáfono', icon: CreditCard, desc: 'Crédito o Débito' },
        { id: 'nequi_daviplata', label: 'Nequi / Daviplata', icon: Smartphone, desc: 'Transferencia móvil inmediata' },
        { id: 'mixto', label: 'Pago Mixto', icon: Layers, desc: 'Dividir métodos de pago' },
      ];
    }
    const mapped = active.map((p) => {
      let icon = CreditCard;
      if (p.category === 'efectivo') icon = Banknote;
      else if (p.category === 'billetera_digital') icon = Smartphone;
      return {
        id: (p.name.toLowerCase().replace(/\s+/g, '_')) as PaymentMethod,
        label: p.name,
        icon,
        desc: p.description || (p.isCashType ? 'Efectivo en caja' : p.bankName ? `Canal ${p.bankName}` : 'Medio habilitado'),
      };
    });
    return [...mapped, { id: 'mixto' as PaymentMethod, label: 'Pago Mixto', icon: Layers, desc: 'Dividir métodos de pago' }];
  }, [paymentMethods]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#121117] border border-[#3f3521] rounded-2xl w-full max-w-3xl max-h-[94vh] flex flex-col shadow-2xl text-[#faf5ee]">
        
        {/* Cabecera */}
        <div className="px-5 py-4 border-b border-[#2d281e] flex items-center justify-between bg-gradient-to-r from-[#1a1722] to-[#121117]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#8c711a] flex items-center justify-center text-[#0e0e12] font-black">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#fef3c7]">
                  Cobro y Facturación Comercial
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#2b2416] text-[#d4af37] border border-[#d4af37]/40">
                  {order.tableName || `Pedido #${order.orderNumber}`}
                </span>
              </div>
              <p className="text-xs text-[#a8a29e]">
                {activeShift ? `Registrando en Turno de ${activeShift.cashierName}` : 'Sin turno de caja abierto'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#a8a29e] hover:text-[#fef3c7] hover:bg-[#201e28]"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 overflow-y-auto space-y-5">
          
          {/* Desglose de Cuenta */}
          <div className="bg-[#18171f] p-4 rounded-xl border border-[#2d281e] grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#a8a29e] mb-2">
                Resumen de Consumo ({order.items.length} productos en {order.currentRound || 1} rondas)
              </h3>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
                {order.items.map((it) => (
                  <div key={it.id} className="flex justify-between text-[#d6d3d1]">
                    <span>
                      {it.quantity}x {it.name} <span className="text-[10px] text-[#78716c]">(R{it.roundNumber})</span>
                    </span>
                    <span className="font-semibold">{formatCOP(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totales y Propina */}
            <div className="bg-[#121117] p-3 rounded-lg border border-[#383124] flex flex-col justify-between space-y-2 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[#a8a29e]">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-[#fef3c7]">{formatCOP(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#a8a29e]">
                  <span>Impoconsumo (8%):</span>
                  <span className="font-semibold text-[#fef3c7]">{formatCOP(order.tax)}</span>
                </div>

                {/* Control de Propina */}
                <div className="pt-2 border-t border-[#2d281e]">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[#d4af37] font-semibold">
                      <input
                        type="checkbox"
                        checked={includeTip}
                        onChange={(e) => setIncludeTip(e.target.checked)}
                        className="accent-[#d4af37]"
                      />
                      <span>Propina Voluntaria (10%):</span>
                    </label>
                    <span className="font-bold text-[#d4af37]">{formatCOP(tipAmount)}</span>
                  </div>
                  {includeTip && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCustomTip(Math.round(order.subtotal * 0.10))}
                        className="px-2 py-0.5 rounded bg-[#2b2416] text-[10px] text-[#d4af37] hover:bg-[#3d331f]"
                      >
                        10% Sugerido
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomTip(Math.round(order.subtotal * 0.15))}
                        className="px-2 py-0.5 rounded bg-[#2b2416] text-[10px] text-[#d4af37] hover:bg-[#3d331f]"
                      >
                        15% Extra
                      </button>
                      <input
                        type="number"
                        aria-label="Monto de propina personalizado"
                        value={customTip}
                        onChange={(e) => setCustomTip(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-24 bg-[#18171f] border border-[#383124] rounded px-2 py-0.5 text-right text-xs font-mono text-[#fef3c7]"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-[#383124] flex justify-between items-baseline">
                <span className="text-xs uppercase font-bold text-[#a8a29e]">Total a Pagar:</span>
                <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-[#fef3c7] via-[#d4af37] to-[#e6ca65]">
                  {formatCOP(grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* División de Cuentas (Split Bill) */}
          <div className="bg-[#18171f] p-3 rounded-xl border border-[#2d281e]">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsSplitting(!isSplitting)}
                className="flex items-center gap-2 text-xs font-bold text-[#d4af37] hover:underline cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>{isSplitting ? 'Cerrar división de cuenta' : '¿Dividir la cuenta entre varias personas?'}</span>
              </button>
              {isSplitting && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#a8a29e]">Dividir entre:</span>
                  <div className="flex items-center gap-1">
                    {[2, 3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSplitCount(num)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                          splitCount === num
                            ? 'bg-[#d4af37] text-[#0e0e12]'
                            : 'bg-[#121117] text-[#a8a29e] border border-[#383124]'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isSplitting && (
              <div className="mt-3 pt-3 border-t border-[#2d281e] grid grid-cols-2 sm:grid-cols-3 gap-2">
                {splitAmounts.map((amt, idx) => (
                  <div
                    key={idx}
                    className="bg-[#121117] p-2 rounded-lg border border-[#383124] text-center"
                  >
                    <span className="text-[10px] text-[#a8a29e] block">Persona {idx + 1}</span>
                    <span className="text-xs font-black text-[#d4af37]">{formatCOP(amt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Método de Pago */}
          <div>
            <label className="block text-xs font-semibold text-[#a8a29e] mb-2 uppercase">
              Forma de Pago
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {methodsList.map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#2b2416] border-[#d4af37] shadow-lg shadow-[#d4af37]/10'
                        : 'bg-[#18171f] border-[#2d281e] hover:border-[#383124]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-[#d4af37]' : 'text-[#78716c]'}`} />
                      {isSelected && <CheckCircle className="w-3.5 h-3.5 text-[#d4af37]" />}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-[#fef3c7]">{m.label}</span>
                      <span className="block text-[10px] text-[#a8a29e]">{m.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opciones Específicas por Método */}
          {paymentMethod === 'efectivo' && (
            <div className="bg-[#18171f] p-4 rounded-xl border border-[#2d281e] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#d4af37] mb-1">
                  Efectivo Recibido (COP):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-[#a8a29e]">$</span>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#121117] border border-[#383124] rounded-lg pl-7 pr-3 py-2 text-sm font-bold text-[#fef3c7] focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
                {/* Botones rápidos de billetes comunes en Colombia */}
                <div className="flex gap-1.5 mt-2">
                  {[20000, 50000, 100000].map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => setCashReceived(bill)}
                      className="px-2 py-1 bg-[#121117] border border-[#383124] rounded text-[10px] font-semibold text-[#a8a29e] hover:text-[#d4af37]"
                    >
                      ${(bill / 1000)}k
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCashReceived(grandTotal)}
                    className="px-2 py-1 bg-[#2b2416] border border-[#d4af37]/40 rounded text-[10px] font-bold text-[#d4af37]"
                  >
                    Exacto
                  </button>
                </div>
              </div>

              <div className="bg-[#121117] p-3 rounded-xl border border-[#383124] flex flex-col justify-center text-center">
                <span className="text-xs uppercase font-bold text-[#a8a29e]">Cambio / Vueltas a Entregar</span>
                <span className={`text-xl font-black mt-1 ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCOP(change)}
                </span>
                {change < 0 && (
                  <span className="text-[10px] text-red-400 mt-1">Faltan fondos por recibir</span>
                )}
              </div>
            </div>
          )}

          {paymentMethod === 'mixto' && (
            <div className="bg-[#18171f] p-4 rounded-xl border border-[#2d281e] space-y-3">
              <span className="text-xs font-bold text-[#d4af37] block">
                Distribución de Montos Mixtos:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#a8a29e] mb-1">Parte en Efectivo (COP):</label>
                  <input
                    type="number"
                    value={splits[0].amount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setSplits([
                        { method: 'efectivo', amount: val },
                        { method: 'tarjeta', amount: Math.max(0, grandTotal - val) },
                      ]);
                    }}
                    className="w-full bg-[#121117] border border-[#383124] rounded-lg px-3 py-1.5 text-xs text-[#fef3c7]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#a8a29e] mb-1">Parte en Tarjeta / Datáfono (COP):</label>
                  <input
                    type="number"
                    value={splits[1].amount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setSplits([
                        { method: 'efectivo', amount: Math.max(0, grandTotal - val) },
                        { method: 'tarjeta', amount: val },
                      ]);
                    }}
                    className="w-full bg-[#121117] border border-[#383124] rounded-lg px-3 py-1.5 text-xs text-[#fef3c7]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Datos de Facturación / Cliente */}
          <div className="bg-[#18171f] p-3 rounded-xl border border-[#2d281e] grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#a8a29e] mb-1">Nombre en Factura</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Consumidor Final o Nombre Cliente"
                className="w-full bg-[#121117] border border-[#383124] rounded-lg px-3 py-1.5 text-xs text-[#fef3c7] focus:outline-none focus:border-[#d4af37]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#a8a29e] mb-1">Cédula o NIT</label>
              <input
                type="text"
                value={customerNit}
                onChange={(e) => setCustomerNit(e.target.value)}
                placeholder="222222222222"
                className="w-full bg-[#121117] border border-[#383124] rounded-lg px-3 py-1.5 text-xs text-[#fef3c7] focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#2d281e] flex items-center justify-between bg-[#14131a]">
          <div className="text-xs text-[#a8a29e]">
            {order.tableId ? 'La mesa quedará libre tras confirmar el cobro' : 'El pedido quedará facturado'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#383124] text-xs font-semibold text-[#a8a29e] hover:bg-[#1a1922] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handlePay}
              disabled={actionLoading || (paymentMethod === 'efectivo' && cashReceived < grandTotal)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all ${
                actionLoading || (paymentMethod === 'efectivo' && cashReceived < grandTotal)
                  ? 'bg-[#2a2213] text-[#78716c] cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#d4af37] via-[#c49f2b] to-[#a68218] text-[#0e0e12] hover:brightness-110 shadow-lg shadow-[#d4af37]/25'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{actionLoading ? 'Procesando Cobro...' : `Cobrar ${formatCOP(grandTotal)}`}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
