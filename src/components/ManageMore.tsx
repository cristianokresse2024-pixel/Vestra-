import React, { useState } from 'react';
import { useReino } from '../store';
import { Partner, Expense, CashEntry } from '../types';
import { 
  Users, 
  Target, 
  ArrowDownLeft, 
  DollarSign, 
  BarChart3, 
  Store as StoreIcon, 
  Bell, 
  Plus, 
  Trash2, 
  CheckCircle, 
  X, 
  ArrowLeft,
  Briefcase,
  AlertCircle,
  HelpCircle,
  Smartphone,
  BellRing,
  Copy,
  Check,
  Volume2,
  Zap,
  Sparkles,
  Clock,
  Percent,
  TrendingUp,
  PiggyBank,
  Award
} from 'lucide-react';
import { requestFCMToken, playNotificationSound } from '../services/fcm';

type AdminModule = 'menu' | 'parceiros' | 'metas' | 'despesas' | 'caixa' | 'relatorios' | 'lojas' | 'notificacoes';

export const ManageMore: React.FC = () => {
  const [activeModule, setActiveModule] = useState<AdminModule>('menu');
  const { 
    partners, addPartner, deletePartner,
    expenses, addExpense, deleteExpense, updateExpense,
    cashEntries, addCashEntry, deleteCashEntry,
    goals, updateGoal,
    desiredSalaries, updateDesiredSalary,
    stores, addStore, deleteStore, activeStoreId, setActiveStoreId,
    notifications, markNotificationAsRead, clearNotification,
    toggleCommissionPayment, sales, addSale, products
  } = useReino();

  // FCM Cloud Messaging Config States
  const [fcmLoading, setFcmLoading] = useState(false);
  const [fcmStatus, setFcmStatus] = useState<{
    initialized: boolean;
    supported: boolean;
    permission: NotificationPermission;
    token: string | null;
    error: string | null;
  }>({
    initialized: false,
    supported: typeof window !== 'undefined' && 'Notification' in window,
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'default',
    token: null,
    error: null
  });
  const [copiedToken, setCopiedToken] = useState(false);

  const handleSetupFCM = async () => {
    setFcmLoading(true);
    const result = await requestFCMToken();
    setFcmStatus({
      initialized: true,
      supported: result.supported,
      permission: result.permission,
      token: result.token,
      error: result.error
    });
    setFcmLoading(false);
  };

  const copyTokenToClipboard = (tokenStr: string) => {
    navigator.clipboard.writeText(tokenStr);
    setCopiedToken(true);
    setTimeout(() => {
      setCopiedToken(false);
    }, 2000);
  };

  const handleSimulateSaleNotification = () => {
    if (partners.length === 0) {
      alert("Alerta: Cadastre pelo menos um parceiro na aba 'Parceiros' antes de simular!");
      return;
    }
    
    // Choose a random partner
    const randomPartner = partners[Math.floor(Math.random() * partners.length)];
    
    // Find or locate a product and link to them if not linked
    const prd = products[0];
    if (!prd) {
      alert("Alerta: Cadastre pelo menos uma mercadoria no módulo de cadastro de produtos para simular!");
      return;
    }

    // Force partner link on product for simulation if not set
    const originalPartnerId = prd.partnerId;
    prd.partnerId = randomPartner.id;

    const qty = Math.floor(Math.random() * 2) + 1;
    const saleTotal = prd.salePrice * qty;

    // Dispatch the sale!
    addSale({
      items: [{
        productId: prd.id,
        quantity: qty,
        costPrice: prd.purchasePrice,
        salePrice: prd.salePrice
      }],
      discount: 0,
      total: saleTotal,
      paymentMethod: ['Dinheiro', 'Pix', 'Cartão de Crédito'][Math.floor(Math.random() * 3)] as any,
      partnerId: randomPartner.id,
      commissionPercent: randomPartner.commissionPercent,
      commissionAmount: saleTotal * (randomPartner.commissionPercent / 100)
    });

    // Trigger local push notification popup if permitted by browser
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification("Reino Gestão - FCM Venda! 👑", {
          body: `Venda de ${qty}x "${prd.name}" vinculada ao parceiro ${randomPartner.name}.`,
          icon: "/assets/crown.png"
        });
      } catch (e) {
        console.warn(e);
      }
    }

    // Restore product state if needed, but since it is stored in state, let's keep it linked for partner dashboard tests!
  };

  // Calendar Helpers for Goals/Salary
  const currentMonthStr = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [tempGoal, setTempGoal] = useState('');
  const [tempProfitGoal, setTempProfitGoal] = useState('');
  const [tempSalary, setTempSalary] = useState('');

  // 1. Partners/Sellers State
  const [partnerName, setPartnerName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerCommission, setPartnerCommission] = useState('5');

  // 2. Expenses State
  const [expDesc, setExpDesc] = useState('');
  const [expCategory, setExpCategory] = useState('Aluguel');
  const [expAmount, setExpAmount] = useState('');
  const [expStatus, setExpStatus] = useState<'Pago' | 'Pendente'>('Pendente');
  const [expDueDate, setExpDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('Todas');
  const [expenseStatusFilter, setExpenseStatusFilter] = useState('Todos');
  const [reportPeriod, setReportPeriod] = useState<'selected' | 'all'>('selected');

  // 3. Cash Adjustment State
  const [cashType, setCashType] = useState<'entrada' | 'saída'>('entrada');
  const [cashDesc, setCashDesc] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cashCategory, setCashCategory] = useState('Ajuste');

  // 4. Stores State
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreLoc, setNewStoreLoc] = useState('');

  // Selected store details
  const activeStoreObj = stores.find(s => s.id === activeStoreId);

  // Formatting helper
  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // HANDLERS
  const handleAddPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName.trim()) return;
    addPartner({
      name: partnerName.trim(),
      phone: partnerPhone.trim() || undefined,
      commissionPercent: parseFloat(partnerCommission) || 0
    });
    setPartnerName('');
    setPartnerPhone('');
    setPartnerCommission('5');
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDesc.trim() || !expAmount) return;
    addExpense({
      description: expDesc.trim(),
      category: expCategory,
      amount: parseFloat(expAmount) || 0,
      date: new Date().toISOString().slice(0, 10),
      status: expStatus,
      dueDate: expDueDate
    });
    setExpDesc('');
    setExpAmount('');
    setExpStatus('Pendente');
    setExpDueDate(new Date().toISOString().slice(0, 10));
  };

  const handleAddCashAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashDesc.trim() || !cashAmount) return;
    addCashEntry({
      type: cashType,
      description: `Ajuste manual: ${cashDesc.trim()}`,
      amount: parseFloat(cashAmount) || 0,
      category: cashCategory
    });
    setCashDesc('');
    setCashAmount('');
  };

  const handleSaveGoalAndSalary = (e: React.FormEvent) => {
    e.preventDefault();
    
    const existingGoal = goals.find(g => g.yearMonth === selectedMonth);
    const billingValue = tempGoal !== '' ? (parseFloat(tempGoal) || 0) : (existingGoal?.targetValue ?? 0);
    const profitValue = tempProfitGoal !== '' ? (parseFloat(tempProfitGoal) || 0) : (existingGoal?.profitTargetValue ?? 0);

    updateGoal(selectedMonth, billingValue, profitValue);
    
    if (tempSalary !== '') {
      updateDesiredSalary(selectedMonth, parseFloat(tempSalary) || 0);
    }
    
    setTempGoal('');
    setTempProfitGoal('');
    setTempSalary('');
    alert('Metas financeiras e pró-labore salvos com sucesso!');
  };

  const handleCreateStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;
    addStore(newStoreName.trim(), newStoreLoc.trim() || undefined);
    setNewStoreName('');
    setNewStoreLoc('');
  };

  return (
    <div className="space-y-6">
      
      {/* Title wrapper: shows Back Button if in sub-module */}
      <div className="flex items-center gap-3">
        {activeModule !== 'menu' && (
          <button
            onClick={() => setActiveModule('menu')}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-purple-400 rounded-xl transition-all active:scale-95"
            title="Voltar ao Painel"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-sans uppercase">
            {activeModule === 'menu' && "Painel Admin do Reino"}
            {activeModule === 'parceiros' && "Comissões & Sindicado de Parceiros"}
            {activeModule === 'metas' && "Metas de Faturamento & Pró-labore"}
            {activeModule === 'despesas' && "Lançamento de Despesas Operacionais"}
            {activeModule === 'caixa' && "Ajuste de Caixa & Livro-caixa"}
            {activeModule === 'relatorios' && "Relatórios Consolidados de Desempenho"}
            {activeModule === 'lojas' && "Escalabilidade de Lojas Unificadas"}
            {activeModule === 'notificacoes' && "Notificações do Sistema em Tempo Real"}
          </h2>
          <p className="text-xs text-zinc-500 font-sans">
            {activeModule === 'menu' && "Gerencie a infraestrutura administrativa, metas e finanças da loja"}
            {activeModule === 'parceiros' && "Cadastro de vendedores externos ou parceiros com comissionamentos"}
            {activeModule === 'metas' && `Estipule objetivos de vendas e pró-labore desejado para ${selectedMonth}`}
            {activeModule === 'despesas' && "Controle as saídas e passivos da sua operação comercial física"}
            {activeModule === 'caixa' && "Veja o histórico líquido de todas as entradas, vendas e retiradas físicas"}
            {activeModule === 'relatorios' && "Auditoria de lucros de custos mercantis, margens e custos consolidados"}
            {activeModule === 'lojas' && "Múltiplas lojas atuando de forma isolada na mesma conta de comerciante"}
            {activeModule === 'notificacoes' && "Alertas gerados automaticamente em processos de vendas e quebras de estoque"}
          </p>
        </div>
      </div>

      {/* RENDER GRID MENU */}
      {activeModule === 'menu' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Option: Lojas */}
          <button
            onClick={() => setActiveModule('lojas')}
            className="glow-zinc-card p-6 rounded-2xl text-left cursor-pointer transition-all hover:border-purple-500/40 relative group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-900/15 flex items-center justify-center mb-4 text-purple-400 group-hover:scale-110 transition-transform">
              <StoreIcon className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-zinc-200 text-sm font-sans">Configuração de Lojas</h4>
            <p className="text-xs text-zinc-500 mt-2 font-sans leading-normal">
              Cadastrar filiais ou alternar entre lojas físicas. {stores.length} loja(s) operando.
            </p>
            <span className="text-[10px] font-mono font-semibold text-purple-400 absolute bottom-3 right-4">
              {activeStoreObj?.name}
            </span>
          </button>

          {/* Option: Partners */}
          <button
            onClick={() => setActiveModule('parceiros')}
            className="glow-zinc-card p-6 rounded-2xl text-left cursor-pointer transition-all hover:border-purple-500/40 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-900/15 flex items-center justify-center mb-4 text-purple-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-zinc-200 text-sm font-sans">Parceiros & Vendedores</h4>
            <p className="text-xs text-zinc-500 mt-2 font-sans leading-normal">
              Controle o cadastro de parceiros com comissões sobre vendas. {partners.length} parceiros.
            </p>
          </button>

          {/* Option: Goals */}
          <button
            onClick={() => setActiveModule('metas')}
            className="glow-zinc-card p-6 rounded-2xl text-left cursor-pointer transition-all hover:border-purple-500/40 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-900/15 flex items-center justify-center mb-4 text-purple-400 group-hover:scale-110 transition-transform">
              <Target className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-zinc-200 text-sm font-sans">Metas & Salário Ideal</h4>
            <p className="text-xs text-zinc-500 mt-2 font-sans leading-normal">
              Defina faturamentos de metas gerais e controle do seu pró-labore almejado.
            </p>
          </button>

          {/* Option: Expenses */}
          <button
            onClick={() => setActiveModule('despesas')}
            className="glow-zinc-card p-6 rounded-2xl text-left cursor-pointer transition-all hover:border-purple-500/40 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-900/15 flex items-center justify-center mb-4 text-purple-400 group-hover:scale-110 transition-transform">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-zinc-200 text-sm font-sans">Controle de Despesas</h4>
            <p className="text-xs text-zinc-500 mt-2 font-sans leading-normal">
              Registre custos fixos e variáveis, lançando quitações direto no fluxo de caixa.
            </p>
          </button>

          {/* Option: Cashflow Ledger */}
          <button
            onClick={() => setActiveModule('caixa')}
            className="glow-zinc-card p-6 rounded-2xl text-left cursor-pointer transition-all hover:border-purple-500/40 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-900/15 flex items-center justify-center mb-4 text-purple-400 group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-zinc-200 text-sm font-sans">Fluxo de Caixa Integral</h4>
            <p className="text-xs text-zinc-500 mt-2 font-sans leading-normal">
              Extrato completo de entradas de vendas, saídas de caixa e ajustes manuais do lojista.
            </p>
          </button>

          {/* Option: Reports */}
          <button
            onClick={() => setActiveModule('relatorios')}
            className="glow-zinc-card p-6 rounded-2xl text-left cursor-pointer transition-all hover:border-purple-500/40 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-900/15 flex items-center justify-center mb-4 text-purple-400 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-zinc-200 text-sm font-sans">Relatórios Finais</h4>
            <p className="text-xs text-zinc-500 mt-2 font-sans leading-normal">
              Análise real de faturamento bruto, custos do acervo (C.M.V) e o lucro líquido líquido histórico.
            </p>
          </button>

          {/* Option: Notifications */}
          <button
            onClick={() => setActiveModule('notificacoes')}
            className="glow-zinc-card p-6 rounded-2xl text-left cursor-pointer transition-all hover:border-purple-500/40 group relative"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-900/15 flex items-center justify-center mb-4 text-purple-400 group-hover:scale-110 transition-transform">
              <Bell className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-zinc-200 text-sm font-sans">Histórico de Alertas</h4>
            <p className="text-xs text-zinc-500 mt-2 font-sans leading-normal">
              Notificações de reposição de estoque, vendas novas e conquistas de metas mensais.
            </p>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute top-6 right-6 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            )}
          </button>
        </div>
      )}

      {/* SUBMODULE: MULTI-STORE MANAGEMENT */}
      {activeModule === 'lojas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-xs">
          {/* Add Store Form */}
          <div className="glow-zinc-card p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-semibold tracking-wider text-zinc-200 uppercase flex items-center gap-1.5 pb-2 border-b border-zinc-800">
              <Plus className="w-4 h-4 text-purple-400" /> Registrar Nova Filial
            </h3>
            
            <form onSubmit={handleCreateStore} className="space-y-4 text-zinc-300">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase text-zinc-400">
                  Nome Fantasia da Unidade *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Reino - Loja 2 do Shopping"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:border-purple-500 outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase text-zinc-400">
                  Localidade / Endereço
                </label>
                <input
                  type="text"
                  placeholder="Ex: Av. Dr. Silva, 300 - Piso L1"
                  value={newStoreLoc}
                  onChange={(e) => setNewStoreLoc(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:border-purple-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-650 hover:bg-purple-600 text-white font-semibold rounded-lg transition-all"
              >
                Cadastrar Nova Filial
              </button>
            </form>
          </div>

          {/* List and switch active stores */}
          <div className="lg:col-span-2 glow-zinc-card p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-semibold tracking-wider text-zinc-200 uppercase flex items-center gap-1.5 pb-2 border-b border-zinc-800">
              <StoreIcon className="w-4 h-4 text-purple-400" /> Suas Filiais Registradas
            </h3>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {stores.map(st => {
                const isActive = st.id === activeStoreId;
                return (
                  <div 
                    key={st.id} 
                    className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                      isActive 
                        ? 'bg-purple-900/10 border-purple-500/80 glow-purple' 
                        : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                        {st.name}
                        {isActive && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider font-mono">Loja Ativa</span>}
                      </h4>
                      {st.location && <p className="text-zinc-500 text-[11px] mt-1">📍 {st.location}</p>}
                      <p className="text-[10px] text-zinc-500 font-mono mt-1">Criada em: {new Date(st.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <button
                          onClick={() => setActiveStoreId(st.id)}
                          className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-purple-500/45 text-purple-400 font-semibold text-[11px] rounded-lg transition-all"
                        >
                          Conectar à Loja
                        </button>
                      )}
                      
                      {stores.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm(`Aviso Crítico: Ao remover permanentemente a loja "${st.name}", TODOS os produtos cadastrados, vendas, metas e caixas dela serão apagados para sempre. Deseja prosseguir?`)) {
                              deleteStore(st.id);
                            }
                          }}
                          className="p-1.5 bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-red-400 rounded-lg transition-all"
                          title="Remover Loja"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBMODULE: PARTNERS / COMMISSION */}
      {activeModule === 'parceiros' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-xs">
          {/* Add Partner */}
          <div className="glow-zinc-card p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-semibold tracking-wider text-zinc-200 uppercase flex items-center gap-1.5 pb-2 border-b border-zinc-800">
              <Plus className="w-4 h-4 text-purple-400" /> Adicionar Parceiro / Vendedor
            </h3>

            <form onSubmit={handleAddPartner} className="space-y-4 text-zinc-300">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase text-zinc-400">
                  Nome do Parceiro *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Rodrigo Vendedor Centro"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:border-purple-500 outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase text-zinc-400">
                  Telefone de Contato (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: (11) 98888-2222"
                  value={partnerPhone}
                  onChange={(e) => setPartnerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:border-purple-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase text-zinc-400">
                  Comissão Base (%) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="5"
                  value={partnerCommission}
                  onChange={(e) => setPartnerCommission(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:border-purple-500 outline-none font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-650 hover:bg-purple-600 text-white font-semibold rounded-lg transition-all"
              >
                Registrar Parceiro
              </button>
            </form>
          </div>

          {/* List existing partners */}
          <div className="lg:col-span-2 glow-zinc-card p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-semibold tracking-wider text-zinc-200 uppercase flex items-center gap-1.5 pb-2 border-b border-zinc-800">
              <Users className="w-4 h-4 text-purple-400" /> Seus Parceiros Comerciais
            </h3>

            {partners.length > 0 ? (
              <div className="space-y-4">
                <div className="space-y-2 overflow-y-auto max-h-[250px] pr-1">
                  {partners.map(p => {
                    const partnerSalesList = sales.filter(s => s.items.some(item => item.partnerId === p.id));
                    const unpaidCommissions = partnerSalesList.filter(s => s.commissionPaid === false).reduce((sum, s) => sum + s.items.filter(item => item.partnerId === p.id).reduce((sSum, item) => sSum + (item.commissionAmount || 0), 0), 0);
                    const paidCommissions = partnerSalesList.filter(s => s.commissionPaid === true).reduce((sum, s) => sum + s.items.filter(item => item.partnerId === p.id).reduce((sSum, item) => sSum + (item.commissionAmount || 0), 0), 0);
                    return (
                      <div key={p.id} className="p-3 bg-zinc-900/40 border border-zinc-805 rounded-xl flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-zinc-200 text-sm">{p.name}</h4>
                          {p.phone && <p className="text-zinc-500 mt-0.5">📞 {p.phone}</p>}
                          <p className="text-[10px] text-purple-400 font-mono mt-1 font-semibold">
                            Comissão Base: {p.commissionPercent}% sobre receita de vendas
                          </p>
                          <div className="flex gap-4 mt-2 text-[10px] text-zinc-400 font-sans">
                            <span>Pendente: <strong className="text-amber-400">{formatBRL(unpaidCommissions)}</strong></span>
                            <span>Pago: <strong className="text-emerald-400">{formatBRL(paidCommissions)}</strong></span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (confirm(`Excluir parceiro "${p.name}"? Isso não apagará comissões e vendas históricas já faturadas.`)) {
                              deletePartner(p.id);
                            }
                          }}
                          className="p-2 border border-zinc-800 text-zinc-500 hover:text-red-400 rounded-lg transition-colors bg-zinc-950 self-start"
                          title="Remover Parceiro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Direct list of unliquidated partner commissions */}
                <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
                  <div>
                    <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest font-mono">Liquidação de Comissões Pendentes</h4>
                    <p className="text-[11px] text-zinc-500 font-sans mt-0.5">Baixar e marcar os repasses de comissão selecionados como pagos</p>
                  </div>

                  {sales.filter(s => s.commissionPaid === false && s.items.some(item => item.partnerId && item.commissionAmount && item.commissionAmount > 0)).length > 0 ? (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {sales.filter(s => s.commissionPaid === false && s.items.some(item => item.partnerId && item.commissionAmount && item.commissionAmount > 0)).map(s => {
                        const partnerIdsInSale = Array.from(new Set(
                          s.items.filter(item => item.partnerId && item.commissionAmount && item.commissionAmount > 0).map(item => item.partnerId)
                        ));
                        const partnerNames = partnerIdsInSale.map(pId => partners.find(pt => pt.id === pId)?.name || 'Parceiro').join(', ');
                        const totalCommissionInSale = s.items.filter(item => item.partnerId && item.commissionAmount && item.commissionAmount > 0).reduce((acc, item) => acc + (item.commissionAmount || 0), 0);
                        return (
                          <div key={s.id} className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="text-xs text-zinc-200 font-sans">
                                Parceiro(s): <span className="font-semibold text-purple-400">{partnerNames || 'Não cadastrado'}</span>
                              </p>
                              <p className="text-[10px] text-zinc-500 mt-1">
                                Venda #{s.id.slice(0, 8)} • Total: {formatBRL(s.total)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <span className="text-xs font-mono font-bold text-amber-500">
                                 + {formatBRL(totalCommissionInSale)}
                              </span>
                              <button
                                onClick={() => toggleCommissionPayment(s.id)}
                                className="px-2.5 py-1.5 bg-purple-600/10 hover:bg-purple-600 hover:text-white text-purple-400 border border-purple-500/20 text-[10px] font-semibold rounded-lg transition-all cursor-pointer"
                              >
                                Baixar Repasse
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-[10px] text-zinc-500 border border-dashed border-zinc-900 rounded-xl">
                      Nenhum repasse de comissão pendente!
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-550 border border-dashed border-zinc-800 rounded-xl">
                Nenhum parceiro de consultoria ou vendas registrado ainda no Reino. Registre-os para gerenciar comissões em vendas físicas de forma estruturada.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBMODULE: GOALS & IDEAL SALARY */}
      {activeModule === 'metas' && (
        <div className="font-sans text-xs space-y-6">
          
          {(() => {
            // 1. Month entries, sales, and expenses of the chosen selectedMonth
            const targetEntries = cashEntries.filter(c => c.date && c.date.slice(0, 7) === selectedMonth);
            const targetSales = sales.filter(s => s.date && s.date.slice(0, 7) === selectedMonth);
            const targetExpenses = expenses.filter(e => (e.dueDate || e.date).slice(0, 7) === selectedMonth);

            // 2. Realized values
            const currentRevenue = targetEntries
              .filter(c => c.type === 'entrada' && c.category === 'Vendas')
              .reduce((sum, item) => sum + item.amount, 0);

            const totalCOGS = targetSales.reduce((sum, sale) => {
              return sum + sale.items.reduce((s2, i) => s2 + (i.costPrice * i.quantity), 0);
            }, 0);

            const paidExpensesTotal = targetExpenses
              .filter(e => e.status === 'Pago')
              .reduce((sum, e) => sum + e.amount, 0);

            const pendingExpensesTotal = targetExpenses
              .filter(e => e.status === 'Pendente')
              .reduce((sum, e) => sum + e.amount, 0);

            const paidCommissionsTotal = targetSales.reduce((sum, sale) => sum + (sale.commissionAmount || 0), 0);

            // True Net Profit
            const currentProfit = (currentRevenue - totalCOGS) - paidExpensesTotal - paidCommissionsTotal - pendingExpensesTotal;

            // 3. Goal targets for chosen selectedMonth
            const activeGoalObj = goals.find(g => g.yearMonth === selectedMonth);
            const faturamentoGoal = activeGoalObj?.targetValue || 0;
            const lucroGoal = activeGoalObj?.profitTargetValue || 0;
            const salarialGoal = desiredSalaries.find(d => d.yearMonth === selectedMonth)?.amount || 0;

            // 4. Progress and remaining
            const faturamentoPercent = faturamentoGoal > 0 ? (currentRevenue / faturamentoGoal) * 105 : 0;
            const faturamentoPercentCapped = Math.min(100, faturamentoPercent);
            const faturamentoRestante = Math.max(0, faturamentoGoal - currentRevenue);

            const lucroPercent = lucroGoal > 0 ? (currentProfit / lucroGoal) * 100 : 0;
            const lucroPercentCapped = Math.min(100, Math.max(0, lucroPercent));
            const lucroRestante = Math.max(0, lucroGoal - currentProfit);

            const salarialPercent = salarialGoal > 0 ? (currentProfit / salarialGoal) * 100 : 0;
            const salarialPercentCapped = Math.min(100, Math.max(0, salarialPercent));
            const salarialRestante = Math.max(0, salarialGoal - currentProfit);

            // 5. Projections
            const getProjection = (currentVal: number, yearMonth: string) => {
              const now = new Date();
              const currentYM = now.toISOString().slice(0, 7); // "YYYY-MM"
              
              if (yearMonth === currentYM) {
                const day = now.getDate();
                const year = now.getFullYear();
                const month = now.getMonth(); // 0-indexed
                const dInMonth = new Date(year, month + 1, 0).getDate(); // Total days in month
                
                return (currentVal / Math.max(1, day)) * dInMonth;
              } else if (yearMonth < currentYM) {
                return currentVal;
              } else {
                return 0;
              }
            };

            const projectedRevenue = getProjection(currentRevenue, selectedMonth);
            const projectedProfit = getProjection(currentProfit, selectedMonth);

            // Daily chart data
            const compileMonthlyDaysData = (yearMonth: string) => {
              const [yr, mn] = yearMonth.split('-').map(Number);
              const totalDays = new Date(yr, mn, 0).getDate(); // last day of month

              const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
              
              let cumulativeSales = 0;
              let cumulativeProfit = 0;
              
              return daysArray.map(day => {
                const dateStr = `${yearMonth}-${String(day).padStart(2, '0')}`;
                
                const daySales = sales.filter(s => s.date === dateStr);
                const dayRevenue = daySales.reduce((acc, curr) => acc + curr.total, 0);
                
                const dayCOGS = daySales.reduce((sum, sale) => {
                  return sum + sale.items.reduce((s2, i) => s2 + (i.costPrice * i.quantity), 0);
                }, 0);
                
                const dayCommissions = daySales.reduce((sum, sale) => sum + (sale.commissionAmount || 0), 0);
                
                const dayExpenses = expenses.filter(e => (e.dueDate || e.date) === dateStr);
                const dayExpensesCost = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

                const netDayProfit = dayRevenue - dayCOGS - dayCommissions - dayExpensesCost;
                
                cumulativeSales += dayRevenue;
                cumulativeProfit += netDayProfit;
                
                return {
                  day,
                  revenue: cumulativeSales,
                  profit: cumulativeProfit,
                };
              });
            };

            const monthlyData = compileMonthlyDaysData(selectedMonth);
            const maxChartValue = Math.max(
              100,
              ...monthlyData.map(d => Math.max(d.revenue, d.profit)),
              faturamentoGoal,
              lucroGoal,
              salarialGoal
            );

            const drawCumulativeChart = (data: { day: number; revenue: number; profit: number }[], maxVal: number) => {
              if (data.length === 0 || maxVal === 0) return null;
              
              const width = 500;
              const height = 150;
              const padding = 20;

              const pointsRevenue = data.map((d, idx) => {
                const x = padding + (idx / (data.length - 1)) * (width - padding * 2);
                const y = height - padding - (d.revenue / maxVal) * (height - padding * 2);
                return `${x},${y}`;
              }).join(' ');

              const pointsProfit = data.map((d, idx) => {
                const x = padding + (idx / (data.length - 1)) * (width - padding * 2);
                const y = height - padding - (Math.max(0, d.profit) / maxVal) * (height - padding * 2);
                return `${x},${y}`;
              }).join(' ');

              return (
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 overflow-visible">
                  <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#27272a" strokeDasharray="3,3" />
                  <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#27272a" strokeDasharray="3,3" />
                  <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#3f3f46" />
                  
                  {/* Area plots */}
                  <polygon
                    points={`${padding},${height - padding} ${pointsRevenue} ${width - padding},${height - padding}`}
                    fill="url(#revenueGrad)"
                    opacity="0.12"
                  />
                  <polygon
                    points={`${padding},${height - padding} ${pointsProfit} ${width - padding},${height - padding}`}
                    fill="url(#profitGrad)"
                    opacity="0.08"
                  />

                  {/* Revenue Curve */}
                  <polyline
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={pointsRevenue}
                  />

                  {/* Profit Curve */}
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={pointsProfit}
                  />
                  
                  {/* Gradients */}
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              );
            };

            return (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Visual Dashboard and Progress Trackers */}
                <div className="xl:col-span-2 space-y-6">
                  
                  {/* Timescale Selector Widget */}
                  <div className="glow-zinc-card p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] uppercase font-mono tracking-wider font-bold rounded-md inline-block mb-1">
                        Monitor de Objetivos
                      </span>
                      <h3 className="text-sm font-semibold tracking-wider text-zinc-200 uppercase">
                        Gestão e Auditoria de Metas
                      </h3>
                      <p className="text-[10px] text-zinc-500">Acompanhamento automatizado de lucratividade de performance</p>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto bg-zinc-950 p-1 border border-zinc-900 rounded-xl">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase ml-2">Mês Analisado:</label>
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 font-mono text-xs focus:border-purple-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* 3 Bento Cards for 3 goals */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Goal Card 1: Faturamento */}
                    <div className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                      faturamentoGoal > 0 && currentRevenue >= faturamentoGoal
                        ? 'bg-purple-950/20 border-purple-500/30 shadow-[0_4px_20px_rgba(168,85,247,0.15)] shadow-purple-500/5'
                        : 'bg-zinc-900/40 border-zinc-900 hover:border-zinc-800'
                    }`}>
                      <div className="flex justify-between items-start pb-3 mb-4 border-b border-zinc-900/40">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-purple-400 tracking-wider">Metas de Vendas</span>
                          <h4 className="text-xs font-semibold text-zinc-200 uppercase mt-0.5">Faturamento Bruto</h4>
                        </div>
                        <span className={`p-1.5 rounded-lg ${
                          faturamentoGoal > 0 && currentRevenue >= faturamentoGoal
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-zinc-955 border border-zinc-850 text-zinc-500'
                        }`}>
                          <TrendingUp className="w-4 h-4" />
                        </span>
                      </div>
                      
                      {/* Metric value and Target value */}
                      <div className="space-y-4">
                        <div>
                          <span className="text-[9px] text-zinc-500 uppercase block font-semibold">Faturamento Atual</span>
                          <strong className="text-xl font-mono text-white tracking-tight">{formatBRL(currentRevenue)}</strong>
                        </div>
                        
                        <div>
                          <span className="text-[9px] text-zinc-500 uppercase block font-semibold">Alvo Definido</span>
                          <strong className="text-xs font-mono text-zinc-350">{faturamentoGoal > 0 ? formatBRL(faturamentoGoal) : 'A definir'}</strong>
                        </div>

                        {/* Progress */}
                        {faturamentoGoal > 0 ? (
                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-mono">
                              <span className="text-zinc-400">Progresso</span>
                              <strong className="text-purple-400">{faturamentoPercent.toFixed(1)}%</strong>
                            </div>
                            <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-1000"
                                style={{ width: `${faturamentoPercentCapped}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-zinc-550 italic">Insira uma meta de faturamento bruto para acompanhar.</p>
                        )}

                        {/* Remaining & Projection fields */}
                        {faturamentoGoal > 0 && (
                          <div className="pt-3 border-t border-zinc-900/40 space-y-2 text-[10px] font-sans">
                            <div className="flex justify-between">
                              <span className="text-zinc-500 uppercase text-[9px]">Valor Restante:</span>
                              <strong className={`${faturamentoRestante === 0 ? 'text-emerald-400 font-bold' : 'text-zinc-350'} font-mono`}>
                                {faturamentoRestante === 0 ? 'BATIDA! 👑' : formatBRL(faturamentoRestante)}
                              </strong>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-zinc-500 uppercase text-[9px]">Projeção de Fechamento:</span>
                              <div className="flex justify-between items-center mt-0.5">
                                <strong className={`font-mono ${projectedRevenue >= faturamentoGoal ? 'text-emerald-400 font-bold' : 'text-amber-500'}`}>
                                  {formatBRL(projectedRevenue)}
                                </strong>
                                <span className={`px-1.5 py-0.2 text-[8px] uppercase font-mono font-bold rounded ${
                                  projectedRevenue >= faturamentoGoal ? 'bg-emerald-500/10 text-emerald-400 animate-pulse' : 'bg-amber-500/10 text-amber-500'
                                }`}>
                                  {projectedRevenue >= faturamentoGoal ? 'On-Track' : 'Alerta'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Goal Card 2: Lucro Líquido */}
                    <div className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                      lucroGoal > 0 && currentProfit >= lucroGoal
                        ? 'bg-emerald-950/15 border-emerald-500/30 shadow-[0_4px_20px_rgba(16,185,129,0.12)] shadow-emerald-500/5'
                        : 'bg-zinc-900/40 border-zinc-900 hover:border-zinc-800'
                    }`}>
                      <div className="flex justify-between items-start pb-3 mb-4 border-b border-zinc-900/40">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider">Excedente Líquido</span>
                          <h4 className="text-xs font-semibold text-zinc-200 uppercase mt-0.5">Meta de Lucro Líquido</h4>
                        </div>
                        <span className={`p-1.5 rounded-lg ${
                          lucroGoal > 0 && currentProfit >= lucroGoal
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-zinc-950 border border-zinc-850 text-zinc-500'
                        }`}>
                          <PiggyBank className="w-4 h-4" />
                        </span>
                      </div>
                      
                      {/* Metric value and Target value */}
                      <div className="space-y-4">
                        <div>
                          <span className="text-[9px] text-zinc-550 uppercase block font-semibold font-sans">Lucro Realizado</span>
                          <strong className={`text-xl font-mono tracking-tight ${currentProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {formatBRL(currentProfit)}
                          </strong>
                        </div>
                        
                        <div>
                          <span className="text-[9px] text-zinc-550 uppercase block font-semibold font-sans">Alvo Definido</span>
                          <strong className="text-xs font-mono text-zinc-350">{lucroGoal > 0 ? formatBRL(lucroGoal) : 'A definir'}</strong>
                        </div>

                        {/* Progress */}
                        {lucroGoal > 0 ? (
                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-mono">
                              <span className="text-zinc-400">Progresso</span>
                              <strong className="text-emerald-400">{lucroPercent.toFixed(1)}%</strong>
                            </div>
                            <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
                                style={{ width: `${lucroPercentCapped}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-zinc-550 italic">Insira uma meta de lucro líquido desejado para monitorar.</p>
                        )}

                        {/* Remaining & Projection fields */}
                        {lucroGoal > 0 && (
                          <div className="pt-3 border-t border-zinc-900/40 space-y-2 text-[10px] font-sans">
                            <div className="flex justify-between">
                              <span className="text-zinc-500 uppercase text-[9px]">Valor Restante:</span>
                              <strong className={`${lucroRestante === 0 ? 'text-emerald-400 font-bold' : 'text-zinc-350'} font-mono`}>
                                {lucroRestante === 0 ? 'BATIDA! 👑' : formatBRL(lucroRestante)}
                              </strong>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-zinc-500 uppercase text-[9px]">Projeção de Lucro:</span>
                              <div className="flex justify-between items-center mt-0.5">
                                <strong className={`font-mono ${projectedProfit >= lucroGoal ? 'text-emerald-450 font-bold' : 'text-amber-400'}`}>
                                  {formatBRL(projectedProfit)}
                                </strong>
                                <span className={`px-1.5 py-0.2 text-[8px] uppercase font-mono font-bold rounded ${
                                  projectedProfit >= lucroGoal ? 'bg-emerald-500/10 text-emerald-450 animate-pulse' : 'bg-amber-500/10 text-amber-500'
                                }`}>
                                  {projectedProfit >= lucroGoal ? 'On-Track' : 'Alerta'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Goal Card 3: Meta Salarial / Pró-labore */}
                    <div className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                      salarialGoal > 0 && currentProfit >= salarialGoal
                        ? 'bg-amber-950/15 border-amber-500/30'
                        : 'bg-zinc-900/40 border-zinc-900 hover:border-zinc-800'
                    }`}>
                      <div className="flex justify-between items-start pb-3 mb-4 border-b border-zinc-900/40">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-amber-400 tracking-wider">Retirada Pessoal</span>
                          <h4 className="text-xs font-semibold text-zinc-200 uppercase mt-0.5">Pró-labore Ideal</h4>
                        </div>
                        <span className={`p-1.5 rounded-lg ${
                          salarialGoal > 0 && currentProfit >= salarialGoal
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-zinc-950 border border-zinc-850 text-zinc-500'
                        }`}>
                          <Award className="w-4 h-4" />
                        </span>
                      </div>
                      
                      {/* Metric value and Target value */}
                      <div className="space-y-4">
                        <div>
                          <span className="text-[9px] text-zinc-550 uppercase block font-semibold font-sans">Lucro p/ Cobertura</span>
                          <strong className="text-xl font-mono text-zinc-100 tracking-tight">{formatBRL(currentProfit)}</strong>
                        </div>
                        
                        <div>
                          <span className="text-[9px] text-zinc-555 uppercase block font-semibold font-sans">Salarial Almejado</span>
                          <strong className="text-xs font-mono text-purple-400">{salarialGoal > 0 ? formatBRL(salarialGoal) : 'A definir'}</strong>
                        </div>

                        {/* Progress */}
                        {salarialGoal > 0 ? (
                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-mono">
                              <span className="text-zinc-400">Cobertura</span>
                              <strong className="text-amber-400">{salarialPercent.toFixed(1)}%</strong>
                            </div>
                            <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                              <div 
                                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-1000"
                                style={{ width: `${salarialPercentCapped}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-zinc-550 italic">Insira um pró-labore ideal para analisar a viabilidade de retirada fiscal.</p>
                        )}

                        {/* Remaining & Projection fields */}
                        {salarialGoal > 0 && (
                          <div className="pt-3 border-t border-zinc-900/40 space-y-2 text-[10px] font-sans">
                            <div className="flex justify-between">
                              <span className="text-zinc-500 uppercase text-[9px]">Restante p/ Garantir:</span>
                              <strong className={`${salarialRestante === 0 ? 'text-emerald-400 font-bold' : 'text-zinc-350'} font-mono`}>
                                {salarialRestante === 0 ? 'GARANTIDO! 👑' : formatBRL(salarialRestante)}
                              </strong>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-zinc-500 uppercase text-[9px]">Cobertura Estimada:</span>
                              <div className="flex justify-between items-center mt-0.5">
                                <strong className={`font-mono ${projectedProfit >= salarialGoal ? 'text-emerald-450 font-bold' : 'text-amber-400'}`}>
                                  {formatBRL(projectedProfit)}
                                </strong>
                                <span className={`px-1.5 py-0.2 text-[8px] uppercase font-mono font-bold rounded ${
                                  projectedProfit >= salarialGoal ? 'bg-emerald-500/10 text-emerald-450 animate-pulse' : 'bg-red-500/10 text-red-400'
                                }`}>
                                  {projectedProfit >= salarialGoal ? 'VIÁVEL' : 'INSUFICIENTE'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Progression Chart widget */}
                  <div className="bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-zinc-300 tracking-wider flex items-center gap-1.5">
                          <BarChart3 className="w-4 h-4 text-purple-400" /> Histórico de Acumulação Diária ({selectedMonth})
                        </h4>
                        <p className="text-[10px] text-zinc-500">Curvas de progressão fiduciária contínua de vendas brutas e excedente monetário no período</p>
                      </div>
                      <div className="flex gap-4 text-[10px] font-mono">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.1 h-2.1 rounded-full bg-purple-500 inline-block shadow"></span>
                          <span className="text-zinc-400 text-[9px]">Faturamento</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.1 h-2.1 rounded-full bg-emerald-500 inline-block shadow"></span>
                          <span className="text-zinc-400 text-[9px]">Excedente Neto (Lucro)</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="relative pt-2">
                      {drawCumulativeChart(monthlyData, maxChartValue)}
                      {monthlyData.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/20 backdrop-blur-[1px]">
                          <p className="text-xs text-zinc-500 font-sans italic">Não há consolidações faturadas para este período fiscal ainda.</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between text-[9px] text-zinc-550 font-mono pt-1">
                      <span>Dia 01</span>
                      <span>Dia 15</span>
                      <span>Dia {monthlyData.length || 30}</span>
                    </div>
                  </div>

                </div>

                {/* Form to Set/Update targets on the Right */}
                <div className="glow-zinc-card p-5 rounded-2xl h-fit space-y-4">
                  <div className="border-b border-zinc-900 pb-2">
                    <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] uppercase font-mono tracking-wider font-bold rounded-md inline-block mb-1">
                      Ajuste Orçamentário
                    </span>
                    <h3 className="text-sm font-semibold tracking-wider text-zinc-200 uppercase flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-purple-400" /> Estipular Alvos
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Defina as metas fiduciárias de vendas, excedente de lucro líquido e retirada de pró-labore para o mês ativo</p>
                  </div>

                  <form onSubmit={handleSaveGoalAndSalary} className="space-y-4 text-zinc-300">
                    
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold uppercase text-zinc-400 tracking-wider">
                        Meta de Faturamento Bruto (R$)
                      </label>
                      <input
                        type="number"
                        placeholder={faturamentoGoal > 0 ? `Atual: ${faturamentoGoal}` : "Ex: 15000"}
                        value={tempGoal}
                        onChange={(e) => setTempGoal(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-805 rounded-xl text-zinc-100 placeholder-zinc-550 focus:border-purple-500 outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold uppercase text-zinc-400 tracking-wider">
                        Meta de Lucro Líquido (R$)
                      </label>
                      <input
                        type="number"
                        placeholder={lucroGoal > 0 ? `Atual: ${lucroGoal}` : "Ex: 6000"}
                        value={tempProfitGoal}
                        onChange={(e) => setTempProfitGoal(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-805 rounded-xl text-zinc-100 placeholder-zinc-550 focus:border-purple-500 outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold uppercase text-zinc-400 tracking-wider">
                        Pró-labore Desejado / Meta Salarial (R$)
                      </label>
                      <input
                        type="number"
                        placeholder={salarialGoal > 0 ? `Atual: ${salarialGoal}` : "Ex: 3500"}
                        value={tempSalary}
                        onChange={(e) => setTempSalary(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-805 rounded-xl text-zinc-100 placeholder-zinc-550 focus:border-purple-500 outline-none font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-purple-650 to-purple-600 hover:from-purple-600 hover:to-purple-550 text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-purple-500/10"
                    >
                      Gravar Planejamento
                    </button>
                  </form>
                </div>

              </div>
            );
          })()}
          
        </div>
      )}

      {/* SUBMODULE: EXPENSES */}
      {activeModule === 'despesas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-xs">
          {/* Add Expense Form */}
          <div className="glow-zinc-card p-5 rounded-2xl space-y-4 h-fit">
            <div className="border-b border-zinc-800 pb-2">
              <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] uppercase font-mono tracking-wider font-bold rounded-md inline-block mb-1">
                Administração Operacional
              </span>
              <h3 className="text-sm font-semibold tracking-wider text-zinc-200 uppercase flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-purple-400" /> Registrar Nova Despesa
              </h3>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4 text-zinc-300">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase text-zinc-400">
                  Descrição / Credor *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Aluguel do Box 4B, Energia Coelba..."
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:border-purple-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase text-zinc-400">
                    Categoria
                  </label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:border-purple-500 outline-none"
                  >
                    <option value="Aluguel">Aluguel</option>
                    <option value="Água">Água</option>
                    <option value="Energia">Energia</option>
                    <option value="Internet">Internet</option>
                    <option value="Funcionários">Funcionários</option>
                    <option value="Impostos">Impostos</option>
                    <option value="Outras despesas">Outras despesas</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase text-zinc-400">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:border-purple-500 outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase text-zinc-400">
                  Data de Vencimento *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={expDueDate}
                    onChange={(e) => setExpDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:border-purple-500 outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase text-zinc-400">
                  Situação de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Pendente', 'Pago'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setExpStatus(st as any)}
                      className={`py-2 text-center border rounded-lg transition-all ${
                        expStatus === st 
                          ? 'bg-purple-600 text-white font-bold border-purple-500 shadow-md shadow-purple-500/10' 
                          : 'bg-zinc-900 border-zinc-800 text-zinc-450 hover:text-zinc-200 hover:bg-zinc-850'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-purple-650 to-purple-600 hover:from-purple-600 hover:to-purple-550 text-white font-semibold rounded-lg transition-all shadow-md cursor-pointer"
              >
                Cadastrar Despesa
              </button>
            </form>
          </div>

          {/* List and History of existing expenses with advanced searching/filtering */}
          <div className="lg:col-span-2 glow-zinc-card p-5 rounded-2xl flex flex-col justify-between space-y-4">
            
            {/* Header and Quick Summary Banner */}
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-zinc-900">
                <div>
                  <h3 className="text-sm font-semibold tracking-wider text-zinc-200 uppercase flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-400" /> Histórico e Controle de Compromissos
                  </h3>
                  <p className="text-[10px] text-zinc-500">Audite e filtre os custos e compromissos fiscais de forma inteligente</p>
                </div>
                <span className="px-2.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded-full font-mono text-[10px] text-zinc-400">
                  {expenses.length} totais
                </span>
              </div>

              {/* Quick Sum boxes inside Despesas panel to show total pending vs paid */}
              {expenses.length > 0 && (
                <div className="grid grid-cols-3 gap-3.5 mt-3">
                  <div className="p-2.5 bg-zinc-950 border border-zinc-900/60 rounded-xl space-y-0.5">
                    <span className="text-[8px] text-zinc-550 uppercase tracking-wider font-semibold block">Gasto Total</span>
                    <strong className="text-sm font-mono text-zinc-200">
                      {formatBRL(expenses.reduce((s, e) => s + e.amount, 0))}
                    </strong>
                  </div>
                  <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-0.5 animate-pulse">
                    <span className="text-[8px] text-emerald-500 uppercase tracking-wider font-semibold block">Total Pago</span>
                    <strong className="text-sm font-mono text-emerald-400">
                      {formatBRL(expenses.filter(e => e.status === 'Pago').reduce((s, e) => s + e.amount, 0))}
                    </strong>
                  </div>
                  <div className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-0.5">
                    <span className="text-[8px] text-amber-500 uppercase tracking-wider font-semibold block">Total Pendente</span>
                    <strong className="text-sm font-mono text-amber-400">
                      {formatBRL(expenses.filter(e => e.status === 'Pendente').reduce((s, e) => s + e.amount, 0))}
                    </strong>
                  </div>
                </div>
              )}

              {/* Filter drawer / line */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 p-3 bg-zinc-950/50 border border-zinc-900 rounded-xl">
                <div>
                  <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Pesquisar por Nome</label>
                  <input
                    type="text"
                    placeholder="Filtrar descrição..."
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-250 placeholder-zinc-650 outline-none focus:border-purple-500 font-sans"
                  />
                </div>
                
                <div>
                  <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Filtrar Categoria</label>
                  <select
                    value={expenseCategoryFilter}
                    onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                    className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-250 outline-none focus:border-purple-500 font-sans"
                  >
                    <option value="Todas">Todas as Categorias</option>
                    <option value="Aluguel">Aluguel</option>
                    <option value="Água">Água</option>
                    <option value="Energia">Energia</option>
                    <option value="Internet">Internet</option>
                    <option value="Funcionários">Funcionários</option>
                    <option value="Impostos">Impostos</option>
                    <option value="Outras despesas">Outras despesas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Filtrar Status</label>
                  <div className="flex gap-2">
                    <select
                      value={expenseStatusFilter}
                      onChange={(e) => setExpenseStatusFilter(e.target.value)}
                      className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-250 outline-none focus:border-purple-500 font-sans"
                    >
                      <option value="Todos">Todos os Status</option>
                      <option value="Pago">Pago</option>
                      <option value="Pendente">Pendente</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* List rendered with filtering */}
            {(() => {
              const filteredList = expenses.filter(e => {
                const matchesSearch = e.description.toLowerCase().includes(expenseSearch.toLowerCase());
                const matchesCategory = expenseCategoryFilter === 'Todas' || e.category === expenseCategoryFilter;
                const matchesStatus = expenseStatusFilter === 'Todos' || e.status === expenseStatusFilter;
                return matchesSearch && matchesCategory && matchesStatus;
              });

              return filteredList.length > 0 ? (
                <div className="divide-y divide-zinc-900 overflow-y-auto max-h-[380px] pr-1 space-y-1.5 min-h-[220px] flex-1">
                  {filteredList.map(e => {
                    // Check if a pending bill is past due date
                    const isOverdue = e.status === 'Pendente' && e.dueDate && (new Date(e.dueDate).getTime() < new Date().setHours(0,0,0,0));
                    
                    return (
                      <div key={e.id} className="py-3 first:pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1 select-all">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-zinc-200 text-sm tracking-wide">{e.description}</span>
                            <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 text-[9px] font-mono whitespace-nowrap">
                              {e.category}
                            </span>
                            {isOverdue && (
                              <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[8px] font-mono uppercase font-bold tracking-wide animate-pulse">
                                Atrasado ⚠
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-550">
                            <span>Lançada em: <strong className="text-zinc-400 font-mono">{new Date(e.date).toLocaleDateString('pt-BR')}</strong></span>
                            {e.dueDate && (
                              <span className="flex items-center gap-1">
                                Vence em: 
                                <strong className={`font-mono ${
                                  e.status === 'Pago' 
                                    ? 'text-zinc-500' 
                                    : isOverdue 
                                    ? 'text-red-400 underline font-bold' 
                                    : 'text-amber-400'
                                }`}>
                                  {new Date(e.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                                </strong>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3.5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-900">
                          <span className="font-mono font-bold text-white text-sm">
                            {formatBRL(e.amount)}
                          </span>

                          <div className="flex items-center gap-2.5">
                            {e.status === 'Pendente' ? (
                              <button
                                onClick={() => updateExpense(e.id, { status: 'Pago' })}
                                className="px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold rounded-lg hover:bg-emerald-500 hover:text-black transition-all cursor-pointer shadow-md"
                                title="Clique para quitar e registrar saída automática no caixa"
                              >
                                Marcar Paga
                              </button>
                            ) : (
                              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg flex items-center gap-1">
                                ✓ Quitada
                              </span>
                            )}

                            <button
                              onClick={() => deleteExpense(e.id)}
                              className="p-1.5 bg-zinc-950 border border-zinc-900 text-zinc-500 hover:text-red-400 hover:border-red-500/30 rounded-lg transition-all"
                              title="Deletar despesa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-14 text-center text-zinc-550 border border-dashed border-zinc-900 rounded-xl space-y-2 min-h-[220px] flex flex-col justify-center items-center">
                  <AlertCircle className="w-6 h-6 text-zinc-700" />
                  <p className="text-zinc-500 max-w-[280px]">
                    Niciativa excelente: nenhuma despesa corresponde aos filtros selecionados!
                  </p>
                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* SUBMODULE: CASH LEDGER */}
      {activeModule === 'caixa' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-xs">
          {/* Create Cash Entry (Manual Ledger Adjustment) */}
          <div className="glow-zinc-card p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-semibold tracking-wider text-zinc-200 uppercase flex items-center gap-1.5 pb-2 border-b border-zinc-800">
              <Plus className="w-4 h-4 text-purple-400" /> Ajuste Manual de Caixa
            </h3>

            <form onSubmit={handleAddCashAdjustment} className="space-y-4 text-zinc-300">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase text-zinc-400">
                  Tipo de Lançamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCashType('entrada')}
                    className={`py-2 text-center border rounded-lg transition-all ${
                      cashType === 'entrada' 
                        ? 'bg-emerald-600 text-white font-bold border-emerald-500' 
                        : 'bg-zinc-900 border-zinc-850 text-zinc-450 hover:text-zinc-200'
                    }`}
                  >
                    Entrada (Aporte)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashType('saída')}
                    className={`py-2 text-center border rounded-lg transition-all ${
                      cashType === 'saída' 
                        ? 'bg-rose-600 text-white font-bold border-rose-500' 
                        : 'bg-zinc-900 border-zinc-850 text-zinc-455 hover:text-zinc-200'
                    }`}
                  >
                    Saída (Sangria)
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase text-zinc-400">
                  Motivo / Justificativa *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Troco inicial para o dia, Retirada expressa"
                  value={cashDesc}
                  onChange={(e) => setCashDesc(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:border-purple-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase text-zinc-400">
                    Marcação de Fluxo
                  </label>
                  <select
                    value={cashCategory}
                    onChange={(e) => setCashCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:border-purple-500 outline-none"
                  >
                    <option value="Suprimento">Aporte de Troco</option>
                    <option value="Retirada">Sangria Comercial</option>
                    <option value="Ajuste">Ajuste de Saldo</option>
                    <option value="Outros">Outras Operações</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase text-zinc-400">
                    Valor Monetário (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:border-purple-500 outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-650 hover:bg-purple-600 text-white font-semibold rounded-lg transition-all"
              >
                Faturar no Caixa
              </button>
            </form>
          </div>

          {/* Ledger history list */}
          <div className="lg:col-span-2 glow-zinc-card p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-semibold tracking-wider text-zinc-200 uppercase flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-purple-400" /> Extrato Consolidado do Livro-Caixa
              </span>
              <span className="text-xs font-mono font-medium text-purple-400">
                Lançamentos Totais: {cashEntries.length}
              </span>
            </h3>

            {cashEntries.length > 0 ? (
              <div className="divide-y divide-zinc-800/80 overflow-y-auto max-h-[350px] pr-1 space-y-2">
                {cashEntries.map(entry => (
                  <div key={entry.id} className="py-2 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-100">{entry.description}</p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        Lote: {entry.id.slice(0,8).toUpperCase()} • Categoria: {entry.category} • {new Date(entry.date).toLocaleDateString('pt-BR')} às {new Date(entry.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`font-mono font-bold text-sm ${entry.type === 'entrada' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {entry.type === 'entrada' ? '+' : '-'}{formatBRL(entry.amount)}
                      </span>

                      <button
                        onClick={() => {
                          if (confirm('Aviso: Remover este registro de caixa causará um descompasso artificial no seu saldo comercial consolidado.')) {
                            deleteCashEntry(entry.id);
                          }
                        }}
                        className="p-1.5 bg-zinc-950 border border-zinc-850 text-zinc-650 hover:text-red-400 rounded-md transition-colors"
                        title="Extornar Registro"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-550 border border-dashed border-zinc-800 rounded-xl">
                Nenhum lançamento no fluxo de caixa no momento. Registre vendas ou aportes para popular este livro.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBMODULE: SYSTEM NOTIFICATIONS */}
      {activeModule === 'notificacoes' && (
        <div className="space-y-6 max-w-4xl mx-auto font-sans text-xs">
          
          {/* FCM Control & Simulation Bento Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Column 1: FCM Status & Token Registration */}
            <div className="glow-zinc-card p-5 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] uppercase font-mono tracking-wider font-bold rounded-md inline-block mb-2">
                  Configuração Firebase Cloud Messaging
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-purple-400" /> Web Push & Conexão FCM
                </h3>
                <p className="text-[11px] text-zinc-550 mt-1 leading-relaxed">
                  Gerencie o registro de tokens em tempo real para disparar notificações push diretamente na barra do sistema operacional (Desktop ou Mobile).
                </p>
              </div>

              {/* Status indicators */}
              <div className="bg-zinc-950/80 p-3.5 border border-zinc-900 rounded-xl space-y-2.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-500 font-medium">Suporte do Navegador:</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                    fcmStatus.supported 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/10'
                  }`}>
                    {fcmStatus.supported ? 'Disponível' : 'Incompatível'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-500 font-medium">Permissão de Notificação:</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase pr-2 ${
                    fcmStatus.permission === 'granted' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                      : fcmStatus.permission === 'denied'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/10'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-850'
                  }`}>
                    {fcmStatus.permission === 'granted' ? '✓ Permitido' : fcmStatus.permission === 'denied' ? '✗ Bloqueado' : 'Pendendo'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-500 font-medium">Serviço de Segundo Plano:</span>
                  <span className="font-mono text-purple-400 font-semibold">{fcmStatus.token ? 'CONECTADO' : 'AGUARDANDO ATIVAÇÃO'}</span>
                </div>
              </div>

              {/* Activating Trigger */}
              <div>
                {!fcmStatus.token ? (
                  <button
                    onClick={handleSetupFCM}
                    disabled={fcmLoading}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-650 to-purple-600 hover:from-purple-600 hover:to-purple-550 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-95 disabled:opacity-45"
                  >
                    {fcmLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                        Registrando dispositivo...
                      </>
                    ) : (
                      <>
                        <BellRing className="w-3.5 h-3.5 animate-pulse" />
                        Ativar Push Notifications (FCM)
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-mono leading-none">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Token gerado com sucesso! Use para enviar pushes externos:
                    </div>
                    <div className="flex items-center bg-zinc-950 border border-zinc-900 rounded-lg overflow-hidden pr-1">
                      <div className="flex-1 px-3 py-1.5 font-mono text-[9px] text-zinc-500 overflow-x-auto truncate select-all">
                        {fcmStatus.token}
                      </div>
                      <button
                        onClick={() => copyTokenToClipboard(fcmStatus.token || '')}
                        className="p-1 px-2.5 hover:bg-zinc-900 text-purple-400 hover:text-purple-300 font-bold transition-all border-l border-zinc-900"
                        title="Copiar Token FCM"
                      >
                        {copiedToken ? (
                          <span className="text-emerald-400 text-[9px] font-mono font-bold">Copiado</span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Copy className="w-3 h-3" />
                            <span className="text-[9px]">Copiar</span>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Live Simulator Controls */}
            <div className="glow-zinc-card p-5 rounded-2xl flex flex-col justify-between space-y-4 border border-zinc-805">
              <div>
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] uppercase font-mono tracking-wider font-bold rounded-md inline-block mb-2">
                  Console de Simulação de Vendas
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400 animate-bounce" /> Teste e Auditoria do Fluxo 
                </h3>
                <p className="text-[11px] text-zinc-550 mt-1 leading-relaxed">
                  Sem a necessidade de um dispositivo externo pareado, force a simulação instantânea de uma venda de item vinculado a terceiros e audite o disparo instantâneo.
                </p>
              </div>

              {/* Simulation metrics display detail */}
              <div className="p-3.5 bg-amber-500/5 rounded-xl border border-amber-500/15 text-[11px] leading-relaxed text-amber-500/90 space-y-1.5">
                <p className="font-semibold text-amber-400 uppercase tracking-wider text-[9px] font-mono flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Conduta de simulação automatizada:
                </p>
                <ul className="list-disc list-inside space-y-1 text-zinc-400 text-[10px]">
                  <li>Seleciona um parceiro cadastrado aleatório.</li>
                  <li>Injeta as fórmulas fiduciárias de comissionamento.</li>
                  <li>Registra a notificação em tempo real no cloud Firestore.</li>
                  <li>Emite o toque de alerta <span className="text-purple-400 font-bold">"Chime"</span> acústico em todas as sessões.</li>
                </ul>
              </div>

              <div>
                <button
                  onClick={handleSimulateSaleNotification}
                  className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-amber-500/30 text-amber-400 hover:text-amber-300 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Simular Venda & Alerta em Tempo Real
                </button>
              </div>
            </div>

          </div>

          {/* Large Card: Notification Log */}
          <div className="glow-zinc-card p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-900">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-purple-400 animate-swing" /> Feed de Alertas & Histórico Consolidado
                </h3>
                <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Audite as vendas e transações registradas no cloud e seu sincronismo</p>
              </div>
              <span className="px-2.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded-full font-mono text-[10px] text-zinc-400">
                {notifications.length} cadastrados no banco
              </span>
            </div>

            {notifications.length > 0 ? (
              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                {notifications.map(n => {
                  const isPartnerAlert = !!n.soldProduct;
                  return (
                    <div 
                      key={n.id} 
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-start gap-4 transition-all relative overflow-hidden ${
                        n.read 
                          ? 'bg-zinc-955/35 border-zinc-900/60 text-zinc-500' 
                          : 'bg-purple-950/10 border-purple-500/20 text-zinc-200 shadow-sm shadow-purple-505/5'
                      }`}
                    >
                      {/* Decorative sidebar identifier status */}
                      <span className={`absolute left-0 top-0 bottom-0 w-1 ${
                        n.type === 'success' ? 'bg-emerald-500/60' : n.type === 'warning' ? 'bg-amber-500/60' : 'bg-blue-500/60'
                      }`} />

                      <div className="flex-1 space-y-2">
                        {/* Header metadata */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white tracking-wide">{n.title}</span>
                            {isPartnerAlert && (
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono text-[8px] uppercase font-bold tracking-wide">
                                Venda de Parceiro
                              </span>
                            )}
                          </div>
                          
                          <span className="text-[9px] text-zinc-550 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-purple-500/50 shrink-0" />
                            {new Date(n.date).toLocaleDateString('pt-BR')} • {new Date(n.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Base message */}
                        <p className="text-xs text-zinc-400 leading-normal font-sans">{n.message}</p>

                        {/* Premium decoded receipt bento for Partner-related products (Sells detailed info requested) */}
                        {isPartnerAlert && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-zinc-900/40 text-[11px] font-mono">
                            <div className="space-y-0.5 bg-zinc-950/50 p-2 border border-zinc-900/40 rounded-lg">
                              <span className="text-[8px] text-zinc-550 uppercase tracking-widest block">Produto Vendido</span>
                              <strong className="text-zinc-300 font-sans truncate block">{n.soldProduct}</strong>
                            </div>

                            <div className="space-y-0.5 bg-zinc-950/50 p-2 border border-zinc-900/40 rounded-lg">
                              <span className="text-[8px] text-zinc-550 uppercase tracking-widest block">Quantidade</span>
                              <strong className="text-purple-400">{n.quantity} un</strong>
                            </div>

                            <div className="space-y-0.5 bg-zinc-950/50 p-2 border border-zinc-900/40 rounded-lg">
                              <span className="text-[8px] text-zinc-550 uppercase tracking-widest block">Lucro Parceiro</span>
                              <strong className="text-emerald-400">+ R$ {(n.partnerProfit || 0).toFixed(2)}</strong>
                            </div>

                            <div className="space-y-0.5 bg-zinc-950/50 p-2 border border-zinc-900/40 rounded-lg">
                              <span className="text-[8px] text-zinc-550 uppercase tracking-widest block">Saldo Acumulado</span>
                              <strong className="text-white">R$ {(n.accumulatedBalance || 0).toFixed(2)}</strong>
                            </div>
                          </div>
                        )}

                        {/* Interactive triggers */}
                        {!n.read && (
                          <button 
                            onClick={() => markNotificationAsRead(n.id)}
                            className="text-[10px] font-mono text-purple-400 hover:text-purple-300 font-bold cursor-pointer underline underline-offset-2 mt-1 block"
                          >
                            Marcar alerta como lido
                          </button>
                        )}
                      </div>

                      {/* Right Hand Remove Trigger */}
                      <button
                        onClick={() => clearNotification(n.id)}
                        className="p-1 px-1.5 hover:bg-zinc-950 border border-transparent hover:border-zinc-900 text-zinc-650 hover:text-red-400 rounded-md transition-colors self-start sm:self-center"
                        title="Expurgar Notificação"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-zinc-550 border border-dashed border-zinc-905 rounded-xl space-y-2">
                <Bell className="w-8 h-8 text-zinc-700 mx-auto stroke-[1.2] mb-1" />
                <p className="text-xs text-zinc-500 font-sans max-w-[360px] mx-auto">
                  Nenhum alerta armazenado em tempo real no cloud. Teste disparando agora mesmo clicando em <strong className="text-amber-500">"Simular Venda"</strong> acima!
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* SUBMODULE: INTEL/REPORTS */}
      {activeModule === 'relatorios' && (
        <div className="space-y-6 font-sans text-xs">
          
          {/* Timescale Selector Widget */}
          <div className="glow-zinc-card p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-purple-500/10">
            <div>
              <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] uppercase font-mono tracking-wider font-bold rounded-md inline-block mb-1">
                Filtro de Escala Temporal
              </span>
              <h3 className="text-sm font-semibold tracking-wider text-zinc-200 uppercase">
                Janela de Consolidação de Resultados
              </h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Dedução em tempo real de despesas operacionais nos relatórios de lucro líquido</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center bg-zinc-950 p-1 border border-zinc-900 rounded-lg">
                <button
                  type="button"
                  onClick={() => setReportPeriod('selected')}
                  className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                    reportPeriod === 'selected'
                      ? 'bg-purple-650 text-white shadow'
                      : 'text-zinc-550 hover:text-zinc-200'
                  }`}
                >
                  Mensal ({selectedMonth})
                </button>
                <button
                  type="button"
                  onClick={() => setReportPeriod('all')}
                  className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                    reportPeriod === 'all'
                      ? 'bg-purple-650 text-white shadow'
                      : 'text-zinc-550 hover:text-zinc-200'
                  }`}
                >
                  Consolidado Geral
                </button>
              </div>

              {reportPeriod === 'selected' && (
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:border-purple-500 outline-none font-mono"
                />
              )}
            </div>
          </div>

          {/* Performance Report Grid Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Calculation details */}
            {(() => {
              // Get active data based on selection timescale
              const targetEntries = reportPeriod === 'all' 
                ? cashEntries 
                : cashEntries.filter(c => c.date && c.date.slice(0, 7) === selectedMonth);

              const activeSales = useReino().sales;
              const targetSales = reportPeriod === 'all'
                ? activeSales
                : activeSales.filter(s => s.date && s.date.slice(0, 7) === selectedMonth);

              const targetExpenses = reportPeriod === 'all'
                ? expenses
                : expenses.filter(e => (e.dueDate || e.date).slice(0, 7) === selectedMonth);

              // 1. Total revenue
              const totalRevenue = targetEntries
                .filter(c => c.type === 'entrada' && c.category === 'Vendas')
                .reduce((sum, item) => sum + item.amount, 0);

              // 2. Total cost of goods sold (COGS)
              const totalCOGS = targetSales.reduce((sum, sale) => {
                const saleCost = sale.items.reduce((s2, i) => s2 + (i.costPrice * i.quantity), 0);
                return sum + saleCost;
              }, 0);

              // 3. Margin after goods cost
              const grossProfit = totalRevenue - totalCOGS;

              // 4. Total operational expenses (All expenses marked 'Pago')
              const paidExpensesTotal = targetExpenses
                .filter(e => e.status === 'Pago')
                .reduce((sum, e) => sum + e.amount, 0);

              // Total pending expenses in timeframe
              const pendingExpensesTotal = targetExpenses
                .filter(e => e.status === 'Pendente')
                .reduce((sum, e) => sum + e.amount, 0);

              // 5. Total commissions
              const paidCommissionsTotal = targetSales.reduce((sum, sale) => sum + (sale.commissionAmount || 0), 0);

              // 6. Real Net Margin is (Gross Profit - Paid Expenses - Paid Commissions)
              // We also deduct pending expenses if we want a conservative, highly accurate net margin showing actual expected profits!
              // Let us deduct the operational costs of the period to yield net profit.
              const netProfit = grossProfit - paidExpensesTotal - paidCommissionsTotal - pendingExpensesTotal;

              // Budget targets
              const currentMonthGoal = goals.find(g => g.yearMonth === selectedMonth)?.targetValue || 0;
              const desiredSalaryVal = desiredSalaries.find(d => d.yearMonth === selectedMonth)?.amount || 0;

              return (
                <>
                  {/* Revenue Card */}
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-1 relative overflow-hidden">
                    <span className="text-zinc-550 text-[10px] uppercase font-semibold">Faturamento Líquido</span>
                    <p className="text-xl font-mono text-white font-bold">{formatBRL(totalRevenue)}</p>
                    <p className="text-[10px] text-zinc-500">Faturamento bruto registrado {reportPeriod === 'all' ? 'acumulado' : `em ${selectedMonth}`}</p>
                    <div className="absolute right-3 bottom-3 opacity-10 font-bold font-sans text-5xl">+$</div>
                  </div>

                  {/* COGS Card */}
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-1 relative overflow-hidden">
                    <span className="text-zinc-550 text-[10px] uppercase font-semibold">Custo de Reposição (CMV)</span>
                    <p className="text-xl font-mono text-red-400 font-bold">-{formatBRL(totalCOGS)}</p>
                    <p className="text-[10px] text-zinc-500">Preço de compra dos itens comercializados</p>
                    <div className="absolute right-3 bottom-0.5 opacity-10 font-bold font-sans text-5xl text-red-500">▼</div>
                  </div>

                  {/* Active Cash Expense */}
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-1 relative overflow-hidden">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-550 text-[10px] uppercase font-semibold block">Despesas / Custos</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400">
                        {targetExpenses.length}un
                      </span>
                    </div>
                    <p className="text-xl font-mono text-amber-500 font-bold">-{formatBRL(paidExpensesTotal + pendingExpensesTotal + paidCommissionsTotal)}</p>
                    <div className="flex flex-col text-[9px] text-zinc-500 mt-1 space-y-0.5 font-sans">
                      <span className="flex justify-between">
                        <span>• Contas Quita./Comis.:</span>
                        <strong className="text-zinc-400 font-mono">{formatBRL(paidExpensesTotal + paidCommissionsTotal)}</strong>
                      </span>
                      <span className="flex justify-between">
                        <span>• Boletos Pendentes:</span>
                        <strong className="text-amber-400 font-mono">{formatBRL(pendingExpensesTotal)}</strong>
                      </span>
                    </div>
                  </div>

                  {/* REAL NET MARGIN */}
                  <div className="bg-zinc-100/5 hover:bg-zinc-100/10 border border-zinc-850 p-5 rounded-2xl space-y-1 relative overflow-hidden transition-all duration-300">
                    <span className="text-neutral-400 text-[10px] uppercase font-bold tracking-wider block">Resultado Líquido</span>
                    <p className={`text-xl font-mono font-black ${netProfit < 0 ? 'text-red-450' : 'text-emerald-400'}`}>
                      {formatBRL(netProfit)}
                    </p>
                    <p className="text-[10px] text-zinc-500">Dedução total de todas as despesas</p>
                    <div className={`absolute right-3 bottom-2 text-3xl font-bold font-mono opacity-15 ${netProfit < 0 ? 'text-red-400' : 'text-emerald-500'}`}>
                      {netProfit >= 0 ? '✓' : '⚠'}
                    </div>
                  </div>

                  {/* Core Intelligence Text Insights */}
                  <div className="md:col-span-4 glow-zinc-card p-6 rounded-2xl space-y-4 border border-purple-500/10">
                    <h3 className="text-xs font-bold font-sans uppercase tracking-wider text-purple-450 flex items-center gap-1.5 pb-2 border-b border-zinc-900">
                      <AlertCircle className="w-4 h-4 text-purple-400" /> Diagnóstico de Saúde Fiduciária ("Reino Gestão")
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-zinc-300">Suficiência de Provisão de Trabalho</h4>
                        {desiredSalaryVal > 0 ? (
                          netProfit >= desiredSalaryVal ? (
                            <p className="text-emerald-400 text-xs leading-normal">
                              ✓ Excelente! Seu lucro líquido {reportPeriod === 'all' ? 'acumulado ' : ''}de ({formatBRL(netProfit)}) é SUFICIENTE para prover com folga seu pró-labore almejado de ({formatBRL(desiredSalaryVal)}) para {selectedMonth}. Loja saudável e auto-sustentada.
                            </p>
                          ) : (
                            <p className="text-amber-500 text-xs leading-normal">
                              ⚠ Atenção: Seu resultado líquido {reportPeriod === 'all' ? 'acumulado ' : ''}({formatBRL(netProfit)}) ainda está abaixo do seu pró-labore ideal de ({formatBRL(desiredSalaryVal)}). É preciso captar {formatBRL(desiredSalaryVal - netProfit)} adicionais de margem operacional líquida para bater sua meta pessoal.
                            </p>
                          )
                        ) : (
                          <p className="text-zinc-550 italic leading-normal">
                            Defina seu Pró-labore Ideal na aba Metas para avaliar a capacidade auto-sustentável do caixa operacional.
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-semibold text-zinc-300">Alvo de Faturamento Bruto</h4>
                        {currentMonthGoal > 0 ? (
                          totalRevenue >= currentMonthGoal ? (
                            <p className="text-emerald-400 text-xs leading-normal">
                              👑 Objetivo comercial batido! Suas vendas brutas de ({formatBRL(totalRevenue)}) romperam brilhantemente o alvo de faturamento estipulado em ({formatBRL(currentMonthGoal)}). Unidade de alto giro comercial.
                            </p>
                          ) : (
                            <p className="text-zinc-400 text-xs leading-normal">
                              Falta pouco! Suas vendas brutas de ({formatBRL(totalRevenue)}) representam {currentMonthGoal > 0 ? Math.round((totalRevenue / currentMonthGoal) * 100) : 0}% do objetivo comercial estabelecido de {formatBRL(currentMonthGoal)} para este ciclo.
                            </p>
                          )
                        ) : (
                          <p className="text-zinc-550 italic leading-normal">
                            Cadastre seu Alvo Comercial de Faturamento Bruto para usufruir dos algoritmos de meta-alarme em tempo real.
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-semibold text-zinc-300">Retorno sobre Reposição (R.O.I)</h4>
                        {totalCOGS > 0 ? (
                          <p className="text-purple-300 text-xs leading-normal">
                            Sua taxa bruta de acréscimo sobre custo médio de reposição de acervo está fixada em {Math.round((grossProfit / totalCOGS) * 100)}%. Para cada R$ 1,00 gasto no atacado de mercadorias, a loja gera R$ {(totalRevenue / totalCOGS).toFixed(2)} de faturamento bruto no varejo.
                          </p>
                        ) : (
                          <p className="text-zinc-550 italic leading-normal">
                            Gire ao menos uma venda faturando produtos com preços de custo declarados para ativar os indicadores de Markup do Reino.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Month-over-Month Consolidated ledger metrics matrix */}
                  <div className="md:col-span-4 glow-zinc-card p-6 rounded-2xl space-y-4">
                    <div className="border-b border-zinc-900 pb-2">
                      <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        📂 Demonstrativo de Resultados Mensais (Histórico Consolidado)
                      </h4>
                      <p className="text-[10px] text-zinc-550 font-sans mt-0.5">Audite as receitas e deduções de despesas de cada período fiscal individualmente</p>
                    </div>

                    {(() => {
                      // Compile months
                      const allMonths = Array.from(new Set([
                        ...cashEntries.map(c => c.date?.slice(0, 7)),
                        ...expenses.map(e => (e.dueDate || e.date).slice(0, 7)),
                        ...activeSales.map(s => s.date?.slice(0, 7))
                      ].filter(Boolean))).sort().reverse();

                      if (allMonths.length === 0) {
                        return (
                          <p className="text-zinc-550 italic text-center py-6">Não há registros de lançamentos fiduciários ativos.</p>
                        );
                      }

                      return (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left font-sans text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-zinc-800 text-zinc-550 uppercase tracking-widest text-[9px] font-bold">
                                <th className="py-2.5">Mês de Competência</th>
                                <th className="py-2.5 text-right">Faturamento S.I</th>
                                <th className="py-2.5 text-right font-mono">Reposição (CVM)</th>
                                <th className="py-2.5 text-right font-mono">Despesas Quitas.</th>
                                <th className="py-2.5 text-right font-mono text-amber-500">Boletos Pend.</th>
                                <th className="py-2.5 text-right font-mono">Taxas/Comissões</th>
                                <th className="py-2.5 text-right font-bold text-white">Lucro Líquido</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-850 text-zinc-300">
                              {allMonths.map(mMonth => {
                                const mEntries = cashEntries.filter(c => c.date?.slice(0, 7) === mMonth);
                                const mSales = activeSales.filter(s => s.date?.slice(0, 7) === mMonth);
                                const mExpenses = expenses.filter(e => (e.dueDate || e.date).slice(0, 7) === mMonth);

                                const mRevenue = mEntries.filter(c => c.type === 'entrada' && c.category === 'Vendas').reduce((sum, item) => sum + item.amount, 0);
                                const mCOGS = mSales.reduce((sum, sale) => sum + sale.items.reduce((s2, i) => s2 + (i.costPrice * i.quantity), 0), 0);
                                const mPaidExp = mExpenses.filter(e => e.status === 'Pago').reduce((sum, e) => sum + e.amount, 0);
                                const mPendingExp = mExpenses.filter(e => e.status === 'Pendente').reduce((sum, e) => sum + e.amount, 0);
                                const mComissions = mSales.reduce((sum, sale) => sum + (sale.commissionAmount || 0), 0);
                                
                                const mNetProfit = (mRevenue - mCOGS) - mPaidExp - mComissions - mPendingExp;

                                return (
                                  <tr key={mMonth} className="hover:bg-zinc-950/40 transition-colors">
                                    <td className="py-3 font-bold text-zinc-200 uppercase">{mMonth}</td>
                                    <td className="py-3 text-right font-mono">{formatBRL(mRevenue)}</td>
                                    <td className="py-3 text-right font-mono text-red-400">-{formatBRL(mCOGS)}</td>
                                    <td className="py-3 text-right font-mono text-zinc-400">-{formatBRL(mPaidExp)}</td>
                                    <td className="py-3 text-right font-mono text-amber-500">-{formatBRL(mPendingExp)}</td>
                                    <td className="py-3 text-right font-mono text-zinc-400">-{formatBRL(mComissions)}</td>
                                    <td className={`py-3 text-right font-mono font-bold ${mNetProfit >= 0 ? 'text-emerald-450' : 'text-red-400'}`}>
                                      {formatBRL(mNetProfit)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
