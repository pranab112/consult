import React, { useState, useEffect } from 'react';
import { Plus, Search, User, FileText, Check, UploadCloud, Trash2, Loader2, AlertCircle, MapPin, Phone, Mail, FolderOpen, BookOpen, Receipt, Globe, X, Send, MessageCircle, Link, Lock, CheckCircle2, DollarSign, Wallet, Trophy, Activity, ArrowLeft, ScanFace, CreditCard, Sparkles, Key, Calculator, Calendar, MessageSquare, Download, Clock, Ban, Package, Share2, Clipboard, GraduationCap } from 'lucide-react';
import { Student, Country, ApplicationStatus, NocStatus, Invoice, AgencySettings, UserRole, DocumentStatus } from '../../types';
import { fetchStudents, saveStudents, fetchInvoices, saveInvoices, fetchSettings } from '../../services/storageService';
import { getCurrentUser } from '../../services/authService';
import { uploadFile } from '../../services/fileStorageService';
import { UNIVERSAL_DOCS, COUNTRY_SPECIFIC_DOCS, DocRequirement } from '../../constants';
import { simulateSendEmail, generateWhatsAppLink, fillTemplate } from '../../services/communicationService';
import { logActivity } from '../../services/auditService';
import { extractPassportData, analyzeVisaRisk } from '../../services/geminiService';
import { runStatusAutomation } from '../../services/workflowService';
import { generatePartnerBundle } from '../../services/bundleService';

const LEAD_SOURCES = ['Walk-in', 'Referral', 'Web Form', 'Social Media', 'Event', 'Partner', 'Other'];

export const StudentManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<AgencySettings | null>(null);
  
  const [userRole, setUserRole] = useState<UserRole>('Viewer');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'documents' | 'notes' | 'profile' | 'testprep'>('documents');
  
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'consultancy' | 'testprep'>('consultancy');

  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [linkingDoc, setLinkingDoc] = useState<string | null>(null);

  // Bundle Generation State
  const [isBundling, setIsBundling] = useState(false);
  const [bundleReady, setBundleReady] = useState<Blob | null>(null);
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [secureLink, setSecureLink] = useState('');

  // AI Risk State
  const [analyzingRisk, setAnalyzingRisk] = useState(false);

  // Edit Form Data
  const [editFormData, setEditFormData] = useState<Partial<Student>>({ 
      name: '', email: '', phone: '', targetCountry: Country.Australia,
      testType: 'None', testScore: '', targetScore: '', gpa: '', financialCap: 'Low', source: 'Walk-in',
      age: 0, educationGap: 0, workExperience: 0, previousRefusals: false,
      passportNumber: '', dateOfBirth: '', address: '', nationality: '', gender: 'Male',
      portalPassword: '',
      riskAnalysis: undefined,
      testPrep: {
          enrolled: false,
          bookingStatus: 'Pending',
          mockScores: { listening: '', reading: '', writing: '', speaking: '', overall: '' }
      }
  });

  // Add Student Fields
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentCountry, setNewStudentCountry] = useState<Country>(Country.Australia);
  const [newStudentSource, setNewStudentSource] = useState('Walk-in');
  const [newStudentTestType, setNewStudentTestType] = useState('IELTS');
  const [newStudentTestScore, setNewStudentTestScore] = useState('');
  const [newStudentTargetScore, setNewStudentTargetScore] = useState('');
  const [newStudentGpa, setNewStudentGpa] = useState('');
  const [newStudentFinance, setNewStudentFinance] = useState('Low');
  const [newStudentBatch, setNewStudentBatch] = useState('Morning (7-8 AM)');
  const [newStudentAge, setNewStudentAge] = useState<string>('');
  const [newStudentGap, setNewStudentGap] = useState<string>('');
  const [newStudentWorkExp, setNewStudentWorkExp] = useState<string>('');
  const [newStudentRefusals, setNewStudentRefusals] = useState<boolean>(false);
  const [newStudentAddress, setNewStudentAddress] = useState('');
  const [newStudentPassport, setNewStudentPassport] = useState('');
  const [newStudentDOB, setNewStudentDOB] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newStudentNationality, setNewStudentNationality] = useState('');
  const [scanningPassport, setScanningPassport] = useState(false);

  const [showVisaWorkflow, setShowVisaWorkflow] = useState(false);
  const [visaCommission, setVisaCommission] = useState('');
  const [processingVisa, setProcessingVisa] = useState(false);
  const [sendEmailChecked, setSendEmailChecked] = useState(true);
  const [recordRevenueChecked, setRecordRevenueChecked] = useState(true);
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
        setLoading(true);
        try {
            const currentUser = getCurrentUser();
            setUserRole(currentUser?.role || 'Viewer');

            const [s, i, set] = await Promise.all([
                fetchStudents(),
                fetchInvoices(),
                fetchSettings()
            ]);
            setStudents(s);
            setInvoices(i);
            setSettings(set);
            if (set) {
                setNewStudentCountry(set.defaultCountry);
                setSendEmailChecked(set.notifications.emailOnVisa);
            }
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
        }
    };
    init();
  }, []);

  const plan = settings?.subscription?.plan || 'Free';
  const studentLimit = plan === 'Free' ? 50 : 99999;
  const canAddStudent = students.length < studentLimit && userRole !== 'Viewer';
  const canDelete = userRole === 'Owner';
  const canEdit = userRole !== 'Viewer';

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  useEffect(() => {
    if (selectedStudent) {
        setEditFormData({ ...selectedStudent });
        setBundleReady(null);
        setShowBundleModal(false);
    }
  }, [selectedStudentId, selectedStudent, viewMode]);

  const handleAsyncUpdate = async (updatedStudents: Student[]) => {
      setSyncing(true);
      setStudents(updatedStudents);
      await saveStudents(updatedStudents);
      setSyncing(false);
  };

  const handleAsyncInvoiceUpdate = async (updatedInvoices: Invoice[]) => {
      setSyncing(true);
      setInvoices(updatedInvoices);
      await saveInvoices(updatedInvoices);
      setSyncing(false);
  };

  const calculateAge = (dob: string): number => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  };

  const handlePassportScan = async (e: React.ChangeEvent<HTMLInputElement>, isEditMode: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanningPassport(true);
    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64 = (reader.result as string).split(',')[1];
            const data = await extractPassportData(base64, file.type);
            
            if (data) {
                if (isEditMode) {
                    setEditFormData(prev => ({
                        ...prev,
                        name: data.name || prev.name,
                        passportNumber: data.passportNumber || prev.passportNumber,
                        dateOfBirth: data.dateOfBirth || prev.dateOfBirth,
                        address: data.address || prev.address,
                        nationality: data.nationality || prev.nationality,
                        gender: data.gender || prev.gender,
                        age: calculateAge(data.dateOfBirth) || prev.age
                    }));
                    alert("Passport scanned successfully! Profile fields updated.");
                } else {
                    setNewStudentName(data.name);
                    setNewStudentPassport(data.passportNumber);
                    setNewStudentAddress(data.address);
                    setNewStudentDOB(data.dateOfBirth);
                    setNewStudentNationality(data.nationality);
                    if (data.gender) setNewStudentGender(data.gender as 'Male' | 'Female' | 'Other');
                    if (data.dateOfBirth) {
                        setNewStudentAge(calculateAge(data.dateOfBirth).toString());
                    }
                    alert("Passport scanned! Form auto-filled.");
                }
                logActivity('UPDATE', 'Student', `Used AI OCR to scan passport for ${data.name}`);
            } else {
                alert("Could not extract data from passport. Please ensure image is clear.");
            }
            setScanningPassport(false);
        };
    } catch (err) {
        console.error(err);
        alert("Error scanning passport.");
        setScanningPassport(false);
    }
    e.target.value = '';
  };

  const handleRunRiskAnalysis = async () => {
      if (!selectedStudent || !editFormData.targetCountry) return;
      setAnalyzingRisk(true);
      try {
          const profileStr = `
            Age: ${editFormData.age || 'Unknown'},
            Education Gap: ${editFormData.educationGap || 0} years,
            English Score: ${editFormData.testScore || 'Pending'},
            Work Experience: ${editFormData.workExperience || 0} years,
            Previous Refusals: ${editFormData.previousRefusals ? 'Yes' : 'No'},
            Financial Cap: ${editFormData.financialCap || 'Unknown'}
          `;
          const result = await analyzeVisaRisk(profileStr, editFormData.targetCountry);
          
          const updatedAnalysis = { date: Date.now(), result };
          setEditFormData(prev => ({ ...prev, riskAnalysis: updatedAnalysis }));
          
          // Save immediately
          updateStudent({ 
              ...selectedStudent, 
              ...editFormData as Student, 
              riskAnalysis: updatedAnalysis 
          });
          logActivity('UPDATE', 'Student', `Ran AI Risk Analysis for ${selectedStudent.name}`);
      } catch (err) {
          alert("Failed to analyze risk. Please try again.");
      } finally {
          setAnalyzingRisk(false);
      }
  };

  const updateStudent = (updatedStudent: Student) => {
    if (!canEdit) {
        alert("View-only access. Cannot edit.");
        return;
    }
    const updatedList = students.map(s => s.id === updatedStudent.id ? updatedStudent : s);
    handleAsyncUpdate(updatedList);
  };

  const handleAddStudent = async () => {
    if (!newStudentName) {
        alert("Please enter a student name.");
        return;
    }
    if (!canAddStudent) {
        if (userRole === 'Viewer') alert("Viewers cannot add students.");
        else alert("Plan limit reached. Please upgrade.");
        return;
    }
    const isTestPrep = viewMode === 'testprep';
    const defaultPassword = newStudentName.split(' ')[0] + '123';

    const newStudent: Student = {
      id: Date.now().toString(),
      name: newStudentName,
      email: newStudentEmail,
      phone: newStudentPhone,
      targetCountry: newStudentCountry,
      status: ApplicationStatus.Lead,
      nocStatus: NocStatus.NotApplied,
      documents: {},
      documentFiles: {},
      documentDependencies: {},
      notes: isTestPrep ? `Enrolled directly into ${newStudentBatch}` : '',
      createdAt: Date.now(),
      blockedBy: [],
      testType: newStudentTestType as any,
      testScore: newStudentTestScore,
      targetScore: newStudentTargetScore,
      gpa: newStudentGpa,
      financialCap: newStudentFinance as any,
      age: Number(newStudentAge) || undefined,
      educationGap: Number(newStudentGap) || 0,
      workExperience: Number(newStudentWorkExp) || 0,
      previousRefusals: newStudentRefusals,
      source: newStudentSource || 'Walk-in',
      passportNumber: newStudentPassport,
      dateOfBirth: newStudentDOB,
      address: newStudentAddress,
      gender: newStudentGender,
      nationality: newStudentNationality,
      portalPassword: defaultPassword,
      messages: [],
      testPrep: { 
          enrolled: isTestPrep,
          batch: isTestPrep ? newStudentBatch as any : undefined,
          bookingStatus: 'Pending',
          mockScores: { listening: '', reading: '', writing: '', speaking: '', overall: '' }
      }
    };
    
    const updated = [newStudent, ...students];
    await handleAsyncUpdate(updated);
    logActivity('CREATE', 'Student', `Created new student: ${newStudentName} (Source: ${newStudentSource})`);
    setIsAdding(false);
    
    // Reset Form
    setNewStudentName(''); setNewStudentEmail(''); setNewStudentPhone(''); setNewStudentTestScore(''); setNewStudentTargetScore('');
    setNewStudentGpa(''); setNewStudentAge(''); setNewStudentGap(''); setNewStudentWorkExp('');
    setNewStudentRefusals(false); setNewStudentSource('Walk-in'); setNewStudentPassport('');
    setNewStudentAddress(''); setNewStudentDOB('');
    setNewStudentGender('Male'); setNewStudentNationality('');
    
    setSelectedStudentId(newStudent.id);
  };

  const handleSaveProfile = () => {
      if (!selectedStudent) return;
      updateStudent({ ...selectedStudent, ...editFormData as Student });
      logActivity('UPDATE', 'Student', `Updated profile details for ${selectedStudent.name}`);
      alert("Profile updated successfully");
  };

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!selectedStudent || !canEdit) return;
    logActivity('UPDATE', 'Student', `Changed status of ${selectedStudent.name} to ${newStatus}`);
    updateStudent({ ...selectedStudent, status: newStatus });
    await runStatusAutomation(selectedStudent, newStatus);
    if (newStatus === ApplicationStatus.VisaGranted) {
        setVisaCommission('100000');
        setShowVisaWorkflow(true);
    }
  };

  // Bundle Logic
  const validateBundleRequirements = () => {
      if (!selectedStudent) return [];
      const missing = [];
      const docs = selectedStudent.documents || {};
      if (docs['Passport (Valid 6mo+)'] !== 'Uploaded') missing.push('Passport');
      if (docs['SLC/SEE Marksheet'] !== 'Uploaded') missing.push('SLC Marksheet');
      return missing;
  };

  const handleGenerateBundle = async () => {
      if (!selectedStudent || !settings) return;
      const missing = validateBundleRequirements();
      if (missing.length > 0) {
          alert(`Cannot generate bundle. Missing critical documents:\n\n- ${missing.join('\n- ')}`);
          return;
      }
      setIsBundling(true);
      try {
          const zipBlob = await generatePartnerBundle(selectedStudent, settings.agencyName);
          setBundleReady(zipBlob);
          setSecureLink(`https://portal.${settings.agencyName.toLowerCase().replace(/\s/g,'')}.com/s/${selectedStudent.id}/bundle`);
          setShowBundleModal(true);
          logActivity('EXPORT', 'File', `Generated Partner Bundle for ${selectedStudent.name}`);
      } catch (err) {
          console.error(err);
          alert("Failed to generate bundle.");
      } finally {
          setIsBundling(false);
      }
  };

  const downloadBundle = () => {
      if (!bundleReady || !selectedStudent) return;
      const url = window.URL.createObjectURL(bundleReady);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedStudent.name.replace(/\s/g,'_')}_Partner_Packet.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
  };

  const copySecureLink = () => {
      navigator.clipboard.writeText(secureLink);
      alert("Secure link copied to clipboard!");
  };

  const openWhatsApp = (type: 'update' | 'docs' | 'congrats') => {
      if (!selectedStudent || !settings) return;
      setWhatsAppOpen(false);
      let text = "";
      if (type === 'update') {
          const tpl = settings.templates?.whatsappUpdate || "Hi {student_name}, update on your application.";
          text = fillTemplate(tpl, selectedStudent, settings);
      } else if (type === 'docs') {
          text = `Hi ${selectedStudent.name}, please upload pending documents.`;
      } else {
          text = `Congratulations ${selectedStudent.name}! Visa Granted!`;
      }
      window.open(generateWhatsAppLink(selectedStudent.phone, text), '_blank');
  };

  const handleDeleteStudent = () => {
      if (!selectedStudent) return;
      if (!canDelete) { alert("Only Owners can delete."); return; }
      if (window.confirm("Delete student permanently?")) {
          logActivity('DELETE', 'Student', `Deleted student: ${selectedStudent.name}`);
          const updatedList = students.filter(s => s.id !== selectedStudent.id);
          handleAsyncUpdate(updatedList);
          setSelectedStudentId(null);
      }
  };

  // Helper for rendering docs
  const renderDocumentItem = (doc: DocRequirement) => {
    if(!selectedStudent) return null;
    const status = selectedStudent.documents[doc.name] || 'Pending';
    const storedFile = selectedStudent.documentFiles?.[doc.name];
    const fileData = typeof storedFile === 'string' ? { filename: storedFile } : storedFile;
    
    return (
        <div key={doc.name} className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 gap-4">
            <div className="flex items-start space-x-3 flex-1">
                <div className={`p-2 rounded-lg mt-1 ${
                    status === 'Uploaded' ? 'bg-green-100 text-green-600' : 
                    status === 'NotRequired' ? 'bg-slate-100 text-slate-400' :
                    'bg-amber-50 text-amber-500'
                }`}>
                    {status === 'Uploaded' ? <Check size={16} /> : status === 'NotRequired' ? <Ban size={16}/> : <AlertCircle size={16} />}
                </div>
                <div>
                    <div className="flex items-center space-x-2">
                         <p className={`text-sm font-medium ${status === 'Uploaded' ? 'text-slate-800' : 'text-slate-600'}`}>{doc.name}</p>
                         <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{doc.category}</span>
                    </div>
                    {doc.condition && <p className="text-[10px] text-amber-600 font-medium mt-0.5">({doc.condition})</p>}
                    {fileData && (
                        <div className="flex items-center space-x-3 mt-1.5 bg-slate-50 px-2 py-1 rounded w-fit">
                            <span className="text-[10px] text-indigo-600 font-medium truncate max-w-[150px]">{fileData.filename}</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center space-x-3">
                <select 
                    value={status}
                    onChange={(e) => {
                        if (!selectedStudent) return;
                        const updatedDocs = { ...selectedStudent.documents, [doc.name]: e.target.value as DocumentStatus };
                        updateStudent({ ...selectedStudent, documents: updatedDocs });
                    }}
                    className={`text-xs font-bold py-1.5 pl-2 pr-6 rounded-lg appearance-none cursor-pointer outline-none transition-colors border ${
                        status === 'Uploaded' ? 'bg-green-50 text-green-700 border-green-200' :
                        status === 'NotRequired' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                    style={{backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.2rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.2em 1.2em`}}
                >
                    <option value="Pending">Pending</option>
                    <option value="Uploaded">Uploaded</option>
                    <option value="NotRequired">N/A</option>
                </select>
                <label className={`cursor-pointer p-2 rounded-lg transition-all flex items-center justify-center border ${
                    status === 'Uploaded' 
                    ? 'text-slate-400 border-slate-200 hover:text-indigo-600 hover:border-indigo-200' 
                    : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                }`} title="Upload File">
                    {uploadingDoc === doc.name ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                    <input type="file" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !selectedStudent) return;
                        setUploadingDoc(doc.name);
                        try {
                            const storedFile = await uploadFile(file, `students/${selectedStudent.id}`, getCurrentUser()?.name || 'Unknown');
                            const updatedFiles = { ...(selectedStudent.documentFiles || {}), [doc.name]: storedFile };
                            const updatedDocs = { ...selectedStudent.documents, [doc.name]: 'Uploaded' as DocumentStatus };
                            updateStudent({ ...selectedStudent, documentFiles: updatedFiles, documents: updatedDocs });
                            setUploadSuccess(doc.name); setTimeout(()=>setUploadSuccess(null), 3000);
                        } catch (err: any) { alert(err.message); } finally { setUploadingDoc(null); }
                        e.target.value = '';
                    }} disabled={uploadingDoc === doc.name} />
                </label>
            </div>
        </div>
    );
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.Lead: return 'bg-slate-100 text-slate-700';
      case ApplicationStatus.Applied: return 'bg-blue-100 text-blue-700';
      case ApplicationStatus.OfferReceived: return 'bg-yellow-100 text-yellow-700';
      case ApplicationStatus.VisaGranted: return 'bg-green-100 text-green-700';
      case ApplicationStatus.VisaRejected: return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const filteredStudents = students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.phone.includes(searchTerm);
      const matchStatus = statusFilter === 'All' || s.status === statusFilter;
      const matchMode = viewMode === 'consultancy' ? true : s.testPrep?.enrolled;
      return matchSearch && matchStatus && matchMode;
  });

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

  return (
    <div className="flex h-full bg-slate-50">
      
      {/* List View */}
      <div className={`w-full flex flex-col bg-white transition-all ${selectedStudentId ? 'hidden' : 'flex'}`}>
        <div className="p-6 border-b border-slate-100 space-y-4 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <div>
                <h1 className="text-2xl font-bold text-slate-900">Student Manager</h1>
                <p className="text-slate-500 text-sm">Manage applications, documents, and test prep.</p>
             </div>
             <div className="flex space-x-3 w-full sm:w-auto">
                 <div className="flex bg-slate-100 rounded-lg p-1">
                     <button onClick={() => setViewMode('consultancy')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'consultancy' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Consultancy</button>
                     <button onClick={() => setViewMode('testprep')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'testprep' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Test Prep</button>
                 </div>
                 <button onClick={() => setIsAdding(true)} disabled={!canAddStudent} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center disabled:opacity-50">
                    <Plus size={18} className="mr-2" /> Add Student
                 </button>
             </div>
          </div>
          <div className="flex gap-4">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
             </div>
             {viewMode === 'consultancy' && (
                 <select className="p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                     <option value="All">All Statuses</option>
                     {Object.values(ApplicationStatus).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
             )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {filteredStudents.length === 0 ? (
                <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100 border-dashed">
                    <User size={48} className="mx-auto mb-4 opacity-20"/>
                    <p className="text-lg font-medium">No students found.</p>
                </div>
            ) : viewMode === 'testprep' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                   <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                         <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                             <tr>
                                 <th className="px-6 py-4">Student Name</th>
                                 <th className="px-6 py-4">Contact</th>
                                 <th className="px-6 py-4">Exam Target</th>
                                 <th className="px-6 py-4">Batch</th>
                                 <th className="px-6 py-4">Exam Date</th>
                                 <th className="px-6 py-4">Status</th>
                                 <th className="px-6 py-4 text-right">Action</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                            {filteredStudents.map(student => (
                                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-800">{student.name}</td>
                                    <td className="px-6 py-4 text-slate-500">{student.phone}</td>
                                    <td className="px-6 py-4"><span className="bg-slate-100 px-2 py-1 rounded font-mono text-xs">{student.testType}</span></td>
                                    <td className="px-6 py-4 text-slate-600">{student.testPrep?.batch || 'No Batch'}</td>
                                    <td className="px-6 py-4 text-slate-500">{student.testPrep?.examDate ? new Date(student.testPrep.examDate).toLocaleDateString() : '-'}</td>
                                    <td className="px-6 py-4">
                                         <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${student.testPrep?.bookingStatus === 'Booked' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{student.testPrep?.bookingStatus || 'Pending'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => setSelectedStudentId(student.id)} className="text-indigo-600 hover:text-indigo-800 font-bold text-xs">View Details</button>
                                    </td>
                                </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredStudents.map((student) => (
                    <div key={student.id} onClick={() => setSelectedStudentId(student.id)} className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between h-48">
                      <div>
                          <div className="flex justify-between items-start mb-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${student.status === ApplicationStatus.VisaGranted ? 'bg-emerald-500' : 'bg-indigo-500'}`}>{student.name.charAt(0)}</div>
                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide ${getStatusColor(student.status)}`}>{student.status}</span>
                          </div>
                          <h3 className="font-bold text-lg text-slate-900 truncate mb-1 group-hover:text-indigo-600 transition-colors">{student.name}</h3>
                          <p className="text-xs text-slate-400 mb-4">{student.email || 'No email'}</p>
                      </div>
                      <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-xs text-slate-500">
                        <span className="flex items-center"><MapPin size={12} className="mr-1"/> {student.targetCountry}</span>
                        <span className="flex items-center"><Phone size={12} className="mr-1"/> {student.phone}</span>
                      </div>
                    </div>
                  ))}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Details View */}
      <div className={`w-full flex flex-col bg-slate-50 transition-all ${selectedStudentId ? 'flex' : 'hidden'}`}>
        {selectedStudent ? (
          <>
            <div className="bg-white border-b border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-30 shadow-sm">
               <div className="flex items-center">
                   <button onClick={() => setSelectedStudentId(null)} className="mr-4 p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors group"><ArrowLeft size={24} className="group-hover:text-indigo-600 transition-colors" /></button>
                   <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">{selectedStudent.name.charAt(0)}</div>
                   <div className="ml-4">
                       <h2 className="text-xl font-bold text-slate-900 flex items-center">{selectedStudent.name} {selectedStudent.status === ApplicationStatus.VisaGranted && <span className="ml-3 flex items-center text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200"><Sparkles size={10} className="mr-1" /> Complete</span>}</h2>
                       <div className="flex items-center space-x-4 text-sm text-slate-500 mt-1">
                           <span className="flex items-center"><Mail size={14} className="mr-1"/> {selectedStudent.email || 'No email'}</span>
                           <span className="flex items-center"><Phone size={14} className="mr-1"/> {selectedStudent.phone}</span>
                       </div>
                   </div>
               </div>
               
               <div className="flex space-x-2 w-full md:w-auto">
                   <select value={selectedStudent.status} onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)} disabled={!canEdit} className="px-3 py-2 rounded-lg text-sm font-bold border-none outline-none cursor-pointer shadow-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                       {Object.values(ApplicationStatus).map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                   <button onClick={() => setWhatsAppOpen(!whatsAppOpen)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors relative">
                       <MessageCircle size={20} />
                       {whatsAppOpen && (
                           <div className="absolute right-0 top-12 w-48 bg-white shadow-xl rounded-xl border border-slate-100 z-50 p-1 flex flex-col">
                               <button onClick={() => openWhatsApp('update')} className="text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-xs font-medium">Send Status Update</button>
                               <button onClick={() => openWhatsApp('docs')} className="text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-xs font-medium">Request Documents</button>
                               <button onClick={() => openWhatsApp('congrats')} className="text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-xs font-medium">Visa Congratulation</button>
                           </div>
                       )}
                   </button>
                   {canDelete && <button onClick={handleDeleteStudent} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"><Trash2 size={20} /></button>}
               </div>
            </div>

            <div className="bg-white border-b border-slate-200 px-6">
                <div className="flex space-x-6 overflow-x-auto max-w-7xl mx-auto">
                    {[{id:'documents', label:'Documents', icon:FolderOpen}, {id:'profile', label:'Profile', icon:User}, {id:'testprep', label:'Test Prep', icon:BookOpen}, {id:'notes', label:'Notes & Timeline', icon:FileText}].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center space-x-2 py-4 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                            <tab.icon size={16} /> <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                {activeTab === 'documents' && (
                    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-end">
                            <button onClick={handleGenerateBundle} disabled={isBundling} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center shadow-lg hover:bg-indigo-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                                {isBundling ? <Loader2 className="animate-spin mr-2"/> : <Package className="mr-2" size={18}/>}
                                {isBundling ? 'Preparing Bundle...' : 'Generate Partner Packet'}
                            </button>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 flex justify-between items-center"><span className="flex items-center"><Globe size={16} className="mr-2 text-indigo-500"/> Universal Core</span></div>
                            <div className="divide-y divide-slate-50">{UNIVERSAL_DOCS.map(doc => renderDocumentItem(doc))}</div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 flex justify-between items-center"><span className="flex items-center"><MapPin size={16} className="mr-2 text-indigo-500"/> {selectedStudent.targetCountry} Specific</span></div>
                            <div className="divide-y divide-slate-50">{(COUNTRY_SPECIFIC_DOCS[selectedStudent.targetCountry] || []).map(doc => renderDocumentItem(doc))}</div>
                        </div>
                    </div>
                )}

                {activeTab === 'testprep' && (
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                                <h3 className="font-bold text-slate-800 flex items-center"><BookOpen className="mr-2 text-indigo-600"/> Academic Profile</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Test Type</label><select className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50" value={editFormData.testType} onChange={(e) => setEditFormData({...editFormData, testType: e.target.value as any})}><option value="IELTS">IELTS</option><option value="PTE">PTE</option><option value="TOEFL">TOEFL</option><option value="None">None</option></select></div>
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Score</label><input className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50" placeholder="e.g. 7.0" value={editFormData.targetScore} onChange={(e) => setEditFormData({...editFormData, targetScore: e.target.value})}/></div>
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">GPA / Percentage</label><input className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50" placeholder="e.g. 3.6 or 80%" value={editFormData.gpa} onChange={(e) => setEditFormData({...editFormData, gpa: e.target.value})}/></div>
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Real Score</label><input className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-bold text-indigo-600" placeholder="Pending" value={editFormData.testScore} onChange={(e) => setEditFormData({...editFormData, testScore: e.target.value})}/></div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                                <h3 className="font-bold text-slate-800 flex items-center"><Calendar className="mr-2 text-indigo-600"/> Exam Administration</h3>
                                <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Exam Date</label><input type="date" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={editFormData.testPrep?.examDate ? new Date(editFormData.testPrep.examDate).toISOString().split('T')[0] : ''} onChange={(e) => setEditFormData({...editFormData, testPrep: { ...editFormData.testPrep!, examDate: new Date(e.target.value).getTime() }})}/></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Booking Status</label><select className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white" value={editFormData.testPrep?.bookingStatus} onChange={(e) => setEditFormData({...editFormData, testPrep: { ...editFormData.testPrep!, bookingStatus: e.target.value as any }})}><option value="Pending">Pending</option><option value="Booked">Booked</option><option value="Completed">Completed</option></select></div>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-2"><button onClick={handleSaveProfile} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg">Save Test Prep Details</button></div>
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Portal Credentials */}
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 shadow-sm">
                            <h3 className="font-bold text-indigo-900 flex items-center mb-4"><Key className="mr-2 text-indigo-600"/> Client Portal Access</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="text-xs font-bold text-indigo-700 uppercase mb-1 block">Portal Login Email</label><p className="font-mono text-sm bg-white px-3 py-2 rounded border border-indigo-200 text-slate-700">{selectedStudent.email || 'No email set'}</p></div>
                                <div><label className="text-xs font-bold text-indigo-700 uppercase mb-1 block">Access Password</label><p className="font-mono text-lg font-bold bg-white px-3 py-1.5 rounded border border-indigo-200 text-slate-800 min-w-[120px]">{selectedStudent.portalPassword || 'Not Set'}</p></div>
                            </div>
                        </div>

                        {/* OCR */}
                        <div className="bg-slate-900 text-white rounded-xl p-6 relative overflow-hidden flex flex-col sm:flex-row justify-between items-center gap-4">
                             <div className="relative z-10"><h3 className="font-bold text-lg flex items-center mb-1"><ScanFace className="mr-2"/> AI Profile Update</h3><p className="text-slate-300 text-sm">Scan a new passport to auto-update details instantly.</p></div>
                             <div className="relative z-10"><label className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-sm cursor-pointer hover:bg-slate-100 transition-colors flex items-center">{scanningPassport ? <Loader2 className="animate-spin mr-2"/> : <UploadCloud className="mr-2"/>}{scanningPassport ? 'Scanning...' : 'Scan Passport'}<input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handlePassportScan(e, true)} disabled={scanningPassport} /></label></div>
                        </div>

                        {/* Personal Details */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                            <h3 className="text-lg font-bold mb-6 text-slate-800">Edit Personal Details</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <input className="w-full p-3 border border-slate-200 rounded-lg" value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} placeholder="Email"/>
                                    <input className="w-full p-3 border border-slate-200 rounded-lg" value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} placeholder="Phone"/>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <select className="w-full p-3 border border-slate-200 rounded-lg bg-white" value={editFormData.targetCountry} onChange={e => setEditFormData({...editFormData, targetCountry: e.target.value as Country})}>{Object.values(Country).map(c => <option key={c} value={c}>{c}</option>)}</select>
                                    <select className="w-full p-3 border border-slate-200 rounded-lg bg-white" value={editFormData.source} onChange={e => setEditFormData({...editFormData, source: e.target.value})}>{LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                                </div>
                            </div>
                        </div>

                        {/* Risk Assessment Profile */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                    <Activity className="mr-2 text-indigo-600" size={20}/> Visa Risk Profile
                                </h3>
                                <button 
                                    onClick={handleRunRiskAnalysis}
                                    disabled={analyzingRisk}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center shadow-lg shadow-indigo-200 disabled:opacity-50"
                                >
                                    {analyzingRisk ? <Loader2 className="animate-spin mr-2" size={14}/> : <Sparkles className="mr-2" size={14}/>}
                                    Analyze with AI
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Age</label><input type="number" className="w-full p-3 border border-slate-200 rounded-lg" value={editFormData.age} onChange={e => setEditFormData({...editFormData, age: Number(e.target.value)})} /></div>
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gap (Yrs)</label><input type="number" className="w-full p-3 border border-slate-200 rounded-lg" value={editFormData.educationGap} onChange={e => setEditFormData({...editFormData, educationGap: Number(e.target.value)})} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Work Exp (Yrs)</label><input type="number" className="w-full p-3 border border-slate-200 rounded-lg" value={editFormData.workExperience} onChange={e => setEditFormData({...editFormData, workExperience: Number(e.target.value)})} /></div>
                                    <div className="flex items-center pt-6"><input type="checkbox" className="w-5 h-5 text-indigo-600 rounded mr-2" checked={editFormData.previousRefusals} onChange={e => setEditFormData({...editFormData, previousRefusals: e.target.checked})} /><label className="text-sm font-medium text-slate-700">Previous Refusals?</label></div>
                                </div>
                            </div>

                            {/* AI Analysis Result */}
                            {editFormData.riskAnalysis && (
                                <div className="mt-6 p-5 bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 rounded-xl animate-in fade-in slide-in-from-top-2">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-sm font-bold text-indigo-900 flex items-center"><Activity size={14} className="mr-2"/> AI Risk Report</h4>
                                        <span className="text-[10px] text-slate-400">{new Date(editFormData.riskAnalysis.date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed border-t border-indigo-100 pt-3">
                                        {editFormData.riskAnalysis.result}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6"><button onClick={handleSaveProfile} className="w-full bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg text-sm uppercase tracking-wide">Save All Changes</button></div>
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="max-w-4xl mx-auto h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 flex-1 flex flex-col min-h-[400px]">
                            <textarea className="w-full flex-1 bg-transparent border-none outline-none resize-none text-sm text-slate-700 leading-relaxed" placeholder="Enter session notes here..." value={selectedStudent.notes} onChange={(e) => updateStudent({...selectedStudent, notes: e.target.value})} />
                        </div>
                    </div>
                )}
            </div>
          </>
        ) : null}
      </div>
      
      {/* Modals */}
      {isAdding && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                    <h3 className="font-bold text-xl text-slate-900">Add New Student</h3>
                    <p className="text-sm text-slate-500">Create a comprehensive student profile</p>
                </div>
                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <X size={24}/>
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
                {/* AI Scan Section */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-8 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="bg-indigo-600 text-white p-3 rounded-lg">
                            <ScanFace size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-indigo-900">AI Passport Autofill</h4>
                            <p className="text-xs text-indigo-700">Upload a passport image to instantly fill details.</p>
                        </div>
                    </div>
                    <label className="bg-white text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg font-bold text-sm cursor-pointer hover:bg-indigo-50 transition-colors flex items-center shadow-sm">
                        {scanningPassport ? <Loader2 className="animate-spin mr-2"/> : <UploadCloud className="mr-2"/>}
                        {scanningPassport ? 'Scanning...' : 'Upload Passport'}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePassportScan(e, false)} disabled={scanningPassport} />
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Personal Info */}
                    <div className="space-y-6">
                        <h4 className="font-bold text-slate-800 flex items-center text-sm uppercase tracking-wide border-b border-slate-100 pb-2">
                            <User className="mr-2 text-slate-400" size={16}/> Personal Information
                        </h4>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name <span className="text-red-500">*</span></label>
                                <input className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="e.g. Ram Sharma" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone <span className="text-red-500">*</span></label>
                                    <input className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="98XXXXXXXX" value={newStudentPhone} onChange={e => setNewStudentPhone(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date of Birth</label>
                                    <input type="date" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-600" value={newStudentDOB} onChange={e => { setNewStudentDOB(e.target.value); setNewStudentAge(calculateAge(e.target.value).toString()); }} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gender</label>
                                    <select 
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white" 
                                        value={newStudentGender} 
                                        onChange={e => setNewStudentGender(e.target.value as any)}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nationality</label>
                                    <input 
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                                        placeholder="e.g. Nepali" 
                                        value={newStudentNationality} 
                                        onChange={e => setNewStudentNationality(e.target.value)} 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                                <input type="email" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="student@example.com" value={newStudentEmail} onChange={e => setNewStudentEmail(e.target.value)} />
                            </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Passport Number</label>
                                    <input className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="Passport No." value={newStudentPassport} onChange={e => setNewStudentPassport(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                                    <input className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="City, District" value={newStudentAddress} onChange={e => setNewStudentAddress(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Academic & Application */}
                    <div className="space-y-6">
                        <h4 className="font-bold text-slate-800 flex items-center text-sm uppercase tracking-wide border-b border-slate-100 pb-2">
                            <GraduationCap className="mr-2 text-slate-400" size={16}/> Academic & Application
                        </h4>

                         <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Country</label>
                                    <select className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white" value={newStudentCountry} onChange={e => setNewStudentCountry(e.target.value as Country)}>
                                        {Object.values(Country).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lead Source</label>
                                    <select className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white" value={newStudentSource} onChange={e => setNewStudentSource(e.target.value)}>
                                        {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Test Type</label>
                                    <select className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white" value={newStudentTestType} onChange={e => setNewStudentTestType(e.target.value)}>
                                        <option value="IELTS">IELTS</option>
                                        <option value="PTE">PTE</option>
                                        <option value="TOEFL">TOEFL</option>
                                        <option value="None">None</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Test Score</label>
                                    <input className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="Score/Band" value={newStudentTestScore} onChange={e => setNewStudentTestScore(e.target.value)} />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">GPA</label>
                                    <input className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="3.6" value={newStudentGpa} onChange={e => setNewStudentGpa(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gap (Yrs)</label>
                                    <input type="number" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="0" value={newStudentGap} onChange={e => setNewStudentGap(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Work (Yrs)</label>
                                    <input type="number" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="0" value={newStudentWorkExp} onChange={e => setNewStudentWorkExp(e.target.value)} />
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center space-x-2 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                                    <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded" checked={newStudentRefusals} onChange={e => setNewStudentRefusals(e.target.checked)} />
                                    <span className="text-sm font-medium text-slate-700">Student has previous visa refusals?</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button onClick={() => setIsAdding(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors">
                    Cancel
                </button>
                <button onClick={handleAddStudent} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center">
                    <Plus size={18} className="mr-2" /> Create Student Profile
                </button>
            </div>
        </div>
    </div>
)}

      {showBundleModal && bundleReady && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                  <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 flex items-center"><Package className="mr-2 text-indigo-600"/> Bundle Ready</h3>
                      <button onClick={() => setShowBundleModal(false)}><X size={20}/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <button onClick={downloadBundle} className="flex flex-col items-center justify-center p-4 border-2 border-indigo-100 rounded-xl hover:bg-indigo-50"><Download size={32} className="text-indigo-600 mb-2"/><span className="font-bold text-slate-800 text-sm">Download ZIP</span></button>
                          <button onClick={copySecureLink} className="flex flex-col items-center justify-center p-4 border-2 border-slate-100 rounded-xl hover:bg-slate-50"><Share2 size={32} className="text-slate-600 mb-2"/><span className="font-bold text-slate-800 text-sm">Copy Link</span></button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};