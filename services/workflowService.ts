

import { Student, ApplicationStatus, Task } from '../types';
import { fetchTasks, saveTasks } from './storageService';
import { logActivity } from './auditService';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getTargetDayName = (daysFromNow: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return DAYS[date.getDay()];
};

export const runStatusAutomation = async (student: Student, newStatus: ApplicationStatus) => {
    const existingTasks = await fetchTasks();
    const newTasks: Task[] = [];
    
    const createTask = (text: string, priority: 'High' | 'Medium' | 'Low', daysFromNow: number, time: string = '10:00') => {
        const task: Task = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            text: text,
            completed: false,
            priority: priority,
            dueTime: time,
            createdAt: Date.now(),
            day: getTargetDayName(daysFromNow)
        };
        newTasks.push(task);
    };

    // --- WORKFLOW RULES ---

    if (newStatus === ApplicationStatus.Applied) {
        // Rule: Follow up in 1 week
        createTask(`Check Offer Status: ${student.name} (${student.targetCountry})`, 'Low', 7, '11:00');
    }

    else if (newStatus === ApplicationStatus.OfferReceived) {
        // Rule: Immediate Financial Processing
        createTask(`Collect Tuition Fee & GTE Docs: ${student.name}`, 'High', 1, '14:00');
        // Rule: NOC Check
        if ((student.targetCountry as string) !== 'India') {
            createTask(`Verify NOC Status for ${student.name}`, 'Medium', 2, '12:00');
        }
    }

    else if (newStatus === ApplicationStatus.VisaGranted) {
        // Rule: Critical Pre-Departure
        createTask(`Conduct Pre-Departure Briefing: ${student.name}`, 'High', 1, '15:00');
        // Rule: Revenue Operations
        createTask(` CLAIM COMMISSION: ${student.name} (${student.targetCountry})`, 'High', 3, '10:00');
        createTask(`Archive Student File: ${student.name}`, 'Low', 5, '17:00');
    }

    else if (newStatus === ApplicationStatus.VisaRejected) {
        // Rule: Refund Processing
        createTask(`Process Tuition Refund: ${student.name}`, 'High', 1, '11:00');
        createTask(`Review Refusal Reason with ${student.name}`, 'Medium', 2, '14:00');
    }

    if (newTasks.length > 0) {
        const updatedTasks = [...newTasks, ...existingTasks];
        await saveTasks(updatedTasks);
        
        // Log the automation
        logActivity('CREATE', 'Settings', `Workflow Engine created ${newTasks.length} tasks for ${student.name}`);
        
        return newTasks.length;
    }
    
    return 0;
};