import React, { useState } from 'react';
import { useReino } from '../store';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Target, 
  Calendar,
  AlertCircle,
  Package,
  Clock,
  ChevronRight,
  TrendingDown,
  Percent,
  CheckCircle,
  AlertTriangle,
  Activity,
  Award,
  Plus,
  PiggyBank
} from 'lucide-react';
import { motion } from 'motion/react';

export const Dashboard: React.FC = () => {
  const { 
    sales, 
    expenses, 
    cashEntries, 
    goals, 
    desiredSalaries, 
    products, 
    stores, 
    activeStoreId 
  } = useReino();

  const [activeSubTab, setActiveSubTab] = useState<'geral' | 'alertas' | 'historico'>('geral');

  // Find active store details
  const currentStore = stores.find(s => s.id === activeStoreId);

  // Dates
  const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const currentMonthStr = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  // 1. Daily Metrics
  const todaySales = sales.filter(s => s.date.slice(0, 10) === todayStr);
  const totalSalesToday = todaySales.reduce((acc, current) => acc + current.total, 0);
  const totalProfitToday = todaySales.reduce((acc, current) => acc + current.profit, 0);

  // 2. Monthly Metrics
  const monthSales = sales.filter(s => s.date.slice(0, 7) === currentMonthStr);
  const totalSalesMonth = monthSales.reduce((acc, current) => acc + current.total, 0);
  const totalProfitMonth = monthSales.reduce((acc, current) => acc + current.profit, 0);

  const monthExpenses = expenses.filter(e => {
    const expenseTargetMonth = (e.dueDate || e.date).slice(0, 7);
    return expenseTargetMonth === currentMonthStr;
  });
  const totalExpensesMonth = monthExpenses.reduce((acc, current) => acc + current.amount, 0);

  // 3. Current cash balance calculation
  const balance = cashEntries.reduce((acc, current) => {
    if (current.type === 'entrada') return acc + current.amount;
    if (current.type === 'saída') return acc - current.amount;
    return acc;
  }, 0);

  // 4. Pending bills (Contas Pendentes) - Filtering unpaid expenses
  const pendingExpenses = expenses.filter(e => e.status === 'Pendente');
  const countPendingExpenses = pendingExpenses.length;
  const totalPendingExpensesAmount = pendingExpenses.reduce((acc, e) => acc + e.amount, 0);

  // 5. Products with low stock
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const countLowStock = lowStockProducts.length;

  // Rendimento Líquido (Net profit) is sales profit of the month minus monthly expenses
  const netProfitMonth = totalProfitMonth - totalExpensesMonth;

  // 6. Sales Goal Metric
  const currentGoal = goals.find(g => g.yearMonth === currentMonthStr);
  const salesGoalValue = currentGoal ? currentGoal.targetValue : 0;
  const salesGoalProgress = salesGoalValue > 0 ? Math.min(100, Math.round((totalSalesMonth / salesGoalValue) * 100)) : 0;
  const salesGoalGap = Math.max(0, salesGoalValue - totalSalesMonth);

  // 6.5. Profit Goal Metric
  const profitGoalValue = currentGoal ? (currentGoal.profitTargetValue || 0) : 0;
  const profitGoalProgress = profitGoalValue > 0 ? Math.max(0, Math.min(100, Math.round((netProfitMonth / profitGoalValue) * 100))) : 0;
  const profitGoalGap = Math.max(0, profitGoalValue - netProfitMonth);

  // 7. Salary Goal Metric (Meta Salarial)
  const currentSalaryGoal = desiredSalaries.find(d => d.yearMonth === currentMonthStr);
  const salaryGoalValue = currentSalaryGoal ? currentSalaryGoal.amount : 0;
  
  const salaryGoalProgress = salaryGoalValue > 0 ? Math.max(0, Math.min(100, Math.round((netProfitMonth / salaryGoalValue) * 100))) : 0;
  const salaryGoalGap = Math.max(0, salaryGoalValue - netProfitMonth);

  // Format monetary values safely
  const formatBRL = (val: number) => {
    return (val || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };
  const formatCurrency = formatBRL;

  const getMonthName = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${months[parseInt(month, 10) - 1]} de ${year}`;
  };

  // Entry animations container parameters
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 25 } }
  };

  return (
    <div className="space-y-6 relative selection:bg-purple-600 selection:text-white">
      {/* Glow lights behind content */}
      <div className="absolute top-0 left-1/4 w-[350px] h-[350px] bg-purple-900/10 rounded-full blur-[125px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[280px] h-[280px] bg-indigo-900/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-6 bg-zinc-900/35 border border-purple-500/10 rounded-3xl gap-4 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <span className="px-2.5 py-0.5 bg-purple-600/15 text-purple-400 border border-purple-500/20 text-[9px] uppercase font-mono tracking-[0.15em] font-bold rounded-md mb-2 inline-block">
            Centro de Comando Unificado
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white font-sans uppercase">
            Painel Geral do Lojista
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Gere o caixa, monitore despesas e controle o saldo das operações da filial <strong className="text-purple-400 font-semibold">{currentStore?.name || 'Filial Principal'}</strong>
          </p>
        </div>

        {/* Date Selector Badge */}
        <div className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-zinc-900 to-zinc-950 border border-purple-500/15 rounded-xl w-fit self-start md:self-center shadow-lg shadow-black/30">
          <Calendar className="w-4 h-4 text-purple-400" />
          <span className="text-zinc-200 text-xs font-mono font-medium">
            {getMonthName(currentMonthStr)}
          </span>
        </div>
      </div>

      {/* Tabs Selector for Command Center Details */}
      <div className="flex border-b border-zinc-900 gap-1.5 pb-0.5">
        <button
          onClick={() => setActiveSubTab('geral')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
            activeSubTab === 'geral'
              ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Métricas e Desempenho
        </button>
        <button
          onClick={() => setActiveSubTab('alertas')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 relative ${
            activeSubTab === 'alertas'
              ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Alertas e Pendências
          {(countLowStock > 0 || countPendingExpenses > 0) && (
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('historico')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
            activeSubTab === 'historico'
              ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Movimentações do Caixa
        </button>
      </div>

      {activeSubTab === 'geral' && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* DAILY PERFORMANCE ROW */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-400 pl-1 mb-3">
              Fluxo Diário
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Card 1: Vendas do Dia */}
              <motion.div 
                variants={itemVariants}
                className="glow-zinc-card p-5 rounded-2xl relative overflow-hidden group border border-purple-500/10"
              >
                <div className="absolute top-3 right-4 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] uppercase font-mono rounded-md font-bold border border-emerald-500/20">
                  Hoje
                </div>
                <div className="flex items-center gap-2.5 text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2.5 font-sans">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  Vendas do dia
                </div>
                <p className="text-3xl font-extrabold font-mono text-zinc-50 group-hover:text-emerald-400 transition-colors">
                  {formatCurrency(totalSalesToday)}
                </p>
                <p className="text-[10px] text-zinc-500 mt-2 font-sans flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  <span>{todaySales.length} {todaySales.length === 1 ? 'venda registrada' : 'vendas registradas'} hoje</span>
                </p>
              </motion.div>

              {/* Card 2: Lucro do Dia */}
              <motion.div 
                variants={itemVariants}
                className="glow-zinc-card p-5 rounded-2xl relative overflow-hidden group border border-purple-500/10"
              >
                <div className="absolute top-3 right-4 px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[9px] uppercase font-mono rounded-md font-bold border border-purple-500/20">
                  Dia
                </div>
                <div className="flex items-center gap-2.5 text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2.5 font-sans">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  Lucro do dia
                </div>
                <p className="text-3xl font-extrabold font-mono text-zinc-50 group-hover:text-purple-400 transition-colors">
                  {formatCurrency(totalProfitToday)}
                </p>
                <p className="text-[10px] text-zinc-500 mt-2 font-sans">
                  Margem líquida descontando custos de estoque
                </p>
              </motion.div>

            </div>
          </div>

          {/* MONTHLY ACCUMULATED PERFORMANCE ROW */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-400 pl-1 mb-3">
              Acumulado Mensal e Caixa
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 3: Vendas do Mês */}
              <motion.div variants={itemVariants} className="glow-zinc-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[140px] group">
                <div className="flex items-center justify-between pointer-events-none mb-3">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-purple-400">Vendas do Mês</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/15">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-extrabold font-mono text-white group-hover:text-purple-300 transition-colors leading-none mb-1">
                    {formatBRL(totalSalesMonth)}
                  </h4>
                  <p className="text-[10px] text-zinc-500">
                    {monthSales.length} transações no mês
                  </p>
                </div>
              </motion.div>

              {/* Card 4: Lucro do Mês */}
              <motion.div variants={itemVariants} className="glow-zinc-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[140px] group">
                <div className="flex items-center justify-between pointer-events-none mb-3">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-purple-400">Lucro do Mês</span>
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/15">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-extrabold font-mono text-emerald-400 leading-none mb-1">
                    {formatBRL(totalProfitMonth)}
                  </h4>
                  <p className="text-[10px] text-zinc-500">
                    Soma de lucros unitários
                  </p>
                </div>
              </motion.div>

              {/* Card 5: Despesas do Mês */}
              <motion.div variants={itemVariants} className="glow-zinc-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[140px] group">
                <div className="flex items-center justify-between pointer-events-none mb-3">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-purple-400">Despesas do Mês</span>
                  <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/15">
                    <ArrowDownLeft className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-extrabold font-mono text-zinc-100 group-hover:text-rose-400 transition-colors leading-none mb-1">
                    {formatBRL(totalExpensesMonth)}
                  </h4>
                  <p className="text-[10px] text-zinc-500">
                    {monthExpenses.length} despesas lançadas
                  </p>
                </div>
              </motion.div>

              {/* Card 6: Saldo Atual */}
              <motion.div variants={itemVariants} className="glow-zinc-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[140px] group">
                <div className="flex items-center justify-between pointer-events-none mb-3">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-purple-400">Saldo Atual</span>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                    balance >= 0 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' 
                      : 'bg-red-500/10 text-red-400 border-red-500/15'
                  }`}>
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h4 className={`text-xl font-extrabold font-mono leading-none mb-1 ${
                    balance >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {formatBRL(balance)}
                  </h4>
                  <p className="text-[10px] text-zinc-500">
                    Saldo disponível em caixa
                  </p>
                </div>
              </motion.div>

            </div>
          </div>

          {/* CRITICAL INDICATORS & CONTROL PANEL */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Card 7: Contas Pendentes */}
            <motion.div variants={itemVariants} className="glow-zinc-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[145px] hover:border-rose-500/20">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-rose-400">Contas Pendentes</span>
                  <p className="text-[11px] text-zinc-400 font-sans mt-0.5">Soma de obrigações em aberto</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/15">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <h4 className="text-2xl font-extrabold font-mono text-zinc-100 mb-1">
                    {formatBRL(totalPendingExpensesAmount)}
                  </h4>
                  <p className="text-[10px] text-zinc-500">
                    {countPendingExpenses} {countPendingExpenses === 1 ? 'conta aguardando pagamento' : 'contas aguardando pagamento'}
                  </p>
                </div>
                {countPendingExpenses > 0 && (
                  <button
                    onClick={() => setActiveSubTab('alertas')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-zinc-950 border border-zinc-900 hover:border-rose-400/20 text-[10px] text-rose-400 hover:text-rose-300 font-semibold rounded-lg transition-all"
                  >
                    Ver Contas <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </motion.div>

            {/* Card 8: Produtos em Estoque Baixo */}
            <motion.div variants={itemVariants} className="glow-zinc-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[145px] hover:border-amber-500/20">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-500">Alertas de Estoque</span>
                  <p className="text-[11px] text-zinc-400 font-sans mt-0.5">Itens em nível crítico ou nulo</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/15">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <h4 className="text-2xl font-extrabold font-mono text-zinc-100 mb-1">
                    {countLowStock} {countLowStock === 1 ? 'Produto' : 'Produtos'}
                  </h4>
                  <p className="text-[10px] text-zinc-500">
                    Abaixo do estoque mínimo configurado
                  </p>
                </div>
                {countLowStock > 0 && (
                  <button
                    onClick={() => setActiveSubTab('alertas')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-zinc-950 border border-zinc-900 hover:border-amber-400/20 text-[10px] text-amber-400 hover:text-amber-300 font-semibold rounded-lg transition-all"
                  >
                    Repor Estoque <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </motion.div>

          </div>

          {/* TARGETS AND PERCENTAGES ROW */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-400 pl-1 mb-3">
              Metas e Objetivos do Ciclo
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Card 9: Meta de Vendas */}
              <motion.div variants={itemVariants} className="glow-zinc-card p-5 rounded-2xl border border-purple-500/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-sans flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-purple-400" />
                      Meta de Vendas Mensal
                    </h4>
                    <p className="text-[10px] text-zinc-500">
                      Progresso de faturamento do ciclo ativo
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md font-mono text-xs font-semibold">
                    {salesGoalProgress}%
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-850">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${salesGoalProgress}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-[11px] text-zinc-400 font-sans">
                    <span>Atual: <strong>{formatBRL(totalSalesMonth)}</strong></span>
                    <span>Alvo: <strong>{formatBRL(salesGoalValue)}</strong></span>
                  </div>
                </div>

                {salesGoalValue > 0 ? (
                  <p className="text-[10px] text-zinc-500 font-sans pt-1 border-t border-zinc-900">
                    {salesGoalGap > 0 ? (
                      <>Faltam <strong className="text-purple-400 font-mono">{formatBRL(salesGoalGap)}</strong> para atingir sua meta empresarial do mês.</>
                    ) : (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Meta Atingida com Sucesso! 👑
                      </span>
                    )}
                  </p>
                ) : (
                  <div className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-900 font-sans flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-zinc-650 shrink-0" />
                    <span>Nenhuma meta de vendas cadastrada para este mês na aba Administração Geral.</span>
                  </div>
                )}
              </motion.div>

              {/* Card 9.5: Meta de Lucro Líquido */}
              <motion.div variants={itemVariants} className="glow-zinc-card p-5 rounded-2xl border border-purple-500/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-sans flex items-center gap-1.5">
                      <PiggyBank className="w-4 h-4 text-emerald-400" />
                      Meta de Lucro Líquido
                    </h4>
                    <p className="text-[10px] text-zinc-500">
                      Rendimento líquido real pós custos e taxas
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-mono text-xs font-semibold">
                    {profitGoalProgress}%
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-850">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${profitGoalProgress}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-[11px] text-zinc-400 font-sans">
                    <span>Atual: <strong className={netProfitMonth >= 0 ? 'text-emerald-400' : 'text-red-405'}>{formatBRL(netProfitMonth)}</strong></span>
                    <span>Alvo: <strong>{formatBRL(profitGoalValue)}</strong></span>
                  </div>
                </div>

                {profitGoalValue > 0 ? (
                  <p className="text-[10px] text-zinc-500 font-sans pt-1 border-t border-zinc-900">
                    {profitGoalGap > 0 ? (
                      <>Faltam <strong className="text-emerald-400 font-mono">{formatBRL(profitGoalGap)}</strong> de excedente líquido para atingir sua meta empresarial do mês.</>
                    ) : (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Meta de Lucro Batida! 🎉
                      </span>
                    )}
                  </p>
                ) : (
                  <div className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-900 font-sans flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-zinc-650 shrink-0" />
                    <span>Nenhuma meta de lucro líquido cadastrada para este mês na aba Administração Geral.</span>
                  </div>
                )}
              </motion.div>

              {/* Card 10: Meta Salarial (Pró-labore Almejado) */}
              <motion.div variants={itemVariants} className="glow-zinc-card p-5 rounded-2xl border border-purple-500/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-sans flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-purple-400" />
                      Margem de Pró-labore (Meta Salarial)
                    </h4>
                    <p className="text-[10px] text-zinc-500">
                      Pró-labore suportado pelo rendimento líquido mensal
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-mono text-xs font-semibold">
                    {salaryGoalProgress}%
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-850">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${salaryGoalProgress}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-[11px] text-zinc-400 font-sans">
                    <span>Líquido: <strong className={netProfitMonth >= 0 ? 'text-emerald-400' : 'text-red-400'}>{formatBRL(netProfitMonth)}</strong></span>
                    <span>Alvo Salarial: <strong>{formatBRL(salaryGoalValue)}</strong></span>
                  </div>
                </div>

                {salaryGoalValue > 0 ? (
                  <p className="text-[10px] text-zinc-500 font-sans pt-1 border-t border-zinc-900">
                    {salaryGoalGap > 0 ? (
                      <>Faltam <strong className="text-emerald-400 font-mono">{formatBRL(salaryGoalGap)}</strong> de lucro líquido restante para assegurar seu pró-labore.</>
                    ) : (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Pró-labore 100% Coberto & Garantido! 👑
                      </span>
                    )}
                  </p>
                ) : (
                  <div className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-900 font-sans flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-zinc-650 shrink-0" />
                    <span>Nenhuma meta salarial cadastrada para este mês na aba Administração Geral.</span>
                  </div>
                )}
              </motion.div>

            </div>
          </div>
        </motion.div>
      )}

      {/* SUB-TAB: ALERTS & PENDENCIES */}
      {activeSubTab === 'alertas' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Contas Pendentes Table List */}
          <div className="glow-zinc-card p-6 rounded-2xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-400" />
                Contas a Pagar Pendentes ({countPendingExpenses})
              </h3>
              <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                Obrigações e despesas mensais não quitadas
              </p>
            </div>

            {pendingExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 bg-zinc-950/40 rounded-xl border border-zinc-900/60 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-550 mb-2 stroke-[1.5]" />
                <p className="text-xs text-zinc-400 font-sans font-medium">Todas as despesas em dia!</p>
                <p className="text-[10px] text-zinc-500 font-sans max-w-[200px] mt-1">Nenhuma conta pendente para este reino comercial.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {pendingExpenses.map(exp => (
                  <div key={exp.id} className="p-3 bg-zinc-950 border border-zinc-900 hover:border-purple-500/10 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-200 font-semibold font-sans">{exp.description}</p>
                      <p className="text-[10px] text-zinc-500 mt-1 font-sans">
                        Em: {new Date(exp.date).toLocaleDateString('pt-BR')} • Categoria: {exp.category}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-rose-400 shrink-0">
                      {formatBRL(exp.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Produtos com Estoque Baixo Table List */}
          <div className="glow-zinc-card p-6 rounded-2xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                Produtos com Estoque Baixo ({countLowStock})
              </h3>
              <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                Mercadorias exigindo reposição para evitar ruptura
              </p>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 bg-zinc-950/40 rounded-xl border border-zinc-900/60 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-550 mb-2 stroke-[1.5]" />
                <p className="text-xs text-zinc-400 font-sans font-medium">Estoque saudável!</p>
                <p className="text-[10px] text-zinc-500 font-sans max-w-[200px] mt-1">Todos os seus SKU estão acima do estoque mínimo de alerta.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {lowStockProducts.map(prod => (
                  <div key={prod.id} className="p-3 bg-zinc-950 border border-zinc-900 hover:border-purple-500/10 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-200 font-semibold font-sans">{prod.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                        Cód: {prod.code} • Mínimo: {prod.minStock} un
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 font-bold font-mono text-[11px] rounded-lg border ${
                      prod.stock === 0 
                        ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                    }`}>
                      {prod.stock === 0 ? 'Zerado' : `${prod.stock} un`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* SUB-TAB: CASH FLOW ENTRIES */}
      {activeSubTab === 'historico' && (
        <div className="glow-zinc-card p-6 rounded-2xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              Lançamentos Financeiros do Caixa
            </h3>
            <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
              Razão contábil detalhado de entradas e saídas físicas
            </p>
          </div>

          {cashEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 bg-zinc-950/40 rounded-xl border border-zinc-900/60 text-center">
              <Activity className="w-8 h-8 text-zinc-750 mb-2 stroke-[1.5]" />
              <p className="text-xs text-zinc-500 font-sans max-w-[260px]">
                Nenhuma entrada ou saída de caixa registrada atualmente nesta loja.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-550 font-mono text-[10px] uppercase">
                    <th className="py-2 px-1">Data</th>
                    <th className="py-2 px-1">Lançamento / Histórico</th>
                    <th className="py-2 px-1">Categoria</th>
                    <th className="py-2 px-1 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/45 text-zinc-300">
                  {cashEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-zinc-900/10 transition-all font-sans">
                      <td className="py-3.5 px-1 font-mono text-zinc-500 text-[11px]">
                        {new Date(entry.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3.5 px-1 text-zinc-200 font-medium">
                        {entry.description}
                      </td>
                      <td className="py-3.5 px-1">
                        <span className="px-2 py-0.5 bg-zinc-900 text-purple-300 border border-purple-500/10 text-[10px] font-mono rounded-md">
                          {entry.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-1 text-right font-mono font-bold">
                        <span className={entry.type === 'entrada' ? 'text-emerald-400' : 'text-red-400'}>
                          {entry.type === 'entrada' ? '+' : '-'}{formatCurrency(entry.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
