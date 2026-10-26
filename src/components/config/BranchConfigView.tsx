import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { UserRole } from '../../types';
import {
  Building2,
  ShieldCheck,
  Percent,
  Clock,
  Coins,
  Check,
  Sliders,
  Sparkles,
} from 'lucide-react';

export const BranchConfigView: React.FC = () => {
  const { branches, currentBranch, setCurrentBranchId } = useRestaurant();

  // Matriz de permisos configurables por rol
  const rolePermissions: Array<{
    role: UserRole;
    title: string;
    description: string;
    permissions: string[];
  }> = [
    {
      role: 'administrador',
      title: 'Administrador General',
      description: 'Acceso irrestricto a todas las sucursales, finanzas y configuración.',
      permissions: [
        'Crear y modificar pedidos',
        'Agregar rondas a mesas',
        'Acceso al monitor KDS de cocina',
        'Facturación y cobro en caja',
        'Apertura y cierre de turnos (Arqueo)',
        'Movimientos de caja menor (egresos/ingresos)',
        'Ajustes de inventario y compras en Kardex',
        'Modificar recetas y cartas de precios',
        'Cambiar sucursales y permisos de personal',
      ],
    },
    {
      role: 'cajero',
      title: 'Cajero Principal',
      description: 'Responsable de cobros, facturación POS y cuadre de dinero en caja.',
      permissions: [
        'Facturación y cobro de pedidos comerciales',
        'Apertura de turno con base inicial',
        'Cierre de turno con arqueo ciego',
        'Registro de movimientos de caja menor',
        'Reimpresión de tirillas y comprobantes',
        'División de cuentas (split bill)',
      ],
    },
    {
      role: 'mesero',
      title: 'Mesero / Salonero',
      description: 'Atención a comensales en mesas y toma de comandas por rondas.',
      permissions: [
        'Visualizar plano interactivo de mesas',
        'Abrir nuevos pedidos en mesas libres',
        'Agregar rondas de bebidas y platos a mesas ocupadas',
        'Enviar comandas directas a las estaciones de cocina',
        'Solicitar pre-cuenta para comensales',
      ],
    },
    {
      role: 'cocina',
      title: 'Jefe de Cocina / Cocinero',
      description: 'Control de comandas de preparación en tiempo real (KDS).',
      permissions: [
        'Acceso al Monitor KDS filtrado por estación',
        'Marcar comandas en preparación',
        'Marcar comandas y platos listos para servir',
        'Visualización de notas especiales de alérgenos y términos de carne',
      ],
    },
    {
      role: 'domiciliario',
      title: 'Domiciliario / Repartidor',
      description: 'Entregas fuera del establecimiento gastronómico.',
      permissions: [
        'Ver pedidos con tipo Domicilio',
        'Consultar dirección de entrega y teléfono del cliente',
        'Marcar pedidos como entregados al cliente',
      ],
    },
    {
      role: 'supervisor',
      title: 'Supervisor de Servicio',
      description: 'Control de calidad en sala, tiempos de cocina y autorizaciones.',
      permissions: [
        'Visualizar todas las mesas y tiempos de espera',
        'Monitorear comandas con demoras en cocina',
        'Auditar movimientos de inventario en Kardex',
        'Verificar arqueos y diferencias de caja',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. Sucursales Colmena */}
      <div className="bg-[#14131a] p-5 rounded-2xl border border-[#2d281e] shadow-xl">
        <div className="flex items-center gap-2 pb-3 border-b border-[#2d281e] mb-4">
          <Building2 className="w-5 h-5 text-[#d4af37]" />
          <div>
            <h3 className="font-bold text-sm text-[#fef3c7]">Sucursales del Sistema Colmena</h3>
            <p className="text-xs text-[#a8a29e]">
              Cada registro comercial, mesa, inventario y turno de caja pertenece estrictamente a una sucursal.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branches.map((branch) => {
            const isSelected = currentBranch?.id === branch.id;
            return (
              <div
                key={branch.id}
                onClick={() => setCurrentBranchId(branch.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1e1b15] border-[#d4af37] ring-1 ring-[#d4af37]/30 shadow-lg'
                    : 'bg-[#18171f] border-[#2d281e] hover:border-[#383124]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-bold text-sm text-[#fef3c7]">{branch.name}</h4>
                    <span className="text-xs text-[#a8a29e]">{branch.address}</span>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-[#d4af37] text-[#0e0e12]">
                      Activa
                    </span>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-[#2d281e] flex items-center justify-between text-xs text-[#d6d3d1]">
                  <span>Teléfono: {branch.phone}</span>
                  <span className="text-[#d4af37] font-bold">Impoconsumo: {(branch.taxRate * 100).toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Parámetros Legales y Financieros Colombia */}
      <div className="bg-[#14131a] p-5 rounded-2xl border border-[#2d281e] shadow-xl">
        <h3 className="font-bold text-sm text-[#fef3c7] mb-3 flex items-center gap-2">
          <Coins className="w-4 h-4 text-[#d4af37]" />
          <span>Configuración Regional y Fiscal (Colombia)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#18171f] p-3.5 rounded-xl border border-[#2d281e]">
            <span className="text-[10px] uppercase font-bold text-[#a8a29e] block">Moneda de Operación</span>
            <span className="text-sm font-black text-[#fef3c7] mt-1 block">Pesos Colombianos (COP)</span>
            <span className="text-[11px] text-[#78716c]">Separador de miles punto ($ 25.000 COP)</span>
          </div>

          <div className="bg-[#18171f] p-3.5 rounded-xl border border-[#2d281e]">
            <span className="text-[10px] uppercase font-bold text-[#a8a29e] block">Zona Horaria Oficial</span>
            <span className="text-sm font-black text-[#d4af37] mt-1 block">America/Bogota (UTC-5)</span>
            <span className="text-[11px] text-[#78716c]">Registros y auditoría en hora colombiana</span>
          </div>

          <div className="bg-[#18171f] p-3.5 rounded-xl border border-[#2d281e]">
            <span className="text-[10px] uppercase font-bold text-[#a8a29e] block">Impuestos Gastronómicos</span>
            <span className="text-sm font-black text-emerald-400 mt-1 block">Impoconsumo 8%</span>
            <span className="text-[11px] text-[#78716c]">Ley 1935 / Estatuto Tributario Art. 512-1</span>
          </div>
        </div>
      </div>

      {/* 3. Matriz de Roles y Permisos de Personal */}
      <div className="bg-[#14131a] p-5 rounded-2xl border border-[#2d281e] shadow-xl">
        <div className="flex items-center gap-2 pb-3 border-b border-[#2d281e] mb-4">
          <ShieldCheck className="w-5 h-5 text-[#d4af37]" />
          <div>
            <h3 className="font-bold text-sm text-[#fef3c7]">Matriz de Roles y Permisos del Personal</h3>
            <p className="text-xs text-[#a8a29e]">
              Administrador, Cajero, Mesero, Cocina, Domiciliario y Supervisor.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rolePermissions.map((item) => (
            <div
              key={item.role}
              className="bg-[#18171f] p-4 rounded-xl border border-[#2d281e] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-7 h-7 rounded-lg bg-[#2b2416] text-[#d4af37] font-black text-xs flex items-center justify-center border border-[#d4af37]/40 uppercase">
                    {item.role[0]}
                  </span>
                  <h4 className="font-bold text-sm text-[#fef3c7]">{item.title}</h4>
                </div>
                <p className="text-xs text-[#a8a29e] mb-3 leading-relaxed">
                  {item.description}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-[#26231d]">
                  <span className="text-[10px] uppercase font-bold text-[#d4af37] block">
                    Permisos Otorgados:
                  </span>
                  {item.permissions.map((p, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xs text-[#d6d3d1]">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
