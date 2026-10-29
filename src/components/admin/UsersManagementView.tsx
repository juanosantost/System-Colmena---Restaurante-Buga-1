import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { useToast } from '../../context/ToastContext';
import { ColmenaUser, UserRole } from '../../types';
import { validateDocumentNumber, validateEmail, normalizeUserRole } from '../../utils/auth';
import { formatColombiaDateTime } from '../../utils/calculations';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Building2,
  CheckCircle2,
  XCircle,
  Edit2,
  Lock,
  Unlock,
  X,
  FileText,
  Mail,
  Phone,
  Calendar,
  Trash2,
} from 'lucide-react';

export const UsersManagementView: React.FC = () => {
  const {
    allUsers,
    branches,
    currentUser,
    createNewUser,
    updateUserData,
    toggleUserActiveStatus,
  } = useAuth();
  const { clearAllTransactionalRecords } = useRestaurant();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('todos');
  const [branchFilter, setBranchFilter] = useState<string>('todos');
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
  const [clearConfirmText, setClearConfirmText] = useState<string>('');
  const [isClearing, setIsClearing] = useState<boolean>(false);

  const handleClearRecords = async () => {
    if (clearConfirmText !== 'LIMPIAR') {
      showToast('Escribe "LIMPIAR" para confirmar la limpieza de registros', 'warning');
      return;
    }
    setIsClearing(true);
    try {
      await clearAllTransactionalRecords();
      showToast('Registros de prueba eliminados. Sistema limpio y listo para datos reales.', 'success');
      setIsClearModalOpen(false);
      setClearConfirmText('');
    } catch (err: any) {
      showToast(err.message || 'Error al limpiar los registros', 'error');
    } finally {
      setIsClearing(false);
    }
  };

  // Modal de Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<ColmenaUser | null>(null);

  // Form states
  const [fullName, setFullName] = useState<string>('');
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<UserRole>('asesor');
  const [authorizedBranchIds, setAuthorizedBranchIds] = useState<string[]>([]);
  const [phone, setPhone] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const rolesList: { id: UserRole; label: string; desc: string }[] = [
    { id: 'administrador', label: 'Administrador (Acceso total)', desc: 'Acceso total a todos los módulos y opciones' },
    { id: 'asesor', label: 'Asesor (Apartado operación)', desc: 'Acceso exclusivo al apartado operación' },
    { id: 'cocinero', label: 'Cocinero (Únicamente cocina)', desc: 'Acceso únicamente a la parte de cocina' },
  ];

  const filteredUsers = allUsers.filter((u) => {
    if (roleFilter !== 'todos' && normalizeUserRole(u.role) !== roleFilter) return false;
    if (branchFilter !== 'todos' && !u.authorizedBranchIds?.includes(branchFilter)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (u.fullName || '').toLowerCase().includes(q);
      const matchDoc = (u.documentNumber || '').includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      if (!matchName && !matchDoc && !matchEmail) return false;
    }
    return true;
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setFullName('');
    setDocumentNumber('');
    setEmail('');
    setRole('asesor');
    setAuthorizedBranchIds(branches.map((b) => b.id)); // Por defecto todas
    setPhone('');
    setIsModalOpen(true);
  };

  const openEditModal = (u: ColmenaUser) => {
    setEditingUser(u);
    setFullName(u.fullName);
    setDocumentNumber(u.documentNumber);
    setEmail(u.email);
    setRole(normalizeUserRole(u.role));
    setAuthorizedBranchIds(u.authorizedBranchIds || []);
    setPhone(u.phone || '');
    setIsModalOpen(true);
  };

  const handleBranchCheckbox = (branchId: string) => {
    setAuthorizedBranchIds((prev) =>
      prev.includes(branchId) ? prev.filter((id) => id !== branchId) : [...prev, branchId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      showToast('El nombre completo es requerido', 'warning');
      return;
    }
    if (!validateDocumentNumber(documentNumber)) {
      showToast('El número de documento debe contener entre 5 y 15 dígitos numéricos', 'warning');
      return;
    }
    if (!validateEmail(email)) {
      showToast('Ingresa un correo electrónico válido', 'warning');
      return;
    }
    if (authorizedBranchIds.length === 0) {
      showToast('Debes autorizar al menos una sucursal para el usuario', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        await updateUserData(editingUser.id, {
          fullName: fullName.trim(),
          documentNumber: documentNumber.trim(),
          role,
          authorizedBranchIds,
          phone: phone.trim(),
        });
        showToast('Usuario actualizado correctamente', 'success');
      } else {
        await createNewUser({
          fullName: fullName.trim(),
          documentNumber: documentNumber.trim(),
          email: email.trim(),
          role,
          authorizedBranchIds,
          phone: phone.trim(),
        });
        showToast('Usuario creado con éxito en Sistema Colmena', 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error al guardar el usuario', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: ColmenaUser) => {
    // Si intenta desactivar al único admin activo, bloquear
    if (user.role === 'administrador' && user.isActive) {
      const activeAdmins = allUsers.filter((u) => u.role === 'administrador' && u.isActive);
      if (activeAdmins.length <= 1) {
        showToast('No puedes desactivar al único Administrador activo del sistema', 'error');
        return;
      }
    }

    try {
      await toggleUserActiveStatus(user.id, user.isActive);
      showToast(
        `Usuario ${user.fullName} ${user.isActive ? 'desactivado' : 'activado'} correctamente`,
        'info'
      );
    } catch (err: any) {
      console.error(err);
      showToast('Error al modificar estado del usuario', 'error');
    }
  };

  const getRoleLabel = (r: UserRole) => {
    const norm = normalizeUserRole(r);
    switch (norm) {
      case 'administrador':
        return 'Administrador';
      case 'asesor':
        return 'Asesor';
      case 'cocinero':
        return 'Cocinero';
    }
  };

  const getRoleBadge = (r: UserRole) => {
    const norm = normalizeUserRole(r);
    switch (norm) {
      case 'administrador':
        return 'bg-[#292212] text-[#D6A21A] border border-[#B77900]';
      case 'asesor':
        return 'bg-blue-950/80 text-blue-300 border border-blue-800';
      case 'cocinero':
        return 'bg-emerald-950/80 text-emerald-300 border border-emerald-800';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cabecera del Módulo */}
      <div className="bg-[#181818] p-5 sm:p-6 rounded-3xl border border-[#333333] text-[#FFFDF5] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#B77900] to-[#D6A21A] flex items-center justify-center text-[#181818] font-black shadow-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-[#FFFDF5]">
                Administración de Usuarios y Personal
              </h2>
            </div>
            <p className="text-xs text-[#a8a29e] mt-0.5">
              Control de roles, números de documento y asignación de sucursales autorizadas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsClearModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-red-950/80 border border-red-800 text-red-200 font-bold text-xs flex items-center gap-2 hover:bg-red-900 cursor-pointer shadow-lg"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span>Limpiar Registros (Datos Reales)</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#B77900] to-[#D6A21A] text-[#181818] font-black text-xs flex items-center gap-2 hover:brightness-110 shadow-lg shadow-[#B77900]/20 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-[#181818] p-4 rounded-2xl border border-[#333333] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-[#a8a29e] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nombre, documento o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#242424] border border-[#383838] rounded-xl pl-9 pr-3 py-2 text-xs text-[#FFFDF5] focus:outline-none focus:border-[#D6A21A]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            aria-label="Filtrar por Rol"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#242424] border border-[#383838] rounded-xl px-3 py-2 text-xs text-[#FFFDF5] font-semibold focus:outline-none focus:border-[#D6A21A]"
          >
            <option value="todos">Todos los Roles</option>
            {rolesList.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por Sucursal"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="bg-[#242424] border border-[#383838] rounded-xl px-3 py-2 text-xs text-[#FFFDF5] font-semibold focus:outline-none focus:border-[#D6A21A]"
          >
            <option value="todos">Todas las Sucursales</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-[#181818] rounded-2xl border border-[#333333] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#d6d3d1]">
            <thead className="bg-[#222222] text-[10px] uppercase font-bold text-[#a8a29e] border-b border-[#333333]">
              <tr>
                <th className="p-3.5">Personal / Nombre</th>
                <th className="p-3.5">Documento (C.C.)</th>
                <th className="p-3.5">Correo Autenticación</th>
                <th className="p-3.5">Rol</th>
                <th className="p-3.5">Sucursales Autorizadas</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5">Último Acceso</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#78716c]">
                    No se encontraron usuarios registrados con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleBadge = getRoleBadge(user.role);
                  return (
                    <tr key={user.id} className="hover:bg-[#222222] transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-[#FFFDF5]">{user.fullName}</div>
                        {user.phone && (
                          <div className="text-[10px] text-[#a8a29e] flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-[#D6A21A]" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-[#D6A21A] font-semibold">
                        {user.documentNumber || '—'}
                      </td>
                      <td className="p-3.5 text-[#FFFDF5] font-mono">
                        {user.email}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleBadge}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {normalizeUserRole(user.role) === 'administrador' ? (
                            <span className="px-1.5 py-0.5 rounded bg-[#292212] text-[#D6A21A] text-[10px] font-bold border border-[#B77900]/40">
                              Todas las Sucursales
                            </span>
                          ) : user.authorizedBranchIds?.length > 0 ? (
                            user.authorizedBranchIds.map((bid) => {
                              const b = branches.find((br) => br.id === bid);
                              return (
                                <span
                                  key={bid}
                                  className="px-1.5 py-0.5 rounded bg-[#262626] text-[#FFFDF5] text-[10px] font-medium border border-[#383838]"
                                >
                                  {b ? b.name.split('—')[0].trim() : bid}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[10px] text-red-400">Sin sucursal asignada</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            user.isActive
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-red-950 text-red-400 border border-red-800'
                          }`}
                        >
                          {user.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Activo</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Inactivo</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-3.5 text-[#a8a29e] text-[11px] whitespace-nowrap">
                        {user.lastLoginAt ? formatColombiaDateTime(user.lastLoginAt) : 'Sin ingresos'}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="p-1.5 rounded-lg bg-[#2a2a2a] text-[#D6A21A] hover:bg-[#333333] border border-[#383838]"
                            title="Editar usuario"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user)}
                            className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                              user.isActive
                                ? 'bg-red-950/40 text-red-400 border-red-800 hover:bg-red-950'
                                : 'bg-emerald-950/40 text-emerald-400 border-emerald-800 hover:bg-emerald-950'
                            }`}
                            title={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                          >
                            {user.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Crear / Editar Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#181818] border border-[#B77900] rounded-3xl w-full max-w-lg p-6 text-[#FFFDF5] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#333333] mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#D6A21A]" />
                <h3 className="font-black text-base text-[#FFFDF5]">
                  {editingUser ? 'Editar Usuario Colmena' : 'Registrar Nuevo Usuario'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#a8a29e] hover:text-[#FFFDF5] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#a8a29e] mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Laura Sofía Morales"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#242424] border border-[#383838] rounded-xl px-3 py-2 text-xs text-[#FFFDF5] focus:outline-none focus:border-[#D6A21A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#a8a29e] mb-1">
                    Número de Documento (C.C.) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="1020304050"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    className="w-full bg-[#242424] border border-[#383838] rounded-xl px-3 py-2 text-xs text-[#FFFDF5] focus:outline-none focus:border-[#D6A21A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#a8a29e] mb-1">
                    Teléfono / Celular
                  </label>
                  <input
                    type="text"
                    placeholder="300 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#242424] border border-[#383838] rounded-xl px-3 py-2 text-xs text-[#FFFDF5] focus:outline-none focus:border-[#D6A21A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a8a29e] mb-1">
                  Correo Electrónico (para autenticación) *
                </label>
                <input
                  type="email"
                  required
                  disabled={!!editingUser}
                  placeholder="usuario@colmena.co"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-[#242424] border border-[#383838] rounded-xl px-3 py-2 text-xs text-[#FFFDF5] focus:outline-none focus:border-[#D6A21A] ${
                    editingUser ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                />
                {editingUser && (
                  <span className="text-[10px] text-[#78716c] block mt-1">
                    El correo está vinculado a la cuenta de autenticación de Firebase.
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a8a29e] mb-1">
                  Rol del Personal *
                </label>
                <select
                  aria-label="Seleccionar Rol del Personal"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-[#242424] border border-[#383838] rounded-xl px-3 py-2 text-xs text-[#FFFDF5] font-semibold focus:outline-none focus:border-[#D6A21A]"
                >
                  {rolesList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#D6A21A] mt-1.5 font-medium">
                  {rolesList.find((r) => r.id === role)?.desc}
                </p>
              </div>

              {/* Selección de Sucursales Autorizadas */}
              <div>
                <label className="block text-xs font-semibold text-[#D6A21A] mb-1.5">
                  Sucursales Autorizadas (Acceso permitido) *
                </label>
                <div className="bg-[#242424] p-3 rounded-xl border border-[#383838] space-y-2 max-h-36 overflow-y-auto">
                  {branches.map((b) => (
                    <label
                      key={b.id}
                      className="flex items-center gap-2 text-xs text-[#FFFDF5] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={authorizedBranchIds.includes(b.id)}
                        onChange={() => handleBranchCheckbox(b.id)}
                        className="accent-[#B77900] w-4 h-4"
                      />
                      <span>{b.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#333333] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#383838] text-xs font-semibold text-[#a8a29e]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#B77900] to-[#D6A21A] text-[#181818] font-black text-xs hover:brightness-110 shadow"
                >
                  {isSubmitting ? 'Guardando...' : editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación Limpieza de Registros */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-red-600 rounded-3xl w-full max-w-md p-6 text-[#FFFDF5] shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-2xl bg-red-950 border border-red-800 flex items-center justify-center font-bold">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-[#FFFDF5]">Limpiar Registros del Sistema</h3>
                <p className="text-xs text-red-300">Esta acción es irreversible y preparará el sistema para datos reales.</p>
              </div>
            </div>

            <p className="text-xs text-[#d6d3d1]">
              Se eliminarán todos los pedidos, comandas, pagos, turnos de caja, compras, clientes y registros de auditoría de prueba. Los catálogos, mesas y sucursales se mantendrán intactos.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#a8a29e] mb-1">
                Escribe <strong className="text-red-400">LIMPIAR</strong> para confirmar:
              </label>
              <input
                type="text"
                placeholder="Escribe LIMPIAR"
                value={clearConfirmText}
                onChange={(e) => setClearConfirmText(e.target.value)}
                className="w-full bg-[#242424] border border-[#383838] rounded-xl px-3 py-2 text-xs text-[#FFFDF5] focus:outline-none focus:border-red-500 font-mono tracking-widest"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsClearModalOpen(false);
                  setClearConfirmText('');
                }}
                className="px-4 py-2 rounded-xl border border-[#383838] text-xs font-semibold text-[#a8a29e] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isClearing || clearConfirmText !== 'LIMPIAR'}
                onClick={handleClearRecords}
                className={`px-5 py-2 rounded-xl bg-red-600 text-white font-black text-xs shadow cursor-pointer ${
                  isClearing || clearConfirmText !== 'LIMPIAR' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'
                }`}
              >
                {isClearing ? 'Limpiando...' : 'Confirmar y Limpiar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
