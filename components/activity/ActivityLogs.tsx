
import React, { useEffect, useState } from 'react';
import { ActivityLog } from '../../types';
import { fetchLogs } from '../../services/auditService';
import { History, User, Calendar, ShieldCheck, Activity, Loader2 } from 'lucide-react';

export const ActivityLogs: React.FC = () => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await fetchLogs();
            setLogs(data);
            setLoading(false);
        };
        load();
    }, []);

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-emerald-100 text-emerald-700';
            case 'DELETE': return 'bg-red-100 text-red-700';
            case 'UPDATE': return 'bg-blue-100 text-blue-700';
            case 'LOGIN': return 'bg-indigo-100 text-indigo-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

    return (
        <div className="h-full p-8 bg-slate-50 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                        <History className="mr-3 text-indigo-600"/> Audit Trail
                    </h1>
                    <p className="text-slate-500 mt-1">Track all user activities and system changes for security and accountability.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <ShieldCheck size={18} className="text-emerald-500"/>
                            <span className="text-sm font-bold text-slate-700">Secure Logging Active</span>
                        </div>
                        <span className="text-xs text-slate-400">Showing last 100 events</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Action</th>
                                    <th className="px-6 py-4">Entity</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4 text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.length > 0 ? logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                    {log.userName.charAt(0)}
                                                </div>
                                                <span className="font-medium text-slate-900">{log.userName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-medium">
                                            {log.entityType}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {log.details}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-400 text-xs font-mono">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            <Activity size={48} className="mx-auto mb-3 opacity-20"/>
                                            <p>No activity recorded yet.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
