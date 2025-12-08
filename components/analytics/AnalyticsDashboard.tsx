

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fetchStudents, fetchInvoices, saveInvoices, fetchSettings, fetchClaims, fetchExpenses, saveExpenses } from '../../services/storageService';
import { Student, ApplicationStatus, Invoice, AgencySettings, CommissionClaim, Expense, ExpenseCategory } from '../../types';
import { Plus, DollarSign, Wallet, TrendingUp, AlertCircle, Users, Search, CreditCard, ArrowUpRight, Activity, Calendar, Loader2, FileText, Hash, Target, HandCoins, ArrowDownRight, Printer, Receipt } from 'lucide-react';
import { getCurrentUser } from '../../services/authService';
import { logActivity } from '../../services/auditService';
import { generateReceipt } from '../../services/documentService';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#64748b', '#8b5cf6', '#ec4899', '#14b8a6'];

const CustomTooltip = ({ active, payload, label, currency }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs z-50">
          <p className="font-bold mb-1 text-slate-300">{label || payload[0].name}</p>
          <p className="text-white font-mono text-sm">
             {payload[0].value.toLocaleString()} 
             {payload[0].payload.amount ? ` ${currency}` : ''}
          </p>
        </div>
      );
    }
    return null;
};

export const AnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses'>('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [claims, setClaims] = useState<CommissionClaim[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<AgencySettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Invoice Form State
  const [newInvNumber, setNewInvNumber] = useState('');
  const [newInvAmount, setNewInvAmount] = useState('');
  const [newInvDesc, setNewInvDesc] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');

  // Expense Form State
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('Rent');
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');

  const generateInvoiceNumber = () => {
    return `INV-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  useEffect(() => {
    const load = async () => {
        setLoading(true);
        const [s, i, c, e, set] = await Promise.all([
            fetchStudents(),
            fetchInvoices(),
            fetchClaims(),
            fetchExpenses(),
            fetchSettings()
        ]);
        setStudents(s);
        setInvoices(i);
        setClaims(c);
        setExpenses(e);
        setSettings(set);
        setNewInvNumber(generateInvoiceNumber());
        setLoading(false);
    };
    load();
  }, []);

  // Compute Stats
  const statusData = [
    { name: 'Applied', value: students.filter(s => s.status === ApplicationStatus.Applied).length },
    { name: 'Visa Granted', value: students.filter(s => s.status === ApplicationStatus.VisaGranted).length },
    { name: 'Leads', value: students.filter(s => s.status === ApplicationStatus.Lead).length },
    { name: 'Offers', value: students.filter(s => s.status === ApplicationStatus.OfferReceived).length },
  ];

  const countryData = students.reduce((acc, curr) => {
    const found = acc.find(item => item.name === curr.targetCountry);
    if (found) found.value++;
    else acc.push({ name: curr.targetCountry, value: 1 });
    return acc;
  }, [] as {name: string, value: number}[]);

  const studentRevenue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0);
  const commissionRevenue = claims.filter(c => c.status === 'Received').reduce((sum, c) => sum + c.amount, 0);
  const totalRevenue = studentRevenue + commissionRevenue;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const pendingRevenue = invoices.filter(i => i.status === 'Pending').reduce((sum, i) => sum + i.amount, 0) + 
                         claims.filter(c => c.status === 'Invoiced').reduce((sum, c) => sum + c.amount, 0);

  // Expense Chart Data
  const expenseData = expenses.reduce((acc, curr) => {
      const found = acc.find(item => item.name === curr.category);
      if (found) found.value += curr.amount;
      else acc.push({ name: curr.category, value: curr.amount });
      return acc;
  }, [] as {name: string, value: number}[]);

  // Calculate Pipeline Value (Estimated Revenue based on CRM Status)
  const pipelineValue = students.reduce((sum, student) => {
      let val = 0;
      if (student.status === ApplicationStatus.Applied) val = 15000;
      if (student.status === ApplicationStatus.OfferReceived) val = 50000;
      if (student.status === ApplicationStatus.VisaGranted) val = 150000;
      return sum + val;
  }, 0);

  const addInvoice = async () => {
    if (!newInvAmount || !newInvDesc) return;
    const inv: Invoice = {
      id: Date.now().toString(),
      invoiceNumber: newInvNumber || generateInvoiceNumber(),
      studentId: 'general', 
      studentName: 'General Client', 
      amount: Number(newInvAmount),
      description: newInvDesc,
      status: 'Pending',
      date: Date.now()
    };
    const updated = [inv, ...invoices];
    setInvoices(updated);
    await saveInvoices(updated);
    logActivity('CREATE', 'Invoice', `Created General Invoice ${inv.invoiceNumber}`);

    const curr = settings?.currency || 'NPR';
    alert(`Invoice Created Successfully!\n\nInvoice #: ${inv.invoiceNumber}\nDescription: ${inv.description}\nAmount: ${curr} ${inv.amount.toLocaleString()}`);

    setNewInvAmount('');
    setNewInvDesc('');
    setNewInvNumber(generateInvoiceNumber());
  };

  const addExpense = async () => {
      if (!expAmount || !expDesc) return;
      const user = getCurrentUser();
      const newExp: Expense = {
          id: Date.now().toString(),
          category: expCategory,
          amount: Number(expAmount),
          description: expDesc,
          date: Date.now(),
          recordedBy: user?.name || 'Unknown'
      };
      
      const updated = [newExp, ...expenses];
      setExpenses(updated);
      await saveExpenses(updated);
      logActivity('CREATE', 'Expense', `Recorded expense: ${newExp.amount} for ${newExp.category}`);
      
      setExpAmount('');
      setExpDesc('');
      alert("Expense recorded successfully.");
  };

  const markPaid = async (id: string) => {
    const updated = invoices.map(i => i.id === id ? {...i, status: 'Paid' as const} : i);
    setInvoices(updated);
    await saveInvoices(updated);
    logActivity('UPDATE', 'Invoice', `Marked invoice ${id} as PAID`);
  };

  const handleDownloadReceipt = (invoice: Invoice) => {
      generateReceipt(invoice, settings);
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.description.toLowerCase().includes(invoiceSearch.toLowerCase()) || 
    inv.studentName.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()))
  );

  const currency = settings?.currency || 'NPR';

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-8 space-y-8 animate-in fade-in duration-500 pb-32">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                  <Activity className="mr-3 text-indigo-600" /> Financial Command Center
              </h1>
              <p className="text-slate-500 mt-1 ml-9">Real-time revenue metrics, P&L, and application analytics.</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'overview' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  Overview & Invoices
              </button>
              <button 
                onClick={() => setActiveTab('expenses')}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'expenses' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  Expenses & P&L
              </button>
          </div>
      </div>

      {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Revenue */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                    <Wallet size={120} className="text-emerald-600" />
                </div>
                <div className="flex items-center space-x-3 mb-4 relative z-10">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                        <DollarSign size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Revenue</span>
                </div>
                <div className="flex items-baseline space-x-3 relative z-10">
                    <span className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                        <span className="text-lg text-slate-400 font-normal mr-1">{currency}</span>
                        {totalRevenue.toLocaleString()}
                    </span>
                </div>
                <div className="mt-3 flex items-center text-xs text-emerald-600 font-bold bg-emerald-50 w-fit px-2 py-1 rounded-md border border-emerald-100 relative z-10">
                    <TrendingUp size={12} className="mr-1" /> Includes Commissions
                </div>
                </div>

                {/* Pending Invoices */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                    <AlertCircle size={120} className="text-amber-500" />
                </div>
                <div className="flex items-center space-x-3 mb-4 relative z-10">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                        <CreditCard size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding</span>
                </div>
                <div className="flex items-baseline space-x-3 relative z-10">
                    <span className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                        <span className="text-lg text-slate-400 font-normal mr-1">{currency}</span>
                        {pendingRevenue.toLocaleString()}
                    </span>
                </div>
                <div className="mt-3 flex items-center text-xs text-amber-600 font-bold bg-amber-50 w-fit px-2 py-1 rounded-md border border-amber-100 relative z-10">
                    <Activity size={12} className="mr-1" /> Student + Uni
                </div>
                </div>

                {/* Pipeline Value (Estimated) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                    <Target size={120} className="text-blue-600" />
                </div>
                <div className="flex items-center space-x-3 mb-4 relative z-10">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                        <Target size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pipeline Value</span>
                </div>
                <div className="flex items-baseline space-x-3 relative z-10">
                    <span className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                        <span className="text-lg text-slate-400 font-normal mr-1">{currency}</span>
                        {pipelineValue.toLocaleString()}
                    </span>
                </div>
                <div className="mt-3 flex items-center text-xs text-blue-600 font-bold bg-blue-50 w-fit px-2 py-1 rounded-md border border-blue-100 relative z-10">
                    CRM Estimate
                </div>
                </div>

                {/* Net Profit (New) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                    <HandCoins size={120} className={netProfit >= 0 ? "text-emerald-600" : "text-red-600"} />
                </div>
                <div className="flex items-center space-x-3 mb-4 relative z-10">
                    <div className={`p-2.5 rounded-xl border ${netProfit >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                        <DollarSign size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Profit</span>
                </div>
                <div className="flex items-baseline space-x-3 relative z-10">
                    <span className={`text-2xl lg:text-3xl font-bold tracking-tight ${netProfit >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                        <span className="text-lg text-slate-400 font-normal mr-1">{currency}</span>
                        {netProfit.toLocaleString()}
                    </span>
                </div>
                <div className="mt-3 flex items-center text-xs text-slate-500 font-medium relative z-10">
                    Rev: {totalRevenue.toLocaleString()} - Exp: {totalExpenses.toLocaleString()}
                </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                    <span className="w-1 h-6 bg-indigo-500 rounded-full mr-3"></span>
                    Application Funnel
                </h3>
                <div className="h-72 w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        >
                        {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip currency={currency} />} />
                        <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" />
                    </PieChart>
                    </ResponsiveContainer>
                </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                    <span className="w-1 h-6 bg-emerald-500 rounded-full mr-3"></span>
                    Destination Demographics
                </h3>
                <div className="h-72 w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={countryData} barSize={40}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} dy={10} />
                        <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip currency={currency} />} cursor={{fill: '#f1f5f9'}} />
                        <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
                </div>
            </div>

            {/* Invoicing Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-20">
                <div className="p-6 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center">
                        <FileText className="mr-2 text-indigo-600" size={20}/>
                        Student Invoices
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">Manage student processing fees and generate receipts.</p>
                </div>
                
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                        placeholder="Search invoice #, client..." 
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 focus:bg-white transition-all"
                        value={invoiceSearch}
                        onChange={e => setInvoiceSearch(e.target.value)}
                    />
                </div>
                </div>

                {/* New Invoice Creation Area - Dedicated Row */}
                <div className="bg-indigo-50/60 p-5 border-b border-indigo-100">
                    <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-3 flex items-center">
                        <Plus size={14} className="mr-1"/> Create New Invoice
                    </h4>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="w-full md:w-40">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Invoice # (Auto)</label>
                            <input 
                            className="w-full bg-slate-100 px-4 py-2.5 text-sm outline-none border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed font-mono shadow-inner"
                            value={newInvNumber}
                            readOnly
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                            <input 
                            placeholder="e.g. Visa Processing Fee - Student Name" 
                            className="w-full bg-white px-4 py-2.5 text-sm outline-none border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all shadow-sm"
                            value={newInvDesc}
                            onChange={e => setNewInvDesc(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-40">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Amount ({currency})</label>
                            <input 
                            type="number" 
                            placeholder="0.00" 
                            className="w-full bg-white px-4 py-2.5 text-sm outline-none border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all shadow-sm" 
                            value={newInvAmount}
                            onChange={e => setNewInvAmount(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={addInvoice} 
                            disabled={!newInvAmount || !newInvDesc}
                            className="w-full md:w-auto bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg font-bold text-sm flex items-center justify-center whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none h-[42px]"
                        >
                        Generate Invoice
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[1000px]">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                        <tr>
                        <th className="px-6 py-4">Invoice #</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Client / Description</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredInvoices.length > 0 ? (
                            filteredInvoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-mono font-medium text-xs">
                                    {inv.invoiceNumber || <span className="text-slate-300 italic">--</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-slate-500 flex items-center">
                                    <Calendar size={14} className="mr-2 text-slate-300"/>
                                    {new Date(inv.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-bold text-slate-800">{inv.studentName}</p>
                                    <p className="text-xs text-slate-500">{inv.description}</p>
                                </td>
                                <td className="px-6 py-4 font-mono font-medium text-slate-700">
                                    {currency} {inv.amount.toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                    inv.status === 'Paid' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${inv.status === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                    {inv.status}
                                </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                    {inv.status === 'Paid' && (
                                        <button
                                            onClick={() => handleDownloadReceipt(inv)}
                                            className="text-slate-500 hover:text-indigo-600 p-2 rounded hover:bg-indigo-50 transition-colors"
                                            title="Download Receipt"
                                        >
                                            <Receipt size={16} />
                                        </button>
                                    )}
                                    {inv.status === 'Pending' && (
                                        <button 
                                            onClick={() => markPaid(inv.id)} 
                                            className="text-indigo-600 hover:text-indigo-800 font-bold text-xs bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0"
                                        >
                                            Mark Paid
                                        </button>
                                    )}
                                </div>
                                </td>
                            </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                    No invoices found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    </table>
                </div>
            </div>
          </div>
      )}

      {activeTab === 'expenses' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Expense Form */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                          <ArrowDownRight className="mr-2 text-red-500"/> Record Expense
                      </h3>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                              <select 
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-white"
                                value={expCategory}
                                onChange={(e) => setExpCategory(e.target.value as any)}
                              >
                                  {['Rent', 'Salaries', 'Marketing', 'Utilities', 'Software', 'Office', 'Travel', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount ({currency})</label>
                              <input 
                                type="number"
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm"
                                placeholder="0.00"
                                value={expAmount}
                                onChange={(e) => setExpAmount(e.target.value)}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                              <input 
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm"
                                placeholder="e.g. Office Rent Feb 2024"
                                value={expDesc}
                                onChange={(e) => setExpDesc(e.target.value)}
                              />
                          </div>
                          <button 
                            onClick={addExpense}
                            disabled={!expAmount || !expDesc}
                            className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 mt-2 disabled:opacity-50"
                          >
                              Record Expense
                          </button>
                      </div>
                  </div>

                  {/* Expense Chart */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
                      <h3 className="font-bold text-slate-800 mb-2">Expense Breakdown</h3>
                      <div className="h-64 w-full min-w-0">
                        {expenses.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={expenseData} layout="vertical" margin={{top: 5, right: 30, left: 40, bottom: 5}}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 11}} />
                                    <Tooltip content={<CustomTooltip currency={currency} />} cursor={{fill: '#fef2f2'}} />
                                    <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                                No expenses recorded yet.
                            </div>
                        )}
                      </div>
                  </div>
              </div>

              {/* Expense List */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-white">
                      <h3 className="font-bold text-slate-800">Expense History</h3>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                              <tr>
                                  <th className="px-6 py-4">Date</th>
                                  <th className="px-6 py-4">Category</th>
                                  <th className="px-6 py-4">Description</th>
                                  <th className="px-6 py-4">Recorded By</th>
                                  <th className="px-6 py-4 text-right">Amount</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {expenses.length > 0 ? (
                                  expenses.sort((a,b) => b.date - a.date).map(exp => (
                                      <tr key={exp.id} className="hover:bg-slate-50">
                                          <td className="px-6 py-4 text-slate-500">{new Date(exp.date).toLocaleDateString()}</td>
                                          <td className="px-6 py-4">
                                              <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                                                  {exp.category}
                                              </span>
                                          </td>
                                          <td className="px-6 py-4 text-slate-700">{exp.description}</td>
                                          <td className="px-6 py-4 text-slate-500 text-xs">{exp.recordedBy}</td>
                                          <td className="px-6 py-4 text-right font-mono font-medium text-red-600">
                                              - {currency} {exp.amount.toLocaleString()}
                                          </td>
                                      </tr>
                                  ))
                              ) : (
                                  <tr>
                                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                          No expense records found.
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
