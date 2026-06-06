import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Store,
  Product,
  Sale,
  Partner,
  Expense,
  CashEntry,
  MonthlyGoal,
  MonthlyDesiredSalary,
  Notification
} from './types';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from './firebase';
import { playNotificationSound } from './services/fcm';

interface ReinoContextProps {
  stores: Store[];
  activeStoreId: string;
  products: Product[];
  sales: Sale[];
  partners: Partner[];
  expenses: Expense[];
  cashEntries: CashEntry[];
  goals: MonthlyGoal[];
  desiredSalaries: MonthlyDesiredSalary[];
  notifications: Notification[];
  
  // Actions
  addStore: (name: string, location?: string) => Store;
  deleteStore: (storeId: string) => void;
  setActiveStoreId: (storeId: string) => void;
  
  addProduct: (product: Omit<Product, 'id' | 'storeId'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  addSale: (sale: Omit<Sale, 'id' | 'storeId' | 'date'>) => void;
  deleteSale: (id: string) => void;
  toggleCommissionPayment: (id: string) => void;
  
  addPartner: (partner: Omit<Partner, 'id' | 'storeId'>) => void;
  updatePartner: (id: string, partner: Partial<Partner>) => void;
  deletePartner: (id: string) => void;
  
  addExpense: (expense: Omit<Expense, 'id' | 'storeId'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  
  addCashEntry: (entry: Omit<CashEntry, 'id' | 'storeId'> & { date?: string }) => void;
  deleteCashEntry: (id: string) => void;
  
  updateGoal: (yearMonth: string, targetValue: number, profitTargetValue?: number) => void;
  updateDesiredSalary: (yearMonth: string, amount: number) => void;
  
  addNotification: (title: string, message: string, type: 'info' | 'warning' | 'success') => void;
  markNotificationAsRead: (id: string) => void;
  clearNotification: (id: string) => void;
}

const ReinoContext = createContext<ReinoContextProps | undefined>(undefined);

export const ReinoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial empty arrays (absolutely no mock data, as requested)
  const [stores, setStores] = useState<Store[]>(() => {
    const saved = localStorage.getItem('reino_stores');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeStoreId, setActiveStoreIdState] = useState<string>(() => {
    const saved = localStorage.getItem('reino_active_store_id');
    return saved || '';
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('reino_products');
    return saved ? JSON.parse(saved) : [];
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('reino_sales');
    return saved ? JSON.parse(saved) : [];
  });

  const [partners, setPartners] = useState<Partner[]>(() => {
    const saved = localStorage.getItem('reino_partners');
    return saved ? JSON.parse(saved) : [];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('reino_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [cashEntries, setCashEntries] = useState<CashEntry[]>(() => {
    const saved = localStorage.getItem('reino_cash_entries');
    return saved ? JSON.parse(saved) : [];
  });

  const [goals, setGoals] = useState<MonthlyGoal[]>(() => {
    const saved = localStorage.getItem('reino_goals');
    return saved ? JSON.parse(saved) : [];
  });

  const [desiredSalaries, setDesiredSalaries] = useState<MonthlyDesiredSalary[]>(() => {
    const saved = localStorage.getItem('reino_desired_salaries');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('reino_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  // Track Firestore real-time notifications synchronization
  useEffect(() => {
    if (!activeStoreId) return;

    const q = query(
      collection(db, 'notifications'),
      where('storeId', '==', activeStoreId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbNotifs: Notification[] = [];
      let shouldPlaySound = false;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        dbNotifs.push({
          id: docSnap.id,
          storeId: data.storeId,
          type: data.type as 'info' | 'warning' | 'success',
          title: data.title,
          message: data.message,
          date: data.date,
          read: data.read ?? false,
          soldProduct: data.soldProduct,
          quantity: data.quantity,
          partnerProfit: data.partnerProfit,
          accumulatedBalance: data.accumulatedBalance,
          partnerId: data.partnerId
        });

        // Play chime audio specifically for new success/sale trigger signals (less than 8 seconds old)
        if (data.type === 'success' && data.soldProduct && (Date.now() - new Date(data.date).getTime() < 8000)) {
          shouldPlaySound = true;
        }
      });

      // Maintain latest on top
      dbNotifs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setNotifications(dbNotifs);

      if (shouldPlaySound) {
        playNotificationSound();
      }
    }, (error) => {
      console.error("Firestore Notification Listener error:", error);
    });

    return () => unsubscribe();
  }, [activeStoreId]);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('reino_stores', JSON.stringify(stores));
  }, [stores]);

  useEffect(() => {
    localStorage.setItem('reino_active_store_id', activeStoreId);
  }, [activeStoreId]);

  useEffect(() => {
    localStorage.setItem('reino_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('reino_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('reino_partners', JSON.stringify(partners));
  }, [partners]);

  useEffect(() => {
    localStorage.setItem('reino_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('reino_cash_entries', JSON.stringify(cashEntries));
  }, [cashEntries]);

  useEffect(() => {
    localStorage.setItem('reino_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('reino_desired_salaries', JSON.stringify(desiredSalaries));
  }, [desiredSalaries]);

  useEffect(() => {
    localStorage.setItem('reino_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Set default active store if none set but stores exist
  useEffect(() => {
    if (!activeStoreId && stores.length > 0) {
      setActiveStoreIdState(stores[0].id);
    }
  }, [stores, activeStoreId]);

  // Actions
  const addStore = (name: string, location?: string) => {
    const newStore: Store = {
      id: crypto.randomUUID(),
      name,
      location,
      createdAt: new Date().toISOString()
    };
    const updated = [...stores, newStore];
    setStores(updated);
    if (!activeStoreId) {
      setActiveStoreIdState(newStore.id);
    }
    
    // Welcome notification
    addNotificationForStore(
      newStore.id,
      'Loja Ativada',
      `O Reino Gestão foi inicializado com sucesso para a loja "${name}". Comece cadastrando seus parceiros e produtos.`,
      'success'
    );

    return newStore;
  };

  const deleteStore = (storeId: string) => {
    setStores(prev => prev.filter(s => s.id !== storeId));
    // Clean up associated store data to prevent leakages
    setProducts(prev => prev.filter(p => p.storeId !== storeId));
    setSales(prev => prev.filter(s => s.storeId !== storeId));
    setPartners(prev => prev.filter(p => p.storeId !== storeId));
    setExpenses(prev => prev.filter(e => e.storeId !== storeId));
    setCashEntries(prev => prev.filter(c => c.storeId !== storeId));
    setGoals(prev => prev.filter(g => g.storeId !== storeId));
    setDesiredSalaries(prev => prev.filter(d => d.storeId !== storeId));
    setNotifications(prev => prev.filter(n => n.storeId !== storeId));

    if (activeStoreId === storeId) {
      const remaining = stores.filter(s => s.id !== storeId);
      setActiveStoreIdState(remaining.length > 0 ? remaining[0].id : '');
    }
  };

  const setActiveStoreId = (storeId: string) => {
    setActiveStoreIdState(storeId);
  };

  // Helper notification adder
  const addNotificationForStore = async (
    storeId: string, 
    title: string, 
    message: string, 
    type: 'info' | 'warning' | 'success',
    extra?: Partial<Notification>
  ) => {
    const docId = crypto.randomUUID();
    const newNotif: Notification = {
      id: docId,
      storeId,
      type,
      title,
      message,
      date: new Date().toISOString(),
      read: false,
      ...extra
    };
    
    // Immediate reactive local state set
    setNotifications(prev => [newNotif, ...prev]);

    // Save in Firestore for active live sync across multi-devices!
    try {
      await setDoc(doc(db, 'notifications', docId), newNotif);
    } catch (err) {
      console.error("Error writing notification to Firestore:", err);
    }
  };

  const addNotification = (title: string, message: string, type: 'info' | 'warning' | 'success') => {
    if (!activeStoreId) return;
    addNotificationForStore(activeStoreId, title, message, type);
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await setDoc(doc(db, 'notifications', id), { read: true }, { merge: true });
    } catch (err) {
      console.error("Error setting notification read state:", err);
    }
  };

  const clearNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  // Product CRUD
  const addProduct = (p: Omit<Product, 'id' | 'storeId'>) => {
    if (!activeStoreId) return;
    const newProduct: Product = {
      ...p,
      id: crypto.randomUUID(),
      storeId: activeStoreId
    };
    setProducts(prev => [...prev, newProduct]);

    // Check if added below minimum stock instantly
    if (newProduct.stock <= newProduct.minStock) {
      addNotificationForStore(
        activeStoreId,
        'Estoque Baixo',
        `O produto "${newProduct.name}" foi cadastrado com estoque igual ou abaixo do mínimo (${newProduct.stock} unidades).`,
        'warning'
      );
    }
  };

  const updateProduct = (id: string, updatedFields: Partial<Product>) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const merged = { ...p, ...updatedFields };
        // Trigger alert if stock falls below minStock
        if (merged.stock <= merged.minStock && p.stock > merged.minStock) {
          addNotificationForStore(
            p.storeId,
            'Alerta de Reposição',
            `O produto "${merged.name}" acaba de atingir estoque crítico de ${merged.stock} unidades (mínimo recomendado: ${merged.minStock}).`,
            'warning'
          );
        }
        return merged;
      }
      return p;
    }));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Sales and Cash flow
  const addSale = (s: Omit<Sale, 'id' | 'storeId' | 'date'>) => {
    if (!activeStoreId) return;
    const saleDate = new Date().toISOString();
    
    // Check if any item in the sale has a partner commission attached to determine commissionPaid
    const hasCommissions = s.items.some(item => item.commissionAmount && item.commissionAmount > 0);
    
    const newSale: Sale = {
      ...s,
      id: crypto.randomUUID(),
      storeId: activeStoreId,
      date: saleDate,
      commissionPaid: hasCommissions ? false : undefined
    };

    // 1. Deduct Inventory Stock
    newSale.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        const nextStock = Math.max(0, prod.stock - item.quantity);
        updateProduct(item.productId, { stock: nextStock });
      }
    });

    // 2. Log in global sales
    setSales(prev => [newSale, ...prev]);

    // 3. Register Cash Entry automatically (Entrada de Caixa)
    const discountText = s.discount > 0 ? ` (Desconto: R$ ${s.discount.toFixed(2)})` : '';
    const desc = `Venda ${newSale.id.slice(0, 8)} - ${s.paymentMethod}${discountText}`;
    
    const newCash: CashEntry = {
      id: crypto.randomUUID(),
      storeId: activeStoreId,
      type: 'entrada',
      description: desc,
      amount: s.total,
      date: saleDate,
      category: 'Vendas'
    };
    setCashEntries(prev => [newCash, ...prev]);

    // 4. Send Confirmation Notification and check for partner-linked product sales
    addNotificationForStore(
      activeStoreId,
      'Venda Efetuada',
      `Nova venda concluída no valor total de R$ ${s.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} via ${s.paymentMethod}.`,
      'success'
    );

    // Auto-trigger partner notifications if any of the items belong to a product linked to a partner
    s.items.forEach(item => {
      if (item.partnerId && item.commissionAmount) {
        const partner = partners.find(p => p.id === item.partnerId);
        if (partner) {
          const partnerProfit = item.commissionAmount;

          // Calculate accumulated historic commission balance
          const partnerSalesSum = sales.reduce((sum, ls) => {
            const itemCommissions = ls.items
              .filter(i => i.partnerId === partner.id)
              .reduce((itemSum, i) => itemSum + (i.commissionAmount || 0), 0);
            return sum + itemCommissions;
          }, 0);
          
          const accumulatedBalance = partnerSalesSum + partnerProfit;

          // Format clean automatic notification displaying exact required details
          addNotificationForStore(
            activeStoreId,
            'Produto de Parceiro Vendido! 💸',
            `O parceiro "${partner.name}" acaba de pontuar comissão na venda do produto "${item.name}".`,
            'success',
            {
              soldProduct: item.name,
              quantity: item.quantity,
              partnerProfit: partnerProfit,
              accumulatedBalance: accumulatedBalance,
              partnerId: partner.id
            }
          );
        }
      }
    });

    // 5. Evaluate Target Milestones
    const currentYearMonth = saleDate.slice(0, 7); // "YYYY-MM"
    const goal = goals.find(g => g.storeId === activeStoreId && g.yearMonth === currentYearMonth);
    if (goal) {
      // Calculate previous sales totals vs current
      const monthlySales = sales.filter(ls => ls.storeId === activeStoreId && ls.date.startsWith(currentYearMonth));
      const prevTotal = monthlySales.reduce((sum, item) => sum + item.total, 0);
      const nextTotal = prevTotal + s.total;

      if (nextTotal >= goal.targetValue && prevTotal < goal.targetValue) {
        addNotificationForStore(
          activeStoreId,
          'Meta de Vendas Atingida! 👑',
          `Parabéns! Vendas de ${currentYearMonth} atingiram R$ ${nextTotal.toFixed(2)}, ultrapassando a meta de R$ ${goal.targetValue.toFixed(2)}.`,
          'success'
        );
      }
    }
  };

  const deleteSale = (id: string) => {
    const sale = sales.find(s => s.id === id);
    if (!sale) return;

    // 1. Restore Inventory Stock
    sale.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        updateProduct(item.productId, { stock: prod.stock + item.quantity });
      }
    });

    // 2. Remove associated Cash flow entries
    const searchString = `Venda ${id.slice(0, 8)}`;
    setCashEntries(prev => prev.filter(c => !c.description.includes(searchString)));

    // 3. Remove sale
    setSales(prev => prev.filter(s => s.id !== id));
  };

  const toggleCommissionPayment = (id: string) => {
    setSales(prev => prev.map(s => {
      if (s.id === id) {
        const nextPaid = !s.commissionPaid;
        return { ...s, commissionPaid: nextPaid };
      }
      return s;
    }));
  };

  // Partners / Sellers CRUD
  const addPartner = (p: Omit<Partner, 'id' | 'storeId'>) => {
    if (!activeStoreId) return;
    const newPartner: Partner = {
      ...p,
      id: crypto.randomUUID(),
      storeId: activeStoreId
    };
    setPartners(prev => [...prev, newPartner]);
    
    addNotificationForStore(
      activeStoreId,
      'Parceiro Cadastrado',
      `O parceiro "${p.name}" foi registrado com sucesso com comissão de ${p.commissionPercent}%.`,
      'info'
    );
  };

  const updatePartner = (id: string, fields: Partial<Partner>) => {
    setPartners(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p));
  };

  const deletePartner = (id: string) => {
    setPartners(prev => prev.filter(p => p.id !== id));
  };

  // Expenses Control
  const addExpense = (e: Omit<Expense, 'id' | 'storeId'>) => {
    if (!activeStoreId) return;
    const newExpense: Expense = {
      ...e,
      id: crypto.randomUUID(),
      storeId: activeStoreId
    };
    setExpenses(prev => [...prev, newExpense]);

    // If expense status is 'Pago', register as a 'saída' in cash entries automatically
    if (newExpense.status === 'Pago') {
      const newCash: CashEntry = {
        id: crypto.randomUUID(),
        storeId: activeStoreId,
        type: 'saída',
        description: `Despesa: ${newExpense.description}`,
        amount: newExpense.amount,
        date: newExpense.date || new Date().toISOString(),
        category: newExpense.category
      };
      setCashEntries(prev => [newCash, ...prev]);
    }

    addNotificationForStore(
      activeStoreId,
      'Despesa Registrada',
      `Despesa "${e.description}" de R$ ${e.amount.toFixed(2)} cadastrada como ${e.status}.`,
      e.status === 'Pendente' ? 'warning' : 'info'
    );
  };

  const updateExpense = (id: string, fields: Partial<Expense>) => {
    setExpenses(prev => prev.map(e => {
      if (e.id === id) {
        const updated = { ...e, ...fields };
        
        // Handle trigger when pending expense is marked paid
        if (fields.status === 'Pago' && e.status === 'Pendente') {
          const newCash: CashEntry = {
            id: crypto.randomUUID(),
            storeId: e.storeId,
            type: 'saída',
            description: `Despesa (Quitada): ${updated.description}`,
            amount: updated.amount,
            date: new Date().toISOString(),
            category: updated.category
          };
          setCashEntries(prev => [newCash, ...prev]);
          
          addNotificationForStore(
            e.storeId,
            'Despesa Quitada',
            `A despesa "${updated.description}" foi marcada como paga, registrando saída no fluxo de caixa.`,
            'success'
          );
        }
        return updated;
      }
      return e;
    }));
  };

  const deleteExpense = (id: string) => {
    const expense = expenses.find(e => e.id === id);
    if (expense && expense.status === 'Pago') {
      // Remove corresponding cash entry if was paid
      const searchDesc = `Despesa: ${expense.description}`;
      const searchDescPaid = `Despesa (Quitada): ${expense.description}`;
      setCashEntries(prev => prev.filter(c => c.description !== searchDesc && c.description !== searchDescPaid));
    }
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Cash Ledger Flow (Ad hoc entries)
  const addCashEntry = (c: Omit<CashEntry, 'id' | 'storeId'> & { date?: string }) => {
    if (!activeStoreId) return;
    const newEntry: CashEntry = {
      ...c,
      id: crypto.randomUUID(),
      storeId: activeStoreId,
      date: c.date || new Date().toISOString()
    };
    setCashEntries(prev => [newEntry, ...prev]);
  };

  const deleteCashEntry = (id: string) => {
    setCashEntries(prev => prev.filter(c => c.id !== id));
  };

  // Targets (Goals) Management
  const updateGoal = (yearMonth: string, targetValue: number, profitTargetValue?: number) => {
    if (!activeStoreId) return;
    setGoals(prev => {
      const existsIdx = prev.findIndex(g => g.storeId === activeStoreId && g.yearMonth === yearMonth);
      if (existsIdx > -1) {
        const next = [...prev];
        next[existsIdx] = { ...next[existsIdx], targetValue, profitTargetValue };
        return next;
      } else {
        return [...prev, { id: crypto.randomUUID(), storeId: activeStoreId, targetValue, profitTargetValue, yearMonth }];
      }
    });

    addNotificationForStore(
      activeStoreId,
      'Planejamento de Metas Cadastrado',
      `Metas para o período de ${yearMonth} ajustadas comercialmente: Faturamento R$ ${targetValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}${profitTargetValue ? ` e Lucro R$ ${profitTargetValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}.`,
      'info'
    );
  };

  // Desired Salary Settings
  const updateDesiredSalary = (yearMonth: string, amount: number) => {
    if (!activeStoreId) return;
    setDesiredSalaries(prev => {
      const existsIdx = prev.findIndex(d => d.storeId === activeStoreId && d.yearMonth === yearMonth);
      if (existsIdx > -1) {
        const next = [...prev];
        next[existsIdx] = { ...next[existsIdx], amount };
        return next;
      } else {
        return [...prev, { id: crypto.randomUUID(), storeId: activeStoreId, amount, yearMonth }];
      }
    });

    addNotificationForStore(
      activeStoreId,
      'Projeção de Pró-labore',
      `Seu pró-labore almejado para o período de ${yearMonth} foi fixado em R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      'info'
    );
  };

  return (
    <ReinoContext.Provider
      value={{
        stores,
        activeStoreId,
        products: products.filter(p => p.storeId === activeStoreId),
        sales: sales.filter(s => s.storeId === activeStoreId),
        partners: partners.filter(p => p.storeId === activeStoreId),
        expenses: expenses.filter(e => e.storeId === activeStoreId),
        cashEntries: cashEntries.filter(c => c.storeId === activeStoreId),
        goals: goals.filter(g => g.storeId === activeStoreId),
        desiredSalaries: desiredSalaries.filter(d => d.storeId === activeStoreId),
        notifications: notifications.filter(n => n.storeId === activeStoreId),

        addStore,
        deleteStore,
        setActiveStoreId,
        
        addProduct,
        updateProduct,
        deleteProduct,
        
        addSale,
        deleteSale,
        toggleCommissionPayment,
        
        addPartner,
        updatePartner,
        deletePartner,
        
        addExpense,
        updateExpense,
        deleteExpense,
        
        addCashEntry,
        deleteCashEntry,
        
        updateGoal,
        updateDesiredSalary,
        
        addNotification,
        markNotificationAsRead,
        clearNotification
      }}
    >
      {children}
    </ReinoContext.Provider>
  );
};

export const useReino = () => {
  const context = useContext(ReinoContext);
  if (!context) {
    throw new Error('useReino must be used inside a ReinoProvider');
  }
  return context;
};
