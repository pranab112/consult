
import { Country, DocumentItem } from './types';

export interface DocRequirement {
  name: string;
  category: string;
  condition?: string;
}

export const UNIVERSAL_DOCS: DocRequirement[] = [
  { name: 'Passport (Valid 6mo+)', category: 'Identity' },
  { name: 'Citizenship (Notarized)', category: 'Identity' },
  { name: 'Passport Size Photos', category: 'Identity' },
  { name: 'SLC/SEE Marksheet', category: 'Academics' },
  { name: '+2/HSEB Transcript & Character', category: 'Academics' },
  { name: "Bachelor's Transcript & Degree", category: 'Academics', condition: 'If Masters' },
  { name: 'IELTS/PTE Scorecard', category: 'Tests', condition: 'with Login Credentials' },
  { name: 'NOC (Ministry of Education)', category: 'Gov' },
  { name: 'CV/Resume', category: 'Gap/Work', condition: 'Gap > 6mo' },
  { name: 'Work Experience Letters', category: 'Gap/Work', condition: 'Gap > 6mo' },
  { name: 'Gap Affidavit', category: 'Gap/Work', condition: 'Gap > 6mo' },
  { name: 'Student Email Credentials', category: 'Operations', condition: 'Gmail/Outlook' },
  { name: 'Marriage Certificate', category: 'Spouse', condition: 'If Married' },
  { name: 'Spouse Passport', category: 'Spouse', condition: 'If Married' }
];

export const COUNTRY_SPECIFIC_DOCS: Record<Country, DocRequirement[]> = {
  [Country.USA]: [
    { name: 'I-20 Form', category: 'Visa' },
    { name: 'DS-160 Confirmation', category: 'Visa' },
    { name: 'SEVIS Fee Receipt', category: 'Visa' },
    { name: 'Bank Balance Certificate', category: 'Finance', condition: '1 Year Tuition' },
    { name: 'Affidavit of Support', category: 'Finance' },
    { name: 'WES/ECE Evaluation', category: 'Academics', condition: 'If required' },
    { name: 'SOP (Statement of Purpose)', category: 'Academics' }
  ],
  [Country.Australia]: [
    { name: 'CoE (Confirmation of Enrolment)', category: 'Visa' },
    { name: 'GS (Genuine Student) Statement', category: 'Visa' },
    { name: 'OSHC (Health Insurance)', category: 'Health' },
    { name: 'Medical Exam (HAP ID)', category: 'Health' },
    { name: 'Relationship Certificate', category: 'Civil', condition: 'Ward Office' },
    { name: 'Property Valuation Report', category: 'Finance' },
    { name: 'One and the Same Certificate', category: 'Civil', condition: 'If name mismatch' }
  ],
  [Country.Canada]: [
    { name: 'LOA (Letter of Acceptance)', category: 'Visa' },
    { name: 'PAL (Provincial Attestation Letter)', category: 'Visa' },
    { name: 'GIC Certificate ($20,635 CAD)', category: 'Finance' },
    { name: 'Upfront Medical Sheet', category: 'Health' },
    { name: 'Custodianship Declaration', category: 'Visa', condition: 'Under 18' }
  ],
  [Country.UK]: [
    { name: 'CAS Statement', category: 'Visa' },
    { name: 'TB Test Certificate', category: 'Health', condition: 'IOM' },
    { name: 'Credibility Interview Pass Proof', category: 'Visa' },
    { name: 'ATAS Certificate', category: 'Academics', condition: 'Science/Eng courses' }
  ],
  [Country.Japan]: [
    { name: 'COE (Certificate of Eligibility)', category: 'Visa' },
    { name: 'JLPT/NAT Certificate', category: 'Academics' },
    { name: 'Relationship Certificate', category: 'Civil' },
    { name: 'Income & Tax Clearance', category: 'Finance' },
    { name: 'Japanese Translations', category: 'Ops' }
  ],
  [Country.Korea]: [
    { name: 'Certificate of Admission', category: 'Visa', condition: 'Issued by University' },
    { name: 'Visa Application Form', category: 'Visa', condition: 'Form No. 34' },
    { name: 'Academic Transcripts', category: 'Academics', condition: 'Apostilled/Consular Attested' },
    { name: 'Language Score (TOPIK/IELTS)', category: 'Academics', condition: 'Korean vs English Track' },
    { name: 'Bank Balance Certificate', category: 'Finance', condition: 'Frozen 3-6 Months' },
    { name: "Sponsor's Income & Tax", category: 'Finance' },
    { name: 'TB Test Report', category: 'Health', condition: 'Designated Hospitals Only' },
    { name: 'Family Relation Certificate', category: 'Identity', condition: 'Translated & Notarized' },
    { name: 'Study Plan', category: 'Visa', condition: 'Specific Korea Format' }
  ]
};

export const MOCK_STUDENTS_INITIAL = [
  {
    id: '1',
    name: 'Ram Karki',
    email: 'ram.k@example.com',
    phone: '9841000001',
    targetCountry: Country.Australia,
    status: 'Applied',
    nocStatus: 'Voucher Received',
    documents: { 'Passport (Valid 6mo+)': true, 'SLC/SEE Marksheet': true },
    documentFiles: {},
    documentDependencies: {},
    notes: 'Waiting for offer letter from Flinders.',
    createdAt: Date.now() - 86400000 * 5,
    blockedBy: [],
    testType: 'IELTS',
    testScore: '7.5',
    gpa: '3.6',
    financialCap: 'Satisfactory',
    testPrep: { enrolled: false }
  },
  {
    id: '2',
    name: 'Sita Sharma',
    email: 'sita.s@example.com',
    phone: '9802000002',
    targetCountry: Country.USA,
    status: 'Lead',
    nocStatus: 'Not Applied',
    documents: {},
    documentFiles: {},
    documentDependencies: {},
    notes: 'Interested in Nursing programs. Needs to take PTE.',
    createdAt: Date.now() - 100000,
    blockedBy: [],
    testType: 'PTE',
    testScore: 'Pending',
    gpa: '3.2',
    financialCap: 'Medium',
    testPrep: {
        enrolled: true,
        batch: 'Morning (7-8 AM)',
        bookingStatus: 'Pending',
        mockScores: { listening: '60', reading: '58', writing: '62', speaking: '65', overall: '61' }
    }
  },
  {
    id: '3',
    name: 'Aarav Singh',
    email: 'aarav.s@example.com',
    phone: '9851000003',
    targetCountry: Country.Canada,
    status: 'Offer Received',
    nocStatus: 'Applied',
    documents: { 'Passport (Valid 6mo+)': true, 'IELTS/PTE Scorecard': true, 'LOA (Letter of Acceptance)': true },
    documentFiles: {},
    documentDependencies: {},
    notes: 'Received LOA from Seneca. Preparing GIC funds.',
    createdAt: Date.now() - 86400000 * 10,
    blockedBy: [],
    testType: 'IELTS',
    testScore: '7.0',
    gpa: '3.8',
    financialCap: 'Satisfactory',
    testPrep: { enrolled: false }
  },
  {
    id: '4',
    name: 'Riya Basnet',
    email: 'riya.b@example.com',
    phone: '9812000004',
    targetCountry: Country.UK,
    status: 'Visa Granted',
    nocStatus: 'Issued',
    documents: { 'Passport (Valid 6mo+)': true, 'CAS Statement': true, 'TB Test Certificate': true },
    documentFiles: {},
    documentDependencies: {},
    notes: 'Visa granted! Need to arrange pre-departure briefing.',
    createdAt: Date.now() - 86400000 * 20,
    blockedBy: [],
    testType: 'IELTS',
    testScore: '6.5',
    gpa: '3.0',
    financialCap: 'Medium',
    testPrep: { enrolled: false }
  },
  {
    id: '5',
    name: 'Binod Chaudhry',
    email: 'binod.c@example.com',
    phone: '9860000005',
    targetCountry: Country.Japan,
    status: 'Applied',
    nocStatus: 'Not Applied',
    documents: { 'Passport (Valid 6mo+)': true, 'JLPT/NAT Certificate': true },
    documentFiles: {},
    documentDependencies: {},
    notes: 'Applied for language school in Tokyo. Waiting for COE.',
    createdAt: Date.now() - 86400000 * 3,
    blockedBy: [],
    testType: 'None',
    testScore: 'N5',
    gpa: '2.8',
    financialCap: 'Low',
    testPrep: { enrolled: false }
  },
  {
    id: '6',
    name: 'Mina Tamang',
    email: 'mina.t@example.com',
    phone: '9845000006',
    targetCountry: Country.Korea,
    status: 'Lead',
    nocStatus: 'Not Applied',
    documents: {},
    documentFiles: {},
    documentDependencies: {},
    notes: 'Looking for Universities in Seoul. Needs guidance on bank balance.',
    createdAt: Date.now(),
    blockedBy: [],
    testType: 'None',
    testScore: '',
    gpa: '3.5',
    financialCap: 'Medium',
    testPrep: { enrolled: false }
  },
  {
    id: '7',
    name: 'Suren Magar',
    email: 'suren.m@example.com',
    phone: '9801000007',
    targetCountry: Country.Australia,
    status: 'Visa Rejected',
    nocStatus: 'Verified',
    documents: { 'Passport (Valid 6mo+)': true, 'CoE (Confirmation of Enrolment)': true },
    documentFiles: {},
    documentDependencies: {},
    notes: 'Visa rejected due to GTE. Considering re-application or change of country.',
    createdAt: Date.now() - 86400000 * 45,
    blockedBy: [],
    testType: 'PTE',
    testScore: '58',
    gpa: '2.6',
    financialCap: 'Low',
    testPrep: { enrolled: false }
  },
  {
    id: '8',
    name: 'Priti Oli',
    email: 'priti.o@example.com',
    phone: '9823000008',
    targetCountry: Country.USA,
    status: 'Lead',
    nocStatus: 'Not Applied',
    documents: {},
    documentFiles: {},
    documentDependencies: {},
    notes: 'Currently taking IELTS classes. Plan to apply for Fall 2025.',
    createdAt: Date.now() - 86400000 * 2,
    blockedBy: [],
    testType: 'IELTS',
    testScore: 'Pending',
    gpa: '3.9',
    financialCap: 'Satisfactory',
    testPrep: {
        enrolled: true,
        batch: 'Evening (5-6 PM)',
        bookingStatus: 'Booked',
        examDate: Date.now() + 86400000 * 10,
        mockScores: { listening: '7.0', reading: '6.5', writing: '6.0', speaking: '7.0', overall: '6.5' }
    }
  },
  {
    id: '9',
    name: 'Kiren Limbu',
    email: 'kiren.l@example.com',
    phone: '9849000009',
    targetCountry: Country.Canada,
    status: 'Offer Received',
    nocStatus: 'Voucher Received',
    documents: { 'Passport (Valid 6mo+)': true, 'LOA (Letter of Acceptance)': true },
    documentFiles: {},
    documentDependencies: {},
    notes: 'Conditional offer received. Need to send final transcript.',
    createdAt: Date.now() - 86400000 * 12,
    blockedBy: [],
    testType: 'IELTS',
    testScore: '6.5',
    gpa: '3.1',
    financialCap: 'Medium',
    testPrep: { enrolled: false }
  },
  {
    id: '10',
    name: 'Ashish Darai',
    email: 'ashish.d@example.com',
    phone: '9861000010',
    targetCountry: Country.UK,
    status: 'Applied',
    nocStatus: 'Applied',
    documents: { 'Passport (Valid 6mo+)': true },
    documentFiles: {},
    documentDependencies: {},
    notes: 'Applied to 3 universities. Waiting for response.',
    createdAt: Date.now() - 86400000 * 6,
    blockedBy: [],
    testType: 'PTE',
    testScore: '62',
    gpa: '2.9',
    financialCap: 'Medium',
    testPrep: { enrolled: false }
  }
];

export const MOCK_PARTNERS_INITIAL = [
  { id: 'p1', name: 'Flinders University', type: 'University', commissionRate: 15, portalUrl: 'https://www.flinders.edu.au/agent' },
  { id: 'p2', name: 'ApplyBoard', type: 'Aggregator', commissionRate: 20, portalUrl: 'https://www.applyboard.com/login' },
  { id: 'p3', name: 'Torrens University', type: 'University', commissionRate: 12, portalUrl: 'https://agent.torrens.edu.au' },
  { id: 'p4', name: 'Excelsia College', type: 'College', commissionRate: 25, portalUrl: 'https://excelsia.edu.au/agents/' },
  { id: 'p5', name: 'Global Reach', type: 'Consultancy', commissionRate: 10, portalUrl: '#' }
];

export const TEST_PREP_LINKS = [
  { name: 'British Council (IELTS)', url: 'https://takeielts.britishcouncil.org/' },
  { name: 'IDP Nepal (IELTS)', url: 'https://www.idp.com/nepal/ielts/' },
  { name: 'Pearson (PTE)', url: 'https://www.pearsonpte.com/' },
  { name: 'ETS (TOEFL)', url: 'https://www.ets.org/toefl.html' }
];
