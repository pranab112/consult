

export enum Country {
  USA = 'USA',
  Australia = 'Australia',
  Canada = 'Canada',
  UK = 'UK',
  Japan = 'Japan',
  Korea = 'Korea'
}

export enum ApplicationStatus {
  Lead = 'Lead',
  Applied = 'Applied',
  OfferReceived = 'Offer Received',
  VisaGranted = 'Visa Granted',
  VisaRejected = 'Visa Rejected'
}

export enum NocStatus {
  NotApplied = 'Not Applied',
  Applied = 'Applied',
  VoucherReceived = 'Voucher Received',
  Verified = 'Verified',
  Issued = 'Issued'
}

export interface DocumentItem {
  name: string;
  checked: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'Student' | 'Agent';
  timestamp: number;
}

export type DocumentStatus = 'Pending' | 'Uploaded' | 'NotRequired';

export interface StoredFile {
    key: string;
    filename: string;
    url: string;
    size: number;
    mimeType: string;
    uploadedAt: number;
    uploadedBy: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  targetCountry: Country;
  status: ApplicationStatus;
  nocStatus: NocStatus;
  documents: Record<string, DocumentStatus>; // Changed from boolean to detailed status
  documentFiles?: Record<string, StoredFile>; // Changed from string to full file object
  documentDependencies?: Record<string, string[]>; // map docName to list of prerequisite docNames
  notes: string;
  createdAt: number;
  blockedBy?: string[]; // IDs of students this student depends on
  
  // Client Portal Credentials
  portalPassword?: string; 
  messages?: ChatMessage[];

  // Identity & Passport Data (New for OCR)
  passportNumber?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  nationality?: string;
  address?: string;
  gender?: 'Male' | 'Female' | 'Other';

  // Academic & Financial Info
  testType?: 'IELTS' | 'PTE' | 'TOEFL' | 'None';
  testScore?: string; // Real/Actual Score
  targetScore?: string; // New: Target Score
  gpa?: string;
  financialCap?: 'Low' | 'Medium' | 'Satisfactory';

  // Risk Assessment Data
  age?: number;
  educationGap?: number; // Years
  workExperience?: number; // Years
  previousRefusals?: boolean;
  
  // AI Analysis Result
  riskAnalysis?: {
      date: number;
      result: string;
  };

  // Test Prep Centre Info
  testPrep?: {
      enrolled: boolean;
      batch?: 'Morning (7-8 AM)' | 'Day (12-1 PM)' | 'Evening (5-6 PM)';
      examDate?: number;
      bookingStatus?: 'Pending' | 'Booked' | 'Completed';
      // New Fields for Exam Management
      portalUsername?: string;
      portalPassword?: string;
      examVenue?: string;
      examFeeStatus?: 'Paid' | 'Unpaid';
      mockScores?: {
          listening: string;
          reading: string;
          writing: string;
          speaking: string;
          overall: string;
      };
      // Attendance Tracking: 'YYYY-MM-DD' -> Status
      attendance?: Record<string, 'Present' | 'Absent' | 'Late'>;
  };
  
  source?: string; // e.g., 'Web Form', 'Manual', 'Referral'
  referralPartnerId?: string; // Link to a Partner (B2B Agent/Aggregator)
  courseInterest?: string;
  educationHistory?: string;
}

export interface Partner {
  id: string;
  name: string;
  type: 'University' | 'Aggregator' | 'College' | 'Consultancy' | 'B2B Agent';
  commissionRate: number; // Percentage
  portalUrl: string;
}

// B2B COMMISSION CLAIM TRACKING
export interface CommissionClaim {
    id: string;
    studentId: string;
    studentName: string;
    partnerId: string;
    partnerName: string;
    amount: number;
    currency: string;
    status: 'Unclaimed' | 'Invoiced' | 'Received';
    invoiceDate: number;
    dueDate?: number;
    notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  amount: number;
  description: string;
  status: 'Pending' | 'Paid';
  date: number;
}

export type ExpenseCategory = 'Rent' | 'Salaries' | 'Marketing' | 'Utilities' | 'Software' | 'Office' | 'Travel' | 'Other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: number;
  recordedBy: string;
}

export interface PRPointsCriteria {
  age: number;
  englishLevel: 'Superior' | 'Proficient' | 'Competent';
  education: 'Doctorate' | 'Master/Bachelor' | 'Diploma' | 'Trade';
  experienceYears: number;
  australianStudy: boolean;
  regionalStudy: boolean;
  partnerSkills: boolean;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: 'High' | 'Medium' | 'Low';
  dueTime: string; // e.g. "14:00"
  createdAt: number;
  day: string; // Day of the week
}

export type SubscriptionPlan = 'Free' | 'Pro' | 'Enterprise';

export interface LeadFormConfig {
    enabled: boolean;
    title: string;
    description: string;
    fields: {
        phone: boolean;
        targetCountry: boolean;
        courseInterest: boolean;
        educationHistory: boolean;
    };
    themeColor: string;
}

export interface AgencySettings {
  agencyName: string;
  email: string;
  phone: string;
  address: string;
  defaultCountry: Country;
  currency: string;
  notifications: {
    emailOnVisa: boolean;
    dailyReminders: boolean;
  };
  subscription: {
    plan: SubscriptionPlan;
    expiryDate?: number;
  };
  templates?: {
    emailVisaGranted: string;
    whatsappUpdate: string;
  };
  leadForm?: LeadFormConfig;
}

// --- AUTH & MULTI-TENANCY TYPES ---

export type UserRole = 'Owner' | 'Counsellor' | 'Viewer' | 'Student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  agencyId: string; // The tenant ID
  avatarUrl?: string;
}

export interface AuthSession {
  user: User;
  token: string;
}

// --- AUDIT LOGS ---
export interface ActivityLog {
    id: string;
    userId: string;
    userName: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT';
    entityType: 'Student' | 'Invoice' | 'Settings' | 'File' | 'Auth' | 'Commission' | 'Expense';
    details: string;
    timestamp: number;
}