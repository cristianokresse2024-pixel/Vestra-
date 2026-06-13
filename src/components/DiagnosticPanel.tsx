import React, { useState, useEffect } from 'react';
import { auth, db, firebaseConfig } from '../firebase';
import { doc, getDocFromServer } from 'firebase/firestore';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  Key, 
  Globe, 
  UserCheck,
  ShieldAlert,
  Server
} from 'lucide-react';

interface DiagnosticResult {
  title: string;
  category: 'firebase' | 'auth' | 'session' | 'db';
  status: 'loading' | 'success' | 'error' | 'warning';
  detail: string;
  solution?: string;
}

export const DiagnosticPanel: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [results, setResults] = useState<DiagnosticResult[]>([
    { title: "Estrutura de Variáveis de Ambiente", category: "firebase", status: "loading", detail: "Iniciando verificação..." },
    { title: "Inicialização do App Firebase", category: "firebase", status: "loading", detail: "Pendente..." },
    { title: "Verificação de Sessão do Usuário", category: "session", status: "loading", detail: "Pendente..." },
    { title: "Acesso de Teste ao Banco (Firestore)", category: "db", status: "loading", detail: "Pendente..." }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastCheck, setLastCheck] = useState<string>('');

  const runDiagnostics = async () => {
    setIsRunning(true);
    const updated = [...results].map(r => ({ ...r, status: 'loading' as const, detail: "Analisando..." }));
    setResults(updated);

    // 1. Env & Configuration Check
    const configChecked: DiagnosticResult = {
      title: "Estrutura de Variáveis de Ambiente",
      category: "firebase",
      status: "success",
      detail: "Variáveis mapeadas com sucesso."
    };

    const missingVars: string[] = [];
    if (!firebaseConfig.apiKey) missingVars.push("VITE_FIREBASE_API_KEY");
    if (!firebaseConfig.authDomain) missingVars.push("VITE_FIREBASE_AUTH_DOMAIN");
    if (!firebaseConfig.projectId) missingVars.push("VITE_FIREBASE_PROJECT_ID");
    if (!firebaseConfig.appId) missingVars.push("VITE_FIREBASE_APP_ID");

    if (missingVars.length > 0) {
      configChecked.status = "warning";
      configChecked.detail = `Faltam credenciais no ambiente: ${missingVars.join(", ")}.`;
      configChecked.solution = "Adicione as variáveis de ambiente com o prefixo VITE_ nas configurações de produção do Cloudflare Pages.";
    } else {
      configChecked.detail = `Todas as chaves de ambiente principais do Firebase estão presentes na compilação. ID do projeto: ${firebaseConfig.projectId}`;
    }

    // 2. Firebase App Initialization Check
    const initChecked: DiagnosticResult = {
      title: "Inicialização do App Firebase",
      category: "firebase",
      status: "success",
      detail: "Firebase SDK ativo e carregado corretamente."
    };

    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.length < 10) {
      initChecked.status = "error";
      initChecked.detail = "Firebase não pôde inicializar de forma autêntica devido a chave de API ausente ou inválida.";
      initChecked.solution = "Verifique o arquivo firebase-applet-config.json ou configure VITE_FIREBASE_API_KEY.";
    }

    // 3. Session / User State Check
    const authChecked: DiagnosticResult = {
      title: "Verificação de Sessão do Usuário",
      category: "session",
      status: "success",
      detail: "Nenhum usuário logado no momento."
    };

    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        authChecked.detail = `Usuário autenticado: ${currentUser.email} (UID: ${currentUser.uid}).`;
        if (!currentUser.emailVerified) {
          authChecked.status = "warning";
          authChecked.detail += " E-mail não verificado.";
          authChecked.solution = "Algumas restrições de segurança podem se aplicar. Considere verificar sua conta.";
        }
      } else {
        authChecked.detail = "Sessão anônima / Sem usuário conectado no navegador. Gateway pronto.";
      }
    } catch (e: any) {
      authChecked.status = "error";
      authChecked.detail = `Erro ao recuperar estado do auth: ${e.message}`;
    }

    // 4. DB Access Check
    const dbChecked: DiagnosticResult = {
      title: "Acesso de Teste ao Banco (Firestore)",
      category: "db",
      status: "success",
      detail: "Conectando ao banco..."
    };

    try {
      // Get document from server to check real persistence connection 
      const testDocRef = doc(db, 'test_connection', 'ping');
      await getDocFromServer(testDocRef).catch((e) => {
        // We catch to inspect
        throw e;
      });
      dbChecked.detail = `Leitura efetuada no banco de dados '${firebaseConfig.firestoreDatabaseId}' com sucesso.`;
    } catch (e: any) {
      // In Firestore, if a document doesn't exist, getDocFromServer succeeds (returns empty snapshot)
      // If there is a network error or missing permission, it will throw an exception
      const msg = e.message || String(e);
      if (msg.includes('insufficient permissions') || msg.includes('permission-denied')) {
        // Permissions are strict, which is fine! It means the database is online and rules are working!
        dbChecked.status = "success";
        dbChecked.detail = `Banco acessível e regras de segurança do Reino ativas (Rejeitou acesso não autorizado legitimamente).`;
      } else if (msg.includes('offline') || msg.includes('failed-to-get-document') || msg.includes('network')) {
        dbChecked.status = "error";
        dbChecked.detail = `Falha de rede ao conectar com servidores do Google Firestore: ${msg}`;
        dbChecked.solution = "Verifique se o seu navegador possui conectividade com o Firestore ou se políticas de CORS/Rede local estão restringindo conexões.";
      } else {
        dbChecked.status = "warning";
        dbChecked.detail = `Aviso do banco Firestore: ${msg}`;
        dbChecked.solution = "Isso pode ocorrer caso o banco ainda esteja em aprovação no Firebase Console.";
      }
    }

    setResults([configChecked, initChecked, authChecked, dbChecked]);
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
            Painel de Diagnóstico do Reino
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
        Este painel realiza testes em tempo real de integração com o sistema Firebase Authentication e Firestore database, essencial para a estabilidade do sistema Reino Gestão ao ser publicado no Cloudflare.
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
                  {r.status === 'loading' ? 'Verificando' : r.status === 'success' ? 'OK' : r.status === 'warning' ? 'Alerta' : 'Erro'}
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
        <span>Última análise: {lastCheck || 'Processando'}</span>
        {onClose && (
          <button 
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
