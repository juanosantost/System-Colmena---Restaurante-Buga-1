import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { useToast } from '../../context/ToastContext';
import {
  LayoutGrid,
  ClipboardList,
  Flame,
  Receipt,
  Boxes,
  Users,
  Building2,
  Building,
  Home,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Clock,
  Sparkles,
  Sliders,
  DollarSign,
  ChevronDown,
  Settings,
  UtensilsCrossed,
  Bike,
  Truck,
  BarChart3,
  MapPin,
  BookmarkCheck,
  CreditCard,
  TrendingUp,
} from 'lucide-react';

export type AppView =
  | 'home'
  | 'mesas'
  | 'catalogo'
  | 'pedidos'
  | 'domicilios'
  | 'cocina'
  | 'caja'
  | 'ingresos'
  | 'otros-ingresos'
  | 'inventario'
  | 'compras'
  | 'proveedores'
  | 'cuentas-por-pagar'
  | 'anticipos-proveedores'
  | 'desembolsos'
  | 'registrar-gasto'
  | 'registrar-compra'
  | 'clientes'
  | 'separados'
  | 'cartera'
  | 'reportes'
  | 'usuarios'
  | 'sucursales'
  | 'config'
  | 'config-mesas'
  | 'medios-pago';

interface AppLayoutProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentView,
  onNavigate,
  children,
}) => {
  const {
    currentUser,
    branches,
    currentBranch,
    authorizedBranches,
    setCurrentBranchId,
    logout,
    canAccess,
  } = useAuth();
  const { tables, activeOrders, activeComandas, inventory, activeShift } = useRestaurant();
  const { showToast } = useToast();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [colombiaTime, setColombiaTime] = useState<string>('');
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  // Reloj oficial de Colombia (America/Bogota, UTC-5)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setColombiaTime(
        new Intl.DateTimeFormat('es-CO', {
          timeZone: 'America/Bogota',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).format(now)
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Conteos en tiempo real para badges
  const occupiedTables = tables.filter(
    (t) => t.status === 'ocupada' || t.status === 'cuenta_solicitada'
  ).length;
  const pendingComandas = activeComandas.filter(
    (c) => c.status === 'nueva' || c.status === 'en_preparacion'
  ).length;
  const lowStockItems = inventory.filter((i) => i.currentStock <= i.minStock).length;

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Sesión cerrada correctamente', 'info');
    } catch (err: any) {
      console.error(err);
      showToast('Error al cerrar sesión', 'error');
    }
  };

  const handleBranchSelect = (branchId: string) => {
    try {
      setCurrentBranchId(branchId);
      const b = branches.find((x) => x.id === branchId);
      showToast(`Cambiado a sucursal: ${b?.name || branchId}`, 'info');
    } catch (err: any) {
      showToast(err.message || 'No autorizado para esta sucursal', 'error');
    }
  };

  // Definición de ítems del menú con control de permisos
  interface MenuOption {
    id: AppView;
    label: string;
    icon: any;
    badge?: string | number;
    badgeColor?: string;
    requiresAdmin?: boolean;
    moduleKey: string;
  }

  interface MenuSection {
    sectionTitle: string;
    items: MenuOption[];
  }

  const rawSections: MenuSection[] = [
    {
      sectionTitle: 'OPERACIÓN',
      items: [
        { id: 'home', label: 'Inicio', icon: Home, moduleKey: 'home' },
        { id: 'pedidos', label: 'Pedidos Comercial', icon: ClipboardList, badge: activeOrders.length > 0 ? activeOrders.length : undefined, badgeColor: 'bg-[#292212] text-[#D6A21A] border border-[#B77900]/40', moduleKey: 'pedidos' },
        { id: 'mesas', label: 'Mesas & Salón', icon: LayoutGrid, badge: occupiedTables > 0 ? `${occupiedTables}/${tables.length}` : undefined, badgeColor: 'bg-[#B77900] text-[#181818]', moduleKey: 'mesas' },
        { id: 'cocina', label: 'Cocina (KDS)', icon: Flame, badge: pendingComandas > 0 ? pendingComandas : undefined, badgeColor: 'bg-amber-600 text-white animate-pulse', moduleKey: 'cocina' },
        { id: 'domicilios', label: 'Domicilios & Llevar', icon: Bike, badge: 'Módulo 08', badgeColor: 'bg-[#B77900] text-[#181818]', moduleKey: 'domicilios' },
        { id: 'caja', label: 'Caja & Movimientos', icon: Receipt, moduleKey: 'caja' },
        { id: 'ingresos', label: 'Ingresos', icon: TrendingUp, moduleKey: 'caja' },
      ],
    },
    {
      sectionTitle: 'PRODUCTOS E INVENTARIO',
      items: [
        { id: 'catalogo', label: 'Menú & Productos', icon: UtensilsCrossed, badge: 'Módulo 03', badgeColor: 'bg-[#B77900] text-[#181818]', moduleKey: 'catalogo' },
        { id: 'inventario', label: 'Ingredientes e Inventario', icon: Boxes, badge: lowStockItems > 0 ? `! ${lowStockItems}` : undefined, badgeColor: 'bg-red-900/80 text-red-200 border border-red-700/50', moduleKey: 'inventario' },
      ],
    },
    {
      sectionTitle: 'COMPRAS Y PROVEEDORES',
      items: [
        { id: 'desembolsos', label: 'Desembolsos', icon: DollarSign, moduleKey: 'compras' },
        { id: 'proveedores', label: 'Proveedores', icon: Building, moduleKey: 'compras' },
        { id: 'cuentas-por-pagar', label: 'Cuentas por Pagar', icon: CreditCard, moduleKey: 'compras' },
        { id: 'anticipos-proveedores', label: 'Anticipos a Proveedores', icon: DollarSign, moduleKey: 'compras' },
      ],
    },
    {
      sectionTitle: 'GESTIÓN COMERCIAL',
      items: [
        { id: 'clientes', label: 'Clientes & CRM', icon: Users, badge: 'Módulo 12', badgeColor: 'bg-[#B77900] text-[#181818]', moduleKey: 'clientes' },
        { id: 'separados', label: 'Separados & Reservas', icon: BookmarkCheck, badge: 'Layaway', badgeColor: 'bg-[#B77900] text-[#181818]', moduleKey: 'separados' },
        { id: 'cartera', label: 'Cartera & Cobros', icon: CreditCard, badge: 'Créditos', badgeColor: 'bg-[#B77900] text-[#181818]', moduleKey: 'cartera' },
      ],
    },
    {
      sectionTitle: 'ADMINISTRACIÓN',
      items: [
        { id: 'reportes', label: 'Informes & Estadísticas', icon: BarChart3, badge: 'Módulo 13', badgeColor: 'bg-[#B77900] text-[#181818]', moduleKey: 'reportes' },
        { id: 'medios-pago', label: 'Medios de Pago', icon: CreditCard, requiresAdmin: false, moduleKey: 'caja' },
        { id: 'usuarios', label: 'Usuarios & Personal', icon: Users, requiresAdmin: true, moduleKey: 'usuarios' },
        { id: 'sucursales', label: 'Sucursales & Facturación', icon: Building2, requiresAdmin: true, moduleKey: 'sucursales' },
        { id: 'config-mesas', label: 'Config. Salones & Mesas', icon: Settings, badge: 'Módulo 02', badgeColor: 'bg-[#B77900] text-[#181818]', requiresAdmin: false, moduleKey: 'config-mesas' },
        { id: 'config', label: 'Matriz de Permisos', icon: Sliders, moduleKey: 'config' },
      ],
    },
  ];

  const visibleSections = rawSections
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((item) => {
        if (
          item.id === 'home' ||
          item.id === 'config' ||
          item.id === 'config-mesas' ||
          item.id === 'medios-pago' ||
          item.id === 'catalogo' ||
          item.id === 'domicilios' ||
          item.id === 'clientes' ||
          item.id === 'separados' ||
          item.id === 'cartera' ||
          item.id === 'ingresos' ||
          item.id === 'otros-ingresos' ||
          item.id === 'desembolsos' ||
          item.id === 'proveedores' ||
          item.id === 'cuentas-por-pagar' ||
          item.id === 'anticipos-proveedores'
        )
          return true;
        if (currentUser?.role === 'administrador' || currentUser?.role === 'supervisor') return true;
        if (item.requiresAdmin) return false;
        return canAccess(item.moduleKey);
      }),
    }))
    .filter((sec) => sec.items.length > 0);

  const getRoleBadgeColor = (role: string = '') => {
    switch (role) {
      case 'administrador':
        return 'bg-[#292212] text-[#D6A21A] border-[#B77900]';
      case 'supervisor':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'cajero':
        return 'bg-cyan-950 text-cyan-300 border-cyan-800';
      case 'mesero':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'cocina':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'domiciliario':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      default:
        return 'bg-[#242424] text-[#a8a29e] border-[#383838]';
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e10] text-[#FFFDF5] flex flex-col antialiased selection:bg-[#B77900] selection:text-[#FFFDF5]">
      
      {/* 1. Encabezado Superior Fijo */}
      <header className="bg-[#181818] border-b border-[#333333] text-[#FFFDF5] sticky top-0 z-40 shadow-lg">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
            
            {/* Lado Izquierdo: Botón Menú Móvil + Logo Colmena */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-[#242424] text-[#D6A21A] hover:bg-[#2d2d2d] border border-[#383838]"
                aria-label="Abrir menú"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div
                onClick={() => onNavigate('home')}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-[#B77900] via-[#D6A21A] to-[#181818] text-[#FFFDF5] shadow-lg shadow-[#B77900]/25 border border-[#D6A21A]/40 group-hover:scale-105 transition-transform">
                  <span className="font-black text-2xl tracking-tighter">⬡</span>
                  <Sparkles className="w-3.5 h-3.5 absolute top-1 right-1 text-[#FFFDF5] animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg sm:text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#FFFDF5] via-[#D6A21A] to-[#B77900]">
                      COLMENA
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#292212] text-[#D6A21A] border border-[#B77900]/40 hidden sm:inline-block">
                      Restaurante POS
                    </span>
                  </div>
                  <p className="text-[11px] text-[#a8a29e] hidden md:block">
                    Multisucursal · Tiempo Real · Colombia (COP)
                  </p>
                </div>
              </div>
            </div>

            {/* Centro: Sede Única — Guadalajara de Buga */}
            <div className="hidden md:flex items-center bg-[#242424] border border-[#383838] rounded-2xl px-3.5 py-1.5 gap-2.5 shadow-sm">
              <MapPin className="w-4 h-4 text-[#D6A21A] shrink-0" />
              <div className="text-left">
                <span className="block text-[9px] text-[#a8a29e] uppercase font-bold tracking-wider">
                  Sede Oficial
                </span>
                <span className="text-xs font-black text-[#FFFDF5]">
                  Guadalajara de Buga (Valle del Cauca)
                </span>
              </div>
            </div>

            {/* Lado Derecho: Botón Cerrar Sesión */}
            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>

          </div>

          {/* Barra móvil para sede y hora oficial */}
          <div className="md:hidden py-2 border-t border-[#2e2e2e] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-[#a8a29e]">
              <MapPin className="w-3.5 h-3.5 text-[#D6A21A]" />
              <span className="text-xs font-bold text-[#FFFDF5]">Guadalajara de Buga</span>
            </div>
            <div className="text-[11px] text-[#D6A21A] font-mono font-semibold">
              {colombiaTime} (Buga)
            </div>
          </div>

        </div>
      </header>

      {/* 2. Cuerpo Principal: Sidebar Plegable en Desktop + Contenido Central */}
      <div className="flex-1 flex w-full relative">
        
        {/* Barra Lateral Plegable para Desktop */}
        <aside
          className={`hidden lg:flex flex-col bg-[#181818] border-r border-[#333333] transition-all duration-300 z-30 sticky top-20 h-[calc(100vh-5rem)] ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Navegación Vertical con Grupos Solicitados */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
            {visibleSections.map((sec) => (
              <div key={sec.sectionTitle} className="space-y-1">
                {!isSidebarCollapsed ? (
                  <div className="px-2 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-[#D6A21A]/80 border-b border-[#292212]">
                    {sec.sectionTitle}
                  </div>
                ) : (
                  <div className="my-1 border-t border-[#292212]" />
                )}
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-gradient-to-r from-[#B77900] to-[#D6A21A] text-[#181818] shadow-md shadow-[#B77900]/20'
                          : 'text-[#d6d3d1] hover:text-[#FFFDF5] hover:bg-[#242424]'
                      }`}
                      title={item.label}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-[#181818]' : 'text-[#D6A21A]'
                        }`}
                      />
                      {!isSidebarCollapsed && (
                        <span className="flex-1 text-left truncate">{item.label}</span>
                      )}
                      {!isSidebarCollapsed && item.badge && (
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                            item.badgeColor || 'bg-[#292212] text-[#D6A21A]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Botón Plegar / Desplegar Sidebar */}
          <div className="p-3 border-t border-[#2e2e2e] flex items-center justify-between text-xs text-[#a8a29e]">
            {!isSidebarCollapsed && (
              <span className="text-[10px] uppercase font-bold text-[#78716c]">
                Colapsar Menú
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-xl bg-[#242424] hover:bg-[#2f2f2f] text-[#D6A21A] border border-[#383838] transition-colors ml-auto"
              title={isSidebarCollapsed ? 'Expandir barra' : 'Plegar barra'}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </aside>

        {/* Drawer de Navegación Adaptable para Dispositivos Móviles */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Panel Lateral Desplegable */}
            <div className="relative w-72 max-w-[80vw] bg-[#181818] border-r border-[#B77900] text-[#FFFDF5] flex flex-col p-4 shadow-2xl z-10">
              <div className="flex items-center justify-between pb-3 border-b border-[#2e2e2e] mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[#D6A21A] font-black text-xl">⬡</span>
                  <span className="font-black text-base text-[#FFFDF5]">COLMENA POS</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-[#a8a29e] hover:text-[#FFFDF5]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                {visibleSections.map((sec) => (
                  <div key={sec.sectionTitle} className="space-y-1">
                    <div className="px-2 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-[#D6A21A]/80 border-b border-[#292212]">
                      {sec.sectionTitle}
                    </div>
                    {sec.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentView === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            onNavigate(item.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                            isActive
                              ? 'bg-gradient-to-r from-[#B77900] to-[#D6A21A] text-[#181818]'
                              : 'text-[#d6d3d1] hover:bg-[#242424]'
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-[#181818]' : 'text-[#D6A21A]'
                            }`}
                          />
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                item.badgeColor || 'bg-[#292212] text-[#D6A21A]'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#2e2e2e] mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-red-950/40 text-red-400 border border-red-800 text-xs font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Área Principal de Contenido (Fondo Crema Colmena #FFFDF5) */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
          
          {/* Barra Superior de Estado, Reloj y Perfil de Usuario (Ubicada fuera del Header) */}
          <div className="bg-[#181818] border border-[#333333] text-[#FFFDF5] rounded-2xl p-3 sm:px-4 sm:py-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
            
            {/* Usuario Autenticado y Rol */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#B77900] to-[#D6A21A] text-[#181818] flex items-center justify-center font-black text-sm shrink-0 shadow">
                {currentUser?.fullName?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-[#FFFDF5]">
                    {currentUser?.fullName || 'Usuario'}
                  </span>
                  <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border ${getRoleBadgeColor(currentUser?.role)}`}>
                    {currentUser?.role || 'Staff'}
                  </span>
                </div>
                <p className="text-[11px] text-[#a8a29e] flex items-center gap-2 font-mono">
                  <span>C.C. {currentUser?.documentNumber || '—'}</span>
                  <span>·</span>
                  <span>{currentUser?.email}</span>
                </p>
              </div>
            </div>

            {/* Reloj Oficial Bogotá y Estado de Caja */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              {/* Indicador de Turno de Caja */}
              <div className="flex items-center gap-2 bg-[#242424] border border-[#383838] px-3 py-1.5 rounded-xl">
                <DollarSign className="w-3.5 h-3.5 text-[#D6A21A]" />
                <div className="text-left">
                  <span className="block text-[8px] text-[#a8a29e] uppercase font-bold tracking-wider">
                    Estado Caja
                  </span>
                  <span className="text-xs font-bold text-[#D6A21A]">
                    {activeShift ? 'Turno Abierto' : 'Caja Cerrada'}
                  </span>
                </div>
              </div>

              {/* Reloj Oficial Colombia */}
              <div className="flex items-center gap-2 bg-[#242424] border border-[#383838] px-3 py-1.5 rounded-xl">
                <Clock className="w-3.5 h-3.5 text-[#D6A21A]" />
                <div className="text-right">
                  <span className="block text-[8px] text-[#a8a29e] uppercase font-bold tracking-wider">
                    Bogotá (UTC-5)
                  </span>
                  <span className="text-xs font-mono font-bold text-[#FFFDF5]">
                    {colombiaTime || '12:00:00 PM'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {children}
        </main>

      </div>

      {/* 3. Footer Oficial Colmena */}
      <footer className="bg-[#181818] border-t border-[#333333] py-4 text-xs text-[#a8a29e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[#D6A21A] font-bold">⬡ Sistema Colmena Restaurante</span>
            <span className="text-[#44403c]">·</span>
            <span className="text-[#FFFDF5] font-semibold">{currentBranch?.name}</span>
            <span className="text-[#44403c]">·</span>
            <span>NIT: {currentBranch?.nit || '901.458.920-4'}</span>
          </div>
          <div className="text-[11px] text-[#78716c]">
            Pesos Colombianos (COP) · Zona Horaria: America/Bogota (UTC-5) · Impoconsumo 8%
          </div>
        </div>
      </footer>

    </div>
  );
};
