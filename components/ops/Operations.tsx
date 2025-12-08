
import React, { useState, useEffect, useRef } from 'react';
import { fetchStudents, saveStudents, fetchTasks, saveTasks } from '../../services/storageService';
import { Student, ApplicationStatus, NocStatus, Country, Task } from '../../types';
import { UNIVERSAL_DOCS, COUNTRY_SPECIFIC_DOCS } from '../../constants';
import { generateGoogleCalendarLink } from '../../services/communicationService';
import { Search, MoreHorizontal, Clock, AlertCircle, Filter, Trash2, Phone, Mail, DollarSign, CheckCircle2, Link, Lock, X, Plus, Calendar, CheckSquare, Square, Flag, ChevronDown, ChevronLeft, ChevronRight, Loader2, CalendarPlus, Save, Check, ExternalLink, Bell, BellRing, BellOff } from 'lucide-react';

export const Operations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kanban' | 'noc' | 'schedule'>('kanban');
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  
  // Shared State
  const [plannerDay, setPlannerDay] = useState<string>('Monday');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Notification State
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const notifiedTasksRef = useRef<Set<string>>(new Set());

  // Initialize planner day to today
  useEffect(() => {
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const todayIdx = new Date().getDay(); // 0 is Sunday
    const adjustedIdx = todayIdx === 0 ? 6 : todayIdx - 1;
    setPlannerDay(DAYS[adjustedIdx]);
  }, []);

  // Fetch tasks once on mount
  useEffect(() => {
      const load = async () => {
          setLoadingTasks(true);
          const loaded = await fetchTasks();
          // Ensure every task has a day
          const migrated = loaded.map(t => t.day ? t : { ...t, day: 'Monday' });
          setTasks(migrated);
          setLoadingTasks(false);
      };
      load();
  }, []);

  // Check Permission on Mount
  useEffect(() => {
      if ('Notification' in window) {
          setPermission(Notification.permission);
      }
  }, []);

  // Notification Interval Checker
  useEffect(() => {
      if (permission !== 'granted') return;

      const checkUpcomingTasks = () => {
          const now = new Date();
          const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const currentDayName = DAYS[now.getDay()];

          tasks.forEach(task => {
              if (task.completed || task.day !== currentDayName || !task.dueTime) return;
              
              // Prevent duplicate notifications
              if (notifiedTasksRef.current.has(task.id)) return;

              const [hours, minutes] = task.dueTime.split(':').map(Number);
              const taskTime = new Date(now);
              taskTime.setHours(hours, minutes, 0, 0);

              const diffMs = taskTime.getTime() - now.getTime();
              const diffMins = diffMs / (1000 * 60);

              // Notify if due within 15 minutes and hasn't passed by more than 1 minute
              if (diffMins <= 15 && diffMins > -1) {
                  new Notification(`Upcoming Task: ${task.text}`, {
                      body: `Due at ${task.dueTime} (${task.priority} Priority)`,
                      icon: '/favicon.ico' // Assuming favicon exists, or browser default
                  });
                  
                  // Mark as notified
                  notifiedTasksRef.current.add(task.id);
              }
          });
      };

      // Run check immediately and then every 60 seconds
      checkUpcomingTasks();
      const intervalId = setInterval(checkUpcomingTasks, 60000);

      return () => clearInterval(intervalId);
  }, [tasks, permission]);

  const requestNotificationPermission = async () => {
      if (!('Notification' in window)) {
          alert('This browser does not support desktop notifications');
          return;
      }
      const p = await Notification.requestPermission();
      setPermission(p);
      if (p === 'granted') {
          new Notification("Notifications Enabled", { body: "We'll remind you of upcoming tasks!" });
      }
  };

  const saveTasksToStorage = async (newTasks: Task[]) => {
      await saveTasks(newTasks);
  };

  // Centralized Task Mutators (Optimistic UI)
  const handleCreateTask = (newTask: Task) => {
      const updated = [newTask, ...tasks];
      setTasks(updated); // Immediate UI update
      saveTasksToStorage(updated); // Background save
      setTaskModalOpen(false);
  };

  const handleToggleTask = (taskId: string) => {
      const updated = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
      setTasks(updated);
      saveTasksToStorage(updated);
  };

  const handleDeleteTask = (taskId: string) => {
      const updated = tasks.filter(t => t.id !== taskId);
      setTasks(updated);
      saveTasksToStorage(updated);
  };

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-full sm:w-fit overflow-x-auto">
            <button 
            onClick={() => setActiveTab('kanban')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'kanban' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
            Kanban Board
            </button>
            <button 
            onClick={() => setActiveTab('noc')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'noc' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
            NOC Tracker
            </button>
            <button 
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'schedule' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
            Weekly Planner
            </button>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
            {activeTab === 'schedule' && (
                <button
                    onClick={requestNotificationPermission}
                    className={`p-2.5 rounded-lg transition-colors border ${
                        permission === 'granted' 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                        : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                    }`}
                    title={permission === 'granted' ? "Notifications Active" : "Enable Task Notifications"}
                >
                    {permission === 'granted' ? <BellRing size={18} /> : <BellOff size={18} />}
                </button>
            )}
            
            <button 
                onClick={() => setTaskModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg shadow-md hover:bg-indigo-700 transition-colors font-bold text-sm"
            >
                <Plus size={18} />
                <span>New Task</span>
            </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {activeTab === 'kanban' && <KanbanBoard />}
        {activeTab === 'noc' && <NocTracker />}
        {activeTab === 'schedule' && (
            <WeeklyPlanner 
                tasks={tasks}
                loading={loadingTasks}
                selectedDay={plannerDay}
                onDayChange={setPlannerDay}
                onToggle={handleToggleTask}
                onDelete={handleDeleteTask}
                onCreate={handleCreateTask}
            />
        )}
      </div>

      {isTaskModalOpen && (
          <AddTaskModal 
            onClose={() => setTaskModalOpen(false)} 
            onAdd={handleCreateTask} 
            defaultDay={plannerDay}
          />
      )}
    </div>
  );
};

interface AddTaskModalProps {
    onClose: () => void;
    onAdd: (task: Task) => void;
    defaultDay: string;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ onClose, onAdd, defaultDay }) => {
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const [text, setText] = useState('');
    const [day, setDay] = useState(defaultDay);
    const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
    const [time, setTime] = useState('09:00');

    const handleSubmit = () => {
        if (!text.trim()) return;
        const newTask: Task = {
            id: Date.now().toString(),
            text,
            completed: false,
            priority,
            dueTime: time,
            createdAt: Date.now(),
            day
        };
        onAdd(newTask);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center">
                        <CalendarPlus size={18} className="mr-2 text-indigo-600"/> Create New Task
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Task Description</label>
                        <input 
                            className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                            placeholder="e.g. Call University Admission Office"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Schedule Day</label>
                            <select 
                                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none bg-white"
                                value={day}
                                onChange={(e) => setDay(e.target.value)}
                            >
                                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Time</label>
                            <input 
                                type="time"
                                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Priority Level</label>
                        <div className="flex gap-2">
                            {['High', 'Medium', 'Low'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPriority(p as any)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                                        priority === p 
                                        ? p === 'High' ? 'bg-red-50 border-red-200 text-red-600' : p === 'Medium' ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-blue-50 border-blue-200 text-blue-600'
                                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50">
                    <button 
                        onClick={handleSubmit}
                        disabled={!text.trim()}
                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={16} className="mr-2" />
                        Add to Schedule
                    </button>
                </div>
            </div>
        </div>
    );
};

interface WeeklyPlannerProps {
    tasks: Task[];
    loading: boolean;
    selectedDay: string;
    onDayChange: (day: string) => void;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onCreate: (task: Task) => void;
}

const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({ tasks, loading, selectedDay, onDayChange, onToggle, onDelete, onCreate }) => {
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Form State for Inline Add
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
    const [newTaskTime, setNewTaskTime] = useState('');

    const addTaskInline = () => {
        if (!newTaskText.trim()) return;

        const newTask: Task = {
            id: Date.now().toString(),
            text: newTaskText,
            completed: false,
            priority: newTaskPriority,
            dueTime: newTaskTime || '09:00',
            createdAt: Date.now(),
            day: selectedDay
        };
        
        onCreate(newTask);
        
        setNewTaskText('');
        setNewTaskTime('');
    };

    const addToCalendar = (task: Task) => {
        const url = generateGoogleCalendarLink(task);
        window.open(url, '_blank');
    };

    const dayTasks = tasks.filter(t => t.day === selectedDay);
    
    // Sorting: Incomplete first, then by priority
    const sortedTasks = [...dayTasks].sort((a, b) => {
        if (a.completed === b.completed) {
            const pMap: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
            return pMap[b.priority] - pMap[a.priority];
        }
        return a.completed ? 1 : -1;
    });

    const completedCount = dayTasks.filter(t => t.completed).length;
    const progress = dayTasks.length > 0 ? Math.round((completedCount / dayTasks.length) * 100) : 0;

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

    return (
        <div className="h-full flex flex-col md:flex-row gap-6">
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                {/* Header with Day Selector */}
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center">
                            <Calendar className="mr-2 text-indigo-600" size={20}/> Weekly Agenda
                        </h2>
                        <p className="text-sm text-slate-500">Plan your operations week by week.</p>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                         {/* Day Dropdown */}
                         <div className="relative">
                             <select
                                value={selectedDay}
                                onChange={(e) => onDayChange(e.target.value)}
                                className="appearance-none bg-white border border-slate-200 text-slate-700 font-bold py-2 pl-4 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer hover:border-indigo-300 transition-colors"
                             >
                                 {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
                             </select>
                             <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                         </div>

                         {/* Progress Circle */}
                         <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-3">
                             <div className="relative h-8 w-8 flex items-center justify-center">
                                 <svg className="h-full w-full transform -rotate-90">
                                     <circle cx="16" cy="16" r="12" fill="transparent" stroke="#e2e8f0" strokeWidth="3"></circle>
                                     <circle 
                                        cx="16" cy="16" r="12" fill="transparent" stroke="#4f46e5" strokeWidth="3" 
                                        strokeDasharray={75.36} strokeDashoffset={75.36 - ((progress / 100) * 75.36)}
                                        className="transition-all duration-1000"
                                     ></circle>
                                 </svg>
                                 <span className="absolute text-[8px] font-bold text-indigo-600">{progress}%</span>
                             </div>
                             <div className="text-right hidden sm:block">
                                 <p className="text-[10px] text-slate-400 font-medium">Completed</p>
                                 <p className="text-xs font-bold text-slate-800">{completedCount} / {dayTasks.length}</p>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Input Area - Inline */}
                <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 z-10">
                    <label className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-2 block flex items-center">
                        <Plus size={14} className="mr-1"/> Add New Task for {selectedDay}
                    </label>
                    <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
                        <input 
                            placeholder="What needs to be done?"
                            className="flex-1 px-4 py-2.5 bg-white border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full min-w-0 shadow-sm"
                            value={newTaskText}
                            onChange={e => setNewTaskText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addTaskInline()}
                        />
                        <div className="flex w-full lg:w-auto gap-2 items-center">
                             <select 
                                value={newTaskPriority}
                                onChange={e => setNewTaskPriority(e.target.value as any)}
                                className="flex-1 lg:flex-none px-3 py-2.5 bg-white border border-indigo-200 rounded-lg text-sm font-medium focus:outline-none cursor-pointer shadow-sm"
                             >
                                 <option value="High">High Priority</option>
                                 <option value="Medium">Medium</option>
                                 <option value="Low">Low Priority</option>
                             </select>
                             <input 
                                type="time"
                                value={newTaskTime}
                                onChange={e => setNewTaskTime(e.target.value)}
                                className="flex-1 lg:flex-none px-3 py-2.5 bg-white border border-indigo-200 rounded-lg text-sm font-medium focus:outline-none cursor-pointer shadow-sm"
                                aria-label="Due Time"
                             />
                             <button 
                                onClick={addTaskInline}
                                disabled={!newTaskText.trim()}
                                className="flex-none bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm flex items-center justify-center whitespace-nowrap"
                             >
                                 Add Task
                             </button>
                        </div>
                    </div>
                </div>

                {/* Task List */}
                <div className="flex-1 overflow-y-auto overflow-x-auto p-4 custom-scrollbar">
                    <div className="space-y-2">
                        {sortedTasks.length > 0 ? (
                            sortedTasks.map(task => (
                                <div key={task.id} className={`group flex items-center justify-between p-4 rounded-xl border transition-all ${
                                    task.completed 
                                    ? 'bg-slate-50 border-slate-100 opacity-75' 
                                    : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm'
                                }`}>
                                    <div className="flex items-center space-x-4 flex-1">
                                        <button
                                            onClick={() => onToggle(task.id)}
                                            className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                                task.completed 
                                                ? 'bg-emerald-500 border-emerald-500 text-white' 
                                                : 'border-slate-300 hover:border-indigo-400 bg-white'
                                            }`}
                                        >
                                            {task.completed && <Check size={14} strokeWidth={3} />}
                                        </button>
                                        
                                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onToggle(task.id)}>
                                            <p className={`font-medium text-sm transition-all truncate select-none ${
                                                task.completed ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-800'
                                            }`}>
                                                {task.text}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-4 ml-4">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${
                                            task.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                                            task.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                            'bg-blue-50 text-blue-600 border-blue-100'
                                        }`}>
                                            {task.priority}
                                        </span>
                                        {task.dueTime && (
                                            <span className="flex items-center text-[10px] text-slate-400 whitespace-nowrap w-16">
                                                <Clock size={10} className="mr-1"/> {task.dueTime}
                                            </span>
                                        )}
                                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => addToCalendar(task)}
                                                className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex-shrink-0"
                                                title="Add to Google Calendar"
                                            >
                                                <CalendarPlus size={16} />
                                            </button>
                                            <button 
                                                onClick={() => onDelete(task.id)}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <Calendar size={48} className="mb-4 text-slate-200" />
                                <p>No tasks for {selectedDay}.</p>
                                <p className="text-xs">Add a task to stay organized.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Side Panel (Summary) */}
            <div className="w-full md:w-60 flex flex-col gap-4">
                <div className="bg-indigo-900 text-white p-4 rounded-xl shadow-lg relative overflow-hidden">
                     <div className="relative z-10">
                         <h3 className="font-bold text-sm mb-1">{selectedDay}'s Focus</h3>
                         <p className="text-indigo-200 text-[10px] leading-relaxed">
                            {selectedDay === 'Monday' ? 'Start strong. Review leads.' : 
                             selectedDay === 'Friday' ? 'Finalize submissions.' : 
                             'Focus on high-priority tasks.'}
                         </p>
                     </div>
                     <div className="absolute -right-2 -bottom-2 opacity-10">
                         <Flag size={60} />
                     </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex-1">
                    <h3 className="font-bold text-slate-800 mb-3 text-xs uppercase tracking-wide">Overview</h3>
                    <div className="space-y-2">
                        {DAYS.map(day => {
                            const count = tasks.filter(t => t.day === day && !t.completed).length;
                            const isSelected = day === selectedDay;
                            return (
                                <div 
                                    key={day} 
                                    onClick={() => onDayChange(day)}
                                    className={`flex justify-between items-center cursor-pointer p-2 rounded-lg transition-colors ${isSelected ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50'}`}
                                >
                                    <span className={`text-xs ${isSelected ? 'font-bold text-indigo-700' : 'text-slate-600'}`}>{day.substring(0, 3)}</span>
                                    {count > 0 && (
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                            isSelected ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {count}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const KanbanBoard = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState<Country | 'All'>('All');
  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null);
  
  // Dependency Management State
  const [linkingStudentId, setLinkingStudentId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
        setLoading(true);
        const data = await fetchStudents();
        setStudents(data);
        setLoading(false);
    };
    load();
  }, []);

  const updateStudentsAsync = async (updated: Student[]) => {
      setStudents(updated); // Optimistic
      await saveStudents(updated);
  };

  const columns = Object.values(ApplicationStatus);

  const getStudentById = (id: string) => students.find(s => s.id === id);

  const isBlocked = (student: Student): { blocked: boolean; blockerName?: string } => {
    if (!student.blockedBy || student.blockedBy.length === 0) return { blocked: false };
    
    for (const blockerId of student.blockedBy) {
        const blocker = getStudentById(blockerId);
        if (blocker && blocker.status !== ApplicationStatus.VisaGranted) {
            return { blocked: true, blockerName: blocker.name };
        }
    }
    return { blocked: false };
  };

  const getProgress = (student: Student) => {
    const requiredDocs = [
        ...UNIVERSAL_DOCS,
        ...(COUNTRY_SPECIFIC_DOCS[student.targetCountry] || [])
    ];
    const total = requiredDocs.length;
    if (total === 0) return 0;
    // Update filtering logic for object based document requirements
    const completed = requiredDocs.filter(doc => student.documents[doc.name]).length;
    return Math.round((completed / total) * 100);
  };

  const moveStudent = (studentId: string, newStatus: ApplicationStatus) => {
    const student = getStudentById(studentId);
    if (!student) return;

    const blockStatus = isBlocked(student);
    if (blockStatus.blocked) {
        alert(`Cannot move this student. They are blocked by ${blockStatus.blockerName}, who must reach 'Visa Granted' first.`);
        return;
    }

    const updated = students.map(s => s.id === studentId ? { ...s, status: newStatus } : s);
    updateStudentsAsync(updated);
  };

  const deleteStudent = (studentId: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
        const updated = students.filter(s => s.id !== studentId);
        updateStudentsAsync(updated);
    }
  };

  const addDependency = (targetId: string, blockerId: string) => {
      if (targetId === blockerId) return;
      const updated = students.map(s => {
          if (s.id === targetId) {
              const current = s.blockedBy || [];
              if (!current.includes(blockerId)) {
                  return { ...s, blockedBy: [...current, blockerId] };
              }
          }
          return s;
      });
      updateStudentsAsync(updated);
      setLinkingStudentId(null);
  };

  const removeDependency = (targetId: string, blockerId: string) => {
      const updated = students.map(s => {
          if (s.id === targetId) {
              return { ...s, blockedBy: (s.blockedBy || []).filter(id => id !== blockerId) };
          }
          return s;
      });
      updateStudentsAsync(updated);
  };

  const handleDragStart = (e: React.DragEvent, studentId: string) => {
    const student = getStudentById(studentId);
    if (student && isBlocked(student).blocked) {
        e.preventDefault();
        return;
    }
    setDraggedStudentId(studentId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', studentId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      moveStudent(id, status);
      setDraggedStudentId(null);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.targetCountry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = countryFilter === 'All' || s.targetCountry === countryFilter;
    return matchesSearch && matchesCountry;
  });

  const getDaysActive = (timestamp: number) => {
    const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
    return days === 0 ? 'Today' : `${days}d ago`;
  };

  const getColumnValue = (status: ApplicationStatus) => {
      const count = filteredStudents.filter(s => s.status === status).length;
      let valuePerStudent = 0;
      if (status === ApplicationStatus.OfferReceived) valuePerStudent = 50000;
      if (status === ApplicationStatus.VisaGranted) valuePerStudent = 150000;
      
      if (valuePerStudent === 0) return null;
      return (count * valuePerStudent).toLocaleString();
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

  return (
    <div className="h-full flex flex-col relative" onClick={() => linkingStudentId && setLinkingStudentId(null)}>
      {/* Kanban Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 px-1 gap-4">
        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg p-1">
                <Filter size={14} className="ml-2 text-slate-400"/>
                {['All', ...Object.values(Country)].map((c) => (
                    <button
                        key={c}
                        onClick={() => setCountryFilter(c as any)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                            countryFilter === c ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {c}
                    </button>
                ))}
            </div>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search students..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2">
        <div className="flex space-x-4 h-full min-w-max">
          {columns.map(status => {
            const columnValue = getColumnValue(status);
            const count = filteredStudents.filter(s => s.status === status).length;
            
            return (
            <div 
              key={status} 
              className={`w-80 flex flex-col rounded-xl border transition-all duration-200 ${
                draggedStudentId ? 'bg-slate-50/50 border-indigo-200 border-dashed' : 'bg-slate-100 border-slate-200'
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              {/* Column Header */}
              <div className={`p-3 border-b border-slate-200/60 font-semibold text-sm flex flex-col justify-between rounded-t-xl ${
                status === ApplicationStatus.VisaGranted ? 'bg-green-50 text-green-900' : 
                status === ApplicationStatus.VisaRejected ? 'bg-red-50 text-red-900' : 'bg-slate-100 text-slate-700'
              }`}>
                <div className="flex justify-between items-center w-full">
                    <span>{status}</span>
                    <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold shadow-sm border border-slate-100">
                    {count}
                    </span>
                </div>
                {columnValue && (
                    <div className="mt-1 text-[10px] font-normal opacity-80 flex items-center">
                        <DollarSign size={10} className="mr-0.5"/> Est. Rev: NPR {columnValue}
                    </div>
                )}
              </div>

              {/* Cards Container */}
              <div className="flex-1 p-2 space-y-3 overflow-y-auto">
                {filteredStudents.filter(s => s.status === status).map(student => {
                  const blockStatus = isBlocked(student);
                  const progress = getProgress(student);
                  
                  return (
                  <div 
                    key={student.id} 
                    draggable={!blockStatus.blocked}
                    onDragStart={(e) => handleDragStart(e, student.id)}
                    className={`bg-white p-4 rounded-lg shadow-sm border group hover:shadow-md transition-all relative ${
                        blockStatus.blocked ? 'border-red-200 bg-red-50/10 opacity-90 cursor-not-allowed' : 'border-slate-200 cursor-move hover:border-indigo-200 active:cursor-grabbing'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wide ${
                        student.targetCountry === 'USA' ? 'bg-blue-50 text-blue-600' :
                        student.targetCountry === 'Australia' ? 'bg-yellow-50 text-yellow-700' :
                        student.targetCountry === 'Canada' ? 'bg-red-50 text-red-600' :
                        student.targetCountry === 'UK' ? 'bg-purple-50 text-purple-600' :
                        'bg-slate-50 text-slate-600'
                      }`}>
                        {student.targetCountry}
                      </span>
                      
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setLinkingStudentId(student.id); }}
                            className="p-1 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded"
                            title="Link Dependency"
                        >
                            <Link size={14} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); deleteStudent(student.id); }}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded"
                            title="Delete Student"
                        >
                            <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <h4 className="font-bold text-slate-800 mb-1">{student.name}</h4>
                    <p className="text-xs text-slate-400 mb-3 truncate">{student.email || 'No email provided'}</p>
                    
                    {/* Blocker Visualization */}
                    {student.blockedBy && student.blockedBy.length > 0 && (
                         <div className="mb-3 space-y-1">
                             {student.blockedBy.map(bId => {
                                 const blocker = getStudentById(bId);
                                 if (!blocker) return null;
                                 const isCompleted = blocker.status === ApplicationStatus.VisaGranted;
                                 return (
                                     <div key={bId} className={`text-[10px] flex items-center justify-between px-2 py-1 rounded ${isCompleted ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                         <div className="flex items-center">
                                            {isCompleted ? <CheckCircle2 size={10} className="mr-1"/> : <Lock size={10} className="mr-1"/>}
                                            <span className="truncate max-w-[100px]">Waiting for {blocker.name}</span>
                                         </div>
                                         <button onClick={() => removeDependency(student.id, bId)} className="hover:text-red-900"><X size={10}/></button>
                                     </div>
                                 );
                             })}
                         </div>
                    )}

                    {/* Progress Bar */}
                    <div className="mb-3">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                            <span>Documents</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-indigo-500'}`} 
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                        <div className="flex space-x-2">
                             <div className="p-1.5 bg-slate-50 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer transition-colors">
                                <Phone size={12} />
                             </div>
                             <div className="p-1.5 bg-slate-50 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer transition-colors">
                                <Mail size={12} />
                             </div>
                        </div>
                        <div className="flex items-center text-[10px] text-slate-400 font-medium">
                            <Clock size={10} className="mr-1"/> {getDaysActive(student.createdAt)}
                        </div>
                    </div>

                    {/* Dependency Selection Popover */}
                    {linkingStudentId === student.id && (
                        <div 
                            className="absolute top-8 left-0 right-0 z-50 bg-white border border-slate-200 shadow-xl rounded-lg p-2 animate-in fade-in zoom-in duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h5 className="text-xs font-bold text-slate-600 mb-2">Depends on:</h5>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                                {students
                                    .filter(s => s.id !== student.id && !(student.blockedBy || []).includes(s.id))
                                    .map(s => (
                                    <div 
                                        key={s.id} 
                                        onClick={() => addDependency(student.id, s.id)}
                                        className="text-xs p-1.5 hover:bg-indigo-50 rounded cursor-pointer truncate"
                                    >
                                        {s.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                  </div>
                  );
                })}
                {count === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs bg-slate-50/50">
                        <p>No Students</p>
                        <p className="opacity-50 mt-1">Drag items here</p>
                    </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const NocTracker = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active'>('active');
  
    useEffect(() => {
      const load = async () => {
          setLoading(true);
          const data = await fetchStudents();
          setStudents(data);
          setLoading(false);
      };
      load();
    }, []);

    const updateStudentsAsync = async (updated: Student[]) => {
        setStudents(updated);
        await saveStudents(updated);
    };

    const steps = Object.values(NocStatus);

    const updateNocStatus = (studentId: string, newStatus: NocStatus) => {
        const updated = students.map(s => s.id === studentId ? { ...s, nocStatus: newStatus } : s);
        updateStudentsAsync(updated);
    };

    const updateNotes = (studentId: string, text: string) => {
        const updated = students.map(s => s.id === studentId ? { ...s, notes: text } : s);
        updateStudentsAsync(updated);
    };

    const displayedStudents = students.filter(s => {
        if (filter === 'all') return true;
        return s.nocStatus !== NocStatus.NotApplied || 
               s.status === ApplicationStatus.OfferReceived || 
               s.status === ApplicationStatus.VisaGranted;
    });

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

    return (
        <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">NOC Application Tracker</h2>
                    <p className="text-sm text-slate-500">Ministry of Education (Nepal) Status Monitor</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button 
                        onClick={() => window.open('http://noc.moest.gov.np/', '_blank')}
                        className="flex items-center space-x-1 bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors border border-indigo-100 mr-2"
                    >
                        <span>Apply Online</span>
                        <ExternalLink size={14} />
                    </button>
                    <span className="text-sm text-slate-500">Filter:</span>
                    <select 
                        value={filter} 
                        onChange={(e) => setFilter(e.target.value as any)}
                        className="text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                    >
                        <option value="active">Active Applications</option>
                        <option value="all">All Students</option>
                    </select>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {displayedStudents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <AlertCircle className="mb-3 text-slate-300" size={48} />
                        <p className="font-medium">No active NOC applications found.</p>
                        <p className="text-sm">Change status in Student Manager to start tracking.</p>
                    </div>
                ) : (
                    displayedStudents.map(student => {
                        const currentStepIndex = steps.indexOf(student.nocStatus);
                        const isCompleted = student.nocStatus === NocStatus.Issued;
                        
                        return (
                            <div key={student.id} className={`border rounded-xl p-6 transition-all ${isCompleted ? 'bg-green-50/30 border-green-200' : 'bg-white border-slate-200 hover:shadow-md'}`}>
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
                                    <div className="flex items-center space-x-4">
                                        <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm ${
                                            isCompleted ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'
                                        }`}>
                                            {student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-lg">{student.name}</h3>
                                            <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                                                <span className="bg-slate-100 px-2 py-0.5 rounded">{student.targetCountry}</span>
                                                {isCompleted && <span className="flex items-center text-green-600 font-medium"><CheckCircle2 size={12} className="mr-1"/> NOC Issued</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                                        <div className="relative w-full sm:w-48">
                                            <span className="absolute top-1 left-2 text-[10px] text-slate-400">Ref / Note</span>
                                            <input 
                                                type="text" 
                                                className="w-full pt-4 pb-1 px-2 border border-slate-200 rounded text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                                placeholder="Enter NOC Ref #"
                                                value={student.notes}
                                                onChange={(e) => updateNotes(student.id, e.target.value)}
                                            />
                                        </div>

                                        <div className="flex flex-col w-full sm:w-auto">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Update Status</label>
                                            <select 
                                                value={student.nocStatus}
                                                onChange={(e) => updateNocStatus(student.id, e.target.value as NocStatus)}
                                                className={`text-sm font-semibold border rounded-lg p-2.5 cursor-pointer focus:ring-2 focus:outline-none transition-colors ${
                                                    isCompleted 
                                                    ? 'bg-green-100 text-green-800 border-green-200 focus:ring-green-500/30' 
                                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 focus:ring-indigo-500/30'
                                                }`}
                                            >
                                                {steps.map(step => (
                                                    <option key={step} value={step}>{step}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Stepper Visual */}
                                <div className="relative px-4">
                                    {/* Progress Track */}
                                    <div className="overflow-hidden h-2 mb-8 text-xs flex rounded-full bg-slate-100 relative">
                                        <div 
                                            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }} 
                                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-700 ease-in-out bg-gradient-to-r ${
                                                isCompleted ? 'from-green-400 to-green-600' : 'from-indigo-400 to-indigo-600'
                                            }`}
                                        ></div>
                                    </div>
                                    
                                    {/* Steps */}
                                    <div className="flex justify-between w-full absolute -top-1.5 left-0 px-0">
                                        {steps.map((step, idx) => {
                                            const active = idx <= currentStepIndex;
                                            const isCurrent = idx === currentStepIndex;
                                            return (
                                            <div key={step} className={`flex flex-col items-center w-1/5 cursor-pointer group relative`} onClick={() => updateNocStatus(student.id, step)}>
                                                {/* Node Circle */}
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold z-10 transition-all duration-300 border-2 ${
                                                    active
                                                        ? isCompleted 
                                                            ? 'bg-green-500 border-green-500 shadow-md scale-110' 
                                                            : 'bg-indigo-600 border-indigo-600 shadow-md scale-110'
                                                        : 'bg-white border-slate-300 group-hover:border-indigo-400'
                                                }`}>
                                                    {active && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                                </div>
                                                
                                                {/* Pulse Effect for current active step */}
                                                {isCurrent && !isCompleted && (
                                                    <span className="absolute top-0 w-5 h-5 rounded-full bg-indigo-500 opacity-75 animate-ping"></span>
                                                )}

                                                {/* Label */}
                                                <span className={`absolute top-7 text-[10px] text-center font-medium leading-tight transition-colors w-24 ${
                                                    active 
                                                        ? isCompleted ? 'text-green-700 font-bold' : 'text-indigo-700 font-bold'
                                                        : 'text-slate-400'
                                                }`}>
                                                    {step}
                                                </span>
                                            </div>
                                        )})}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    )
}
