/// <reference types="vite/client" />
import React, { useState, useEffect } from 'react';
import { useAuth, UserRole } from '../auth';
import { useReino } from '../store';
import { 
  Crown, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  ShieldCheck, 
  Briefcase, 
  Users, 
  ArrowLeft, 
  RefreshCw,
  Percent,
  Check,
  Activity,
  ShieldAlert,
  Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
// Using full local storage strategy for auth and locks
import { DiagnosticPanel } from './DiagnosticPanel';

export const AuthScreen: React.FC = () => {
  const { login, registerUser, recoverPassword, loginWithGoogle, error, setError } = useAuth();
  const { partners, addPartner } = useReino();
  
  const [mode, setMode] = useState<'login' | 'register' | 'recover'>('login');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Administrador');
  const [linkedPartnerId, setLinkedPartnerId] = useState('');
  const [newPartnerCommission, setNewPartnerCommission] = useState('10'); // Default 10% commission

  // Admin lock states for first-admin and subsequent validation checks
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [adminAuthCode, setAdminAuthCode] = useState('');
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    const checkAdminLock = () => {
      try {
        const usersStr = localStorage.getItem('reino_users') || '[]';
        const users = JSON.parse(usersStr);
        const hasAdmin = users.some((u: any) => u.profile?.role === 'Administrador');
        const lockMetadata = localStorage.getItem('reino_admin_lock') === 'true';
        setAdminExists(hasAdmin || lockMetadata);
      } catch (err) {
        console.warn("Could not retrieve admin_lock local state:", err);
        setAdminExists(false);
      }
    };
    if (mode === 'register') {
      checkAdminLock();
    }
  }, [mode]);

  const handleToggleMode = (newMode: 'login' | 'register' | 'recover') => {
    setError(null);
    setSuccessMsg(null);
    setPassword('');
    setMode(newMode);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    
    if (!email) {
      setError("Por favor, insira o seu e-mail.");
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        if (!password) {
          setError("Por favor, digite sua senha.");
          setLoading(false);
          return;
        }
        await login(email, password);
      } else if (mode === 'recover') {
        await recoverPassword(email);
        setSuccessMsg("E-mail de redefinição enviado com sucesso! Verifique sua caixa de entrada.");
      } else if (mode === 'register') {
        if (!name.trim()) {
          setError("Por favor, digite seu nome completo.");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("A senha deve conter no mínimo 6 caracteres.");
          setLoading(false);
          return;
        }

        // Validate admin code if Admin role is chosen and an admin already exists in metadata
        if (role === 'Administrador' && adminExists === true) {
          const expectedCode = import.meta.env.VITE_ADMIN_AUTH_CODE || "ReinoAdmin2026!";
          if (adminAuthCode.trim() !== expectedCode) {
            setError("Chave de autorização de Administrador incorreta. Por favor, solicite a chave ao administrador principal.");
            setLoading(false);
            return;
          }
        }

        let partnerIdToLink = linkedPartnerId;

        // If the role is Partner (Parceiro) and "new" is selected or no partner exists
        if (role === 'Parceiro' && (!linkedPartnerId || linkedPartnerId === 'new')) {
          // Register a new partner in our internal store index synchronously
          const newPartnerId = crypto.randomUUID();
          addPartner({
            name: name.trim(),
            email: email.trim(),
            commissionPercent: parseFloat(newPartnerCommission) || 10
          });
          // Retrieve newly added partner's ID (or we can just query latest)
          partnerIdToLink = newPartnerId; 
        }

        await registerUser(name, email, password, role, partnerIdToLink);

        // If newly registered user is successfully created as first Admin, set the system lock
        if (role === 'Administrador') {
          localStorage.setItem('reino_admin_lock', 'true');
          setAdminExists(true);
        }

        setSuccessMsg("Sua conta foi criada e ativada com sucesso!");
      }
    } catch (err: any) {
      // Errors are caught and handled inside AuthContext state
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-zinc-50 flex flex-col items-center justify-center p-4 md:p-6 lg:p-8 relative overflow-y-auto font-sans selection:bg-purple-600 selection:text-white">
      {/* Premium ambient backdrop light effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-900/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[460px] bg-[#0d0d12]/80 backdrop-blur-xl border border-purple-500/15 rounded-3xl p-8 relative overflow-hidden z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        {/* Glowing top line indicator */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-purple-500 via-fuchsia-600 to-indigo-500" />
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-16 h-16 bg-zinc-950 border border-purple-500/30 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(139,92,246,0.15)] group hover:border-purple-400/50 transition-all duration-300">
            <Crown className="w-9 h-9 text-purple-400 stroke-[1.5]" />
          </div>

          <h1 className="text-2xl font-bold font-sans tracking-tight bg-gradient-to-r from-white via-zinc-100 to-purple-300 bg-clip-text text-transparent">
            REINO GESTÃO
          </h1>
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-purple-400 mt-1 font-semibold">
            Controle • Resultados • Finanças
          </p>
        </div>

        {/* Dynamic Mode Switch Title */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white">
            {mode === 'login' && "Acesse seu Império"}
            {mode === 'register' && "Registrar Nova Conta"}
            {mode === 'recover' && "Recuperar Credenciais"}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {mode === 'login' && "Insira suas credenciais abaixo para carregar seu painel corporativo."}
            {mode === 'register' && "Preencha as informações para registrar o nível de acesso à filial."}
            {mode === 'recover' && "Digite o e-mail cadastrado e enviaremos um link de recuperação instantâneo."}
          </p>
        </div>

        {/* Global Notifications Panel */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-950/40 border border-red-500/20 rounded-xl p-3 text-xs text-red-300 mb-5 flex items-start gap-2.5 overflow-hidden"
            >
              <div className="mt-0.5 w-1.5 h-1.5 bg-red-400 rounded-full shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-emerald-950/40 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300 mb-5 flex items-start gap-2.5 overflow-hidden"
            >
              <div className="mt-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0 animate-ping" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Authentication Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          
          {/* REGISTER-ONLY: Full Name input */}
          {mode === 'register' && (
            <div>
              <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Nome Completo
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500">
                  <UserIcon className="w-4 h-4 text-purple-500/65" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cristiano Kresse"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950/85 border border-purple-500/10 focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/40 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all duration-200 shadow-sm"
                />
              </div>
            </div>
          )}

          {/* GENERAL: Email Address input */}
          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Endereço de E-mail
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500">
                <Mail className="w-4 h-4 text-purple-500/65" />
              </span>
              <input
                type="email"
                required
                placeholder="Ex: login@imperio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-950/85 border border-purple-500/10 focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/40 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all duration-200 shadow-sm"
              />
            </div>
          </div>

          {/* REGISTER & LOGIN ONLY: Password input */}
          {mode !== 'recover' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Chave Secreta (Senha)
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => handleToggleMode('recover')}
                    className="text-[10px] text-purple-400 hover:text-purple-300 font-medium transition-all"
                  >
                    Esqueceu a chave?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500">
                  <Lock className="w-4 h-4 text-purple-500/65" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950/85 border border-purple-500/10 focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/40 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all duration-200 shadow-sm"
                />
              </div>
            </div>
          )}

          {/* REGISTER-ONLY: User Permission Role select */}
          {mode === 'register' && (
            <div className="space-y-3.5 pt-1">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Cargo / Tipo de Acesso
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Administrador', 'Vendedor', 'Parceiro'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 px-1 text-center rounded-xl text-[11px] font-semibold transition-all border outline-none cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        role === r
                          ? 'bg-purple-600/15 text-purple-300 border-purple-500/40 shadow-inner shadow-purple-900/30'
                          : 'bg-zinc-950/70 text-zinc-400 border-zinc-900 hover:bg-zinc-900/40 hover:text-zinc-200'
                      }`}
                    >
                      {r === 'Administrador' && <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />}
                      {r === 'Vendedor' && <Briefcase className="w-3.5 h-3.5 text-purple-400" />}
                      {r === 'Parceiro' && <Users className="w-3.5 h-3.5 text-purple-400" />}
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional options for system roles compatibility */}
              <AnimatePresence mode="wait">
                {role === 'Parceiro' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-zinc-950/50 border border-purple-500/10 rounded-xl space-y-2.5 overflow-hidden"
                  >
                    <div>
                      <label className="block text-[9px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                        Vincular a Cadastro Existente?
                      </label>
                      <select
                        value={linkedPartnerId}
                        onChange={(e) => setLinkedPartnerId(e.target.value)}
                        className="w-full bg-zinc-950 border border-purple-500/10 rounded-lg text-xs p-2 text-zinc-200 outline-none"
                      >
                        <option value="new">Criar Novo Registro de Parceiro</option>
                        {partners.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.commissionPercent}%)
                          </option>
                        ))}
                      </select>
                    </div>

                    {(!linkedPartnerId || linkedPartnerId === 'new') && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-1"
                      >
                        <label className="block text-[9px] font-semibold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Percent className="w-3 h-3 text-purple-400" />
                          Comissão Padrão do Novo Parceiro (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={newPartnerCommission}
                          onChange={(e) => setNewPartnerCommission(e.target.value)}
                          className="w-full bg-zinc-950 border border-purple-500/10 rounded-lg text-xs p-2 text-zinc-200 outline-none"
                          placeholder="Ex: 10"
                        />
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {role === 'Vendedor' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3.5 bg-purple-950/20 border border-purple-500/10 rounded-xl text-[11px] text-purple-300 leading-relaxed overflow-hidden"
                  >
                    <span className="font-semibold block mb-0.5">ℹ️ Acesso Restrito (Sindicato):</span>
                    Contas do tipo Vendedor só terão acesso ao módulo "Frente de Caixa (PDV)" para registro de vendas. Funções administrativas, relatórios, caixa geral e estoques ficarão bloqueados temporariamente.
                  </motion.div>
                )}

                {role === 'Administrador' && (
                  <div className="space-y-3">
                    {adminExists === true ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3.5 bg-zinc-950/80 border border-purple-500/15 rounded-xl space-y-2 overflow-hidden"
                      >
                        <label className="block text-[9px] font-semibold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-purple-400" />
                          Chave de Autorização Admin (Obrigatório)
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Segredo para novos administradores"
                          value={adminAuthCode}
                          onChange={(e) => setAdminAuthCode(e.target.value)}
                          className="w-full bg-zinc-950 border border-purple-500/10 focus:border-purple-500/40 rounded-lg text-xs p-2 text-zinc-200 outline-none"
                        />
                        <span className="text-[9px] text-zinc-550 leading-normal block">
                          Já existe uma conta administrativa principal registrada. Insira o código mestre para autorizar novas contas do tipo Administrador.
                        </span>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3.5 bg-emerald-950/20 border border-emerald-500/15 rounded-xl text-[11px] text-emerald-300 leading-relaxed overflow-hidden"
                      >
                        <span className="font-semibold block mb-0.5">👑 Primeiro Administrador (Auto-autorizado):</span>
                        Como não há nenhum Administrador em nossos metadados, você poderá criar a conta raiz de forma direta e sem chave de segurança secundária!
                      </motion.div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3.5 bg-indigo-950/20 border border-indigo-500/10 rounded-xl text-[11px] text-indigo-300 leading-relaxed overflow-hidden"
                    >
                      <span className="font-semibold block mb-0.5">👑 Realeza Plena:</span>
                      Contas do tipo Administrador herdam privilégios e permissões totais para regular todas as lojas, despesas, objetivos financeiros, lucros e estoque unificado.
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Action trigger Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2.5 py-3.5 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-500 hover:via-purple-600 hover:to-indigo-550 active:scale-[0.98] text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 border border-purple-400/25 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none uppercase tracking-wider"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {mode === 'login' && "Conectar Painel"}
                {mode === 'register' && "Registrar Acesso"}
                {mode === 'recover' && "Enviar Recuperação"}
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </>
            )}
          </button>
        </form>

        {mode !== 'recover' && (
          <>
            <div className="relative flex items-center py-4 my-2">
              <div className="flex-grow border-t border-zinc-900"></div>
              <span className="flex-shrink-0 mx-4 text-zinc-500 text-[10px] font-sans uppercase tracking-wider">Ou continue com</span>
              <div className="flex-grow border-t border-zinc-900"></div>
            </div>

            <button
              type="button"
              onClick={loginWithGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-xs rounded-xl shadow-sm border border-transparent transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none mb-6"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>{mode === 'login' ? 'Acessar com Google' : 'Cadastrar com Google'}</span>
            </button>
          </>
        )}

        {mode === 'recover' && <div className="w-full h-[1px] bg-zinc-900 my-6" />}

        {/* Auth Mode Toggle Footer */}
        <div className="text-center text-xs">
          {mode === 'login' ? (
            <p className="text-zinc-550">
              Não possui login de acesso?{" "}
              <button
                type="button"
                onClick={() => handleToggleMode('register')}
                className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer transition-all underline ml-1"
              >
                Cadastrar-se
              </button>
            </p>
          ) : (
            <button
              onClick={() => handleToggleMode('login')}
              className="text-purple-400 hover:text-purple-300 font-semibold flex items-center justify-center gap-2 mx-auto text-xs cursor-pointer transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar ao Login do Império
            </button>
          )}
        </div>

        <p className="text-center text-[10px] text-zinc-650 mt-6 font-mono uppercase tracking-wider">
          🔒 Conexão segura • reino gestão v2.0
        </p>

        <div className="flex flex-col items-center gap-2 mt-4">
          <button
            type="button"
            onClick={() => setShowDiagnostics(true)}
            className="text-[10px] text-zinc-500 hover:text-purple-400 font-mono uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 bg-zinc-950/40 hover:bg-zinc-900/60 py-1.5 px-3 rounded-full border border-zinc-900/40 outline-none"
          >
            <Activity className="w-3 h-3 text-purple-500 animate-pulse" />
            Diagnóstico de Conexão
          </button>
        </div>
      </motion.div>

      {/* Connection Diagnostic Panel Overlay */}
      <AnimatePresence>
        {showDiagnostics && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            >
              <DiagnosticPanel onClose={() => setShowDiagnostics(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
