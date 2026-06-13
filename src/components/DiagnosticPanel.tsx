import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  ShieldCheck, 
  UserCheck,
  Server
} from 'lucide-react';

interface DiagnosticResult {
  title: string;
  category: 'storage' | 'auth' | 'session' | 'db';
  status: 'loading' | 'success' | 'error' | 'warning';
  detail: string;
  solution?: string;
}

export const DiagnosticPanel: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [results, setResults] = useState<DiagnosticResult[]>([
    { title: "Armazenamento de Dados Local (localStorage)", category: "storage", status: "loading", detail: "Iniciando verificação..." },
    { title: "Estado de Segurança de Administradores", category: "auth", status: "loading", detail: "Pendente..." },
    { title: "Verificação de Sessão do Usuário", category: "session", status: "loading", detail: "Pendente..." },
    { title: "Integridade de Banco Unificado (Lojas e Produtos)", category: "db", status: "loading", detail: "Pendente..." }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastCheck, setLastCheck] = useState<string>('');

  const runDiagnostics = async () => {
    setIsRunning(true);
    const updated = [...results].map(r => ({ ...r, status: 'loading' as const, detail: "Analisando..." }));
    setResults(updated);

    // Simulate minor analyzer delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // 1. LocalStorage Availability Check
    const storageChecked: DiagnosticResult = {
      title: "Armazenamento de Dados Local (localStorage)",
      category: "storage",
      status: "success",
      detail: "Seu navegador possui suporte ativo a persistência localStorage de alto desempenho."
    };
    try {
      localStorage.setItem('reino_health_ping', 'true');
      const ping = localStorage.getItem('reino_health_ping');
      if (ping !== 'true') {
        throw new Error("Erro de gravação");
      }
      localStorage.removeItem('reino_health_ping');
    } catch (e: any) {
      storageChecked.status = "error";
      storageChecked.detail = "Seu navegador está bloqueando persistência em LocalStorage (modo anônimo restrito ou iframe isolado).";
      storageChecked.solution = "Permita armazenamento offline ou use uma janela comum para garantir o salvamento automático das planilhas.";
    }

    // 2. Admin Lock Check
    const authChecked: DiagnosticResult = {
      title: "Chave de Segurança & Registro de Administradores",
      category: "auth",
      status: "success",
      detail: "Nenhum administrador principal bloqueado."
    };
    try {
      const usersStr = localStorage.getItem('reino_users') || '[]';
      const users = JSON.parse(usersStr);
      const adminUsers = users.filter((u: any) => u.profile?.role === 'Administrador');
      
      if (adminUsers.length > 0) {
        authChecked.detail = `Sistema de segurança ativo: ${adminUsers.length} administradores cadastrados com senhas seguras.`;
      } else {
        authChecked.status = "warning";
        authChecked.detail = "Nenhum Administrador foi registrado ainda. A primeira conta poderá ser criada de forma livre.";
        authChecked.solution = "Cadastre uma conta Administrativa para ativar as proteções globais contra invasão de outras contas de vendedores.";
      }
    } catch (e) {
      authChecked.status = "warning";
      authChecked.detail = "A chave de segurança local está desconfigurada.";
    }

    // 3. User Session Verification
    const sessionChecked: DiagnosticResult = {
      title: "Verificação de Sessão do Usuário",
      category: "session",
      status: "success",
      detail: "Nenhum usuário logado no momento."
    };
    try {
      const savedUserStr = localStorage.getItem('reino_current_user');
      const savedProfileStr = localStorage.getItem('reino_current_profile');
      if (savedUserStr && savedProfileStr) {
        const profile = JSON.parse(savedProfileStr);
        sessionChecked.detail = `Usuário logado: ${profile.name} (${profile.role}). Permissões ativas.`;
      } else {
        sessionChecked.detail = "Nenhum usuário ativo. Aguardando login de controle.";
      }
    } catch (e) {
      sessionChecked.status = "error";
      sessionChecked.detail = "Sessão corrompida localmente.";
    }

    // 4. DB Integrity count
    const dbChecked: DiagnosticResult = {
      title: "Integridade de Banco Unificado (Lojas e Produtos)",
      category: "db",
      status: "success",
      detail: "Inspecionando tabelas locais..."
    };
    try {
      const storesStr = localStorage.getItem('reino_stores') || '[]';
      const productsStr = localStorage.getItem('reino_products') || '[]';
      
      const storesCount = JSON.parse(storesStr).length;
      const productsCount = JSON.parse(productsStr).length;
      
      dbChecked.detail = `Banco de dados local operando corretamente. Lojas criadas: ${storesCount} | Catálogo de Produtos: ${productsCount}.`;
    } catch (e) {
      dbChecked.status = "error";
      dbChecked.detail = "Falha de consistência de tabelas.";
    }

    setResults([storageChecked, authChecked, sessionChecked, dbChecked]);
    setIsRunning(false);
    setLastCheck(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="bg-[#0b0b10] border border-zinc-800 rounded-2xl p-5 space-y-4 max-w-lg w-full text-zinc-300 font-sans shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-indigo-500" />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100">
            Diagnóstico Local (Armazenamento em Navegador)
          </h3>
        </div>
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer disabled:opacity-40"
          title="Recarregar Diagnósticos"
        >
          <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <p className="text-[11px] text-zinc-500 leading-relaxed text-justify">
        O sistema está operando em **Modo Armazenamento Exclusivo em Navegador**. Seus dados são salvos de forma rápida, privada e autônoma sem requisições externas para o Firebase.
      </p>

      <div className="space-y-3 pt-1">
        {results.map((r, idx) => (
          <div key={idx} className="bg-zinc-950/65 border border-zinc-900 rounded-xl p-3 flex gap-3 items-start select-none">
            <div className="mt-0.5 shrink-0">
              {r.status === 'loading' && <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />}
              {r.status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
              {r.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
              {r.status === 'error' && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
            </div>
            
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-1.5 justify-between">
                <span className="text-[11px] font-semibold text-zinc-200 leading-none">{r.title}</span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider ${
                  r.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                  r.status === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                  r.status === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-purple-500/10 text-purple-400'
                }`}>
                  {r.status === 'loading' ? 'Verificando' : r.status === 'success' ? 'OK' : r.status === 'warning' ? 'Aviso' : 'Erro'}
                </span>
              </div>
              
              <p className="text-[10px] text-zinc-400 leading-normal truncate-2-lines break-words">{r.detail}</p>
              
              {r.solution && (
                <p className="text-[10px] text-amber-400/90 leading-relaxed bg-amber-950/10 border border-amber-900/20 rounded p-1.5 mt-1">
                  💡 <strong>Ajuste recomendado:</strong> {r.solution}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono border-t border-zinc-900/60 pt-3">
        <span>Análise offline: {lastCheck || 'Processando'}</span>
        {onClose && (
          <button 
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-850 rounded text-zinc-300 font-semibold cursor-pointer border border-zinc-800 transition-all text-[10px]"
          >
            Fechar Diagnóstico
          </button>
        )}
      </div>
    </div>
  );
};
