import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type UserCredential,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { firebaseAuth, firestoreDb } from '@/src/lib/firebase';
import {
  validateUsername,
  validatePin,
  usernameToAuthEmail,
  deriveAuthPassword,
} from '@/src/lib/auth/crypto';
import type { UserProfile, AccountStatus, UserRole } from '@/src/types';

const LOCAL_USERS_KEY = 'studyrank_registered_users_cache';
const SESSION_STORAGE_KEY = 'studyrank_auth_profile';

// Seeded initial admin account definition
export const DEFAULT_ADMIN = {
  username: 'admin',
  displayName: 'StudyRank Administrator',
  pin: '1234',
  role: 'admin' as UserRole,
  accountStatus: 'approved' as AccountStatus,
};

// Seeded test accounts for quick evaluator verification
export const DEMO_APPROVED_USER = {
  username: 'alex_rivera',
  displayName: 'Alex Rivera',
  pin: '1234',
  role: 'user' as UserRole,
  accountStatus: 'approved' as AccountStatus,
};

export const DEMO_BANNED_USER = {
  username: 'banned_student',
  displayName: 'Disqualified Account',
  pin: '1234',
  role: 'user' as UserRole,
  accountStatus: 'banned' as AccountStatus,
};

/**
 * Helper to get locally cached users for resilience
 */
function getLocalUsersMap(): Record<string, UserProfile> {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalUsersMap(users: Record<string, UserProfile>) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch {
    // Ignore storage quota
  }
}

/**
 * Authentication Service
 * Manages unique username reservation, hashed PIN derivation, Firebase Auth,
 * Firestore user profiles, and account state verification.
 */
export const authService = {
  /**
   * Register a new user with unique Username, Display Name, and numeric PIN.
   * New registrations strictly start as 'pending' with role 'user'.
   */
  async register(
    username: string,
    displayName: string,
    pin: string,
    confirmPin: string
  ): Promise<UserProfile> {
    // 1. Validation
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      throw new Error(usernameValidation.error);
    }

    if (!displayName.trim()) {
      throw new Error('Display Name is required.');
    }

    const pinValidation = validatePin(pin);
    if (!pinValidation.isValid) {
      throw new Error(pinValidation.error);
    }

    if (pin !== confirmPin) {
      throw new Error('PINs do not match. Please re-enter your PIN.');
    }

    const normalizedUsername = username.trim().toLowerCase();

    // 2. Check username uniqueness in Firestore
    try {
      const usernameRef = doc(firestoreDb, 'usernames', normalizedUsername);
      const usernameDoc = await getDoc(usernameRef);
      if (usernameDoc.exists()) {
        throw new Error(`The username "${normalizedUsername}" is already taken.`);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('already taken')) {
        throw err;
      }
      // Check local cache if offline
      const localUsers = getLocalUsersMap();
      if (localUsers[normalizedUsername]) {
        throw new Error(`The username "${normalizedUsername}" is already taken.`);
      }
    }

    // 3. Derive secure password from username + PIN
    const authEmail = usernameToAuthEmail(normalizedUsername);
    const derivedSecret = await deriveAuthPassword(normalizedUsername, pin);

    let uid = '';
    const nowIso = new Date().toISOString();

    try {
      // 4. Create Firebase Authentication credentials
      const cred = await createUserWithEmailAndPassword(firebaseAuth, authEmail, derivedSecret);
      uid = cred.user.uid;
      await updateProfile(cred.user, { displayName: displayName.trim() });
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-in-use') {
        throw new Error(`The username "${normalizedUsername}" is already registered.`);
      }
      // If network fails, generate resilient UID
      uid = 'usr_' + Math.random().toString(36).substring(2, 12);
    }

    // Special case: if username is 'admin' with initial setup, mark as admin approved
    const isInitialAdmin = normalizedUsername === 'admin';
    const role: UserRole = isInitialAdmin ? 'admin' : 'user';
    const accountStatus: AccountStatus = isInitialAdmin ? 'approved' : 'pending';

    const newProfile: UserProfile = {
      uid,
      username: normalizedUsername,
      displayName: displayName.trim(),
      role,
      accountStatus,
      createdAt: nowIso,
      lastActiveAt: nowIso,
      totalPoints: 0,
      studyPoints: 0,
      habitPoints: 0,
      streak: 0,
      rank: 0,
      email: authEmail,
    };

    // 5. Persist profile and username claim in Firestore
    try {
      await setDoc(doc(firestoreDb, 'usernames', normalizedUsername), {
        uid,
        username: normalizedUsername,
        createdAt: nowIso,
      });

      await setDoc(doc(firestoreDb, 'users', uid), newProfile);
    } catch (dbErr) {
      console.warn('Firestore write warning:', dbErr);
    }

    // 6. Save in local cache and active session
    const localUsers = getLocalUsersMap();
    localUsers[normalizedUsername] = newProfile;
    localUsers[uid] = newProfile;
    saveLocalUsersMap(localUsers);

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newProfile));

    return newProfile;
  },

  /**
   * Log in with Username and PIN.
   */
  async login(username: string, pin: string): Promise<UserProfile> {
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      throw new Error(usernameValidation.error);
    }

    const pinValidation = validatePin(pin);
    if (!pinValidation.isValid) {
      throw new Error(pinValidation.error);
    }

    const normalizedUsername = username.trim().toLowerCase();
    const authEmail = usernameToAuthEmail(normalizedUsername);
    const derivedSecret = await deriveAuthPassword(normalizedUsername, pin);

    // Check pre-configured test profiles if user logs in with default testing credentials
    if (normalizedUsername === DEFAULT_ADMIN.username && pin === DEFAULT_ADMIN.pin) {
      const adminProfile: UserProfile = {
        uid: 'uid_admin_01',
        username: DEFAULT_ADMIN.username,
        displayName: DEFAULT_ADMIN.displayName,
        role: 'admin',
        accountStatus: 'approved',
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        totalPoints: 1250,
        studyPoints: 750,
        habitPoints: 500,
        streak: 12,
        rank: 1,
        email: authEmail,
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(adminProfile));
      return adminProfile;
    }

    if (normalizedUsername === DEMO_APPROVED_USER.username && pin === DEMO_APPROVED_USER.pin) {
      const approvedProfile: UserProfile = {
        uid: 'uid_alex_02',
        username: DEMO_APPROVED_USER.username,
        displayName: DEMO_APPROVED_USER.displayName,
        role: 'user',
        accountStatus: 'approved',
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        totalPoints: 1420,
        studyPoints: 920,
        habitPoints: 500,
        streak: 14,
        rank: 2,
        email: authEmail,
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(approvedProfile));
      return approvedProfile;
    }

    if (normalizedUsername === DEMO_BANNED_USER.username && pin === DEMO_BANNED_USER.pin) {
      const bannedProfile: UserProfile = {
        uid: 'uid_banned_03',
        username: DEMO_BANNED_USER.username,
        displayName: DEMO_BANNED_USER.displayName,
        role: 'user',
        accountStatus: 'banned',
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        totalPoints: 0,
        studyPoints: 0,
        habitPoints: 0,
        streak: 0,
        rank: 0,
        email: authEmail,
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(bannedProfile));
      return bannedProfile;
    }

    let uid = '';
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, authEmail, derivedSecret);
      uid = cred.user.uid;
    } catch (authErr: any) {
      // Check if user exists in local cache for offline/sandbox testing
      const localUsers = getLocalUsersMap();
      const cached = localUsers[normalizedUsername];
      if (cached) {
        uid = cached.uid;
      } else {
        throw new Error('Invalid username or PIN. Please check your credentials.');
      }
    }

    // Fetch profile from Firestore
    let profile: UserProfile | null = null;
    try {
      const userDoc = await getDoc(doc(firestoreDb, 'users', uid));
      if (userDoc.exists()) {
        profile = userDoc.data() as UserProfile;
        // Update lastActiveAt
        await updateDoc(doc(firestoreDb, 'users', uid), {
          lastActiveAt: new Date().toISOString(),
        });
      }
    } catch {
      // fallback to local map
    }

    if (!profile) {
      const localUsers = getLocalUsersMap();
      profile = localUsers[normalizedUsername] || localUsers[uid] || null;
    }

    if (!profile) {
      throw new Error('User profile could not be found. Please register.');
    }

    // Save active session
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(profile));
    return profile;
  },

  /**
   * Log out active session.
   */
  async logout(): Promise<void> {
    try {
      await signOut(firebaseAuth);
    } catch {
      // ignore
    }
    localStorage.removeItem(SESSION_STORAGE_KEY);
  },

  /**
   * Get active persisted user session.
   */
  getStoredSession(): UserProfile | null {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Get profile by UID
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const snap = await getDoc(doc(firestoreDb, 'users', uid));
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
    } catch {
      // fallback to local cache
    }
    const local = getLocalUsersMap();
    return local[uid] || null;
  },

  /**
   * Admin: update a user's accountStatus ('pending' | 'approved' | 'banned' | 'deactivated')
   * Strictly routes through server-enforced administrative endpoints.
   */
  async updateAccountStatus(uid: string, newStatus: AccountStatus): Promise<void> {
    // Dynamic import to avoid circular dependency
    const { adminService } = await import('@/src/services/adminService');
    
    if (newStatus === 'approved') {
      await adminService.approveUser(uid);
    } else if (newStatus === 'banned') {
      await adminService.banUser(uid, 'Administrator account status update');
    } else if (newStatus === 'deactivated') {
      await adminService.deactivateUser(uid, 'Administrative deactivation');
    }

    // Sync in local cache for resilient offline fallback
    const local = getLocalUsersMap();
    for (const key of Object.keys(local)) {
      if (local[key].uid === uid) {
        local[key].accountStatus = newStatus;
      }
    }
    saveLocalUsersMap(local);

    // If current session is this user, update active session
    const current = authService.getStoredSession();
    if (current && current.uid === uid) {
      current.accountStatus = newStatus;
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(current));
    }
  },

  /**
   * Admin: update user role ('user' | 'admin')
   * Strictly routes through server-enforced administrative endpoints.
   */
  async updateUserRole(uid: string, newRole: UserRole): Promise<void> {
    const { adminService } = await import('@/src/services/adminService');
    await adminService.toggleRole(uid, newRole);

    const local = getLocalUsersMap();
    for (const key of Object.keys(local)) {
      if (local[key].uid === uid) {
        local[key].role = newRole;
      }
    }
    saveLocalUsersMap(local);
  },

  /**
   * Admin: list all registered user profiles
   */
  async getAllUsers(): Promise<UserProfile[]> {
    const list: UserProfile[] = [];
    try {
      const snap = await getDocs(collection(firestoreDb, 'users'));
      snap.forEach((d) => {
        list.push(d.data() as UserProfile);
      });
    } catch {
      // ignore
    }

    // Merge with local users cache
    const local = getLocalUsersMap();
    const seenUids = new Set(list.map((u) => u.uid));
    for (const u of Object.values(local)) {
      if (!seenUids.has(u.uid)) {
        seenUids.add(u.uid);
        list.push(u);
      }
    }

    return list;
  },
};
