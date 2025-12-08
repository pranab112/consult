

import React, { useState, useEffect } from 'react';
import { BookOpen, Download, ExternalLink, FileText, GraduationCap, Plus, X, UploadCloud, Save, Loader2, Link, Users, Clock, Calendar, Filter, Search, CheckCircle2, XCircle, CalendarCheck, ClipboardList } from 'lucide-react';
import { TEST_PREP_LINKS } from '../../constants';
import { fetchStudents, saveStudents } from '../../services/storageService';
import { Student } from '../../types';

interface Resource {
    id: string;
    title: string;
    category: 'IELTS' | 'PTE' | 'TOEFL' | 'General';
    module?: 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'All';
    type: string;
    size: string;
    addedBy?: string;
}

const INITIAL_RESOURCES: Resource[] = [
    { id: '1', title: 'IELTS Band 9 Speaking Guide', category: 'IELTS', module: 'Speaking', type: 'PDF', size: '2.4 MB' },
    { id: '2', title: 'PTE 79+ Template Collection', category: 'PTE', module: 'Writing', type: 'ZIP', size: '5.1 MB' },
    { id: '3', title: 'TOEFL Writing Samples', category: 'TOEFL', module: 'Writing', type: 'PDF', size: '1.2 MB' },
    { id: '4', title: 'Common Visa Interview Questions', category: 'General', module: 'Speaking', type: 'PDF', size: '0.8 MB' },
    { id: '5', title: 'IELTS Cambridge Book 18', category: 'IELTS', module: 'All', type: 'PDF', size: '145 MB' },
    { id: '6', title: 'PTE Real Exam Questions 2024', category: 'PTE', module: 'Reading', type: 'DOCX', size: '3.5 MB' },
    { id: '7', title: '500 Essential Vocabulary List', category: 'General', module: 'All', type: 'PDF', size: '1.1 MB' },
];

export const TestPrepHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'attendance'>('dashboard');
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<Student[]>([]);
    
    // Links State
    const [links, setLinks] = useState<{name: string, url: string}[]>(TEST_PREP_LINKS);
    const [isAddingLink, setIsAddingLink] = useState(false);
    const [newLinkName, setNewLinkName] = useState('');
    const [newLinkUrl, setNewLinkUrl] = useState('');

    // Resources State
    const [resources, setResources] = useState<Resource[]>(INITIAL_RESOURCES);
    const [resourceFilter, setResourceFilter] = useState<'All' | 'IELTS' | 'PTE' | 'TOEFL' | 'General'>('All');
    const [resourceSearch, setResourceSearch] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    
    // Form State for Resources
    const [newTitle, setNewTitle] = useState('');
    const [newCategory, setNewCategory] = useState<'IELTS' | 'PTE' | 'TOEFL' | 'General'>('IELTS');
    const [newModule, setNewModule] = useState<'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'All'>('All');
    const [newType, setNewType] = useState('PDF');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Attendance State
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceBatch, setAttendanceBatch] = useState<string>('All');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await fetchStudents();
            setStudents(data);
            setLoading(false);
        };
        load();
    }, []);

    // --- ANALYTICS COMPUTATION ---
    const enrolledStudents = students.filter(s => s.testPrep?.enrolled);
    
    const batches = {
        morning: enrolledStudents.filter(s => s.testPrep?.batch === 'Morning (7-8 AM)').length,
        day: enrolledStudents.filter(s => s.testPrep?.batch === 'Day (12-1 PM)').length,
        evening: enrolledStudents.filter(s => s.testPrep?.batch === 'Evening (5-6 PM)').length
    };

    const upcomingExams = enrolledStudents
        .filter(s => s.testPrep?.examDate && s.testPrep.examDate > Date.now())
        .sort((a, b) => (a.testPrep!.examDate!) - (b.testPrep!.examDate!))
        .slice(0, 5); // Show next 5 exams

    const handleAddLink = () => {
        if (!newLinkName || !newLinkUrl) {
            alert("Please enter a name and URL.");
            return;
        }
        
        let url = newLinkUrl;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        const newLink = { name: newLinkName, url: url };
        setLinks([...links, newLink]);
        setIsAddingLink(false);
        setNewLinkName('');
        setNewLinkUrl('');
    };

    const handleAddResource = () => {
        if (!newTitle || !selectedFile) {
            alert("Please enter a title and select a file.");
            return;
        }

        setIsUploading(true);

        // Simulate network upload
        setTimeout(() => {
            const sizeInMB = (selectedFile.size / (1024 * 1024)).toFixed(1);
            
            const newRes: Resource = {
                id: Date.now().toString(),
                title: newTitle,
                category: newCategory,
                module: newModule,
                type: newType,
                size: `${sizeInMB} MB`,
                addedBy: 'User'
            };

            setResources([newRes, ...resources]);
            setIsUploading(false);
            setIsAdding(false);
            
            // Reset Form
            setNewTitle('');
            setNewCategory('IELTS');
            setNewModule('All');
            setNewType('PDF');
            setSelectedFile(null);
        }, 1500);
    };

    const filteredResources = resources.filter(res => {
        const matchesCategory = resourceFilter === 'All' || res.category === resourceFilter;
        const matchesSearch = res.title.toLowerCase().includes(resourceSearch.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // --- ATTENDANCE FUNCTIONS ---
    const updateAttendance = async (studentId: string, status: 'Present' | 'Absent' | 'Late') => {
        const updatedStudents = students.map(s => {
            if (s.id === studentId) {
                const updatedTestPrep = {
                    ...s.testPrep!,
                    attendance: {
                        ...(s.testPrep?.attendance || {}),
                        [attendanceDate]: status
                    }
                };
                return { ...s, testPrep: updatedTestPrep };
            }
            return s;
        });
        
        setStudents(updatedStudents); // Optimistic UI
        await saveStudents(updatedStudents);
    };

    const getAttendanceStats = () => {
        const batchStudents = enrolledStudents.filter(s => attendanceBatch === 'All' || s.testPrep?.batch === attendanceBatch);
        const total = batchStudents.length;
        let present = 0, absent = 0, late = 0;

        batchStudents.forEach(s => {
            const status = s.testPrep?.attendance?.[attendanceDate];
            if (status === 'Present') present++;
            if (status === 'Absent') absent++;
            if (status === 'Late') late++;
        });

        return { total, present, absent, late, unmarked: total - (present + absent + late) };
    };

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

    const stats = getAttendanceStats();

    return (
        <div className="h-full bg-slate-50 flex flex-col p-8 overflow-y-auto relative">
            
            {/* Header with Tabs */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Test Prep Hub</h1>
                    <p className="text-slate-500 mt-1">Manage classes, attendance, and study materials.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'dashboard' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Dashboard & Resources
                    </button>
                    <button 
                        onClick={() => setActiveTab('attendance')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center ${activeTab === 'attendance' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <CalendarCheck size={16} className="mr-2"/>
                        Attendance Tracker
                    </button>
                </div>
            </div>

            {activeTab === 'dashboard' ? (
                <>
                    {/* TOP STATS: Batches & Exams */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-2">
                        {/* Batch Stats */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                                <Users className="mr-2 text-indigo-600" size={20}/> Active Batches
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex flex-col items-center text-center">
                                    <span className="text-amber-600 font-bold text-xs uppercase mb-1">Morning (7-8 AM)</span>
                                    <span className="text-3xl font-bold text-slate-900">{batches.morning}</span>
                                    <span className="text-xs text-slate-500">Students</span>
                                </div>
                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center text-center">
                                    <span className="text-blue-600 font-bold text-xs uppercase mb-1">Day (12-1 PM)</span>
                                    <span className="text-3xl font-bold text-slate-900">{batches.day}</span>
                                    <span className="text-xs text-slate-500">Students</span>
                                </div>
                                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col items-center text-center">
                                    <span className="text-indigo-600 font-bold text-xs uppercase mb-1">Evening (5-6 PM)</span>
                                    <span className="text-3xl font-bold text-slate-900">{batches.evening}</span>
                                    <span className="text-xs text-slate-500">Students</span>
                                </div>
                            </div>
                        </div>

                        {/* Upcoming Exams */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                                <Calendar className="mr-2 text-red-500" size={20}/> Upcoming Exams
                            </h3>
                            <div className="space-y-3">
                                {upcomingExams.length > 0 ? (
                                    upcomingExams.map(student => (
                                        <div key={student.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                            <div className="flex items-center space-x-3">
                                                <div className="bg-red-50 text-red-600 font-bold px-2 py-1 rounded text-xs text-center min-w-[40px]">
                                                    {new Date(student.testPrep!.examDate!).getDate()}
                                                    <span className="block text-[8px] uppercase">{new Date(student.testPrep!.examDate!).toLocaleString('default', { month: 'short' })}</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{student.name}</p>
                                                    <p className="text-[10px] text-slate-500">{student.testType}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                                                {Math.ceil((student.testPrep!.examDate! - Date.now()) / (1000 * 60 * 60 * 24))} days
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-slate-400">
                                        <p className="text-sm">No upcoming exams.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 w-full flex-1 min-h-0">
                        
                        {/* Resources Section - Takes up main space */}
                        <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden min-w-0">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <div>
                                    <h2 className="text-xl font-bold flex items-center text-slate-800">
                                        <Download className="mr-2 text-indigo-600"/> Study Materials
                                    </h2>
                                </div>
                                <button 
                                    onClick={() => setIsAdding(true)}
                                    className="flex items-center space-x-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                                >
                                    <Plus size={16} />
                                    <span>Add Resource</span>
                                </button>
                            </div>

                            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                {['All', 'IELTS', 'PTE', 'TOEFL', 'General'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setResourceFilter(cat as any)}
                                        className={`px-3 py-1 text-xs font-bold rounded-full transition-colors whitespace-nowrap ${
                                            resourceFilter === cat 
                                            ? 'bg-indigo-100 text-indigo-700' 
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            <div className="mb-4 relative">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                                <input 
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    placeholder="Search resources..."
                                    value={resourceSearch}
                                    onChange={(e) => setResourceSearch(e.target.value)}
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                {filteredResources.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                                        <div className="flex items-center space-x-3">
                                            <div className={`p-2.5 rounded-lg border border-slate-200 ${item.addedBy ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-500'}`}>
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <span className="text-slate-800 font-bold block text-sm group-hover:text-indigo-700 transition-colors">{item.title}</span>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                        item.category === 'IELTS' ? 'bg-red-50 text-red-600' : 
                                                        item.category === 'PTE' ? 'bg-blue-50 text-blue-600' : 
                                                        'bg-slate-200 text-slate-600'
                                                    }`}>{item.category}</span>
                                                    {item.module && item.module !== 'All' && (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">{item.module}</span>
                                                    )}
                                                    <span className="text-[10px] text-slate-400">• {item.type} • {item.size}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="text-slate-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-lg transition-colors">
                                            <Download size={20}/>
                                        </button>
                                    </div>
                                ))}
                                {filteredResources.length === 0 && (
                                    <div className="text-center py-10 text-slate-400">
                                        <p>No resources found.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Official Portals Section - Sidebar style */}
                        <div className="w-full lg:w-96 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit flex-shrink-0">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold flex items-center text-slate-800">
                                    <GraduationCap className="mr-2 text-indigo-600"/> Official Portals
                                </h2>
                                <button 
                                    onClick={() => setIsAddingLink(true)}
                                    className="flex items-center space-x-1 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors border border-indigo-100"
                                >
                                    <Plus size={16} />
                                    <span>Add Link</span>
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                {links.map((link, idx) => (
                                    <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-all group">
                                        <div>
                                            <h3 className="font-bold text-slate-800 group-hover:text-indigo-700">{link.name}</h3>
                                            <p className="text-xs text-slate-500 mt-1">Book exams and check results</p>
                                        </div>
                                        <ExternalLink size={18} className="text-slate-300 group-hover:text-indigo-500"/>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                // ATTENDANCE TAB CONTENT
                <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    
                    {/* Attendance Controls */}
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8 border-b border-slate-100 pb-6">
                        <div className="flex gap-4 w-full md:w-auto">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Date</label>
                                <input 
                                    type="date" 
                                    value={attendanceDate}
                                    onChange={(e) => setAttendanceDate(e.target.value)}
                                    className="p-2 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                />
                            </div>
                            <div className="flex-1 md:flex-none">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Filter Batch</label>
                                <select 
                                    value={attendanceBatch}
                                    onChange={(e) => setAttendanceBatch(e.target.value)}
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white"
                                >
                                    <option value="All">All Batches</option>
                                    <option value="Morning (7-8 AM)">Morning (7-8 AM)</option>
                                    <option value="Day (12-1 PM)">Day (12-1 PM)</option>
                                    <option value="Evening (5-6 PM)">Evening (5-6 PM)</option>
                                </select>
                            </div>
                        </div>

                        {/* Daily Stats Summary */}
                        <div className="flex gap-3">
                            <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 text-center">
                                <span className="block text-[10px] uppercase font-bold text-slate-400">Total</span>
                                <span className="font-bold text-slate-700">{stats.total}</span>
                            </div>
                            <div className="px-4 py-2 bg-green-50 rounded-lg border border-green-100 text-center">
                                <span className="block text-[10px] uppercase font-bold text-green-600">Present</span>
                                <span className="font-bold text-green-700">{stats.present}</span>
                            </div>
                            <div className="px-4 py-2 bg-red-50 rounded-lg border border-red-100 text-center">
                                <span className="block text-[10px] uppercase font-bold text-red-600">Absent</span>
                                <span className="font-bold text-red-700">{stats.absent}</span>
                            </div>
                            <div className="px-4 py-2 bg-amber-50 rounded-lg border border-amber-100 text-center">
                                <span className="block text-[10px] uppercase font-bold text-amber-600">Late</span>
                                <span className="font-bold text-amber-700">{stats.late}</span>
                            </div>
                        </div>
                    </div>

                    {/* Student List */}
                    <div className="flex-1 overflow-y-auto">
                        {enrolledStudents.filter(s => attendanceBatch === 'All' || s.testPrep?.batch === attendanceBatch).length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                                <ClipboardList size={48} className="mb-2 opacity-20"/>
                                <p>No students found in this batch.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4">Student Name</th>
                                        <th className="px-6 py-4">Batch</th>
                                        <th className="px-6 py-4">Attendance Status</th>
                                        <th className="px-6 py-4 text-right">Current Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {enrolledStudents
                                        .filter(s => attendanceBatch === 'All' || s.testPrep?.batch === attendanceBatch)
                                        .map(student => {
                                            const status = student.testPrep?.attendance?.[attendanceDate];
                                            return (
                                                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-slate-800">{student.name}</td>
                                                    <td className="px-6 py-4 text-slate-500 text-sm">{student.testPrep?.batch}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => updateAttendance(student.id, 'Present')}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center ${
                                                                    status === 'Present' 
                                                                    ? 'bg-green-100 text-green-700 ring-2 ring-green-500 ring-offset-1' 
                                                                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-green-50 hover:text-green-600 hover:border-green-200'
                                                                }`}
                                                            >
                                                                <CheckCircle2 size={14} className="mr-1.5"/> Present
                                                            </button>
                                                            <button 
                                                                onClick={() => updateAttendance(student.id, 'Absent')}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center ${
                                                                    status === 'Absent' 
                                                                    ? 'bg-red-100 text-red-700 ring-2 ring-red-500 ring-offset-1' 
                                                                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                                                                }`}
                                                            >
                                                                <XCircle size={14} className="mr-1.5"/> Absent
                                                            </button>
                                                            <button 
                                                                onClick={() => updateAttendance(student.id, 'Late')}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center ${
                                                                    status === 'Late' 
                                                                    ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-500 ring-offset-1' 
                                                                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200'
                                                                }`}
                                                            >
                                                                <Clock size={14} className="mr-1.5"/> Late
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {status ? (
                                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                                                status === 'Present' ? 'bg-green-50 text-green-700' :
                                                                status === 'Absent' ? 'bg-red-50 text-red-700' :
                                                                'bg-amber-50 text-amber-700'
                                                            }`}>
                                                                {status}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs italic">Not Marked</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    }
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* Add Resource Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center">
                                <UploadCloud size={18} className="mr-2 text-indigo-600"/> Upload New Material
                            </h3>
                            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Resource Title</label>
                                <input 
                                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                    placeholder="e.g. Cambridge 19 Listening Audio"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                                    <select 
                                        className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none bg-white"
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value as any)}
                                    >
                                        <option value="IELTS">IELTS</option>
                                        <option value="PTE">PTE</option>
                                        <option value="TOEFL">TOEFL</option>
                                        <option value="General">General</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Module</label>
                                    <select 
                                        className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none bg-white"
                                        value={newModule}
                                        onChange={(e) => setNewModule(e.target.value as any)}
                                    >
                                        <option value="All">All Modules</option>
                                        <option value="Listening">Listening</option>
                                        <option value="Reading">Reading</option>
                                        <option value="Writing">Writing</option>
                                        <option value="Speaking">Speaking</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">File Type</label>
                                <select 
                                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none bg-white"
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value)}
                                >
                                    <option value="PDF">PDF Document</option>
                                    <option value="DOCX">Word Document</option>
                                    <option value="ZIP">ZIP Archive</option>
                                    <option value="JPG">Image (JPG/PNG)</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select File</label>
                                <label className="flex items-center justify-center w-full p-4 border border-slate-200 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <span className="text-xs text-slate-500 truncate max-w-[200px]">
                                        {selectedFile ? selectedFile.name : 'Click to Browse...'}
                                    </span>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50">
                            <button 
                                onClick={handleAddResource}
                                disabled={isUploading}
                                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploading ? <Loader2 size={16} className="mr-2 animate-spin"/> : <Save size={16} className="mr-2" />} 
                                {isUploading ? 'Uploading...' : 'Save Resource'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Link Modal */}
            {isAddingLink && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center">
                                <Link size={18} className="mr-2 text-indigo-600"/> Add New Link
                            </h3>
                            <button onClick={() => setIsAddingLink(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link Name</label>
                                <input 
                                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                    placeholder="e.g. GRE Official Site"
                                    value={newLinkName}
                                    onChange={(e) => setNewLinkName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL</label>
                                <input 
                                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                    placeholder="https://..."
                                    value={newLinkUrl}
                                    onChange={(e) => setNewLinkUrl(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50">
                            <button 
                                onClick={handleAddLink}
                                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center"
                            >
                                <Save size={16} className="mr-2" /> Save Link
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};