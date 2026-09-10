import { 
  User, 
  Form, 
  Submission, 
  SubmissionStatus,
  FormWithStatus, 
  UserSummary,
  EditableTableTemplate,
  UserTableSubmission,
  TableWithStatus,
  TableRowData,
  TableColumn,
  NotificationItem
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_FORMS, 
  INITIAL_SUBMISSIONS,
  INITIAL_TABLE_TEMPLATES,
  INITIAL_TABLE_SUBMISSIONS
} from '../data/initialData';

const STORAGE_KEYS = {
  USERS: 'biiroo_fayyaa_users_v2',
  FORMS: 'biiroo_fayyaa_forms_v2',
  SUBMISSIONS: 'biiroo_fayyaa_submissions_v2',
  TABLE_TEMPLATES: 'biiroo_fayyaa_table_templates_v2',
  TABLE_SUBMISSIONS: 'biiroo_fayyaa_table_submissions_v2',
  CURRENT_USER_ID: 'biiroo_fayyaa_current_user_id_v2',
  OUTBOX_EMAILS: 'biiroo_fayyaa_outbox_emails_v2',
  NOTIFICATIONS: 'biiroo_fayyaa_notifications_v2'
};

export interface OutboxEmail {
  id: string;
  to: string;
  subject: string;
  code: string;
  sentAt: string;
  expiresAt: number;
}

class StorageService {
  private users: User[] = [];
  private forms: Form[] = [];
  private submissions: Submission[] = [];
  private tableTemplates: EditableTableTemplate[] = [];
  private tableSubmissions: UserTableSubmission[] = [];
  private notifications: NotificationItem[] = [];
  private outbox: OutboxEmail[] = [];
  private currentUserId: number | null = null;
  private listeners: Set<(detail?: any) => void> = new Set();
  private initializedEvents = false;

  constructor() {
    this.init();
    this.setupWindowListeners();
  }

  private setupWindowListeners() {
    if (typeof window !== 'undefined' && !this.initializedEvents) {
      this.initializedEvents = true;
      window.addEventListener('storage', () => {
        this.init();
        this.notifyListeners({ type: 'storage_sync' });
      });
      window.addEventListener('biiroo_storage_change', (e: any) => {
        this.listeners.forEach(fn => {
          try {
            fn(e.detail);
          } catch (err) {
            console.error(err);
          }
        });
      });
    }
  }

  public subscribe(listener: (detail?: any) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public notifyListeners(detail?: any) {
    this.listeners.forEach(fn => {
      try {
        fn(detail);
      } catch (err) {
        console.error('Storage listener error:', err);
      }
    });
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('biiroo_storage_change', { detail }));
      } catch (e) {
        // ignore
      }
    }
  }

  public init() {
    try {
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      const storedForms = localStorage.getItem(STORAGE_KEYS.FORMS);
      const storedSubmissions = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      const storedTables = localStorage.getItem(STORAGE_KEYS.TABLE_TEMPLATES);
      const storedTableSubs = localStorage.getItem(STORAGE_KEYS.TABLE_SUBMISSIONS);
      const storedCurrentUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      const storedOutbox = localStorage.getItem(STORAGE_KEYS.OUTBOX_EMAILS);
      const storedNotifications = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);

      this.users = storedUsers ? JSON.parse(storedUsers) : [...INITIAL_USERS];
      this.forms = storedForms ? JSON.parse(storedForms) : [...INITIAL_FORMS];
      this.submissions = storedSubmissions ? JSON.parse(storedSubmissions) : [...INITIAL_SUBMISSIONS];
      this.tableTemplates = storedTables ? JSON.parse(storedTables) : [...INITIAL_TABLE_TEMPLATES];
      this.tableSubmissions = storedTableSubs ? JSON.parse(storedTableSubs) : [...INITIAL_TABLE_SUBMISSIONS];
      this.outbox = storedOutbox ? JSON.parse(storedOutbox) : [];
      this.notifications = storedNotifications ? JSON.parse(storedNotifications) : [];
      
      // Check stored session user
      if (storedCurrentUserId) {
        const parsedId = parseInt(storedCurrentUserId, 10);
        const exists = this.users.find(u => u.id === parsedId);
        this.currentUserId = exists ? exists.id : null;
      } else {
        // Default to admin for first initial load if none saved
        this.currentUserId = this.users[0]?.id || 1;
      }

      // Ensure template columns contain Total case, P.V, P.F and Total
      if (this.tableTemplates.length > 0) {
        this.tableTemplates.forEach(tpl => {
          const hasPV = tpl.columns.some(c => c.id === 'col_pv' || c.label.toLowerCase().includes('p.v'));
          if (!hasPV) {
            // Replace or append surveillance columns
            tpl.columns = INITIAL_TABLE_TEMPLATES[0].columns;
          }
        });
      } else {
        this.tableTemplates = [...INITIAL_TABLE_TEMPLATES];
      }

      // If no table submissions exist in localStorage yet, populate with initial baseline submissions
      if (!this.tableSubmissions || this.tableSubmissions.length === 0) {
        this.tableSubmissions = [...INITIAL_TABLE_SUBMISSIONS];
      }

      // Ensure every submitted row is auto-written with the submitter's username and case data
      this.tableSubmissions.forEach(sub => {
        const user = this.users.find(u => u.id === sub.user_id);
        const username = user?.username || `user_${sub.user_id}`;
        if (sub.rows) {
          sub.rows.forEach(r => {
            if (!r.username) {
              r.username = username;
            }
            // Auto calculate Total if missing
            if (r.col_pv !== undefined || r.col_pf !== undefined) {
              if (r.col_total === undefined) {
                r.col_total = (Number(r.col_pv) || 0) + (Number(r.col_pf) || 0);
              }
              if (r.col_total_cases === undefined) {
                r.col_total_cases = r.col_total;
              }
            }
          });
        }
      });

      this.persistAll();
    } catch (e) {
      console.warn('LocalStorage error or not available, fallback to initial data', e);
      this.users = [...INITIAL_USERS];
      this.forms = [...INITIAL_FORMS];
      this.submissions = [...INITIAL_SUBMISSIONS];
      this.tableTemplates = [...INITIAL_TABLE_TEMPLATES];
      this.tableSubmissions = [...INITIAL_TABLE_SUBMISSIONS];
      this.notifications = [];
      this.currentUserId = null;
    }
  }

  public resetToDefaults() {
    this.users = JSON.parse(JSON.stringify(INITIAL_USERS));
    this.forms = JSON.parse(JSON.stringify(INITIAL_FORMS));
    this.submissions = JSON.parse(JSON.stringify(INITIAL_SUBMISSIONS));
    this.tableTemplates = JSON.parse(JSON.stringify(INITIAL_TABLE_TEMPLATES));
    this.tableSubmissions = JSON.parse(JSON.stringify(INITIAL_TABLE_SUBMISSIONS));
    this.notifications = [];
    this.outbox = [];
    this.currentUserId = null;
    this.persistAll();
  }

  private persistUsers() {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
      this.notifyListeners({ type: 'users', count: this.users.length });
    } catch (e) {
      console.error(e);
    }
  }

  private persistForms() {
    try {
      localStorage.setItem(STORAGE_KEYS.FORMS, JSON.stringify(this.forms));
      this.notifyListeners({ type: 'forms', count: this.forms.length });
    } catch (e) {
      console.error(e);
    }
  }

  private persistSubmissions() {
    try {
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(this.submissions));
      this.notifyListeners({ type: 'submissions', count: this.submissions.length });
    } catch (e) {
      console.error(e);
    }
  }

  private persistTableTemplates() {
    try {
      localStorage.setItem(STORAGE_KEYS.TABLE_TEMPLATES, JSON.stringify(this.tableTemplates));
      this.notifyListeners({ type: 'tables', count: this.tableTemplates.length });
    } catch (e) {
      console.error(e);
    }
  }

  private persistTableSubmissions() {
    try {
      localStorage.setItem(STORAGE_KEYS.TABLE_SUBMISSIONS, JSON.stringify(this.tableSubmissions));
      this.notifyListeners({ type: 'table_submissions', count: this.tableSubmissions.length });
    } catch (e) {
      console.error(e);
    }
  }

  private persistNotifications() {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.notifications));
      this.notifyListeners({ type: 'notifications', count: this.notifications.length });
    } catch (e) {
      console.error(e);
    }
  }

  private persistOutbox() {
    try {
      localStorage.setItem(STORAGE_KEYS.OUTBOX_EMAILS, JSON.stringify(this.outbox));
      this.notifyListeners({ type: 'outbox', count: this.outbox.length });
    } catch (e) {
      console.error(e);
    }
  }

  private persistAll() {
    this.persistUsers();
    this.persistForms();
    this.persistSubmissions();
    this.persistTableTemplates();
    this.persistTableSubmissions();
    this.persistNotifications();
    this.persistOutbox();
    if (this.currentUserId !== null) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, this.currentUserId.toString());
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    }
  }

  // --- Auth & User Operations ---

  public getCurrentUser(): User | null {
    if (this.currentUserId === null) {
      return null;
    }
    return this.users.find(u => u.id === this.currentUserId) || null;
  }

  public setCurrentUser(userId: number | null) {
    this.currentUserId = userId;
    if (userId !== null) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId.toString());
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    }
  }

  public async login(usernameOrEmail: string, password_input: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const rawUser = (usernameOrEmail || '').trim();
    // Strip leading @ if provided by user
    const cleanUser = rawUser.startsWith('@') ? rawUser.slice(1).trim().toLowerCase() : rawUser.toLowerCase();
    const trimmedPass = (password_input || '').trim();

    if (!cleanUser || !trimmedPass) {
      return { success: false, error: 'Both Username/Gmail and password are required to login.' };
    }

    const user = this.users.find(u => 
      u.username.toLowerCase() === cleanUser || 
      u.email.toLowerCase() === cleanUser ||
      (u.full_name && u.full_name.toLowerCase() === cleanUser)
    );

    if (!user) {
      return { success: false, error: 'Invalid Username/Gmail or password. Access denied.' };
    }

    // STRICT Password Check: MUST match stored password_hash
    const storedPass = (user.password_hash || '').trim();
    if (storedPass !== trimmedPass) {
      return { success: false, error: 'Invalid Username/Gmail or password. Access denied.' };
    }

    this.setCurrentUser(user.id);
    return { success: true, user };
  }

  public logout() {
    this.setCurrentUser(null);
  }

  public getUsers(): User[] {
    return [...this.users];
  }

  public getUserById(id: number): User | undefined {
    return this.users.find(u => u.id === id);
  }

  public createUser(userData: { username: string; email: string; password: string; role?: 'admin' | 'user'; full_name?: string }): { success: boolean; user?: User; error?: string } {
    const username = userData.username.trim();
    const email = userData.email.trim();
    const cleanPassword = (userData.password || '').trim();
    if (!username || !email || !cleanPassword) {
      return { success: false, error: 'All fields (Username, Email, and Password) are required' };
    }

    if (this.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, error: 'Username already exists' };
    }
    if (this.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'Email already exists' };
    }

    const colors = ['#005a9e', '#0b7285', '#0EA5E9', '#10B981', '#F59E0B', '#6366F1'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newUser: User = {
      id: this.users.length ? Math.max(...this.users.map(u => u.id)) + 1 : 1,
      username,
      email,
      password_hash: cleanPassword,
      role: userData.role || 'user',
      full_name: userData.full_name || (userData.role === 'admin' ? 'Admin Biiroo Eegumsa Fayyaa' : username),
      avatar_color: randomColor,
      created_at: new Date().toISOString()
    };

    this.users.push(newUser);
    this.persistUsers();

    // Auto-create initial table submissions for all existing templates
    try {
      this.tableTemplates.forEach(tpl => {
        const alreadyHas = this.tableSubmissions.some(s => s.table_id === tpl.id && s.user_id === newUser.id);
        if (!alreadyHas) {
          const sampleRows: TableRowData[] = (tpl.default_rows && tpl.default_rows.length > 0)
            ? tpl.default_rows.map((r, idx) => ({ ...r, id: `row_${newUser.id}_${tpl.id}_${idx + 1}` }))
            : [
                {
                  id: `row_${newUser.id}_${tpl.id}_1`,
                  username: newUser.username,
                  user_id: newUser.id,
                  col_facility: `${newUser.full_name || newUser.username} Health Center`,
                  col_total_cases: 0,
                  col_pv: 0,
                  col_pf: 0,
                  col_total: 0
                }
              ];
          const newSubmission: UserTableSubmission = {
            id: this.tableSubmissions.length ? Math.max(...this.tableSubmissions.map(s => s.id)) + 1 : 1,
            table_id: tpl.id,
            user_id: newUser.id,
            status: 'draft',
            rows: sampleRows,
            submitted_at: null,
            updated_at: new Date().toISOString()
          };
          this.tableSubmissions.push(newSubmission);
        }
      });
      this.persistTableSubmissions();
    } catch (e) {
      console.warn('Failed to auto-init submissions for new user:', e);
    }

    this.addNotification({
      user_id: 'admin',
      title: 'New User Registered',
      message: `User account @${newUser.username} (${newUser.email}) was created in Biiroo Eegumsa Fayyaa.`,
      type: 'system',
      link_view: 'admin-users'
    });

    return { success: true, user: newUser };
  }

  public updateUserProfile(userId: number, profileData: { username?: string; email?: string; password?: string; full_name?: string; phone?: string; avatar_color?: string }): { success: boolean; user?: User; error?: string } {
    const user = this.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User not found' };

    let usernameChanged = false;
    let oldUsername = user.username;

    if (profileData.username) {
      const usernameTrim = profileData.username.trim().toLowerCase();
      if (usernameTrim.length < 3) {
        return { success: false, error: 'Username must be at least 3 characters' };
      }
      if (this.users.some(u => u.id !== userId && u.username.toLowerCase() === usernameTrim)) {
        return { success: false, error: 'Username is already in use by another account' };
      }
      if (user.username !== usernameTrim) {
        usernameChanged = true;
        oldUsername = user.username;
        user.username = usernameTrim;
      }
    }

    if (profileData.email) {
      const emailTrim = profileData.email.trim().toLowerCase();
      if (this.users.some(u => u.id !== userId && u.email.toLowerCase() === emailTrim)) {
        return { success: false, error: 'Email is already in use by another account' };
      }
      user.email = emailTrim;
    }

    if (profileData.password) {
      const passTrim = profileData.password.trim();
      if (passTrim.length < 4) {
        return { success: false, error: 'Password must be at least 4 characters' };
      }
      user.password_hash = passTrim;
    }

    if (profileData.full_name !== undefined) user.full_name = profileData.full_name.trim();
    if (profileData.phone !== undefined) user.phone = profileData.phone.trim();
    if (profileData.avatar_color) user.avatar_color = profileData.avatar_color;

    // Cascade username changes across all existing table submissions so data is never detached
    if (usernameChanged) {
      this.tableSubmissions.forEach(sub => {
        if (sub.user_id === userId && sub.rows) {
          sub.rows.forEach(r => {
            if (!r.username || r.username === oldUsername || r.username === `@${oldUsername}`) {
              r.username = user.username;
            }
          });
        }
      });
      this.persistTableSubmissions();
    }

    this.persistUsers();
    return { success: true, user };
  }

  public deleteUser(userId: number): { success: boolean; error?: string } {
    if (userId === 1) {
      return { success: false, error: 'Cannot delete primary root administrator' };
    }
    this.users = this.users.filter(u => u.id !== userId);
    this.submissions = this.submissions.filter(s => s.user_id !== userId);
    this.tableSubmissions = this.tableSubmissions.filter(s => s.user_id !== userId);
    this.persistUsers();
    this.persistSubmissions();
    this.persistTableSubmissions();
    return { success: true };
  }

  public async requestPasswordReset(usernameOrEmail: string): Promise<{ success: boolean; code?: string; email?: string; error?: string; message?: string }> {
    const query = usernameOrEmail.trim().toLowerCase();
    let user = this.users.find(u => u.username.toLowerCase() === query || u.email.toLowerCase() === query);
    
    // If entered an email format and no exact user matched, associate with primary admin
    if (!user && query.includes('@')) {
      const adminUser = this.users.find(u => u.role === 'admin') || this.users[0];
      if (adminUser) {
        adminUser.email = query;
        user = adminUser;
        this.persistUsers();
      }
    }

    if (!user) {
      return { success: false, error: 'No account found with that Gmail or username.' };
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 15 * 60 * 1000; // 15 mins

    user.reset_code = resetCode;
    user.reset_expires = expires;
    this.persistUsers();

    // Log to simulated outbox
    const emailItem: OutboxEmail = {
      id: Math.random().toString(36).substring(2, 9),
      to: user.email,
      subject: `${resetCode} is your Biiroo Eegumsa Fayyaa Reset Code`,
      code: resetCode,
      sentAt: new Date().toLocaleTimeString(),
      expiresAt: expires
    };
    this.outbox.unshift(emailItem);
    this.persistOutbox();

    // Send Real Email via backend /api/send-reset-code
    try {
      const response = await fetch('/api/send-reset-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: user.email,
          code: resetCode,
          username: user.username,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        return {
          success: true,
          code: resetCode,
          email: user.email,
          message: data.message || `Real verification code sent to ${user.email}`,
        };
      } else {
        console.warn('Backend email dispatch warning:', data.error);
        return {
          success: true,
          code: resetCode,
          email: user.email,
          message: `Verification code generated for ${user.email}`,
        };
      }
    } catch (err: any) {
      console.warn('Network error calling email dispatch API:', err);
      return {
        success: true,
        code: resetCode,
        email: user.email,
        message: `Verification code generated for ${user.email}`,
      };
    }
  }

  public updateUserPassword(userId: number, newPassword: string): { success: boolean; error?: string } {
    const user = this.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User not found' };
    user.password_hash = (newPassword || '').trim();
    this.persistUsers();
    return { success: true };
  }

  public getPortalUrl(): string {
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost:3000';
    const pathname = typeof window !== 'undefined' && window.location ? window.location.pathname : '/';
    return `${origin}${pathname}`;
  }

  public generateLoginUrl(username?: string, tableId?: number): string {
    const baseUrl = this.getPortalUrl();
    const params = new URLSearchParams();
    if (username) {
      params.set('u', username);
    }
    if (tableId) {
      params.set('table', tableId.toString());
    }
    const query = params.toString();
    return query ? `${baseUrl}?${query}` : baseUrl;
  }

  public generateInviteTemplate(user: User): string {
    const portalUrl = this.getPortalUrl();
    const userPass = (user.password_hash || '').trim() || 'user123';

    return `BIIROO EEGUMSA FAYYAA - HEALTHCARE PORTAL LOGIN

Hello ${user.full_name || user.username},

Your healthcare portal account is ready. Please use the unified portal link and your assigned credentials below to log into your account:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOGIN CREDENTIALS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Portal Link: ${portalUrl}
• Username: ${user.username}
• Gmail / Email: ${user.email}
• Password: ${userPass}
• Account Role: ${user.role === 'admin' ? 'Admin Biiroo Eegumsa Fayyaa' : 'Healthcare Staff Member'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOGIN INSTRUCTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Open the portal link in your browser: ${portalUrl}
2. Enter your Username (${user.username}) or Gmail (${user.email}).
3. Enter your Password: ${userPass}
4. Click LOGIN to access your dashboard, assigned spreadsheets, and reporting forms.`;
  }

  public verifyAndResetPassword(username: string, code: string, newPassword: string): { success: boolean; error?: string } {
    const user = this.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() || u.email.toLowerCase() === username.trim().toLowerCase());
    if (!user || !user.reset_code || user.reset_code !== code.trim()) {
      return { success: false, error: 'Invalid username/Gmail or reset code.' };
    }
    if (user.reset_expires && user.reset_expires < Date.now()) {
      return { success: false, error: 'Reset code has expired. Please request a new code.' };
    }

    user.password_hash = newPassword;
    user.reset_code = null;
    user.reset_expires = null;
    this.persistUsers();
    return { success: true };
  }

  public changePassword(userId: number, oldPassword: string, newPassword: string): { success: boolean; error?: string } {
    const user = this.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User not found' };

    if (user.password_hash !== oldPassword) {
      return { success: false, error: 'Current password is incorrect' };
    }

    if (newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long' };
    }

    user.password_hash = newPassword;
    this.persistUsers();
    return { success: true };
  }

  // --- Notification System ---

  public getNotifications(userId: number | null, role?: string): NotificationItem[] {
    if (!userId && !role) return [];
    return this.notifications.filter(n => {
      if (role === 'admin' && (n.user_id === 'admin' || n.user_id === 'all')) return true;
      if (userId && (n.user_id === userId || n.user_id === 'all')) return true;
      return false;
    });
  }

  public addNotification(notif: Omit<NotificationItem, 'id' | 'created_at' | 'read'>): NotificationItem {
    const newNotif: NotificationItem = {
      ...notif,
      id: Math.random().toString(36).substring(2, 9),
      read: false,
      created_at: new Date().toISOString()
    };
    this.notifications.unshift(newNotif);
    this.persistNotifications();
    return newNotif;
  }

  public markNotificationAsRead(id: string) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.persistNotifications();
    }
  }

  public markAllNotificationsAsRead(userId: number | null, role?: string) {
    this.notifications.forEach(n => {
      if (role === 'admin' && (n.user_id === 'admin' || n.user_id === 'all')) {
        n.read = true;
      }
      if (userId && (n.user_id === userId || n.user_id === 'all')) {
        n.read = true;
      }
    });
    this.persistNotifications();
  }

  public getUnreadNotificationsCount(userId: number | null, role?: string): number {
    return this.getNotifications(userId, role).filter(n => !n.read).length;
  }

  // --- Outbox Operations ---

  public getOutbox(): OutboxEmail[] {
    return [...this.outbox];
  }

  public clearOutbox() {
    this.outbox = [];
    this.persistOutbox();
  }

  // --- Form Operations ---

  public getForms(): Form[] {
    return [...this.forms];
  }

  public getFormById(id: number): Form | undefined {
    return this.forms.find(f => f.id === id);
  }

  public createForm(formData: Omit<Form, 'id' | 'created_at'>): Form {
    const newId = this.forms.length ? Math.max(...this.forms.map(f => f.id)) + 1 : 1;
    const newForm: Form = {
      ...formData,
      id: newId,
      created_at: new Date().toISOString(),
      fields: formData.fields.map((field, idx) => ({
        ...field,
        id: field.id || Number(`${newId}${idx + 1}`),
        form_id: newId
      }))
    };
    this.forms.unshift(newForm);
    this.persistForms();

    this.addNotification({
      user_id: 'all',
      title: 'New Health Report Form Published',
      message: `Admin Biiroo Eegumsa Fayyaa published new form: "${newForm.title}"`,
      type: 'assignment',
      link_view: 'report-form',
      link_id: newId
    });

    return newForm;
  }

  public updateForm(formId: number, updateData: Partial<Form>): { success: boolean; form?: Form; error?: string } {
    const idx = this.forms.findIndex(f => f.id === formId);
    if (idx === -1) return { success: false, error: 'Form not found' };

    this.forms[idx] = {
      ...this.forms[idx],
      ...updateData,
      updated_at: new Date().toISOString()
    };

    this.persistForms();
    return { success: true, form: this.forms[idx] };
  }

  public deleteForm(formId: number): { success: boolean; error?: string } {
    this.forms = this.forms.filter(f => f.id !== formId);
    this.submissions = this.submissions.filter(s => s.form_id !== formId);
    this.persistForms();
    this.persistSubmissions();
    return { success: true };
  }

  // --- Submission Operations ---

  public getSubmissions(): Submission[] {
    return [...this.submissions];
  }

  public getSubmissionById(id: number): Submission | undefined {
    return this.submissions.find(s => s.id === id);
  }

  public getSubmissionForUserAndForm(userId: number, formId: number): Submission | undefined {
    return this.submissions.find(s => s.user_id === userId && s.form_id === formId);
  }

  public getUserFormsWithStatus(userId: number): FormWithStatus[] {
    const userSubmissions = this.submissions.filter(s => s.user_id === userId);
    return this.forms.map(form => {
      const sub = userSubmissions.find(s => s.form_id === form.id);
      return {
        ...form,
        status: sub ? sub.status : 'Not started',
        submissionId: sub ? sub.id : null,
        lastUpdated: sub ? sub.updated_at : undefined
      };
    });
  }

  public saveSubmission(
    formId: number,
    userId: number,
    action: 'draft' | 'submit',
    data: Record<string, any>
  ): { success: boolean; submission?: Submission; error?: string } {
    const form = this.getFormById(formId);
    if (!form) return { success: false, error: 'Form does not exist' };
    const user = this.getUserById(userId);
    const submitterName = user?.username || `user_${userId}`;

    if (action === 'submit') {
      for (const field of form.fields) {
        if (field.required) {
          const val = data[field.id.toString()];
          if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
            return {
              success: false,
              error: `Required field missing: "${field.field_label}"`
            };
          }
        }
      }
    }

    const now = new Date().toISOString();
    const existing = this.submissions.find(s => s.form_id === formId && s.user_id === userId);

    if (existing) {
      existing.status = action === 'submit' ? 'submitted' : 'draft';
      existing.data = data;
      existing.updated_at = now;
      if (action === 'submit') {
        existing.submitted_at = now;
      }
      this.persistSubmissions();

      if (action === 'submit') {
        // Alert Admin
        this.addNotification({
          user_id: 'admin',
          title: 'New Form Submission Received',
          message: `@${submitterName} submitted report for "${form.title}"`,
          type: 'submission',
          link_view: 'admin-submissions',
          link_id: existing.id
        });
        // Confirm to User
        this.addNotification({
          user_id: userId,
          title: 'Report Submitted Successfully',
          message: `Your report for "${form.title}" was safely delivered to Admin Biiroo Eegumsa Fayyaa.`,
          type: 'submission',
          link_view: 'my-submissions'
        });
      }

      return { success: true, submission: existing };
    } else {
      const newSubmission: Submission = {
        id: this.submissions.length ? Math.max(...this.submissions.map(s => s.id)) + 1 : 1,
        form_id: formId,
        user_id: userId,
        status: action === 'submit' ? 'submitted' : 'draft',
        data,
        submitted_at: action === 'submit' ? now : null,
        updated_at: now
      };
      this.submissions.unshift(newSubmission);
      this.persistSubmissions();

      if (action === 'submit') {
        this.addNotification({
          user_id: 'admin',
          title: 'New Form Submission Received',
          message: `@${submitterName} submitted report for "${form.title}"`,
          type: 'submission',
          link_view: 'admin-submissions',
          link_id: newSubmission.id
        });
        this.addNotification({
          user_id: userId,
          title: 'Report Submitted Successfully',
          message: `Your report for "${form.title}" was safely delivered to Admin Biiroo Eegumsa Fayyaa.`,
          type: 'submission',
          link_view: 'my-submissions'
        });
      }

      return { success: true, submission: newSubmission };
    }
  }

  public getUserSubmissions(userId: number): Submission[] {
    return this.submissions.filter(s => s.user_id === userId);
  }

  public updateSubmission(submissionId: number, updateData: Partial<Submission>): { success: boolean; submission?: Submission; error?: string } {
    const sub = this.submissions.find(s => s.id === submissionId);
    if (!sub) return { success: false, error: 'Submission not found' };
    Object.assign(sub, updateData, { updated_at: new Date().toISOString() });
    this.persistSubmissions();
    return { success: true, submission: sub };
  }

  public updateReviewerNotes(submissionId: number, notes: string): { success: boolean; submission?: Submission } {
    const sub = this.submissions.find(s => s.id === submissionId);
    if (!sub) return { success: false };
    sub.reviewer_notes = notes;
    sub.updated_at = new Date().toISOString();
    this.persistSubmissions();
    return { success: true, submission: sub };
  }

  public createSubmission(data: { form_id: number; user_id: number; data: Record<string, any>; status?: 'draft' | 'submitted' | 'pending'; notes?: string }): Submission {
    const newId = this.submissions.length ? Math.max(...this.submissions.map(s => s.id)) + 1 : 1;
    const now = new Date().toISOString();
    const newSubmission: Submission = {
      id: newId,
      form_id: data.form_id,
      user_id: data.user_id,
      status: (data.status === 'pending' || data.status === 'draft') ? 'draft' : 'submitted',
      data: data.data,
      submitted_at: now,
      updated_at: now,
      reviewer_notes: data.notes || undefined
    };
    this.submissions.unshift(newSubmission);
    this.persistSubmissions();

    const form = this.getFormById(data.form_id);
    const user = this.getUserById(data.user_id);
    const submitterName = user?.username || `user_${data.user_id}`;

    this.addNotification({
      user_id: 'admin',
      title: 'New Emergency Health Report Received',
      message: `@${submitterName} submitted an emergency report: "${form?.title || 'Health Report'}"`,
      type: 'submission',
      link_view: 'admin-submissions',
      link_id: newSubmission.id
    });

    return newSubmission;
  }

  public deleteSubmission(id: number): { success: boolean } {
    this.submissions = this.submissions.filter(s => s.id !== id);
    this.persistSubmissions();
    return { success: true };
  }

  // --- Admin Summaries ---

  public getAdminUserSummaries(): UserSummary[] {
    const regularUsers = this.users.filter(u => u.role === 'user');
    const totalFormsCount = this.forms.length;

    return regularUsers.map(user => {
      const userSubs = this.submissions.filter(s => s.user_id === user.id);
      const submittedForms = userSubs.filter(s => s.status === 'submitted').length;
      const draftCount = userSubs.filter(s => s.status === 'draft').length;

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        created_at: user.created_at,
        submittedForms,
        draftCount,
        totalAssigned: totalFormsCount
      };
    });
  }

  // --- Editable Table Template Operations ---

  public getTableTemplates(): EditableTableTemplate[] {
    return [...this.tableTemplates];
  }

  public getTableTemplateById(id: number): EditableTableTemplate | undefined {
    return this.tableTemplates.find(t => t.id === id);
  }

  public createTableTemplate(templateData: Omit<EditableTableTemplate, 'id' | 'created_at'>): EditableTableTemplate {
    const newId = this.tableTemplates.length ? Math.max(...this.tableTemplates.map(t => t.id)) + 1 : 1;
    
    const formattedColumns = templateData.columns.map((col, idx) => ({
      ...col,
      id: col.id || `col_${Date.now()}_${idx}`
    }));

    const newTemplate: EditableTableTemplate = {
      ...templateData,
      id: newId,
      created_at: new Date().toISOString(),
      columns: formattedColumns,
      assigned_to: templateData.assigned_to || 'all',
      allow_add_rows: templateData.allow_add_rows !== false
    };

    this.tableTemplates.unshift(newTemplate);
    this.persistTableTemplates();

    // Initialize starter user submissions for assigned users so they immediately appear in Master Excel and User Vault
    const regularStaff = this.users.filter(u => u.role === 'user');
    const targetUsers = templateData.assigned_to === 'all' 
      ? regularStaff 
      : regularStaff.filter(u => templateData.assigned_user_ids?.includes(u.id));

    const now = new Date().toISOString();
    targetUsers.forEach((staffUser, userIdx) => {
      let initialRows: TableRowData[] = [];
      if (templateData.default_rows && templateData.default_rows.length > 0) {
        initialRows = JSON.parse(JSON.stringify(templateData.default_rows)).map((r: any) => ({
          ...r,
          username: staffUser.username
        }));
      } else {
        const starterRow: TableRowData = { username: staffUser.username };
        formattedColumns.forEach(c => {
          if (c.type === 'number' || c.type === 'currency') {
            starterRow[c.id] = 0;
          } else if (c.type === 'status') {
            starterRow[c.id] = c.options?.[0] || 'Active';
          } else if (c.id === 'col_facility') {
            starterRow[c.id] = `${staffUser.full_name || staffUser.username} Health Center`;
          } else {
            starterRow[c.id] = c.defaultValue || '';
          }
        });
        initialRows = [starterRow];
      }

      const newSubId = this.tableSubmissions.length ? Math.max(...this.tableSubmissions.map(s => s.id)) + 1 : 1;
      this.tableSubmissions.unshift({
        id: newSubId + userIdx + 1,
        table_id: newId,
        user_id: staffUser.id,
        status: 'draft',
        rows: initialRows,
        submitted_at: now,
        updated_at: now
      });
    });

    this.persistTableSubmissions();

    // Alert assigned users
    const targetUserId = templateData.assigned_to === 'all' ? 'all' : (templateData.assigned_user_ids?.[0] || 'all');
    this.addNotification({
      user_id: targetUserId,
      title: 'New Table Form Assigned',
      message: `Admin Biiroo Eegumsa Fayyaa assigned table "${newTemplate.title}" to you.`,
      type: 'assignment',
      link_view: 'user-table-fill',
      link_id: newId
    });

    return newTemplate;
  }

  public updateTableTemplate(tableId: number, updateData: Partial<EditableTableTemplate>): { success: boolean; template?: EditableTableTemplate; error?: string } {
    const idx = this.tableTemplates.findIndex(t => t.id === tableId);
    if (idx === -1) return { success: false, error: 'Table template not found' };

    this.tableTemplates[idx] = {
      ...this.tableTemplates[idx],
      ...updateData,
      updated_at: new Date().toISOString()
    };

    this.persistTableTemplates();
    return { success: true, template: this.tableTemplates[idx] };
  }

  public deleteTableTemplate(tableId: number): { success: boolean; error?: string } {
    this.tableTemplates = this.tableTemplates.filter(t => t.id !== tableId);
    this.tableSubmissions = this.tableSubmissions.filter(s => s.table_id !== tableId);
    this.persistTableTemplates();
    this.persistTableSubmissions();
    return { success: true };
  }

  // --- Editable Table Submissions Operations (Isolated by User ID) ---

  public getTableSubmissions(): UserTableSubmission[] {
    return [...this.tableSubmissions];
  }

  public getTableSubmissionById(id: number): UserTableSubmission | undefined {
    return this.tableSubmissions.find(s => s.id === id);
  }

  public getTableSubmissionForUserAndTable(userId: number, tableId: number): UserTableSubmission | undefined {
    return this.tableSubmissions.find(s => s.user_id === userId && s.table_id === tableId);
  }

  public getUserAssignedTablesWithStatus(userId: number): TableWithStatus[] {
    const user = this.getUserById(userId);
    if (!user) return [];

    const userSubs = this.tableSubmissions.filter(s => s.user_id === userId);

    const eligibleTemplates = this.tableTemplates.filter(tpl => {
      if (user.role === 'admin') return true;
      if (tpl.assigned_to === 'all') return true;
      if (tpl.assigned_to === 'specific_users' && tpl.assigned_user_ids?.includes(userId)) return true;
      return false;
    });

    return eligibleTemplates.map(tpl => {
      const sub = userSubs.find(s => s.table_id === tpl.id);
      return {
        ...tpl,
        status: sub ? sub.status : 'Not started',
        submissionId: sub ? sub.id : null,
        lastUpdated: sub ? sub.updated_at : undefined,
        rowCount: sub ? sub.rows.length : (tpl.default_rows?.length || 0),
        submitted_at: sub?.submitted_at
      };
    });
  }

  public saveTableSubmission(
    tableId: number,
    userId: number,
    action: 'draft' | 'submit',
    rows: TableRowData[],
    user_notes?: string
  ): { success: boolean; submission?: UserTableSubmission; error?: string } {
    const table = this.getTableTemplateById(tableId);
    if (!table) return { success: false, error: 'Table template does not exist' };
    const user = this.getUserById(userId);
    const submitterUsername = user?.username || `user_${userId}`;

    if (action === 'submit') {
      if (rows.length === 0 && (table.min_rows || 1) > 0) {
        return { success: false, error: 'Please add at least one row to the table before submitting.' };
      }

      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        const row = rows[rIdx];
        for (const col of table.columns) {
          if (col.required) {
            const val = row[col.id];
            if (val === undefined || val === null || val === '') {
              return {
                success: false,
                error: `Row #${rIdx + 1}: Required column "${col.label}" cannot be empty.`
              };
            }
          }
        }
      }
    }

    const now = new Date().toISOString();
    const processedRows = rows.map(r => ({
      ...r,
      username: r.username || submitterUsername
    }));

    const existing = this.tableSubmissions.find(s => s.table_id === tableId && s.user_id === userId);

    if (existing) {
      existing.status = action === 'submit' ? 'submitted' : 'draft';
      existing.rows = processedRows;
      existing.user_notes = user_notes !== undefined ? user_notes : existing.user_notes;
      existing.updated_at = now;
      if (action === 'submit') {
        existing.submitted_at = now;
      }
      this.persistTableSubmissions();

      if (action === 'submit') {
        this.addNotification({
          user_id: 'admin',
          title: 'New Table Submission Received',
          message: `@${submitterUsername} submitted filled table "${table.title}" (${processedRows.length} rows)`,
          type: 'submission',
          link_view: 'admin-dashboard'
        });
        this.addNotification({
          user_id: userId,
          title: 'Table Data Submitted',
          message: `Your table data for "${table.title}" was saved and synced to Admin Biiroo Eegumsa Fayyaa.`,
          type: 'submission',
          link_view: 'user-table-fill',
          link_id: tableId
        });
      }

      return { success: true, submission: existing };
    } else {
      const newSubmission: UserTableSubmission = {
        id: this.tableSubmissions.length ? Math.max(...this.tableSubmissions.map(s => s.id)) + 1 : 1,
        table_id: tableId,
        user_id: userId,
        status: action === 'submit' ? 'submitted' : 'draft',
        rows: processedRows,
        user_notes: user_notes || '',
        submitted_at: action === 'submit' ? now : null,
        updated_at: now
      };
      this.tableSubmissions.unshift(newSubmission);
      this.persistTableSubmissions();

      if (action === 'submit') {
        this.addNotification({
          user_id: 'admin',
          title: 'New Table Submission Received',
          message: `@${submitterUsername} submitted filled table "${table.title}" (${processedRows.length} rows)`,
          type: 'submission',
          link_view: 'admin-dashboard'
        });
        this.addNotification({
          user_id: userId,
          title: 'Table Data Submitted',
          message: `Your table data for "${table.title}" was saved and synced to Admin Biiroo Eegumsa Fayyaa.`,
          type: 'submission',
          link_view: 'user-table-fill',
          link_id: tableId
        });
      }

      return { success: true, submission: newSubmission };
    }
  }

  public updateTableReviewerFeedback(
    submissionId: number, 
    feedback: { reviewer_notes?: string; reviewer_status?: 'pending' | 'approved' | 'needs_revision' }
  ): { success: boolean; submission?: UserTableSubmission; error?: string } {
    const sub = this.tableSubmissions.find(s => s.id === submissionId);
    if (!sub) return { success: false, error: 'Table submission not found' };

    if (feedback.reviewer_notes !== undefined) {
      sub.reviewer_notes = feedback.reviewer_notes;
    }
    if (feedback.reviewer_status !== undefined) {
      sub.reviewer_status = feedback.reviewer_status;
    }
    sub.updated_at = new Date().toISOString();
    this.persistTableSubmissions();

    // Alert User
    const table = this.getTableTemplateById(sub.table_id);
    this.addNotification({
      user_id: sub.user_id,
      title: `Table Status Updated: ${feedback.reviewer_status || 'Reviewed'}`,
      message: `Admin Biiroo Eegumsa Fayyaa reviewed your submission for "${table?.title || 'Table'}".`,
      type: 'alert',
      link_view: 'user-table-fill',
      link_id: sub.table_id
    });

    return { success: true, submission: sub };
  }

  public deleteTableSubmission(id: number): { success: boolean } {
    this.tableSubmissions = this.tableSubmissions.filter(s => s.id !== id);
    this.persistTableSubmissions();
    return { success: true };
  }

  public updateSubmissionCell(
    tableId: number, 
    userId: number, 
    rowIndex: number, 
    columnId: string, 
    newValue: any
  ): { success: boolean; submission?: UserTableSubmission; error?: string } {
    const user = this.getUserById(userId);
    const submitterUsername = user?.username || `user_${userId}`;

    let sub = this.tableSubmissions.find(s => s.table_id === tableId && s.user_id === userId);
    if (!sub) {
      const rows: TableRowData[] = [];
      for (let i = 0; i <= rowIndex; i++) {
        rows.push(i === rowIndex ? { [columnId]: newValue, username: submitterUsername } : { username: submitterUsername });
      }
      return this.saveTableSubmission(tableId, userId, 'submit', rows);
    }

    const rows = [...(sub.rows || [])];
    while (rows.length <= rowIndex) {
      rows.push({ username: submitterUsername });
    }
    rows[rowIndex] = {
      ...rows[rowIndex],
      username: rows[rowIndex].username || submitterUsername,
      [columnId]: newValue
    };

    sub.rows = rows;
    sub.updated_at = new Date().toISOString();
    this.persistTableSubmissions();
    return { success: true, submission: sub };
  }

  public reassignSubmissionRowUser(
    tableId: number,
    currentUserId: number,
    rowIndex: number,
    newUserId: number
  ): { success: boolean; error?: string } {
    if (currentUserId === newUserId) return { success: true };
    const currentSub = this.tableSubmissions.find(s => s.table_id === tableId && s.user_id === currentUserId);
    if (!currentSub || !currentSub.rows || !currentSub.rows[rowIndex]) {
      return { success: false, error: 'Row not found' };
    }

    const targetUser = this.getUserById(newUserId);
    const targetUsername = targetUser?.username || `user_${newUserId}`;

    const rowToMove = { ...currentSub.rows[rowIndex], username: targetUsername };
    
    currentSub.rows.splice(rowIndex, 1);
    currentSub.updated_at = new Date().toISOString();

    const targetSub = this.tableSubmissions.find(s => s.table_id === tableId && s.user_id === newUserId);
    if (targetSub) {
      targetSub.rows.push(rowToMove);
      targetSub.updated_at = new Date().toISOString();
    } else {
      this.tableSubmissions.unshift({
        id: this.tableSubmissions.length ? Math.max(...this.tableSubmissions.map(s => s.id)) + 1 : 1,
        table_id: tableId,
        user_id: newUserId,
        status: 'submitted',
        rows: [rowToMove],
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    this.persistTableSubmissions();
    return { success: true };
  }

  public deleteSubmissionRow(
    tableId: number,
    userId: number,
    rowIndex: number
  ): { success: boolean; error?: string } {
    const sub = this.tableSubmissions.find(s => s.table_id === tableId && s.user_id === userId);
    if (!sub || !sub.rows || !sub.rows[rowIndex]) {
      return { success: false, error: 'Row not found' };
    }

    sub.rows.splice(rowIndex, 1);
    sub.updated_at = new Date().toISOString();
    this.persistTableSubmissions();
    return { success: true };
  }

  public addSubmissionRow(
    tableId: number,
    userId: number,
    newRowData: TableRowData = {}
  ): { success: boolean; submission?: UserTableSubmission; error?: string } {
    const user = this.getUserById(userId);
    const submitterUsername = user?.username || `user_${userId}`;
    const rowWithUsername = { ...newRowData, username: newRowData.username || submitterUsername };

    const sub = this.tableSubmissions.find(s => s.table_id === tableId && s.user_id === userId);
    if (!sub) {
      const newSub: UserTableSubmission = {
        id: this.tableSubmissions.length ? Math.max(...this.tableSubmissions.map(s => s.id)) + 1 : 1,
        table_id: tableId,
        user_id: userId,
        status: 'submitted',
        rows: [rowWithUsername],
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.tableSubmissions.unshift(newSub);
      this.persistTableSubmissions();
      return { success: true, submission: newSub };
    }

    sub.rows.push(rowWithUsername);
    sub.updated_at = new Date().toISOString();
    this.persistTableSubmissions();
    return { success: true, submission: sub };
  }

  public updateTableColumnHeader(
    tableId: number,
    columnId: string,
    newLabel: string
  ): { success: boolean; template?: EditableTableTemplate; error?: string } {
    return this.updateTableColumn(tableId, columnId, { label: newLabel });
  }

  public updateTableColumn(
    tableId: number,
    columnId: string,
    updates: Partial<TableColumn>
  ): { success: boolean; template?: EditableTableTemplate; error?: string } {
    const tpl = this.tableTemplates.find(t => t.id === tableId);
    if (!tpl) return { success: false, error: 'Table not found' };
    
    const col = tpl.columns.find(c => c.id === columnId);
    if (!col) return { success: false, error: 'Column not found' };

    Object.assign(col, updates);
    tpl.updated_at = new Date().toISOString();
    this.persistTableTemplates();
    return { success: true, template: tpl };
  }

  public addColumnToTemplate(
    tableId: number,
    columnData: Partial<TableColumn>
  ): { success: boolean; template?: EditableTableTemplate; column?: TableColumn; error?: string } {
    const tpl = this.tableTemplates.find(t => t.id === tableId);
    if (!tpl) return { success: false, error: 'Table not found' };

    const cleanLabel = (columnData.label || 'New Column').trim();
    const cleanId = columnData.id || `col_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newCol: TableColumn = {
      id: cleanId,
      label: cleanLabel,
      type: columnData.type || 'number',
      required: columnData.required || false,
      summary: columnData.summary || (columnData.type === 'number' || columnData.type === 'currency' ? 'sum' : 'none'),
      placeholder: columnData.placeholder || '-',
      options: columnData.options,
      align: columnData.align || (columnData.type === 'number' || columnData.type === 'currency' ? 'right' : 'left')
    };

    tpl.columns.push(newCol);
    tpl.updated_at = new Date().toISOString();
    this.persistTableTemplates();

    return { success: true, template: tpl, column: newCol };
  }

  public deleteColumnFromTemplate(
    tableId: number,
    columnId: string
  ): { success: boolean; template?: EditableTableTemplate; error?: string } {
    const tpl = this.tableTemplates.find(t => t.id === tableId);
    if (!tpl) return { success: false, error: 'Table not found' };

    if (tpl.columns.length <= 1) {
      return { success: false, error: 'A table must have at least one column' };
    }

    tpl.columns = tpl.columns.filter(c => c.id !== columnId);
    tpl.updated_at = new Date().toISOString();

    // Clean up data in submissions for this column
    this.tableSubmissions.forEach(sub => {
      if (sub.table_id === tableId && sub.rows) {
        sub.rows.forEach(r => {
          delete r[columnId];
        });
      }
    });

    this.persistTableTemplates();
    this.persistTableSubmissions();

    return { success: true, template: tpl };
  }

  public generateTableFillUrl(tableId: number, username?: string): string {
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost:3000';
    const pathname = typeof window !== 'undefined' && window.location ? window.location.pathname : '/';
    const baseUrl = `${origin}${pathname}`;
    const params = new URLSearchParams();
    params.set('table', tableId.toString());
    if (username) {
      params.set('u', username);
    }
    return `${baseUrl}?${params.toString()}`;
  }
}

export const storageService = new StorageService();
