
import { User, AgencySettings, Country } from '../types';

// Firebase imports removed.
const isFirebaseReady = false;

let currentUserCache: User | null = null;

// --- MOCK AUTH HELPERS ---
const MOCK_ADMIN: User = {
    id: 'mock-admin-id',
    name: 'Demo Admin',
    email: 'admin@demo.com',
    role: 'Owner',
    agencyId: 'mock-agency-id'
};

const getLocalUser = (): User | null => {
    const stored = localStorage.getItem('sag_current_user');
    return stored ? JSON.parse(stored) : null;
};

export const login = async (email: string, password: string): Promise<User | null> => {
    // Mock Login Fallback (For Preview/Demo)
    console.log("Using Mock Login System");
    
    // Check Demo Admin
    if (email === 'admin@demo.com' && password === 'password') {
        currentUserCache = MOCK_ADMIN;
        localStorage.setItem('sag_current_user', JSON.stringify(MOCK_ADMIN));
        return MOCK_ADMIN;
    }

    // Check LocalStorage Registered Users
    const localUsers = JSON.parse(localStorage.getItem('sag_users') || '[]');
    const foundUser = localUsers.find((u: any) => u.email === email && u.password === password); // Password plain text for demo only
    
    if (foundUser) {
        const user = { ...foundUser };
        // Remove password from session object
        delete user.password;
        currentUserCache = user;
        localStorage.setItem('sag_current_user', JSON.stringify(user));
        return user;
    }

    // Check for Student Login (from CRM data)
    // We need to fetch all students from all agencies to check credentials in this mock mode
    // In a real app, this would be a DB query. Here we cheat and iterate keys or just fail for now
    // unless implemented specific to the active agency context (which we don't have if not logged in).
    // For simplicity in mock mode, student login might require creating a student first as an admin.
    
    // Simulate invalid login
    throw new Error("Invalid credentials. Try admin@demo.com / password");
};

export const registerAgency = async (
    name: string, 
    email: string, 
    agencyName: string
): Promise<User> => {
    // Mock Register
    const newId = Date.now().toString();
    const mockUser = {
        id: newId,
        name,
        email,
        role: 'Owner' as const,
        agencyId: `agency_${newId}`,
        password: 'password123' // Stored for demo login
    };
    
    // Save to local storage mock DB
    const localUsers = JSON.parse(localStorage.getItem('sag_users') || '[]');
    localUsers.push(mockUser);
    localStorage.setItem('sag_users', JSON.stringify(localUsers));

    // Save default settings for this new mock agency
    const defaultSettings: AgencySettings = {
        agencyName: agencyName,
        email: email,
        phone: '',
        address: '',
        defaultCountry: Country.Australia,
        currency: 'NPR',
        notifications: { emailOnVisa: true, dailyReminders: true },
        subscription: { plan: 'Free' }
    };
    localStorage.setItem(`sag_settings_${mockUser.agencyId}`, JSON.stringify(defaultSettings));

    const appUser = { ...mockUser };
    // @ts-ignore
    delete appUser.password;
    
    currentUserCache = appUser;
    localStorage.setItem('sag_current_user', JSON.stringify(appUser));
    return appUser;
};

export const logout = async () => {
    currentUserCache = null;
    localStorage.removeItem('sag_current_user');
    window.location.reload();
};

export const getCurrentUser = (): User | null => {
    if (!currentUserCache) {
        currentUserCache = getLocalUser();
    }
    return currentUserCache;
};

export const initAuthListener = (callback: (user: User | null) => void) => {
    // Mock Listener: Checks once on mount
    const user = getLocalUser();
    currentUserCache = user;
    callback(user);
    
    return () => {};
};
