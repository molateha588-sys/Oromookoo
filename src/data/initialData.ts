import { User, Form, Submission, EditableTableTemplate, UserTableSubmission } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 1,
    username: 'admin',
    email: 'sinbon636@gmail.com',
    password_hash: 'admin123',
    role: 'admin',
    full_name: 'Admin Biiroo Eegumsa Fayyaa',
    avatar_color: '#005a9e',
    created_at: '2026-01-10T09:00:00.000Z'
  },
  {
    id: 2,
    username: 'alex_smith',
    email: 'alex.smith@company.org',
    password_hash: 'user123',
    role: 'user',
    full_name: 'Alex Smith',
    avatar_color: '#0EA5E9',
    created_at: '2026-02-01T10:30:00.000Z'
  },
  {
    id: 3,
    username: 'sarah_connor',
    email: 'sarah.c@company.org',
    password_hash: 'user123',
    role: 'user',
    full_name: 'Sarah Connor',
    avatar_color: '#10B981',
    created_at: '2026-02-14T14:15:00.000Z'
  }
];

export const INITIAL_FORMS: Form[] = [
  {
    id: 1,
    title: 'Gabaasa Hojii Biiroo Eegumsa Fayyaa (Weekly Health Report)',
    description: 'Provide an overview of health activities completed, community outreach results, and key priorities for Biiroo Eegumsa Fayyaa.',
    category: 'Eegumsa Fayyaa',
    due_date: 'Every Friday 5:00 PM',
    created_at: '2026-02-10T08:00:00.000Z',
    fields: [
      {
        id: 101,
        form_id: 1,
        field_label: 'Health Activity / Initiative Name',
        field_type: 'text',
        required: true,
        order_index: 1,
        placeholder: 'e.g. Immunization & Child Health Outreach'
      },
      {
        id: 102,
        form_id: 1,
        field_label: 'Current Operational Status',
        field_type: 'select',
        required: true,
        order_index: 2,
        options: ['Completed', 'In Progress', 'Scheduled', 'Needs Attention'],
        default_value: 'In Progress'
      },
      {
        id: 103,
        form_id: 1,
        field_label: 'Summary of Achievements & Patients Served',
        field_type: 'textarea',
        required: true,
        order_index: 3,
        placeholder: 'Detail specific health milestones, patient metrics, or community sessions...'
      },
      {
        id: 104,
        form_id: 1,
        field_label: 'Total Beneficiaries / Cases Handled',
        field_type: 'number',
        required: true,
        order_index: 4,
        placeholder: 'e.g. 150'
      },
      {
        id: 105,
        form_id: 1,
        field_label: 'Operational Challenges or Resource Requests',
        field_type: 'textarea',
        required: false,
        order_index: 5,
        placeholder: 'Detail any medical supply shortages, transportation needs, or escalation requirements...'
      }
    ]
  }
];

export const INITIAL_TABLE_TEMPLATES: EditableTableTemplate[] = [
  {
    id: 1,
    title: 'Gabatee Hojii Biiroo Eegumsa Fayyaa (Master Surveillance Table)',
    description: 'Official master table for tracking Total Case, P.V (Plasmodium Vivax), P.F (Plasmodium Falciparum), and Total confirmed cases across health facilities.',
    instructions: 'Fill all case columns accurately. Enter Total case, P.V, P.F, and Total for each health facility name. Changes are autosaved and automatically linked to your username.',
    category: 'Eegumsa Fayyaa',
    due_date: 'Weekly Sync',
    created_at: '2026-03-01T08:00:00.000Z',
    assigned_to: 'all',
    allow_add_rows: true,
    min_rows: 1,
    max_rows: 50,
    columns: [
      {
        id: 'col_facility',
        label: 'Health Facility / Station Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. Adama Health Center',
        width: '240px',
        align: 'left'
      },
      {
        id: 'col_total_cases',
        label: 'Total case',
        type: 'number',
        required: true,
        placeholder: '0',
        width: '140px',
        summary: 'sum',
        align: 'right'
      },
      {
        id: 'col_pv',
        label: 'P.V',
        type: 'number',
        required: true,
        placeholder: '0',
        width: '120px',
        summary: 'sum',
        align: 'right'
      },
      {
        id: 'col_pf',
        label: 'P.F',
        type: 'number',
        required: true,
        placeholder: '0',
        width: '120px',
        summary: 'sum',
        align: 'right'
      },
      {
        id: 'col_total',
        label: 'Total',
        type: 'number',
        required: true,
        placeholder: '0',
        width: '130px',
        summary: 'sum',
        align: 'right'
      },
      {
        id: 'col_date',
        label: 'Report Date',
        type: 'date',
        required: true,
        width: '140px',
        align: 'center'
      },
      {
        id: 'col_status',
        label: 'Status',
        type: 'status',
        required: true,
        options: ['Confirmed', 'Under Review', 'Draft', 'Action Required'],
        defaultValue: 'Confirmed',
        width: '150px',
        align: 'center'
      },
      {
        id: 'col_remarks',
        label: 'Remarks / Field Notes',
        type: 'text',
        required: false,
        placeholder: 'Additional observations...',
        width: '240px',
        align: 'left'
      }
    ],
    default_rows: [],
    styling: {
      headerBgColor: '#005a9e',
      headerTextColor: '#ffffff',
      showTableTitleBanner: true,
      tableNameInHeader: 'Biiroo Eegumsa Fayyaa - Master Case Surveillance Table',
      titleBannerBgColor: '#0b7285',
      titleBannerTextColor: '#ffffff',
      titleBannerFontSize: '16px',
      titleBannerAlignment: 'left',
      titleBannerBold: true
    }
  }
];

export const INITIAL_SUBMISSIONS: Submission[] = [];

export const INITIAL_TABLE_SUBMISSIONS: UserTableSubmission[] = [
  {
    id: 1,
    table_id: 1,
    user_id: 2,
    status: 'submitted',
    submitted_at: '2026-03-02T10:00:00.000Z',
    updated_at: '2026-03-05T14:30:00.000Z',
    rows: [
      {
        username: 'alex_smith',
        col_facility: 'Adama Health Center',
        col_total_cases: 120,
        col_pv: 45,
        col_pf: 75,
        col_total: 120,
        col_date: '2026-03-02',
        col_status: 'Confirmed',
        col_remarks: 'Complete diagnostic screening performed'
      },
      {
        username: 'alex_smith',
        col_facility: 'Bishoftu Hospital',
        col_total_cases: 95,
        col_pv: 30,
        col_pf: 65,
        col_total: 95,
        col_date: '2026-03-03',
        col_status: 'Confirmed',
        col_remarks: 'Outpatient laboratory verified'
      },
      {
        username: 'alex_smith',
        col_facility: 'Mojo Clinic',
        col_total_cases: 60,
        col_pv: 22,
        col_pf: 38,
        col_total: 60,
        col_date: '2026-03-04',
        col_status: 'Confirmed',
        col_remarks: 'All patients received treatment'
      }
    ]
  },
  {
    id: 2,
    table_id: 1,
    user_id: 3,
    status: 'submitted',
    submitted_at: '2026-03-03T11:00:00.000Z',
    updated_at: '2026-03-06T09:15:00.000Z',
    rows: [
      {
        username: 'sarah_connor',
        col_facility: 'Shashemene Referral Center',
        col_total_cases: 140,
        col_pv: 55,
        col_pf: 85,
        col_total: 140,
        col_date: '2026-03-03',
        col_status: 'Confirmed',
        col_remarks: 'Epidemic zone surveillance active'
      },
      {
        username: 'sarah_connor',
        col_facility: 'Hawassa District Post',
        col_total_cases: 80,
        col_pv: 28,
        col_pf: 52,
        col_total: 80,
        col_date: '2026-03-05',
        col_status: 'Confirmed',
        col_remarks: 'RDT and Microscopy matched'
      }
    ]
  }
];
