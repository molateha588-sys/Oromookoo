import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Search, 
  RefreshCw, 
  Layers, 
  Table as TableIcon, 
  Printer, 
  Edit3, 
  Palette, 
  Type, 
  Bold, 
  Italic, 
  Underline, 
  Calculator,
  UserCheck,
  FolderSync,
  TrendingUp,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  Save,
  SlidersHorizontal,
  MoveHorizontal,
  X,
  Link2
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { User, EditableTableTemplate, UserTableSubmission, TableRowData, TableStyleConfig, TableColumn } from '../../types';
import { exportMasterExcelWorkbook, exportTableByTitleExcel } from '../../utils/excelExport';
import { UserLoginLinksModal } from './UserLoginLinksModal';

interface AdminMasterExcelViewProps {
  onNavigateToUserVault?: (userId?: number) => void;
  onNavigateToTables?: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

const FONT_OPTIONS = [
  { label: 'Segoe UI', value: 'Segoe UI, -apple-system, BlinkMacSystemFont, sans-serif' },
  { label: 'Calibri', value: 'Calibri, Candara, Segoe, Segoe UI, Optima, Arial, sans-serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' }
];

const BANNER_THEMES = [
  { name: 'Emerald Excel', bg: '#047857', text: '#ffffff' },
  { name: 'Slate Dark', bg: '#0f172a', text: '#ffffff' },
  { name: 'Royal Navy', bg: '#1e3a8a', text: '#ffffff' },
  { name: 'Deep Indigo', bg: '#3730a3', text: '#ffffff' },
  { name: 'Crimson Burgundy', bg: '#991b1b', text: '#ffffff' },
  { name: 'Warm Amber', bg: '#92400e', text: '#ffffff' }
];

export const AdminMasterExcelView: React.FC<AdminMasterExcelViewProps> = ({
  onNavigateToUserVault,
  onNavigateToTables,
  onShowToast
}) => {
  const [users, setUsers] = useState<User[]>(storageService.getUsers());
  const [templates, setTemplates] = useState<EditableTableTemplate[]>(storageService.getTableTemplates());
  const [submissions, setSubmissions] = useState<UserTableSubmission[]>(storageService.getTableSubmissions());

  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTableId, setActiveTableId] = useState<number | 'all'>('all');
  const [selectedUsernameFilter, setSelectedUsernameFilter] = useState<string>('all');
  
  // Table Ordering (Order tables by Title A-Z, Title Z-A, or Submissions count)
  const [tableOrderSort, setTableOrderSort] = useState<'title_asc' | 'title_desc' | 'submissions_desc' | 'id_asc'>('title_asc');

  // Editing / Cell focus tracking
  const [editingCellKey, setEditingCellKey] = useState<string | null>(null);
  const [lastSavedNotice, setLastSavedNotice] = useState<string | null>(null);

  // Column Header Editing Modal
  const [editingColumnState, setEditingColumnState] = useState<{ tableId: number; column: TableColumn } | null>(null);
  const [tempColumnLabel, setTempColumnLabel] = useState('');

  // Add Row Modal / State
  const [addingRowForTableId, setAddingRowForTableId] = useState<number | null>(null);
  const [newRowTargetUserId, setNewRowTargetUserId] = useState<number | null>(null);

  // Master Excel Form Styling Controls
  const [masterStyling, setMasterStyling] = useState<TableStyleConfig>({
    fontFamily: 'Segoe UI, sans-serif',
    fontSize: '12px',
    textColor: '#0f172a',
    isBold: false,
    isItalic: false,
    isUnderline: false,
    headerBgColor: '#0f172a',
    headerTextColor: '#ffffff',
    showTableTitleBanner: true,
    titleBannerBgColor: '#047857',
    titleBannerTextColor: '#ffffff',
    titleBannerFontSize: '15px',
    titleBannerAlignment: 'left',
    titleBannerBold: true,
    titleBannerItalic: false
  });

  // Editing banner title modal
  const [editingTemplateBannerId, setEditingTemplateBannerId] = useState<number | null>(null);
  const [customBannerTitle, setCustomBannerTitle] = useState('');
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);

  // Quick Create New Table modal
  const [isCreateMasterTableModalOpen, setIsCreateMasterTableModalOpen] = useState(false);
  const [newMasterTableTitle, setNewMasterTableTitle] = useState('');
  const [newMasterTableCategory, setNewMasterTableCategory] = useState('Malaria Surveillance');
  const [newMasterTableDesc, setNewMasterTableDesc] = useState('');

  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      setUsers(storageService.getUsers());
      setTemplates(storageService.getTableTemplates());
      setSubmissions(storageService.getTableSubmissions());
    });
    return unsubscribe;
  }, []);

  const handleCreateMasterTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMasterTableTitle.trim()) {
      onShowToast('Title Required', 'Please specify a title for the new Master Excel table.', 'error');
      return;
    }

    const defaultCols: TableColumn[] = [
      { id: 'col_facility', label: 'Health Facility / Site', type: 'text', required: true, align: 'left' },
      { id: 'col_total_cases', label: 'Total case', type: 'number', summary: 'sum', required: true, align: 'right' },
      { id: 'col_pv', label: 'P.V', type: 'number', summary: 'sum', required: true, align: 'right' },
      { id: 'col_pf', label: 'P.F', type: 'number', summary: 'sum', required: true, align: 'right' },
      { id: 'col_total', label: 'Total', type: 'number', summary: 'sum', required: true, align: 'right' }
    ];

    const newTable = storageService.createTableTemplate({
      title: newMasterTableTitle.trim(),
      category: newMasterTableCategory.trim() || 'Public Health',
      description: newMasterTableDesc.trim() || 'Master surveillance spreadsheet',
      columns: defaultCols,
      assigned_to: 'all',
      styling: {
        headerBgColor: '#047857',
        headerTextColor: '#ffffff',
        showTableTitleBanner: true,
        titleBannerBgColor: '#047857'
      }
    });

    if (newTable && newTable.id) {
      setTemplates(storageService.getTableTemplates());
      setSubmissions(storageService.getTableSubmissions());
      setActiveTableId(newTable.id);
      setIsCreateMasterTableModalOpen(false);
      setNewMasterTableTitle('');
      setNewMasterTableDesc('');
      onShowToast('Excel Table Created', `New table "${newTable.title}" created with starter data for all staff.`, 'success');
    } else {
      onShowToast('Creation Failed', 'Could not create spreadsheet table.', 'error');
    }
  };

  const refreshData = () => {
    setUsers(storageService.getUsers());
    setTemplates(storageService.getTableTemplates());
    setSubmissions(storageService.getTableSubmissions());
    onShowToast('Data Refreshed', 'All user data auto-saved by assigned username synchronized.', 'info');
  };

  // Distinct Staff Usernames
  const staffUsers = useMemo(() => {
    return users.filter(u => u.role === 'user').sort((a, b) => a.username.localeCompare(b.username));
  }, [users]);

  // Order templates according to Title / Sorting preference
  const sortedTemplates = useMemo(() => {
    const list = [...templates];
    list.sort((a, b) => {
      if (tableOrderSort === 'title_asc') {
        return a.title.localeCompare(b.title);
      } else if (tableOrderSort === 'title_desc') {
        return b.title.localeCompare(a.title);
      } else if (tableOrderSort === 'submissions_desc') {
        const countA = submissions.filter(s => s.table_id === a.id && s.status === 'submitted').length;
        const countB = submissions.filter(s => s.table_id === b.id && s.status === 'submitted').length;
        return countB - countA;
      } else {
        return a.id - b.id;
      }
    });
    return list;
  }, [templates, tableOrderSort, submissions]);

  // Build isolated data for EACH table title: ONLY Username + Data Sent, Auto-Saved by Assigned Username
  const separatedTablesData = useMemo(() => {
    return sortedTemplates.map(template => {
      // Find all submissions for THIS table template only
      let tableSubs = submissions.filter(s => s.table_id === template.id);

      // Filter by selected Username if chosen
      if (selectedUsernameFilter !== 'all') {
        const targetUser = users.find(u => u.username === selectedUsernameFilter);
        if (targetUser) {
          tableSubs = tableSubs.filter(s => s.user_id === targetUser.id);
        }
      }

      // Group and sort data rows by Assigned Username
      const userSections: Array<{
        username: string;
        user: User;
        rows: TableRowData[];
      }> = [];

      // Sort submissions alphabetically by assigned username
      const sortedSubs = [...tableSubs].sort((a, b) => {
        const uA = users.find(u => u.id === a.user_id)?.username || '';
        const uB = users.find(u => u.id === b.user_id)?.username || '';
        return uA.localeCompare(uB);
      });

      let totalRowsForTable = 0;

      sortedSubs.forEach(sub => {
        const user = users.find(u => u.id === sub.user_id);
        if (!user) return;

        let rows = sub.rows || [];

        // Text search matching on username or data sent cell values
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const usernameMatches = user.username.toLowerCase().includes(term);

          if (!usernameMatches) {
            rows = rows.filter(r => 
              Object.values(r).some(val => String(val).toLowerCase().includes(term))
            );
          }
        }

        if (rows.length > 0 || !searchTerm.trim()) {
          userSections.push({
            username: user.username,
            user,
            rows: rows.length > 0 ? rows : [{}]
          });

          totalRowsForTable += (rows.length > 0 ? rows.length : 1);
        }
      });

      // Calculate PROGRESSIVE TOTALS for each data column
      const columnProgressiveTotals: Record<string, { sum: number; count: number; isNumeric: boolean }> = {};
      
      template.columns.forEach(col => {
        let sum = 0;
        let count = 0;
        let hasNumeric = false;

        userSections.forEach(section => {
          section.rows.forEach(r => {
            const rawVal = r[col.id];
            if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
              count++;
              const num = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal).replace(/[^0-9.-]/g, ''));
              if (!isNaN(num)) {
                sum += num;
                hasNumeric = true;
              }
            }
          });
        });

        columnProgressiveTotals[col.id] = {
          sum,
          count,
          isNumeric: hasNumeric && (col.type === 'number' || col.type === 'currency' || col.summary === 'sum' || col.summary === 'avg')
        };
      });

      // Flat list of rows with running progressive sums attached
      const flattenedRowsWithProgressive: Array<{
        username: string;
        user: User;
        row: TableRowData;
        rowIndexInUser: number;
        runningCumulative: Record<string, number>;
      }> = [];

      const currentRunningSum: Record<string, number> = {};
      template.columns.forEach(c => { currentRunningSum[c.id] = 0; });

      userSections.forEach(section => {
        section.rows.forEach((r, idx) => {
          const snapshotRunning: Record<string, number> = {};

          template.columns.forEach(col => {
            const rawVal = r[col.id];
            if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
              const num = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal).replace(/[^0-9.-]/g, ''));
              if (!isNaN(num)) {
                currentRunningSum[col.id] += num;
              }
            }
            snapshotRunning[col.id] = currentRunningSum[col.id];
          });

          flattenedRowsWithProgressive.push({
            username: section.username,
            user: section.user,
            row: r,
            rowIndexInUser: idx,
            runningCumulative: snapshotRunning
          });
        });
      });

      return {
        template,
        userSections,
        flattenedRowsWithProgressive,
        totalRowsForTable,
        totalUsersWithData: userSections.length,
        columnProgressiveTotals
      };
    });
  }, [sortedTemplates, submissions, users, selectedUsernameFilter, searchTerm]);

  // Visible tables according to active table selection
  const visibleTables = useMemo(() => {
    if (activeTableId === 'all') {
      return separatedTablesData;
    }
    return separatedTablesData.filter(item => item.template.id === activeTableId);
  }, [separatedTablesData, activeTableId]);

  // Overall Global Counts
  const overallStats = useMemo(() => {
    const totalSubmittedRows = submissions.reduce((acc, s) => acc + (s.rows?.length || 0), 0);
    const totalActiveUsernames = new Set(submissions.map(s => s.user_id)).size;
    return {
      totalTemplates: templates.length,
      totalSubmissions: submissions.length,
      totalSubmittedRows,
      totalActiveUsernames
    };
  }, [templates, submissions]);

  // ================= ADMIN CELL & TEXT EDITING HANDLERS =================

  // 1. Direct Cell Value Change & Immediate Auto-Save
  const handleCellChange = (
    tableId: number, 
    userId: number, 
    rowIndexInUser: number, 
    columnId: string, 
    newRawValue: any
  ) => {
    const template = templates.find(t => t.id === tableId);
    const col = template?.columns.find(c => c.id === columnId);

    let parsedVal: any = newRawValue;
    if (col?.type === 'number' || col?.type === 'currency') {
      if (newRawValue === '') {
        parsedVal = '';
      } else {
        const num = parseFloat(String(newRawValue).replace(/[^0-9.-]/g, ''));
        parsedVal = isNaN(num) ? newRawValue : num;
      }
    } else if (col?.type === 'checkbox') {
      parsedVal = Boolean(newRawValue);
    }

    const res = storageService.updateSubmissionCell(tableId, userId, rowIndexInUser, columnId, parsedVal);
    if (res.success) {
      setSubmissions(storageService.getTableSubmissions());
      setLastSavedNotice(`Autosaved cell change at ${new Date().toLocaleTimeString()}`);
    }
  };

  // 2. Reassign Row Username
  const handleReassignUsername = (
    tableId: number,
    currentUserId: number,
    rowIndexInUser: number,
    newUserIdStr: string
  ) => {
    const newUserId = parseInt(newUserIdStr, 10);
    if (isNaN(newUserId) || currentUserId === newUserId) return;

    const res = storageService.reassignSubmissionRowUser(tableId, currentUserId, rowIndexInUser, newUserId);
    if (res.success) {
      setSubmissions(storageService.getTableSubmissions());
      const targetUser = users.find(u => u.id === newUserId);
      onShowToast('Row Reassigned', `Row moved to assigned username @${targetUser?.username}.`, 'success');
    }
  };

  // 3. Delete Row
  const handleDeleteRow = (
    tableId: number,
    userId: number,
    rowIndexInUser: number
  ) => {
    if (window.confirm('Are you sure you want to delete this row from the Master Excel Table?')) {
      const res = storageService.deleteSubmissionRow(tableId, userId, rowIndexInUser);
      if (res.success) {
        setSubmissions(storageService.getTableSubmissions());
        onShowToast('Row Deleted', 'The row was removed from the Master Excel Table.', 'info');
      }
    }
  };

  // 4. Add Row
  const handleOpenAddRowModal = (tableId: number) => {
    setAddingRowForTableId(tableId);
    if (staffUsers.length > 0) {
      setNewRowTargetUserId(staffUsers[0].id);
    }
  };

  const handleConfirmAddRow = () => {
    if (addingRowForTableId !== null && newRowTargetUserId !== null) {
      const template = templates.find(t => t.id === addingRowForTableId);
      const emptyRow: TableRowData = {};
      template?.columns.forEach(col => {
        emptyRow[col.id] = col.type === 'checkbox' ? false : (col.defaultValue || '');
      });

      const res = storageService.addSubmissionRow(addingRowForTableId, newRowTargetUserId, emptyRow);
      if (res.success) {
        setSubmissions(storageService.getTableSubmissions());
        const user = users.find(u => u.id === newRowTargetUserId);
        onShowToast('Row Added', `New editable row created for @${user?.username}.`, 'success');
      }
    }
    setAddingRowForTableId(null);
  };

  // 5. Edit Column Header Label
  const handleOpenEditColumnModal = (tableId: number, column: TableColumn) => {
    setEditingColumnState({ tableId, column });
    setTempColumnLabel(column.label);
  };

  const handleSaveColumnLabel = () => {
    if (editingColumnState && tempColumnLabel.trim()) {
      const res = storageService.updateTableColumnHeader(
        editingColumnState.tableId,
        editingColumnState.column.id,
        tempColumnLabel.trim()
      );
      if (res.success) {
        setTemplates(storageService.getTableTemplates());
        onShowToast('Column Renamed', `Column header changed to "${tempColumnLabel.trim()}".`, 'success');
      }
    }
    setEditingColumnState(null);
  };

  // Export entire multi-sheet workbook
  const handleExportAllWorkbook = () => {
    try {
      exportMasterExcelWorkbook(users, templates, submissions, 'Admin_Autosaved_By_Username_Master');
      onShowToast('Excel Workbook Exported', 'Downloaded complete workbook saved by username with Total rows.', 'success');
    } catch (e) {
      console.error(e);
      onShowToast('Export Error', 'Failed to export master workbook.', 'error');
    }
  };

  // Export single table title
  const handleExportSingleTable = (template: EditableTableTemplate) => {
    try {
      exportTableByTitleExcel(template, users, submissions);
      onShowToast('Table Exported', `Downloaded Excel table for "${template.title}" organized by username.`, 'success');
    } catch (e) {
      console.error(e);
      onShowToast('Export Error', 'Failed to export table file.', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenEditBannerModal = (template: EditableTableTemplate) => {
    setEditingTemplateBannerId(template.id);
    setCustomBannerTitle(template.styling?.tableNameInHeader || template.title);
  };

  const handleSaveBannerTitle = () => {
    if (editingTemplateBannerId !== null) {
      const template = templates.find(t => t.id === editingTemplateBannerId);
      if (template) {
        const updatedStyling: TableStyleConfig = {
          ...(template.styling || {}),
          tableNameInHeader: customBannerTitle
        };
        storageService.updateTableTemplate(template.id, {
          title: customBannerTitle.trim() || template.title,
          styling: updatedStyling
        });
        setTemplates(storageService.getTableTemplates());
        onShowToast('Banner Title Saved', `Horizontal line banner updated for "${customBannerTitle}".`, 'success');
      }
    }
    setEditingTemplateBannerId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Excel Master Hub with Editable Indicator */}
      <div className="no-print bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white border border-emerald-800/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Autosave Live Sync Active</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-bold border border-indigo-500/30">
              <UserCheck className="w-3.5 h-3.5 text-indigo-300" />
              <span>Saved by Assigned Username</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Data Master Excel (Autosaved by Username)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            All user-submitted and admin-entered data is <strong>automatically saved in real time</strong> with the submitter's username (@username). Progressive totals recalculate dynamically across all tables.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setIsCreateMasterTableModalOpen(true)}
            className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Table</span>
          </button>

          <button
            onClick={() => setIsLinksModalOpen(true)}
            className="px-4 py-3 bg-indigo-700/80 hover:bg-indigo-600 text-white text-xs font-bold rounded-2xl border border-indigo-500/50 shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Link2 className="w-4 h-4 text-indigo-200" />
            <span>User Login Links</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-3 bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-700" />
            <span>Print Tables</span>
          </button>

          <button
            onClick={handleExportAllWorkbook}
            className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-lg border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download All Tables (.XLSX)</span>
          </button>

          <button
            onClick={refreshData}
            className="p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded-2xl border border-slate-700 transition-colors shadow-xs cursor-pointer"
            title="Refresh table sync"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Autosave Summary Metrics Bar */}
      <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Autosaved Rows</div>
          <div className="text-xl font-extrabold text-slate-900 mt-0.5">{overallStats.totalSubmittedRows} Rows</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-3 h-3" /> Live synced
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Usernames</div>
          <div className="text-xl font-extrabold text-[#1c7ed6] mt-0.5">{overallStats.totalActiveUsernames} Staff Users</div>
          <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Categorized by @username</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Master Templates</div>
          <div className="text-xl font-extrabold text-slate-900 mt-0.5">{overallStats.totalTemplates} Data Tables</div>
          <div className="text-[11px] text-slate-500 font-semibold mt-0.5">{visibleTables.length} currently visible</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Autosave Engine</div>
          <div className="text-sm font-extrabold text-emerald-700 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Continuous Sync
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
            {lastSavedNotice || 'Ready for real-time edits'}
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS BAR: SEARCH & USERNAME FOCUS */}
      <div className="no-print bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[260px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by assigned username or data values..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            {/* Filter by Assigned Username */}
            <div className="flex items-center gap-2">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <select
                value={selectedUsernameFilter}
                onChange={(e) => setSelectedUsernameFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 text-slate-700"
              >
                <option value="all">All Assigned Usernames</option>
                {staffUsers.map(u => (
                  <option key={u.id} value={u.username}>
                    @{u.username}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{visibleTables.length} Active Sheet{visibleTables.length === 1 ? '' : 's'} • Auto-Saved by Username</span>
          </div>
        </div>

        {/* Quick Username Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 mr-1">Filter by Username:</span>
          <button
            onClick={() => setSelectedUsernameFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              selectedUsernameFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Users ({submissions.length})
          </button>
          {staffUsers.map(u => {
            const userSubCount = submissions.filter(s => s.user_id === u.id).length;
            const isSelected = selectedUsernameFilter === u.username;
            return (
              <button
                key={u.id}
                onClick={() => setSelectedUsernameFilter(isSelected ? 'all' : u.username)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-white hover:bg-emerald-50/50 text-slate-700 border-slate-200'
                }`}
              >
                <UserCheck className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                <span>@{u.username}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? 'bg-emerald-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {userSubCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TABLE TITLE SELECTOR & ORDERING TABS */}
      <div className="no-print bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Select Table Title (Separated & Not Mixed)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">Order Tables By:</span>
            <select
              value={tableOrderSort}
              onChange={(e) => setTableOrderSort(e.target.value as any)}
              className="text-xs border border-slate-200 rounded-xl px-2.5 py-1 bg-slate-50 font-semibold focus:bg-white text-slate-700"
            >
              <option value="title_asc">Title (A → Z)</option>
              <option value="title_desc">Title (Z → A)</option>
              <option value="submissions_desc">Most Submissions First</option>
              <option value="id_asc">Table ID</option>
            </select>
          </div>
        </div>

        {/* Horizontal Table Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setActiveTableId('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTableId === 'all'
                ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-600/30'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <FolderSync className="w-3.5 h-3.5" />
            <span>All Tables (Separated View)</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeTableId === 'all' ? 'bg-emerald-800 text-white' : 'bg-white text-slate-600'
            }`}>
              {templates.length}
            </span>
          </button>

          {sortedTemplates.map((t) => {
            const isSelected = activeTableId === t.id;
            const subCount = submissions.filter(s => s.table_id === t.id && s.status === 'submitted').length;
            const rowCount = submissions.filter(s => s.table_id === t.id).reduce((acc, s) => acc + (s.rows?.length || 0), 0);

            return (
              <button
                key={t.id}
                onClick={() => setActiveTableId(t.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-500/30'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
                }`}
              >
                <FileSpreadsheet className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-200' : 'text-indigo-600'}`} />
                <span className="truncate max-w-[220px]">{t.title}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {subCount} users • {rowCount} rows
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setIsCreateMasterTableModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-700" />
            <span>+ New Table</span>
          </button>
        </div>
      </div>

      {/* RICH EXCEL STYLING & FONT CONTROLS */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Spreadsheet Styling & Font Controls (Live Update)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Click any cell or header to edit text in place
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          {/* Font Family */}
          <div className="flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={masterStyling.fontFamily}
              onChange={(e) => setMasterStyling({ ...masterStyling, fontFamily: e.target.value })}
              className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 font-medium focus:bg-white focus:outline-hidden"
            >
              {FONT_OPTIONS.map(f => (
                <option key={f.label} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <select
            value={masterStyling.fontSize || '12px'}
            onChange={(e) => setMasterStyling({ ...masterStyling, fontSize: e.target.value })}
            className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 font-medium focus:bg-white focus:outline-hidden"
          >
            <option value="11px">11px</option>
            <option value="12px">12px</option>
            <option value="13px">13px</option>
            <option value="14px">14px</option>
          </select>

          {/* Bold, Italic, Underline */}
          <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setMasterStyling({ ...masterStyling, isBold: !masterStyling.isBold })}
              className={`p-1.5 rounded-lg transition-colors ${
                masterStyling.isBold ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
              title="Toggle Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setMasterStyling({ ...masterStyling, isItalic: !masterStyling.isItalic })}
              className={`p-1.5 rounded-lg transition-colors ${
                masterStyling.isItalic ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
              title="Toggle Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setMasterStyling({ ...masterStyling, isUnderline: !masterStyling.isUnderline })}
              className={`p-1.5 rounded-lg transition-colors ${
                masterStyling.isUnderline ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
              title="Toggle Underline"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Text Color */}
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-2 py-1 bg-slate-50">
            <span className="text-[11px] font-bold text-slate-500">Text:</span>
            <input
              type="color"
              value={masterStyling.textColor || '#0f172a'}
              onChange={(e) => setMasterStyling({ ...masterStyling, textColor: e.target.value })}
              className="w-5 h-5 rounded cursor-pointer border-0 p-0"
              title="Choose text color"
            />
          </div>

          {/* Banner Background Color Swatches */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-1 bg-slate-50">
            <span className="text-[11px] font-bold text-slate-500 px-1">Banner:</span>
            {BANNER_THEMES.map(theme => (
              <button
                key={theme.name}
                type="button"
                onClick={() => setMasterStyling({
                  ...masterStyling,
                  titleBannerBgColor: theme.bg,
                  titleBannerTextColor: theme.text
                })}
                style={{ backgroundColor: theme.bg }}
                className={`w-5 h-5 rounded-md border ${
                  masterStyling.titleBannerBgColor === theme.bg ? 'ring-2 ring-emerald-500 scale-110' : 'opacity-80 hover:opacity-100'
                }`}
                title={theme.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* EDIT HORIZONTAL LINE BANNER MODAL */}
      {editingTemplateBannerId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Edit Table Title / Horizontal Banner Name</h3>
              <button onClick={() => setEditingTemplateBannerId(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Banner Title Name</label>
              <input
                type="text"
                value={customBannerTitle}
                onChange={(e) => setCustomBannerTitle(e.target.value)}
                placeholder="Enter custom title for top horizontal banner..."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 font-bold"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingTemplateBannerId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBannerTitle}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              >
                Save Name
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT COLUMN HEADER MODAL */}
      {editingColumnState !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Edit Column Header</h3>
              <button onClick={() => setEditingColumnState(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Column Label</label>
              <input
                type="text"
                value={tempColumnLabel}
                onChange={(e) => setTempColumnLabel(e.target.value)}
                placeholder="Enter column header label..."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 font-bold"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingColumnState(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveColumnLabel}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              >
                Save Column Header
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ROW MODAL */}
      {addingRowForTableId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add New Row to Master Table</h3>
              <button onClick={() => setAddingRowForTableId(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assign Row to Username</label>
              <select
                value={newRowTargetUserId || ''}
                onChange={(e) => setNewRowTargetUserId(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 font-bold bg-white"
              >
                {staffUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    @{u.username} ({u.department || 'Staff'})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAddingRowForTableId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAddRow}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              >
                Create Row
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEPARATED ORGANIZED TABLES BY TITLE (ONLY USERNAME AND DATA SENT - FULLY EDITABLE) */}
      <div className="space-y-8">
        {visibleTables.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No tables match your current filter</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search query, selecting "All Tables", or resetting the username filter.
            </p>
          </div>
        ) : (
          visibleTables.map(({ template, flattenedRowsWithProgressive, totalRowsForTable, totalUsersWithData, columnProgressiveTotals }) => {
            const bannerTitle = template.styling?.tableNameInHeader || template.title;
            const bannerBg = masterStyling.titleBannerBgColor || template.styling?.titleBannerBgColor || '#047857';
            const bannerTextColor = masterStyling.titleBannerTextColor || template.styling?.titleBannerTextColor || '#ffffff';

            return (
              <div 
                key={template.id}
                className="bg-white rounded-3xl border border-slate-300 shadow-sm overflow-hidden printable-area print-container"
                style={{
                  fontFamily: masterStyling.fontFamily,
                  fontSize: masterStyling.fontSize,
                  color: masterStyling.textColor,
                  fontWeight: masterStyling.isBold ? 'bold' : 'normal',
                  fontStyle: masterStyling.isItalic ? 'italic' : 'normal',
                  textDecoration: masterStyling.isUnderline ? 'underline' : 'none'
                }}
              >
                {/* 1. HORIZONTAL LINE TABLE NAME BANNER (Directly Editable) */}
                <div 
                  className="px-5 py-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors print-table-title"
                  style={{
                    backgroundColor: bannerBg,
                    color: bannerTextColor,
                    borderColor: bannerBg
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 
                          className="font-extrabold tracking-tight uppercase cursor-pointer hover:underline flex items-center gap-1.5"
                          style={{
                            fontSize: masterStyling.titleBannerFontSize || '15px'
                          }}
                          onClick={() => handleOpenEditBannerModal(template)}
                          title="Click to edit table title on horizontal banner"
                        >
                          <span>{bannerTitle}</span>
                          <Edit3 className="w-3.5 h-3.5 opacity-75 inline" />
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider">
                          {template.category || 'General'}
                        </span>
                      </div>
                      <p className="text-[11px] opacity-90 font-normal mt-0.5">
                        {totalUsersWithData} Assigned Usernames • {totalRowsForTable} Data Rows • Click any cell to edit
                      </p>
                    </div>
                  </div>

                  {/* Individual Table Action Buttons */}
                  <div className="no-print flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => handleOpenAddRowModal(template.id)}
                      className="px-3 py-1.5 bg-white text-emerald-950 hover:bg-white/90 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                      title="Add a new row to this table"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-700" />
                      <span>+ Add Row</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditBannerModal(template)}
                      className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                      title="Edit banner name on horizontal line"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Title</span>
                    </button>

                    <button
                      onClick={() => handleExportSingleTable(template)}
                      className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                      title="Download this specific table as Excel .xlsx"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Excel (.xlsx)</span>
                    </button>
                  </div>
                </div>

                {/* 2. SPREADSHEET TABLE: ORGANIZED BY USERNAME AND DATA SENT (DIRECTLY EDITABLE) */}
                <div className="overflow-x-auto max-h-[650px]">
                  <table className="w-full text-left border-collapse border border-slate-300">
                    <thead className="sticky top-0 bg-slate-900 text-white z-20 border-b border-slate-400">
                      <tr className="text-[11px] font-bold uppercase tracking-wider">
                        {/* COLUMN 1: Respective Username */}
                        <th className="py-3 px-3.5 border-r border-slate-700 bg-slate-950 text-emerald-300 min-w-[140px] w-48">
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="font-extrabold tracking-wide">Username</span>
                          </div>
                        </th>

                        {/* DATA SENT COLUMNS: Click-to-Edit Header Label */}
                        {template.columns.map(col => (
                          <th 
                            key={col.id} 
                            className="py-3 px-3.5 border-r border-slate-700 min-w-[150px] group/col"
                            style={{
                              textAlign: col.type === 'number' || col.type === 'currency' ? 'right' : 'left'
                            }}
                          >
                            <div className={`flex items-center gap-1.5 ${col.type === 'number' || col.type === 'currency' ? 'justify-end' : ''}`}>
                              <span className="truncate">{col.label}</span>
                              {col.required && <span className="text-rose-400">*</span>}
                              <button
                                type="button"
                                onClick={() => handleOpenEditColumnModal(template.id, col)}
                                className="opacity-0 group-hover/col:opacity-100 p-0.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-opacity no-print"
                                title="Click to edit column label"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          </th>
                        ))}

                        {/* Grand Total Sum Arranged as Column (Sum Along Row) */}
                        <th className="py-3 px-3.5 border-r border-slate-700 bg-emerald-950 text-amber-300 min-w-[160px] text-right font-extrabold uppercase tracking-wider">
                          <div className="flex items-center justify-end gap-1.5">
                            <Calculator className="w-3.5 h-3.5 text-amber-300" />
                            <span>Grand Total Sum</span>
                          </div>
                        </th>

                        {/* Row Action Controls (Admin delete row) */}
                        <th className="py-3 px-2 w-12 text-center no-print bg-slate-950 text-slate-500">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200">
                      {flattenedRowsWithProgressive.length === 0 ? (
                        <tr>
                          <td colSpan={3 + template.columns.length} className="py-12 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <FileSpreadsheet className="w-7 h-7 text-slate-300" />
                              <p className="text-xs font-semibold text-slate-600">No data sent for "{template.title}" yet.</p>
                              <button
                                onClick={() => handleOpenAddRowModal(template.id)}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Add First Row</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        flattenedRowsWithProgressive.map((item, index) => {
                          const { username, user, row, rowIndexInUser, runningCumulative } = item;
                          const rowKey = `${template.id}-${user.id}-${rowIndexInUser}`;

                          // Calculate Grand Sum along the row across all numeric columns
                          let rowGrandSum = 0;
                          template.columns.forEach(col => {
                            if (col.type === 'number' || col.type === 'currency' || col.summary === 'sum') {
                              const cellVal = row[col.id];
                              if (cellVal !== undefined && cellVal !== null && cellVal !== '') {
                                const num = typeof cellVal === 'number' ? cellVal : parseFloat(String(cellVal).replace(/[^0-9.-]/g, ''));
                                if (!isNaN(num)) {
                                  rowGrandSum += num;
                                }
                              }
                            }
                          });

                          return (
                            <tr 
                              key={`${template.id}-${user.id}-${rowIndexInUser}-${index}`}
                              className="hover:bg-emerald-50/30 transition-colors border-b border-slate-200 group"
                            >
                              {/* Username Column: Clean respective submitter badge */}
                              <td className="py-2 px-3 border-r border-slate-200 font-bold bg-slate-50/70 group-hover:bg-emerald-50/50">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                                  <span className="font-extrabold text-xs text-slate-900 tracking-tight">
                                    @{username || user.username}
                                  </span>
                                  {user.department && (
                                    <span className="text-[10px] text-slate-400 font-normal ml-auto">
                                      {user.department}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* ONLY Data Sent Columns: FULLY DIRECTLY EDITABLE CELLS */}
                              {template.columns.map(col => {
                                const cellVal = row[col.id];
                                const cellKey = `${rowKey}-${col.id}`;
                                const isNum = col.type === 'number' || col.type === 'currency' || col.summary === 'sum' || col.summary === 'avg';
                                const runningSum = runningCumulative[col.id];

                                return (
                                  <td 
                                    key={col.id} 
                                    className="p-1 border-r border-slate-200 text-xs font-semibold focus-within:bg-emerald-50/60 focus-within:ring-2 focus-within:ring-emerald-500/40"
                                    title={isNum && runningSum !== undefined ? `Progressive Cumulative Sum up to this row: ${col.type === 'currency' ? '$' + runningSum.toLocaleString() : runningSum.toLocaleString()}` : undefined}
                                  >
                                    {col.type === 'checkbox' ? (
                                      <div className="flex items-center justify-center py-1">
                                        <input
                                          type="checkbox"
                                          checked={Boolean(cellVal)}
                                          onChange={(e) => handleCellChange(template.id, user.id, rowIndexInUser, col.id, e.target.checked)}
                                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer border-slate-300"
                                        />
                                      </div>
                                    ) : col.type === 'select' && col.options && col.options.length > 0 ? (
                                      <select
                                        value={cellVal || ''}
                                        onChange={(e) => handleCellChange(template.id, user.id, rowIndexInUser, col.id, e.target.value)}
                                        className="w-full px-2 py-1 text-xs border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded-lg bg-transparent focus:bg-white font-semibold focus:outline-hidden"
                                      >
                                        <option value="">— Select —</option>
                                        {col.options.map(opt => (
                                          <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                      </select>
                                    ) : col.type === 'currency' ? (
                                      <div className="relative flex items-center">
                                        <span className="absolute left-2 text-slate-400 font-bold">$</span>
                                        <input
                                          type="text"
                                          value={cellVal !== undefined && cellVal !== null ? cellVal : ''}
                                          onChange={(e) => handleCellChange(template.id, user.id, rowIndexInUser, col.id, e.target.value)}
                                          onFocus={() => setEditingCellKey(cellKey)}
                                          onBlur={() => setEditingCellKey(null)}
                                          placeholder="0.00"
                                          className="w-full pl-5 pr-2 py-1 text-xs font-mono font-bold text-right border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded-lg bg-transparent focus:bg-white text-slate-900 focus:outline-hidden"
                                        />
                                      </div>
                                    ) : col.type === 'number' ? (
                                      <input
                                        type="number"
                                        value={cellVal !== undefined && cellVal !== null ? cellVal : ''}
                                        onChange={(e) => handleCellChange(template.id, user.id, rowIndexInUser, col.id, e.target.value)}
                                        onFocus={() => setEditingCellKey(cellKey)}
                                        onBlur={() => setEditingCellKey(null)}
                                        placeholder="0"
                                        className="w-full px-2 py-1 text-xs font-mono font-bold text-right border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded-lg bg-transparent focus:bg-white text-slate-900 focus:outline-hidden"
                                      />
                                    ) : col.type === 'date' ? (
                                      <input
                                        type="date"
                                        value={cellVal || ''}
                                        onChange={(e) => handleCellChange(template.id, user.id, rowIndexInUser, col.id, e.target.value)}
                                        className="w-full px-2 py-1 text-xs border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded-lg bg-transparent focus:bg-white text-slate-800 focus:outline-hidden font-medium"
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        value={cellVal !== undefined && cellVal !== null ? String(cellVal) : ''}
                                        onChange={(e) => handleCellChange(template.id, user.id, rowIndexInUser, col.id, e.target.value)}
                                        onFocus={() => setEditingCellKey(cellKey)}
                                        onBlur={() => setEditingCellKey(null)}
                                        placeholder={`Enter ${col.label.toLowerCase()}...`}
                                        className="w-full px-2 py-1 text-xs border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded-lg bg-transparent focus:bg-white text-slate-800 focus:outline-hidden font-medium"
                                      />
                                    )}
                                  </td>
                                );
                              })}

                              {/* Grand Total Sum Column for this row (Sum Along the Row) */}
                              <td className="p-2 border-r border-slate-200 bg-amber-50/50 text-right font-mono font-black text-amber-950 text-xs">
                                <div className="flex items-center justify-end gap-1">
                                  <span className="text-[10px] text-amber-600 font-bold">Σ</span>
                                  <span>{rowGrandSum.toLocaleString()}</span>
                                </div>
                              </td>

                              {/* Row Action Controls (Delete Row) */}
                              <td className="py-1 px-1 text-center no-print border-r border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRow(template.id, user.id, rowIndexInUser)}
                                  className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                                  title="Delete this row"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>

                    {/* 3. TOTAL ROW SUMMING PROGRESSIVELY */}
                    {flattenedRowsWithProgressive.length > 0 && (
                      <tfoot className="bg-emerald-900 text-white font-extrabold border-t-2 border-emerald-950 text-xs sticky bottom-0 z-10 shadow-lg">
                        <tr>
                          {/* "Total" placed directly at the bottom of the Username column */}
                          <td className="py-3.5 px-4 border-r border-emerald-800 bg-emerald-950 text-emerald-300 font-extrabold text-xs uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <Calculator className="w-4 h-4 text-emerald-400" />
                              <span>Column Totals</span>
                            </div>
                          </td>

                          {/* Progressive sum for each data column */}
                          {template.columns.map((col) => {
                            const summary = columnProgressiveTotals[col.id];

                            return (
                              <td 
                                key={col.id} 
                                className="py-3 px-3.5 border-r border-emerald-800 font-mono text-xs"
                                style={{
                                  textAlign: col.type === 'number' || col.type === 'currency' ? 'right' : 'left'
                                }}
                              >
                                {summary?.isNumeric ? (
                                  <div className="flex flex-col">
                                    <div className={`flex items-center gap-1 ${col.type === 'number' || col.type === 'currency' ? 'justify-end' : ''}`}>
                                      <span className="text-white font-black text-sm">
                                        {col.type === 'currency' 
                                          ? `$${summary.sum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                          : summary.sum.toLocaleString()
                                        }
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-emerald-300 font-normal">
                                      column total
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-emerald-200 font-normal">
                                    {summary?.count || 0} entries
                                  </span>
                                )}
                              </td>
                            );
                          })}

                          {/* Grand Total Sum Column Footer Value (Combined Total Sum of All Rows) */}
                          <td className="py-3 px-3.5 border-r border-emerald-800 font-mono text-xs text-right bg-emerald-950">
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-1 justify-end">
                                <span className="text-amber-300 font-black text-sm font-mono">
                                  {Object.values(columnProgressiveTotals)
                                    .reduce((acc: number, item: any) => acc + (item?.isNumeric ? (Number(item.sum) || 0) : 0), 0)
                                    .toLocaleString()}
                                </span>
                              </div>
                              <span className="text-[10px] text-amber-300 font-normal">
                                grand row sum
                              </span>
                            </div>
                          </td>

                          {/* Empty spacer under action column */}
                          <td className="no-print bg-emerald-950"></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Bottom Footer Info Bar with + Add Row quick button */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>
                      <strong>Table Title:</strong> {template.title} • <strong>Autosaved by:</strong> Assigned Username • <strong>Admin:</strong> Click any cell to edit & auto-save
                    </span>
                  </div>

                  <div className="no-print flex items-center gap-3">
                    <button
                      onClick={() => handleOpenAddRowModal(template.id)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Row to "{template.title}"</span>
                    </button>

                    <button
                      onClick={() => handleExportSingleTable(template)}
                      className="text-xs font-bold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Excel</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* User Login Links Modal */}
      <UserLoginLinksModal
        isOpen={isLinksModalOpen}
        onClose={() => setIsLinksModalOpen(false)}
        onShowToast={onShowToast}
      />

      {/* Create New Master Table Modal */}
      {isCreateMasterTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Create New Master Table</h3>
                  <p className="text-[11px] text-slate-400">Instantly generate a spreadsheet with surveillance columns</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateMasterTableModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMasterTableSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Spreadsheet Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Woreda Health Center Surveillance"
                  value={newMasterTableTitle}
                  onChange={(e) => setNewMasterTableTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={newMasterTableCategory}
                  onChange={(e) => setNewMasterTableCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newMasterTableDesc}
                  onChange={(e) => setNewMasterTableDesc(e.target.value)}
                  placeholder="Optional notes or instructions..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateMasterTableModalOpen(false);
                    if (onNavigateToTables) onNavigateToTables();
                  }}
                  className="text-xs text-emerald-700 hover:underline font-bold cursor-pointer"
                >
                  Open Table Designer →
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateMasterTableModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    Create Table
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
