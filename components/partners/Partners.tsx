
import React, { useState, useEffect } from 'react';
import { ExternalLink, DollarSign, Building, Plus, X, Save, Globe, Loader2, ArrowRight, CheckCircle2, AlertCircle, FileText, TrendingUp, HandCoins, Users, Briefcase, Pencil, UserPlus, Phone, MapPin, Filter, ChevronDown } from 'lucide-react';
import { fetchPartners, savePartners, fetchSettings, fetchStudents, saveStudents, fetchClaims, saveClaims } from '../../services/storageService';
import { Partner, AgencySettings, Student, ApplicationStatus, CommissionClaim, Country, NocStatus } from '../../types';
import { logActivity } from '../../services/auditService';

export const Partners: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'directory' | 'commissions'>('directory');
    const [partners, setPartners] = useState<Partner[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [claims, setClaims] = useState<CommissionClaim[]>([]);
    const [settings, setSettings] = useState<AgencySettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [calcAmount, setCalcAmount] = useState<number | ''>('');
    
    // Add Partner State
    const [isAdding, setIsAdding] = useState(false);
    const [newPartnerData, setNewPartnerData] = useState({
        name: '',
        type: 'University',
        commissionRate: '',
        portalUrl: ''
    });

    // Edit Partner State
    const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
    const [editTab, setEditTab] = useState<'profile' | 'leads'>('profile');
    
    // Lead Input State (Inside Edit Modal)
    const [newLeadName, setNewLeadName] = useState('');
    const [newLeadPhone, setNewLeadPhone] = useState('');
    const [newLeadCountry, setNewLeadCountry] = useState<Country>(Country.Australia);

    // Create Claim State
    const [claimModalOpen, setClaimModalOpen] = useState(false);
    const [selectedStudentForClaim, setSelectedStudentForClaim] = useState<Student | null>(null);
    const [claimPartnerId, setClaimPartnerId] = useState('');
    const [claimAmount, setClaimAmount] = useState('');
    const [claimStatus, setClaimStatus] = useState<CommissionClaim['status']>('Invoiced');
    
    // Filter State
    const [claimStatusFilter, setClaimStatusFilter] = useState<'All' | 'Invoiced' | 'Received'>('All');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const [p, s, st, c] = await Promise.all([
                fetchPartners(), 
                fetchSettings(), 
                fetchStudents(), 
                fetchClaims()
            ]);
            setPartners(p);
            setSettings(s);
            setStudents(st);
            setClaims(c);
            setLoading(false);
        };
        load();
    }, []);

    const handleAddPartner = async () => {
        if (!newPartnerData.name || !newPartnerData.commissionRate) {
            alert("Please enter a name and commission rate.");
            return;
        }

        const newPartner: Partner = {
            id: Date.now().toString(),
            name: newPartnerData.name,
            type: newPartnerData.type as any,
            commissionRate: Number(newPartnerData.commissionRate),
            portalUrl: newPartnerData.portalUrl || '#'
        };

        const updatedPartners = [...partners, newPartner];
        setPartners(updatedPartners);
        await savePartners(updatedPartners);
        logActivity('CREATE', 'Settings', `Added new partner: ${newPartner.name}`);
        
        // Reset and Close
        setIsAdding(false);
        setNewPartnerData({ name: '', type: 'University', commissionRate: '', portalUrl: '' });
    };

    const handleUpdatePartner = async () => {
        if (!editingPartner) return;
        const updatedPartners = partners.map(p => p.id === editingPartner.id ? editingPartner : p);
        setPartners(updatedPartners);
        await savePartners(updatedPartners);
        logActivity('UPDATE', 'Settings', `Updated partner details: ${editingPartner.name}`);
        alert("Partner profile updated successfully.");
        setEditingPartner(null);
    };

    const handleAddLeadFromPartner = async () => {
        if (!editingPartner || !newLeadName || !newLeadPhone) return;

        const newStudent: Student = {
            id: Date.now().toString(),
            name: newLeadName,
            email: '',
            phone: newLeadPhone,
            targetCountry: newLeadCountry,
            status: ApplicationStatus.Lead,
            nocStatus: NocStatus.NotApplied,
            documents: {},
            notes: `Lead referred by partner: ${editingPartner.name} (${editingPartner.type})`,
            createdAt: Date.now(),
            source: 'Partner',
            referralPartnerId: editingPartner.id,
        };

        const updatedStudents = [newStudent, ...students];
        setStudents(updatedStudents);
        await saveStudents(updatedStudents);
        logActivity('CREATE', 'Student', `Added lead ${newLeadName} from partner ${editingPartner.name}`);
        
        setNewLeadName('');
        setNewLeadPhone('');
        alert(`Lead ${newLeadName} added to CRM successfully!`);
    };

    const handleCreateClaim = async () => {
        if (!selectedStudentForClaim || !claimPartnerId || !claimAmount) return;
        
        const partner = partners.find(p => p.id === claimPartnerId);
        if (!partner) return;

        const newClaim: CommissionClaim = {
            id: Date.now().toString(),
            studentId: selectedStudentForClaim.id,
            studentName: selectedStudentForClaim.name,
            partnerId: partner.id,
            partnerName: partner.name,
            amount: Number(claimAmount),
            currency: settings?.currency || 'NPR',
            status: claimStatus,
            invoiceDate: Date.now()
        };

        const updatedClaims = [...claims, newClaim];
        setClaims(updatedClaims);
        await saveClaims(updatedClaims);
        logActivity('CREATE', 'Commission', `Created commission claim for ${newClaim.studentName} from ${newClaim.partnerName} (${newClaim.status})`);
        
        setClaimModalOpen(false);
        setSelectedStudentForClaim(null);
        setClaimPartnerId('');
        setClaimAmount('');
        setClaimStatus('Invoiced');
    };

    const updateClaimStatus = async (claimId: string, newStatus: CommissionClaim['status']) => {
        const updatedClaims = claims.map(c => c.id === claimId ? { ...c, status: newStatus } : c);
        setClaims(updatedClaims);
        await saveClaims(updatedClaims);
        const claim = claims.find(c => c.id === claimId);
        logActivity('UPDATE', 'Commission', `Updated commission status to ${newStatus} for ${claim?.studentName}`);
    };

    const getTypeIcon = (type: string) => {
        switch(type) {
            case 'University': return <Building size={20} />;
            case 'Consultancy': return <Users size={20} />;
            case 'B2B Agent': return <Briefcase size={20} />;
            default: return <Building size={20} />;
        }
    }

    const getTypeStyles = (type: string) => {
        switch(type) {
            case 'University': return 'bg-indigo-50 text-indigo-600';
            case 'Consultancy': return 'bg-blue-50 text-blue-600';
            case 'B2B Agent': return 'bg-emerald-50 text-emerald-600';
            case 'Aggregator': return 'bg-purple-50 text-purple-600';
            case 'College': return 'bg-orange-50 text-orange-600';
            default: return 'bg-slate-50 text-slate-600';
        }
    }

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

    const currency = settings?.currency || 'NPR';
    
    // Filter students eligible for claims (Visa Granted but not in claims list)
    const claimedStudentIds = claims.map(c => c.studentId);
    const eligibleStudents = students.filter(s => 
        s.status === ApplicationStatus.VisaGranted && !claimedStudentIds.includes(s.id)
    );

    const filteredClaims = claims.filter(c => {
        if (claimStatusFilter === 'All') return true;
        return c.status === claimStatusFilter;
    });

    const totalPotential = claims.filter(c => c.status !== 'Received').reduce((acc, c) => acc + c.amount, 0);
    const totalReceived = claims.filter(c => c.status === 'Received').reduce((acc, c) => acc + c.amount, 0);

    return (
        <div className="h-full flex flex-col relative">
            {/* Header Tabs */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-end gap-4">
                <div>
                     <h1 className="text-2xl font-bold text-slate-900">Partner & Commission Management</h1>
                     <p className="text-slate-500 mt-1">Manage university relationships and track B2B revenue.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('directory')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'directory' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Partner Directory
                    </button>
                    <button 
                        onClick={() => setActiveTab('commissions')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center ${activeTab === 'commissions' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <HandCoins size={16} className="mr-2"/>
                        Commissions
                        {eligibleStudents.length > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 rounded-full">{eligibleStudents.length}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* DIRECTORY TAB */}
            {activeTab === 'directory' && (
                <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
                    {/* Partners List Section */}
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-w-0">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h2 className="font-bold text-slate-800">Universities & Aggregators</h2>
                            <button 
                                onClick={() => setIsAdding(true)}
                                className="flex items-center space-x-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                <Plus size={16} />
                                <span>Add Partner</span>
                            </button>
                        </div>
                        <div className="overflow-y-auto p-4 space-y-3 flex-1">
                            {partners.length > 0 ? (
                                partners.map(p => (
                                    <div key={p.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-lg hover:border-indigo-100 hover:shadow-sm transition-all group bg-white">
                                        <div className="flex items-center space-x-3">
                                            <div className={`p-2 rounded-lg ${getTypeStyles(p.type)}`}>
                                                {getTypeIcon(p.type)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800">{p.name}</h3>
                                                <div className="flex space-x-2 text-xs text-slate-500 mt-0.5">
                                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{p.type}</span>
                                                    <span className="text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                        {p.commissionRate}% Comm.
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button 
                                                onClick={() => { setEditingPartner(p); setEditTab('profile'); }}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Edit Profile & Leads"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <a 
                                                href={p.portalUrl} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Open Partner Portal"
                                            >
                                                <ExternalLink size={18} />
                                            </a>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                    <Building size={48} className="mb-4 text-slate-200"/>
                                    <p>No partners added yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Revenue Estimator Section */}
                    <div className="w-full md:w-80 bg-slate-900 text-white rounded-xl shadow-lg p-6 flex-shrink-0">
                        <h3 className="text-lg font-bold mb-6 flex items-center">
                            <DollarSign className="mr-2 text-emerald-400"/> Revenue Estimator
                        </h3>
                        
                        <div className="mb-6">
                            <label className="text-sm text-slate-400 mb-1 block">Tuition Fee (Annual)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-slate-500">{currency}</span>
                                <input 
                                    type="number" 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-600"
                                    placeholder="e.g. 25000"
                                    value={calcAmount}
                                    onChange={(e) => setCalcAmount(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Estimated Commission</p>
                            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                {partners.map(p => (
                                    <div key={p.id} className="flex justify-between items-center border-b border-slate-800 pb-2 group">
                                        <span className="text-sm text-slate-300 truncate w-32 group-hover:text-white transition-colors">{p.name}</span>
                                        <span className="text-emerald-400 font-mono font-bold">
                                            {calcAmount ? `${currency} ${((Number(calcAmount) * p.commissionRate) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : `${currency} 0`}
                                        </span>
                                    </div>
                                ))}
                                {partners.length === 0 && <p className="text-xs text-slate-600 italic">Add partners to see estimates.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* COMMISSIONS TAB */}
            {activeTab === 'commissions' && (
                <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border-b border-slate-100 bg-slate-50/50">
                        <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Unclaimed Students</p>
                                <h3 className="text-2xl font-bold text-slate-900">{eligibleStudents.length}</h3>
                            </div>
                            <div className="bg-red-50 p-2 rounded-lg text-red-600"><AlertCircle size={20}/></div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Pipeline Amount</p>
                                <h3 className="text-2xl font-bold text-slate-900">{currency} {totalPotential.toLocaleString()}</h3>
                            </div>
                            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><TrendingUp size={20}/></div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total Realized</p>
                                <h3 className="text-2xl font-bold text-slate-900">{currency} {totalReceived.toLocaleString()}</h3>
                            </div>
                            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><DollarSign size={20}/></div>
                        </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* 1. Unclaimed (Eligible) List */}
                        <div>
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                                <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                                Unclaimed Commissions ({eligibleStudents.length})
                            </h3>
                            <div className="space-y-3">
                                {eligibleStudents.length === 0 ? (
                                    <div className="text-center py-8 bg-slate-50 rounded-lg text-slate-400 border border-dashed border-slate-200 text-sm">
                                        All eligible commissions have been claimed.
                                    </div>
                                ) : (
                                    eligibleStudents.map(student => (
                                        <div key={student.id} className="p-4 border border-slate-200 rounded-xl hover:shadow-md transition-all flex justify-between items-center group bg-white">
                                            <div>
                                                <h4 className="font-bold text-slate-800">{student.name}</h4>
                                                <p className="text-xs text-slate-500">{student.targetCountry} • Visa Granted</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setSelectedStudentForClaim(student);
                                                    setClaimModalOpen(true);
                                                }}
                                                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                                            >
                                                Create Claim
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* 2. Active Claims Pipeline */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800 flex items-center">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
                                    Active Claims Pipeline
                                </h3>
                                <div className="relative">
                                    <select 
                                        value={claimStatusFilter}
                                        onChange={(e) => setClaimStatusFilter(e.target.value as any)}
                                        className="appearance-none bg-white border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg pr-7 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                                    >
                                        <option value="All">All Status</option>
                                        <option value="Invoiced">Invoiced</option>
                                        <option value="Received">Received</option>
                                    </select>
                                    <Filter size={12} className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                {filteredClaims.length === 0 ? (
                                    <div className="text-center py-8 bg-slate-50 rounded-lg text-slate-400 border border-dashed border-slate-200 text-sm">
                                        No claims found for this filter.
                                    </div>
                                ) : (
                                    filteredClaims.sort((a,b) => b.invoiceDate - a.invoiceDate).map(claim => (
                                        <div key={claim.id} className={`p-4 border rounded-xl flex justify-between items-center bg-white ${claim.status === 'Received' ? 'border-emerald-100 opacity-90' : 'border-indigo-100 shadow-sm'}`}>
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <h4 className="font-bold text-slate-800">{claim.studentName}</h4>
                                                </div>
                                                <p className="text-xs text-slate-500">{claim.partnerName} • {currency} {claim.amount.toLocaleString()}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">Inv: {new Date(claim.invoiceDate).toLocaleDateString()}</p>
                                            </div>
                                            
                                            <div className="relative">
                                                <select
                                                    value={claim.status}
                                                    onChange={(e) => updateClaimStatus(claim.id, e.target.value as any)}
                                                    className={`text-[10px] px-2 py-1 rounded border outline-none cursor-pointer appearance-none pr-5 font-bold ${
                                                        claim.status === 'Received' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                                        'bg-amber-50 text-amber-700 border-amber-100'
                                                    }`}
                                                >
                                                    <option value="Invoiced">Invoiced</option>
                                                    <option value="Received">Received</option>
                                                </select>
                                                <ChevronDown size={10} className={`absolute right-1 top-1.5 pointer-events-none ${
                                                    claim.status === 'Received' ? 'text-emerald-500' : 'text-amber-500'
                                                }`} />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Partner Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center">
                                <Building size={18} className="mr-2 text-indigo-600"/> Add New Partner
                            </h3>
                            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Institution Name</label>
                                <input 
                                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                    placeholder="e.g. Macquarie University"
                                    value={newPartnerData.name}
                                    onChange={(e) => setNewPartnerData({...newPartnerData, name: e.target.value})}
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Partner Type</label>
                                    <select 
                                        className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none bg-white"
                                        value={newPartnerData.type}
                                        onChange={(e) => setNewPartnerData({...newPartnerData, type: e.target.value})}
                                    >
                                        <option value="University">University</option>
                                        <option value="Consultancy">Consultancy</option>
                                        <option value="B2B Agent">B2B Agent</option>
                                        <option value="College">College</option>
                                        <option value="Aggregator">Aggregator</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Commission %</label>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none pl-3 pr-8"
                                            placeholder="15"
                                            value={newPartnerData.commissionRate}
                                            onChange={(e) => setNewPartnerData({...newPartnerData, commissionRate: e.target.value})}
                                        />
                                        <span className="absolute right-3 top-3 text-slate-400 text-xs font-bold">%</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Agent Portal URL</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-3 text-slate-400" size={16} />
                                    <input 
                                        className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                        placeholder="https://portal.university.edu..."
                                        value={newPartnerData.portalUrl}
                                        onChange={(e) => setNewPartnerData({...newPartnerData, portalUrl: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50">
                            <button 
                                onClick={handleAddPartner}
                                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center"
                            >
                                <Save size={16} className="mr-2" /> Save Partner
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT PARTNER & LEAD INPUT MODAL */}
            {editingPartner && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${getTypeStyles(editingPartner.type)}`}>
                                    {getTypeIcon(editingPartner.type)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{editingPartner.name}</h3>
                                    <p className="text-xs text-slate-500">{editingPartner.type} Management</p>
                                </div>
                            </div>
                            <button onClick={() => setEditingPartner(null)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex border-b border-slate-100">
                            <button 
                                onClick={() => setEditTab('profile')}
                                className={`flex-1 py-3 text-sm font-bold transition-colors ${editTab === 'profile' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Profile Settings
                            </button>
                            <button 
                                onClick={() => setEditTab('leads')}
                                className={`flex-1 py-3 text-sm font-bold transition-colors ${editTab === 'leads' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Leads & Referrals
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4 overflow-y-auto">
                            {editTab === 'profile' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                                        <input 
                                            className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                            value={editingPartner.name}
                                            onChange={(e) => setEditingPartner({...editingPartner, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                                            <select 
                                                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none bg-white"
                                                value={editingPartner.type}
                                                onChange={(e) => setEditingPartner({...editingPartner, type: e.target.value as any})}
                                            >
                                                <option value="University">University</option>
                                                <option value="Consultancy">Consultancy</option>
                                                <option value="B2B Agent">B2B Agent</option>
                                                <option value="College">College</option>
                                                <option value="Aggregator">Aggregator</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Commission %</label>
                                            <input 
                                                type="number"
                                                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                                value={editingPartner.commissionRate}
                                                onChange={(e) => setEditingPartner({...editingPartner, commissionRate: Number(e.target.value)})}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Portal URL</label>
                                        <input 
                                            className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                            value={editingPartner.portalUrl}
                                            onChange={(e) => setEditingPartner({...editingPartner, portalUrl: e.target.value})}
                                        />
                                    </div>
                                    <button 
                                        onClick={handleUpdatePartner}
                                        className="w-full bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center mt-4"
                                    >
                                        <Save size={16} className="mr-2" /> Save Changes
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Add New Lead Form */}
                                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                        <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-3 flex items-center">
                                            <UserPlus size={14} className="mr-1"/> Add New Referral Lead
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <input 
                                                    className="w-full p-2.5 border border-indigo-200 rounded-lg text-sm"
                                                    placeholder="Student Name"
                                                    value={newLeadName}
                                                    onChange={e => setNewLeadName(e.target.value)}
                                                />
                                                <input 
                                                    className="w-full p-2.5 border border-indigo-200 rounded-lg text-sm"
                                                    placeholder="Phone Number"
                                                    value={newLeadPhone}
                                                    onChange={e => setNewLeadPhone(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex space-x-2">
                                                <select 
                                                    className="flex-1 p-2.5 border border-indigo-200 rounded-lg text-sm bg-white"
                                                    value={newLeadCountry}
                                                    onChange={e => setNewLeadCountry(e.target.value as Country)}
                                                >
                                                    {Object.values(Country).map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                <button 
                                                    onClick={handleAddLeadFromPartner}
                                                    disabled={!newLeadName || !newLeadPhone}
                                                    className="bg-indigo-600 text-white px-4 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Existing Leads List */}
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Referred Students</h4>
                                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                            {students.filter(s => s.referralPartnerId === editingPartner.id || s.source === 'Partner' && s.notes.includes(editingPartner.name)).length > 0 ? (
                                                students.filter(s => s.referralPartnerId === editingPartner.id || s.source === 'Partner' && s.notes.includes(editingPartner.name)).map(s => (
                                                    <div key={s.id} className="p-3 border border-slate-100 rounded-lg flex justify-between items-center bg-white">
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-sm">{s.name}</p>
                                                            <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                                                                <span className="flex items-center"><Phone size={10} className="mr-0.5"/> {s.phone}</span>
                                                                <span className="flex items-center"><MapPin size={10} className="mr-0.5"/> {s.targetCountry}</span>
                                                            </div>
                                                        </div>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                                            s.status === ApplicationStatus.VisaGranted ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                            {s.status}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-center text-slate-400 text-sm py-4 italic">No referrals tracked yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Claim Modal */}
            {claimModalOpen && selectedStudentForClaim && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                             <div>
                                <h3 className="font-bold text-slate-800">Claim Commission</h3>
                                <p className="text-xs text-slate-500">For {selectedStudentForClaim.name}</p>
                             </div>
                             <button onClick={() => setClaimModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                             <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select University/Partner</label>
                                <select 
                                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none bg-white"
                                    value={claimPartnerId}
                                    onChange={(e) => setClaimPartnerId(e.target.value)}
                                >
                                    <option value="">-- Choose Partner --</option>
                                    {partners.map(p => <option key={p.id} value={p.id}>{p.name} ({p.commissionRate}%)</option>)}
                                </select>
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Claim Amount ({currency})</label>
                                <input 
                                    type="number"
                                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                    placeholder="e.g. 250000"
                                    value={claimAmount}
                                    onChange={(e) => setClaimAmount(e.target.value)}
                                />
                                {claimPartnerId && claimAmount && (
                                    <p className="text-[10px] text-indigo-600 mt-1">
                                        Note: Check the partner portal to verify the exact amount before claiming.
                                    </p>
                                )}
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Initial Status</label>
                                <select 
                                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none bg-white"
                                    value={claimStatus}
                                    onChange={(e) => setClaimStatus(e.target.value as any)}
                                >
                                    <option value="Invoiced">Invoiced</option>
                                    <option value="Received">Received</option>
                                </select>
                             </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50">
                            <button 
                                onClick={handleCreateClaim}
                                disabled={!claimPartnerId || !claimAmount}
                                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FileText size={16} className="mr-2" /> Generate Claim
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
