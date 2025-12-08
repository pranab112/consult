
import React, { useState, useEffect } from 'react';
import { fetchStudents, saveStudents, fetchInvoices, fetchSettings } from '../../services/storageService';
import { uploadFile } from '../../services/fileStorageService';
import { Student, Invoice, AgencySettings, ApplicationStatus, ChatMessage, DocumentStatus } from '../../types';
import { UNIVERSAL_DOCS, COUNTRY_SPECIFIC_DOCS, DocRequirement } from '../../constants';
import { Loader2, LogOut, UploadCloud, FileText, CheckCircle2, MessageSquare, Send, Bell, User, DollarSign, Calendar, MapPin, Clock } from 'lucide-react';
import { logout } from '../../services/authService';

interface StudentPortalProps {
    studentId: string;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ studentId }) => {
    const [student, setStudent] = useState<Student | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [settings, setSettings] = useState<AgencySettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'documents' | 'financials' | 'chat'>('dashboard');
    
    // Chat State
    const [messageText, setMessageText] = useState('');

    // Upload State
    const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const [allStudents, allInvoices, s] = await Promise.all([
                fetchStudents(),
                fetchInvoices(),
                fetchSettings()
            ]);
            
            const currentStudent = allStudents.find(s => s.id === studentId);
            const studentInvoices = allInvoices.filter(i => i.studentId === studentId);
            
            setStudent(currentStudent || null);
            setInvoices(studentInvoices);
            setSettings(s);
            setLoading(false);
        };
        load();
    }, [studentId]);

    const handleFileUpload = async (docName: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (!student || !e.target.files?.[0]) return;
        
        try {
            setUploadingDoc(docName);
            const file = e.target.files[0];
            const storedFile = await uploadFile(file, `students/${student.id}`, student.name);
            
            const updatedStudent: Student = {
                ...student,
                documents: { ...student.documents, [docName]: 'Uploaded' },
                documentFiles: { ...student.documentFiles, [docName]: storedFile }
            };
            
            // Optimistic Update
            setStudent(updatedStudent);
            
            // Persist
            const allStudents = await fetchStudents();
            const updatedList = allStudents.map(s => s.id === student.id ? updatedStudent : s);
            await saveStudents(updatedList);
            
            alert("Document uploaded successfully!");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setUploadingDoc(null);
        }
    };

    const handleSendMessage = async () => {
        if (!student || !messageText.trim()) return;

        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            text: messageText,
            sender: 'Student',
            timestamp: Date.now()
        };

        const updatedStudent = {
            ...student,
            messages: [...(student.messages || []), newMessage]
        };

        setStudent(updatedStudent);
        setMessageText('');

        const allStudents = await fetchStudents();
        const updatedList = allStudents.map(s => s.id === student.id ? updatedStudent : s);
        await saveStudents(updatedList);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
    if (!student) return <div className="p-8 text-center">Student record not found. Please contact support.</div>;

    const steps = Object.values(ApplicationStatus);
    const currentStepIndex = steps.indexOf(student.status);
    
    // Combine docs
    const requiredDocs = [
        ...UNIVERSAL_DOCS,
        ...(COUNTRY_SPECIFIC_DOCS[student.targetCountry] || [])
    ];
    
    // Helper to check status safely (handling legacy booleans in mock data)
    const checkIsUploaded = (status: any) => status === 'Uploaded' || status === true;

    const completedDocs = requiredDocs.filter(d => checkIsUploaded(student.documents[d.name])).length;
    const progress = Math.round((completedDocs / requiredDocs.length) * 100);

    return (
        <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-20 md:pb-0">
            {/* Top Navigation */}
            <nav className="bg-slate-900 text-white sticky top-0 z-50 shadow-lg">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white mr-3">
                                {settings?.agencyName.charAt(0) || 'A'}
                            </div>
                            <span className="font-bold text-lg hidden sm:block">{settings?.agencyName || 'Student Portal'}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="hidden sm:flex flex-col items-end mr-2">
                                <span className="text-sm font-bold">{student.name}</span>
                                <span className="text-[10px] text-slate-400 uppercase">{student.targetCountry} Applicant</span>
                            </div>
                            <button onClick={logout} className="p-2 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white transition-colors">
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                
                {/* Mobile Tabs */}
                <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 flex justify-around p-2 z-50 shadow-2xl safe-area-bottom">
                     {[
                         { id: 'dashboard', icon: User, label: 'Home' },
                         { id: 'documents', icon: FileText, label: 'Docs' },
                         { id: 'financials', icon: DollarSign, label: 'Fees' },
                         { id: 'chat', icon: MessageSquare, label: 'Chat' }
                     ].map(tab => (
                         <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex flex-col items-center p-2 rounded-lg w-16 transition-all ${activeTab === tab.id ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}
                         >
                             <tab.icon size={20} className={activeTab === tab.id ? 'fill-indigo-100' : ''} />
                             <span className="text-[10px] mt-1">{tab.label}</span>
                         </button>
                     ))}
                </div>

                {/* Desktop Tabs */}
                <div className="hidden md:flex space-x-4 mb-8">
                     {[
                         { id: 'dashboard', icon: User, label: 'Dashboard' },
                         { id: 'documents', icon: FileText, label: 'Documents' },
                         { id: 'financials', icon: DollarSign, label: 'Financials' },
                         { id: 'chat', icon: MessageSquare, label: 'Messages' }
                     ].map(tab => (
                         <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center px-6 py-3 rounded-xl font-bold transition-all shadow-sm ${
                                activeTab === tab.id 
                                ? 'bg-indigo-600 text-white shadow-indigo-200' 
                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                            }`}
                         >
                             <tab.icon size={18} className="mr-2" />
                             {tab.label}
                         </button>
                     ))}
                </div>

                {/* CONTENT AREAS */}

                {activeTab === 'dashboard' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Status Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden">
                            <div className={`absolute top-0 right-0 p-4 opacity-5 ${student.status === ApplicationStatus.VisaGranted ? 'text-green-600' : 'text-indigo-600'}`}>
                                <User size={120} />
                            </div>
                            <div className="relative z-10">
                                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Current Status</h2>
                                <h1 className={`text-3xl font-bold mb-2 ${student.status === ApplicationStatus.VisaGranted ? 'text-green-600' : 'text-indigo-600'}`}>
                                    {student.status}
                                </h1>
                                <p className="text-slate-500 text-sm max-w-md">
                                    Your application for {student.targetCountry} is currently being processed. 
                                    Please check the documents tab for any pending requirements.
                                </p>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                             <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                                 <Clock className="mr-2 text-indigo-500" size={20}/> Application Timeline
                             </h3>
                             <div className="relative">
                                 <div className="absolute left-4 top-0 h-full w-0.5 bg-slate-100"></div>
                                 <div className="space-y-8">
                                     {steps.map((step, idx) => {
                                         const isCompleted = idx <= currentStepIndex;
                                         const isCurrent = idx === currentStepIndex;
                                         return (
                                             <div key={step} className="relative flex items-center">
                                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 transition-all ${
                                                     isCompleted 
                                                     ? 'bg-green-500 border-green-500 text-white' 
                                                     : 'bg-white border-slate-300 text-slate-300'
                                                 }`}>
                                                     {isCompleted ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 bg-slate-300 rounded-full"></div>}
                                                 </div>
                                                 <div className={`ml-4 p-4 rounded-xl flex-1 border transition-all ${
                                                     isCurrent 
                                                     ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                                                     : 'bg-white border-slate-100'
                                                 }`}>
                                                     <h4 className={`font-bold text-sm ${isCurrent ? 'text-indigo-800' : 'text-slate-700'}`}>{step}</h4>
                                                     {isCurrent && <p className="text-xs text-indigo-600 mt-1 font-medium">In Progress</p>}
                                                 </div>
                                             </div>
                                         );
                                     })}
                                 </div>
                             </div>
                        </div>
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                         <div className="bg-indigo-900 text-white rounded-2xl p-6 shadow-lg flex justify-between items-center">
                             <div>
                                 <h2 className="text-xl font-bold">Document Checklist</h2>
                                 <p className="text-indigo-200 text-sm mt-1">{completedDocs} of {requiredDocs.length} documents uploaded</p>
                             </div>
                             <div className="relative w-16 h-16">
                                 <svg className="h-full w-full transform -rotate-90">
                                     <circle cx="32" cy="32" r="28" fill="transparent" stroke="rgba(255,255,255,0.2)" strokeWidth="4"></circle>
                                     <circle 
                                        cx="32" cy="32" r="28" fill="transparent" stroke="#ffffff" strokeWidth="4" 
                                        strokeDasharray={175.9} strokeDashoffset={175.9 - ((progress / 100) * 175.9)}
                                     ></circle>
                                 </svg>
                                 <span className="absolute inset-0 flex items-center justify-center font-bold text-xs">{progress}%</span>
                             </div>
                         </div>

                         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                             <div className="divide-y divide-slate-100">
                                 {requiredDocs.map((doc) => {
                                     const status = student.documents[doc.name];
                                     const isUploaded = checkIsUploaded(status);
                                     const storedFile = student.documentFiles?.[doc.name];
                                     
                                     return (
                                         <div key={doc.name} className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                                             <div className="flex items-start space-x-3">
                                                 <div className={`p-2 rounded-lg mt-1 ${isUploaded ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                                     <FileText size={20} />
                                                 </div>
                                                 <div>
                                                     <h4 className={`font-bold text-sm ${isUploaded ? 'text-slate-800' : 'text-slate-600'}`}>{doc.name}</h4>
                                                     <div className="flex flex-wrap gap-2 mt-1">
                                                         <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{doc.category}</span>
                                                         {doc.condition && <span className="text-[10px] text-amber-600 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-100">{doc.condition}</span>}
                                                     </div>
                                                     {storedFile && <p className="text-xs text-indigo-600 mt-1 truncate max-w-[200px]">{storedFile.filename}</p>}
                                                 </div>
                                             </div>
                                             
                                             <label className={`w-full sm:w-auto text-center cursor-pointer px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                                                 isUploaded ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
                                             }`}>
                                                 {uploadingDoc === doc.name ? <Loader2 size={14} className="animate-spin mr-2" /> : <UploadCloud size={14} className="mr-2" />}
                                                 {uploadingDoc === doc.name ? 'Uploading...' : isUploaded ? 'Update File' : 'Upload File'}
                                                 <input type="file" className="hidden" onChange={(e) => handleFileUpload(doc.name, e)} disabled={!!uploadingDoc} />
                                             </label>
                                         </div>
                                     );
                                 })}
                             </div>
                         </div>
                    </div>
                )}

                {activeTab === 'financials' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
                                <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Total Paid</p>
                                <h2 className="text-2xl font-bold text-slate-900">
                                    {settings?.currency} {invoices.filter(i => i.status === 'Paid').reduce((acc, i) => acc + i.amount, 0).toLocaleString()}
                                </h2>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
                                <p className="text-xs font-bold text-amber-600 uppercase mb-1">Pending Due</p>
                                <h2 className="text-2xl font-bold text-slate-900">
                                    {settings?.currency} {invoices.filter(i => i.status === 'Pending').reduce((acc, i) => acc + i.amount, 0).toLocaleString()}
                                </h2>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700 text-sm">Invoice History</div>
                            {invoices.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {invoices.map(inv => (
                                        <div key={inv.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                                            <div>
                                                <p className="font-bold text-sm text-slate-800">{inv.description}</p>
                                                <p className="text-xs text-slate-500 font-mono mt-0.5">#{inv.invoiceNumber} • {new Date(inv.date).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-slate-900 text-sm">{settings?.currency} {inv.amount.toLocaleString()}</p>
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${
                                                    inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {inv.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-slate-400 text-sm">No invoices found.</div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'chat' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-[calc(100vh-220px)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
                            <h2 className="font-bold text-slate-800 flex items-center">
                                <MessageSquare className="mr-2 text-indigo-600" size={18} />
                                Chat with Counsellor
                            </h2>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                            {!student.messages || student.messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                                    <MessageSquare size={48} className="mb-2 opacity-20"/>
                                    <p>No messages yet.</p>
                                    <p>Start the conversation below.</p>
                                </div>
                            ) : (
                                student.messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'Student' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                                            msg.sender === 'Student' 
                                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                                        }`}>
                                            <p>{msg.text}</p>
                                            <p className={`text-[10px] mt-1 text-right ${msg.sender === 'Student' ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 bg-white border-t border-slate-100 rounded-b-2xl">
                            <div className="flex space-x-2">
                                <input 
                                    className="flex-1 p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    placeholder="Type your message..."
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                />
                                <button 
                                    onClick={handleSendMessage}
                                    disabled={!messageText.trim()}
                                    className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};
