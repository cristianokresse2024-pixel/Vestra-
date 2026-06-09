import React, { useState, useMemo } from 'react';
import { useReino } from '../store';
import { useAuth } from '../auth';
import { 
  Users, 
  DollarSign, 
  Activity, 
  Package, 
  History, 
  TrendingUp, 
  Wallet, 
  CheckCircle,
  Clock,
  LogOut,
  Search,
  Building,
  ArrowRight,
  FileText
} from 'lucide-react';

interface PartnerDashboardProps {
  linkedPartnerId?: string;
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ linkedPartnerId }) => {
  const { profile, logout } = useAuth();
  const { products, sales, partners, activeStoreId, stores } = useReino();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'produtos' | 'extrato'>('produtos');

  const activeStoreObj = stores.find(s => s.id === activeStoreId);

  // Find partner details if linkedPartnerId is present
  const currentPartner = partners.find(p => p.id === linkedPartnerId);
  const partnerName = currentPartner?.name || profile?.name || 'Parceiro Imperial';

  // Filter products unrolled to this partner
  const linkedProducts = products.filter(p => p.partnerId === linkedPartnerId);

  // Filter sales that contain items linked to this partner
  const partnerSales = sales.filter(s => 
    s.items.some(item => item.partnerId === linkedPartnerId)
  );

  // Financial calculations
  // Sum up ONLY the sales value corresponding to products that belong to the partner
  const totalSalesRevenue = partnerSales.reduce((sum, s) => {
    return sum + s.items
      .filter(i => i.partnerId === linkedPartnerId)
      .reduce((itemSum, i) => itemSum + (i.salePrice * i.quantity), 0);
  }, 0);
  
  // Total commissions earned (accumulated profit per item) - "Lucro gerado"
  const totalEarnedCommissions = partnerSales.reduce((sum, s) => {
    return sum + s.items
      .filter(i => i.partnerId === linkedPartnerId)
      .reduce((itemSum, i) => itemSum + (i.commissionAmount || 0), 0);
  }, 0);
  
  // Balance to receive (unpaid commissions for partner items) - "Valor pendente"
  const balanceToReceive = partnerSales
    .filter(s => s.commissionPaid === false)
    .reduce((sum, s) => {
       return sum + s.items
         .filter(i => i.partnerId === linkedPartnerId)
         .reduce((itemSum, i) => itemSum + (i.commissionAmount || 0), 0);
    }, 0);

  // Paid commissions - "Valor já pago"
  const paidCommissions = totalEarnedCommissions - balanceToReceive;

  // Aggregate quantity sold and profit generated for each product
  const productStats = useMemo(() => {
    const stats: Record<string, { quantitySold: number; totalRevenue: number; profitEarned: number }> = {};
    
    // Initialize linked products with zeroes
    linkedProducts.forEach(p => {
      stats[p.id] = { quantitySold: 0, totalRevenue: 0, profitEarned: 0 };
    });
    
    // Process matching items sold
    partnerSales.forEach(s => {
      s.items.forEach(item => {
        if (item.partnerId === linkedPartnerId) {
          if (!stats[item.productId]) {
            stats[item.productId] = { quantitySold: 0, totalRevenue: 0, profitEarned: 0 };
          }
          stats[item.productId].quantitySold += item.quantity;
          stats[item.productId].totalRevenue += item.salePrice * item.quantity;
          stats[item.productId].profitEarned += item.commissionAmount || 0;
        }
      });
    });
    
    return stats;
  }, [linkedProducts, partnerSales, linkedPartnerId]);

  // Complete transactions extrato list
  const extratoList = useMemo(() => {
    const list: Array<{
      id: string;
      saleId: string;
      date: string;
      productName: string;
      quantity: number;
      salePrice: number;
      commissionAmount: number;
      status: 'Pago' | 'Pendente';
    }> = [];
    
    partnerSales.forEach(s => {
      s.items.forEach((item, index) => {
        if (item.partnerId === linkedPartnerId) {
          list.push({
            id: `${s.id}-${item.productId}-${index}`,
            saleId: s.id,
            date: s.date,
            productName: item.name,
            quantity: item.quantity,
            salePrice: item.salePrice,
            commissionAmount: item.commissionAmount || 0,
            status: s.commissionPaid ? 'Pago' : 'Pendente'
          });
        }
      });
    });
    
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [partnerSales, linkedPartnerId]);

  // Format currency helper
  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const filteredProducts = linkedProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Greetings Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 bg-zinc-900/35 border border-zinc-900 rounded-3xl gap-4">
        <div>
          <span className="px-2.5 py-1 bg-purple-600/10 text-purple-400 border border-purple-500/10 text-[9px] uppercase font-mono tracking-wider font-bold rounded-lg mb-2 inline-block">
            Módulo do Parceiro Unificado
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white font-sans uppercase">
            Saudações, {partnerName}!
          </h2>
          <p className="text-xs text-zinc-500 mt-1 font-sans">
            Acompanhe o faturamento líquido, repasses de estoque e histórico de vendas de seus produtos: <strong className="text-purple-400">{activeStoreObj?.name || 'Filial Principal'}</strong>
          </p>
        </div>
        
        <button
          onClick={logout}
          className="flex items-center gap-2 self-start sm:self-center px-4 py-2.5 bg-zinc-950 border border-zinc-850 hover:border-red-500/25 text-xs text-zinc-400 hover:text-red-400 rounded-xl transition-all cursor-pointer font-semibold"
        >
          <LogOut className="w-3.5 h-3.5" />
          Encerrar Sessão
        </button>
      </div>

      {/* Highlights Financial Bento Grid - strictly private metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI: Saldo a Receber / Valor pendente */}
        <div className="glow-zinc-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-[125px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-400">Comissão Pendente</span>
            <div className="w-8 h-8 rounded-lg bg-amber-950/20 text-amber-400 flex items-center justify-center border border-amber-500/10">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-amber-400 tracking-tight leading-none mb-1.5 font-sans">
              {formatBRL(balanceToReceive)}
            </h3>
            <p className="text-[10px] text-zinc-500 font-sans">
              Valor pendente de liquidação
            </p>
          </div>
        </div>

        {/* KPI: Repasses Líquidos pagos / Valor já pago */}
        <div className="glow-zinc-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-[125px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-400">Repasses Quitados</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/20 text-emerald-400 flex items-center justify-center border border-emerald-500/10">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-emerald-400 tracking-tight leading-none mb-1.5 font-sans">
              {formatBRL(paidCommissions)}
            </h3>
            <p className="text-[10px] text-zinc-500 font-sans">
              Valor já pago pela administração
            </p>
          </div>
        </div>

        {/* KPI: Lucro Total Acumulado */}
        <div className="glow-zinc-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-[125px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-purple-400">Lucro Total Gerado</span>
            <div className="w-8 h-8 rounded-lg bg-purple-950/20 text-purple-400 flex items-center justify-center border border-purple-500/10">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white tracking-tight leading-none mb-1.5 font-sans">
              {formatBRL(totalEarnedCommissions)}
            </h3>
            <p className="text-[10px] text-zinc-500 font-sans">
              Comissão acumulada (paga + pendente)
            </p>
          </div>
        </div>

        {/* KPI: Faturamento Total de Seus Produtos */}
        <div className="glow-zinc-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-[125px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-400">Vendas de Seus Produtos</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-purple-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-zinc-100 tracking-tight leading-none mb-1.5 font-sans">
              {extratoList.reduce((sum, item) => sum + item.quantity, 0)} itens
            </h3>
            <p className="text-[10px] text-zinc-500 font-sans">
              Faturamento bruto: {formatBRL(totalSalesRevenue)}
            </p>
          </div>
        </div>

      </div>

      {/* Tabs configuration for cleaner view on desktop and mobile */}
      <div className="flex border-b border-zinc-850 gap-2">
        <button
          onClick={() => setActiveTab('produtos')}
          className={`pb-3 text-xs font-semibold px-4 transition-all relative ${
            activeTab === 'produtos' 
              ? 'text-purple-400 border-b-2 border-purple-500' 
              : 'text-zinc-550 hover:text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Package className="w-4 h-4" />
            Produtos Vinculados & Estatísticas
          </div>
        </button>
        <button
          onClick={() => setActiveTab('extrato')}
          className={`pb-3 text-xs font-semibold px-4 transition-all relative ${
            activeTab === 'extrato' 
              ? 'text-purple-400 border-b-2 border-purple-500' 
              : 'text-zinc-550 hover:text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            Extrato Completo Detalhado
          </div>
        </button>
      </div>

      {activeTab === 'produtos' ? (
        /* TAB 1: Products linked & Statistics */
        <div className="glow-zinc-card p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                Produtos Sob Sua Parceria ({linkedProducts.length})
              </h3>
              <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                Relação de especificações, estoque atual e lucratividade unitária por produto
              </p>
            </div>
            
            {/* Quick search input */}
            <div className="relative max-w-[240px] w-full">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-zinc-500">
                <Search className="w-3.5 h-3.5 text-purple-500/60" />
              </span>
              <input
                type="text"
                placeholder="Buscar produto por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-850 focus:border-purple-500 rounded-lg text-xs pl-8 pr-3 py-1.5 text-zinc-200 placeholder-zinc-550 outline-none transition-all"
              />
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-zinc-950/40 rounded-xl border border-zinc-900/60 text-center">
              <Package className="w-10 h-10 text-zinc-700 mb-3 stroke-[1.5]" />
              <p className="text-xs text-zinc-500 font-sans max-w-[320px]">
                Nenhum produto cadastrado com vínculo ao seu código de parceiro no momento.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 font-mono text-[10px] uppercase bg-zinc-950/30">
                    <th className="py-3 px-3">Ativo</th>
                    <th className="py-3 px-3">Modelo Parceria</th>
                    <th className="py-3 px-3 text-right">Estoque</th>
                    <th className="py-3 px-3 text-right">Preço de Venda</th>
                    <th className="py-3 px-3 text-right text-purple-400">Qtd Vendida</th>
                    <th className="py-3 px-3 text-right text-emerald-400">Total faturado</th>
                    <th className="py-3 px-3 text-right text-purple-300">Meu Lucro Gerado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/40 text-zinc-300">
                  {filteredProducts.map(p => {
                    const stats = productStats[p.id] || { quantitySold: 0, totalRevenue: 0, profitEarned: 0 };
                    return (
                      <tr key={p.id} className="hover:bg-zinc-900/10 transition-all font-sans">
                        <td className="py-4 px-3">
                          <div className="font-semibold text-zinc-200">{p.name}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{p.code}</div>
                        </td>
                        <td className="py-4 px-3">
                          <span className="px-2 py-0.5 rounded bg-purple-950/20 border border-purple-500/10 text-purple-400 text-[10px] font-mono">
                            {p.partnerType === 'lucro' ? `Lucro (${p.partnerValue}%)` :
                             p.partnerType === 'venda' ? `Vendas (${p.partnerValue}%)` :
                             p.partnerType === 'fixo' ? `Unitário Fixo (${formatBRL(p.partnerValue || 0)})` :
                             `Consignado (Loja retém: ${formatBRL(p.partnerValue || 0)})`}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-right font-mono font-medium">
                          <span className={`px-2 py-0.5 rounded-md ${
                            p.stock <= p.minStock 
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                              : 'bg-zinc-950 text-zinc-400'
                          }`}>
                            {p.stock} un
                          </span>
                        </td>
                        <td className="py-4 px-3 text-right font-semibold font-mono text-zinc-100">{formatBRL(p.salePrice)}</td>
                        <td className="py-4 px-3 text-right font-bold text-zinc-400 font-mono">{stats.quantitySold} un</td>
                        <td className="py-4 px-3 text-right font-bold text-zinc-300 font-mono">{formatBRL(stats.totalRevenue)}</td>
                        <td className="py-4 px-3 text-right font-bold text-emerald-400 font-mono">{formatBRL(stats.profitEarned)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: Complete Ledger Extrato */
        <div className="glow-zinc-card p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                Extrato Detalhado de Vendas
              </h3>
              <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                Transações item a item contendo datas de processamento, cálculo e situação do repasse
              </p>
            </div>
          </div>

          {extratoList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-zinc-950/40 rounded-xl border border-zinc-900/60 text-center">
              <Activity className="w-10 h-10 text-zinc-700 mb-3 stroke-[1.5]" />
              <p className="text-xs text-zinc-500 font-sans max-w-[280px]">
                Nenhum repasse de comissões ou vendas registrado historicamente.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 font-mono text-[10px] uppercase bg-zinc-950/30">
                    <th className="py-3 px-3">Data</th>
                    <th className="py-3 px-3">Venda ID</th>
                    <th className="py-3 px-3">Produto</th>
                    <th className="py-3 px-3 text-right">Qtd</th>
                    <th className="py-3 px-3 text-right">Preço Venda</th>
                    <th className="py-3 px-3 text-right">Faturamento</th>
                    <th className="py-3 px-3 text-right text-emerald-400">Minha comissão</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/40 text-zinc-300 font-sans">
                  {extratoList.map(item => (
                    <tr key={item.id} className="hover:bg-zinc-900/10 transition-all">
                      <td className="py-4 px-3 font-mono text-zinc-500">
                        {new Date(item.date).toLocaleDateString('pt-BR')} {new Date(item.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="py-4 px-3 font-mono text-zinc-500">
                        #{item.saleId.slice(0, 8)}
                      </td>
                      <td className="py-4 px-3 font-bold text-zinc-200">
                        {item.productName}
                      </td>
                      <td className="py-4 px-3 text-right font-mono font-medium">
                        {item.quantity} un
                      </td>
                      <td className="py-4 px-3 text-right font-mono text-zinc-300">
                        {formatBRL(item.salePrice)}
                      </td>
                      <td className="py-4 px-3 text-right font-mono text-zinc-300">
                        {formatBRL(item.salePrice * item.quantity)}
                      </td>
                      <td className="py-4 px-3 text-right font-mono font-bold text-emerald-400">
                        + {formatBRL(item.commissionAmount)}
                      </td>
                      <td className="py-4 px-3 text-center">
                        {item.status === 'Pago' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase font-mono rounded font-bold">
                            Pago
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] uppercase font-mono rounded font-bold animate-pulse">
                            Pendente
                          </span>
                        )}
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
