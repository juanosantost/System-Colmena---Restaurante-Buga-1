import { ColmenaUser, UserRole } from '../types';

/**
 * Determina si un usuario tiene acceso a una sucursal específica.
 * El rol 'administrador' tiene acceso a todas las sucursales.
 * Otros roles solo a sus sucursales autorizadas.
 */
export function canUserAccessBranch(user: ColmenaUser | null | undefined, branchId: string): boolean {
  if (!user || !user.isActive) return false;
  if (user.role === 'administrador') return true;
  return Array.isArray(user.authorizedBranchIds) && user.authorizedBranchIds.includes(branchId);
}

/**
 * Matriz de acceso a módulos según rol operativo.
 */
export const MODULE_PERMISSIONS: Record<string, UserRole[]> = {
  home: ['administrador', 'supervisor', 'cajero', 'mesero', 'cocina', 'domiciliario'],
  mesas: ['administrador', 'supervisor', 'cajero', 'mesero'],
  pedidos: ['administrador', 'supervisor', 'cajero', 'mesero', 'domiciliario'],
  cocina: ['administrador', 'supervisor', 'cocina'],
  caja: ['administrador', 'supervisor', 'cajero'],
  inventario: ['administrador', 'supervisor', 'cocina'],
  usuarios: ['administrador'],
  sucursales: ['administrador'],
  compras: ['administrador', 'supervisor'],
  domicilios: ['administrador', 'supervisor', 'domiciliario', 'cajero'],
  clientes: ['administrador', 'supervisor', 'cajero'],
  reportes: ['administrador', 'supervisor'],
};

export function canUserAccessModule(role: UserRole | undefined, moduleName: string): boolean {
  if (!role) return false;
  if (role === 'administrador') return true;
  const allowed = MODULE_PERMISSIONS[moduleName];
  if (!allowed) return false;
  return allowed.includes(role);
}

/**
 * Valida un número de documento de identidad en Colombia (C.C., C.E., NIT).
 */
export function validateDocumentNumber(doc: string): boolean {
  if (!doc) return false;
  const clean = doc.trim().replace(/\D/g, '');
  return clean.length >= 5 && clean.length <= 15;
}

/**
 * Valida formato estándar de correo electrónico.
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

/**
 * Determina si el usuario que está ingresando califica como candidato para registrarse
 * como el Primer Administrador de la Colmena (si no hay usuarios registrados aún o si coincide con el correo principal).
 */
export function isFirstAdminCandidate(
  userEmail: string | null | undefined,
  totalUsersCount: number,
  ownerEmail = 'juan.santos.ieci@gmail.com'
): boolean {
  if (totalUsersCount === 0) return true;
  if (userEmail && userEmail.toLowerCase() === ownerEmail.toLowerCase()) return true;
  return false;
}
