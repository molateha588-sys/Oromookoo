export type UserRole = 'admin' | 'user';

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  reset_code?: string | null;
  reset_expires?: number | null;
  created_at: string;
  avatar_color?: string;
  phone?: string;
  full_name?: string;
}

export type FormFieldType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'select' 
  | 'radio' 
  | 'checkbox' 
  | 'date'
  | 'rating';

export interface FormField {
  id: number;
  form_id: number;
  field_label: string;
  field_type: FormFieldType;
  required: boolean | number;
  order_index: number;
  placeholder?: string;
  help_text?: string;
  options?: string[]; // for select, radio, checkbox
  default_value?: string;
}

export interface Form {
  id: number;
  title: string;
  description?: string;
  category?: string;
  created_at: string;
  updated_at?: string;
  fields: FormField[];
  due_date?: string;
}

export type SubmissionStatus = 'draft' | 'pending' | 'submitted' | 'verified' | 'rejected' | 'approved';

export interface Submission {
  id: number;
  form_id: number;
  user_id: number;
  status: SubmissionStatus;
  data: Record<string, any>; // mapping of field.id -> answer
  submitted_at: string | null;
  updated_at: string;
  reviewer_notes?: string;
}

export interface FormWithStatus extends Form {
  status: 'Not started' | SubmissionStatus;
  submissionId: number | null;
  lastUpdated?: string;
}

export interface UserSummary {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  created_at: string;
  submittedForms: number;
  draftCount: number;
  totalAssigned?: number;
  full_name?: string;
}

export interface NotificationItem {
  id: string;
  user_id: number | 'all' | 'admin';
  title: string;
  message: string;
  type: 'submission' | 'assignment' | 'alert' | 'system';
  read: boolean;
  created_at: string;
  link_view?: string;
  link_id?: number;
}

export type TableColumnType = 
  | 'text' 
  | 'number' 
  | 'currency' 
  | 'date' 
  | 'select' 
  | 'checkbox' 
  | 'status';

export interface TableStyleConfig {
  fontFamily?: string;
  fontSize?: string;
  textColor?: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  headerBgColor?: string;
  headerTextColor?: string;
  showTableTitleBanner?: boolean;
  tableNameInHeader?: string;
  titleBannerBgColor?: string;
  titleBannerTextColor?: string;
  titleBannerFontSize?: string;
  titleBannerAlignment?: 'left' | 'center' | 'right';
  titleBannerBold?: boolean;
  titleBannerItalic?: boolean;
  borderColor?: string;
}

export interface TableColumn {
  id: string;
  label: string;
  type: TableColumnType;
  required?: boolean;
  placeholder?: string;
  options?: string[]; // for select / status
  width?: string;
  summary?: 'none' | 'sum' | 'avg' | 'count';
  defaultValue?: any;
  textColor?: string;
  isBold?: boolean;
  isItalic?: boolean;
  align?: 'left' | 'center' | 'right';
}

export type TableRowData = Record<string, any>;

export interface EditableTableTemplate {
  id: number;
  title: string;
  description: string;
  instructions?: string;
  category: string;
  due_date?: string;
  created_at: string;
  updated_at?: string;
  columns: TableColumn[];
  default_rows?: TableRowData[];
  assigned_to: 'all' | 'specific_users';
  assigned_user_ids?: number[]; // Target assigned user IDs
  allow_add_rows?: boolean;
  min_rows?: number;
  max_rows?: number;
  styling?: TableStyleConfig;
}

export interface UserTableSubmission {
  id: number;
  table_id: number;
  user_id: number; // Stored strictly by user's respective User ID
  status: 'draft' | 'submitted';
  rows: TableRowData[];
  user_notes?: string;
  submitted_at: string | null;
  updated_at: string;
  reviewer_notes?: string;
  reviewer_status?: 'pending' | 'approved' | 'needs_revision';
}

export interface TableWithStatus extends EditableTableTemplate {
  status: 'Not started' | 'draft' | 'submitted';
  submissionId: number | null;
  lastUpdated?: string;
  rowCount?: number;
  submitted_at?: string | null;
}


