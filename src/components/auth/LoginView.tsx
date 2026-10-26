import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ColmenaUser } from '../../types';
import {
  Sparkles,
  Shield,
  UserCheck,
  Building2,
  Lock,
  ArrowRight,
  LogIn,
  CheckCircle2,
  Users,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const {
    loginGoogle,
    bootstrapFirstAdmin,
    branches,
  } = useAuth();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showBootstrapModal, setShowBootstrapModal] = useState<boolean>(false);
  
  // Datos para registrar primer administrador
  const [adminName, setAdminName] = useState<string>('Juan Carlos Gómez');
  const [adminDoc, setAdminDoc] = useState<string>('1020304050');
  const [adminEmail, setAdminEmail] = useState<string>('juan.santos.ieci@gmail.com');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginGoogle();
      showToast('Sesión iniciada correctamente con Google', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error al iniciar sesión con Google', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim() || !adminDoc.trim() || !adminEmail.trim()) {
      showToast('Por favor completa todos los campos del administrador', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      await bootstrapFirstAdmin({
        fullName: adminName.trim(),
        documentNumber: adminDoc.trim(),
        email: adminEmail.trim(),
      });
      showToast('¡Primer Administrador configurado con éxito!', 'success');
      setShowBootstrapModal(false);
    } catch (err: any) {
      console.error(err);
      showToast('Error al registrar administrador', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e10] text-[#FFFDF5] flex flex-col justify-center items-center p-4 sm:p-8">
      
      {/* Tarjeta Central de Inicio de Sesión */}
      <div className="w-full max-w-xl bg-[#181818] text-[#FFFDF5] rounded-3xl p-6 sm:p-10 border border-[#B77900]/40 shadow-2xl relative overflow-hidden">
        
        {/* Adorno dorado de fondo */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-[#B77900]/20 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Encabezado Logo Colmena */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#B77900] via-[#D6A21A] to-[#181818] text-[#FFFDF5] shadow-xl shadow-[#B77900]/30 border border-[#D6A21A]/50 mb-4">
            <span className="font-black text-3xl">⬡</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#FFFDF5] via-[#D6A21A] to-[#B77900]">
            SISTEMA COLMENA
          </h1>
          <p className="text-xs sm:text-sm text-[#D6A21A] font-semibold tracking-widest uppercase mt-1">
            Gastronomía Inteligente · Multisucursal Colombia
          </p>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#242424] text-[11px] text-[#d6d3d1] border border-[#383838]">
            <Building2 className="w-3.5 h-3.5 text-[#D6A21A]" />
            <span>{branches.length} Sucursales activas</span>
          </div>
        </div>

        {/* Botón de Acceso Principal con Google */}
        <div className="space-y-4 mb-8">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#B77900] via-[#D6A21A] to-[#B77900] hover:brightness-110 text-[#181818] font-black text-sm flex items-center justify-center gap-3 shadow-lg shadow-[#B77900]/25 transition-all cursor-pointer"
          >
            <LogIn className="w-5 h-5 text-[#181818]" />
            <span>{isLoading ? 'Autenticando...' : 'Iniciar Sesión con Google'}</span>
          </button>
          
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-[#a8a29e]">
              Autenticación segura con Firebase Authentication
            </span>
            <button
              type="button"
              onClick={() => setShowBootstrapModal(true)}
              className="text-[11px] text-[#D6A21A] hover:underline font-bold"
            >
              Asignar Primer Admin
            </button>
          </div>
        </div>

      </div>

      {/* Modal: Procedimiento Seguro para el Primer Administrador */}
      {showBootstrapModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-[#B77900] rounded-2xl w-full max-w-md p-6 text-[#FFFDF5] shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#B77900]/20 border border-[#B77900] flex items-center justify-center text-[#D6A21A]">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-[#FFFDF5]">
                  Asignar Primer Administrador
                </h3>
                <p className="text-xs text-[#a8a29e]">
                  Configura las credenciales maestras de la Colmena.
                </p>
              </div>
            </div>

            <form onSubmit={handleBootstrap} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#a8a29e] mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full bg-[#242424] border border-[#383838] rounded-lg px-3 py-2 text-xs text-[#FFFDF5] focus:outline-none focus:border-[#D6A21A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a8a29e] mb-1">Número de Documento (C.C.)</label>
                <input
                  type="text"
                  required
                  value={adminDoc}
                  onChange={(e) => setAdminDoc(e.target.value)}
                  className="w-full bg-[#242424] border border-[#383838] rounded-lg px-3 py-2 text-xs text-[#FFFDF5] focus:outline-none focus:border-[#D6A21A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a8a29e] mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-[#242424] border border-[#383838] rounded-lg px-3 py-2 text-xs text-[#FFFDF5] focus:outline-none focus:border-[#D6A21A]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBootstrapModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#383838] text-xs font-semibold text-[#a8a29e]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#B77900] to-[#D6A21A] text-[#181818] font-black text-xs hover:brightness-110 shadow"
                >
                  Registrar Administrador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pie de página */}
      <footer className="mt-8 text-center text-xs text-[#78716c]">
        Sistema Colmena Restaurante · Colombia · Pesos Colombianos (COP) · America/Bogota
      </footer>
    </div>
  );
};
