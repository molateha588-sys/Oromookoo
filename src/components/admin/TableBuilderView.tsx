import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Save, 
  Users, 
  Layers, 
  HelpCircle, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Settings2,
  Sparkles,
  GripVertical,
  ChevronDown,
  Eye,
  Send,
  Palette,
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Printer
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { TableColumn, TableColumnType, TableRowData, EditableTableTemplate, TableStyleConfig } from '../../types';
import { TableGridEditor } from '../common/TableGridEditor';

interface TableBuilderViewProps {
  editTableId: number | null;
  onBack: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

const FONT_OPTIONS = [
  { label: 'Segoe UI', value: 'Segoe UI, -apple-system, BlinkMacSystemFont, sans-serif' },
  { label: 'Calibri', value: 'Calibri, Candara, Segoe, Segoe UI, Optima, Arial, sans-serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Courier New (Mono)', value: '"Courier New", Courier, monospace' }
];

const BANNER_THEMES = [
  { name: 'Oromia Health Blue', bg: '#005a9e', text: '#ffffff' },
  { name: 'Emerald Health', bg: '#047857', text: '#ffffff' },
  { name: 'Slate Dark', bg: '#0f172a', text: '#ffffff' },
  { name: 'Royal Navy', bg: '#1e3a8a', text: '#ffffff' },
  { name: 'Deep Teal', bg: '#0f766e', text: '#ffffff' },
  { name: 'Warm Amber', bg: '#92400e', text: '#ffffff' }
];

export const TableBuilderView: React.FC<TableBuilderViewProps> = ({
  editTableId,
  onBack,
  onShowToast
}) => {
  const users = storageService.getUsers().filter(u => u.role === 'user');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [category, setCategory] = useState('Public Health & Clinical Services');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState<'all' | 'specific_users'>('all');
  const [assignedUserIds, setAssignedUserIds] = useState<number[]>([]);
  const [allowAddRows, setAllowAddRows] = useState(true);
  const [minRows, setMinRows] = useState(1);
  const [maxRows, setMaxRows] = useState(100);

  // Table Styling Configuration
  const [styling, setStyling] = useState<TableStyleConfig>({
    fontFamily: 'Segoe UI, sans-serif',
    fontSize: '12px',
    textColor: '#0f172a',
    isBold: false,
    isItalic: false,
    isUnderline: false,
    textAlign: 'left',
    headerBgColor: '#005a9e',
    headerTextColor: '#ffffff',
    showTableTitleBanner: true,
    tableNameInHeader: '',
    titleBannerBgColor: '#005a9e',
    titleBannerTextColor: '#ffffff',
    titleBannerFontSize: '16px',
    titleBannerAlignment: 'left',
    titleBannerBold: true,
    titleBannerItalic: false
  });
  
  // Columns definition
  const [columns, setColumns] = useState<TableColumn[]>([
    { id: 'col_facility', label: 'Health Facility / Station', type: 'text', required: true, placeholder: 'e.g. Adama General Hospital' },
    { id: 'col_service', label: 'Health Service Category', type: 'select', required: true, options: ['Maternal Care', 'Immunization', 'Emergency', 'Outpatient', 'Pharmacy', 'Epidemiology'], defaultValue: 'Immunization' },
    { id: 'col_date', label: 'Reporting Date', type: 'date', required: true },
    { id: 'col_patients', label: 'Patients Attended', type: 'number', required: true, placeholder: '0', summary: 'sum' },
    { id: 'col_supplies', label: 'Supplies Utilized ($)', type: 'currency', required: false, placeholder: '0.00', summary: 'sum' },
    { id: 'col_status', label: 'Operational Status', type: 'status', required: true, options: ['Operational', 'Supplies Pending', 'Attention Required', 'Completed'], defaultValue: 'Operational' }
  ]);

  // Starter prefilled rows for users
  const [defaultRows, setDefaultRows] = useState<TableRowData[]>([
    {
      col_facility: 'Biiroo Central Clinical Post',
      col_service: 'Immunization',
      col_date: new Date().toISOString().slice(0, 10),
      col_patients: 125,
      col_supplies: 450,
      col_status: 'Operational'
    }
  ]);

  const [activeTab, setActiveTab] = useState<'columns' | 'styling' | 'starter_rows' | 'preview'>('columns');

  useEffect(() => {
    if (editTableId) {
      const existing = storageService.getTableTemplateById(editTableId);
      if (existing) {
        setTitle(existing.title);
        setDescription(existing.description || '');
        setInstructions(existing.instructions || '');
        setCategory(existing.category || 'Public Health');
        setDueDate(existing.due_date || '');
        setAssignedTo(existing.assigned_to === 'specific_users' ? 'specific_users' : 'all');
        setAssignedUserIds(existing.assigned_user_ids || []);
        setAllowAddRows(existing.allow_add_rows !== false);
        setMinRows(existing.min_rows || 1);
        setMaxRows(existing.max_rows || 100);
        setColumns(existing.columns || []);
        setDefaultRows(existing.default_rows || []);
        if (existing.styling) {
          setStyling({
            ...existing.styling,
            tableNameInHeader: existing.styling.tableNameInHeader || existing.title
          });
        }
      }
    }
  }, [editTableId]);

  // Keep styling table name synced when title changes
  useEffect(() => {
    if (title) {
      setStyling(prev => ({
        ...prev,
        tableNameInHeader: title
      }));
    }
  }, [title]);

  const handleAddColumn = () => {
    const newColId = `col_${Date.now()}`;
    const newCol: TableColumn = {
      id: newColId,
      label: `Column ${columns.length + 1}`,
      type: 'text',
      required: false,
      placeholder: 'Enter data...',
      summary: 'none'
    };
    setColumns([...columns, newCol]);
  };

  const handleUpdateColumn = (index: number, updates: Partial<TableColumn>) => {
    const newCols = [...columns];
    newCols[index] = { ...newCols[index], ...updates };
    setColumns(newCols);
  };

  const handleDeleteColumn = (index: number) => {
    if (columns.length <= 1) {
      onShowToast('Cannot Remove Column', 'A table must have at least one column.', 'error');
      return;
    }
    const removedId = columns[index].id;
    const newCols = columns.filter((_, i) => i !== index);
    setColumns(newCols);

    // Also clean up starter rows
    const cleanedRows = defaultRows.map(r => {
      const copy = { ...r };
      delete copy[removedId];
      return copy;
    });
    setDefaultRows(cleanedRows);
  };

  const handleToggleUserAssignment = (userId: number) => {
    if (assignedUserIds.includes(userId)) {
      setAssignedUserIds(assignedUserIds.filter(id => id !== userId));
    } else {
      setAssignedUserIds([...assignedUserIds, userId]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      onShowToast('Missing Title', 'Please enter a title for the Excel form.', 'error');
      return;
    }

    if (columns.length === 0) {
      onShowToast('Missing Columns', 'Please define at least one column for the table.', 'error');
      return;
    }

    if (assignedTo === 'specific_users' && assignedUserIds.length === 0) {
      onShowToast('Select Users', 'Please select at least one staff user to assign this Excel form to.', 'error');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      category: category.trim() || 'Public Health',
      due_date: dueDate.trim() || undefined,
      columns,
      default_rows: defaultRows,
      assigned_to: assignedTo,
      assigned_user_ids: assignedTo === 'specific_users' ? assignedUserIds : undefined,
      allow_add_rows: allowAddRows,
      min_rows: minRows,
      max_rows: maxRows,
      styling: {
        ...styling,
        tableNameInHeader: title.trim()
      }
    };

    if (editTableId) {
      storageService.updateTableTemplate(editTableId, payload);
      onShowToast('Table Updated', `Excel form "${title}" updated successfully.`, 'success');
    } else {
      storageService.createTableTemplate(payload);
      onShowToast('Table Created & Sent', `Excel table "${title}" sent to staff users for editing and submission.`, 'success');
    }

    onBack();
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#005a9e] text-xs font-bold mb-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Biiroo Eegumsa Fayyaa Table Architect</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {editTableId ? 'Edit Excel Spreadsheet Template' : 'Design & Send New Excel Form'}
            </h2>
            <p className="text-xs text-slate-500">
              Prepare custom columns, formatting, and starter rows. Staff can edit their table data and submit to the Master Spreadsheet.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4 text-[#005a9e]" />
            <span>Interactive Preview</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-[#005a9e] hover:bg-[#004b85] text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{editTableId ? 'Save & Update Table' : 'Publish & Send to Users'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Configuration */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Settings2 className="w-4 h-4 text-[#005a9e]" />
            <span>1. Table Metadata & Dispatch Target</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Table Name / Spreadsheet Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Monthly Health Facility Operations & Supply Log"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white font-semibold focus:ring-2 focus:ring-[#005a9e] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Clinical, Logistics, Public Health"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#005a9e] outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Form Purpose & Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of why staff are reporting this data..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#005a9e] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Submission Due Date / Cadence
              </label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="e.g. End of Month 5:00 PM"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#005a9e] outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Instructions for Healthcare Staff (Displayed above table)
              </label>
              <textarea
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Please fill one row per healthcare post. You can edit your rows anytime before or after submitting. The admin receives all rows instantly in the Master Excel."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#005a9e] outline-none"
              />
            </div>
          </div>

          {/* User Assignment Controls */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Users className="w-4 h-4 text-[#005a9e]" />
              <span>Target Assignment (Send to Healthcare Staff)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                assignedTo === 'all' ? 'bg-blue-50/70 border-blue-300 ring-1 ring-[#005a9e]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
              }`}>
                <input
                  type="radio"
                  name="assigned_to"
                  checked={assignedTo === 'all'}
                  onChange={() => setAssignedTo('all')}
                  className="mt-0.5 text-[#005a9e]"
                />
                <div>
                  <strong className="block text-xs font-bold text-slate-900">All Healthcare Staff Members</strong>
                  <span className="text-[11px] text-slate-500">Every staff user receives an editable table template in their workspace</span>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                assignedTo === 'specific_users' ? 'bg-blue-50/70 border-blue-300 ring-1 ring-[#005a9e]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
              }`}>
                <input
                  type="radio"
                  name="assigned_to"
                  checked={assignedTo === 'specific_users'}
                  onChange={() => setAssignedTo('specific_users')}
                  className="mt-0.5 text-[#005a9e]"
                />
                <div>
                  <strong className="block text-xs font-bold text-slate-900">Specific Healthcare Staff</strong>
                  <span className="text-[11px] text-slate-500">Select specific users by username or Gmail</span>
                </div>
              </label>
            </div>

            {/* Specific Users Picker */}
            {assignedTo === 'specific_users' && (
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2 animate-in fade-in">
                <p className="text-xs font-bold text-blue-900">Select Staff Members to Send This Table To:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {users.map(u => {
                    const isSelected = assignedUserIds.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                          isSelected ? 'bg-white border-[#005a9e] shadow-xs font-bold text-blue-900 ring-1 ring-[#005a9e]' : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleUserAssignment(u.id)}
                          className="w-4 h-4 text-[#005a9e] rounded-md border-slate-300 focus:ring-[#005a9e]"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="block truncate">{u.full_name || `@${u.username}`}</span>
                          <span className="text-[10px] text-slate-400 font-mono">@{u.username} • {u.email}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation for Columns, Styling, Starter Rows, and Live Preview */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto bg-white rounded-t-3xl p-3 border border-b-0">
          <button
            type="button"
            onClick={() => setActiveTab('columns')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              activeTab === 'columns'
                ? 'bg-[#005a9e] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>Table Columns ({columns.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('styling')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              activeTab === 'styling'
                ? 'bg-[#005a9e] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Excel Styling & Banner</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('starter_rows')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              activeTab === 'starter_rows'
                ? 'bg-[#005a9e] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Starter Rows ({defaultRows.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-[#005a9e] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Live Interactive Preview</span>
          </button>
        </div>

        {/* TAB 1: Columns Configuration */}
        {activeTab === 'columns' && (
          <div className="bg-white rounded-b-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Spreadsheet Columns & Formulas
                </h3>
                <p className="text-xs text-slate-500">
                  Configure column names, types (text, numbers, currency, date, dropdowns), and footer sum totals.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddColumn}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#005a9e] hover:bg-[#004b85] text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Column</span>
              </button>
            </div>

            <div className="space-y-3">
              {columns.map((col, idx) => (
                <div
                  key={col.id || idx}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {col.label || `Column ${idx + 1}`}
                      </span>
                      {col.required && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                          Required
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteColumn(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete column"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Column Label <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={col.label}
                        onChange={(e) => handleUpdateColumn(idx, { label: e.target.value })}
                        placeholder="e.g. Facility Name"
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#005a9e] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Data Type
                      </label>
                      <select
                        value={col.type}
                        onChange={(e) => handleUpdateColumn(idx, { type: e.target.value as TableColumnType })}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-[#005a9e] outline-none"
                      >
                        <option value="text">Text / Description</option>
                        <option value="number">Number (Integer / Decimal)</option>
                        <option value="currency">Currency ($ USD / ETB)</option>
                        <option value="date">Date</option>
                        <option value="select">Dropdown Select</option>
                        <option value="status">Status Badge</option>
                        <option value="checkbox">Checkbox (Yes/No)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Footer Calculation
                      </label>
                      <select
                        value={col.summary || 'none'}
                        onChange={(e) => handleUpdateColumn(idx, { summary: e.target.value as any })}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-[#005a9e] outline-none"
                      >
                        <option value="none">None</option>
                        <option value="sum">SUM (Total)</option>
                        <option value="avg">AVERAGE (Mean)</option>
                        <option value="count">COUNT (Entries)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Placeholder
                        </label>
                        <input
                          type="text"
                          value={col.placeholder || ''}
                          onChange={(e) => handleUpdateColumn(idx, { placeholder: e.target.value })}
                          placeholder="e.g. Enter value..."
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#005a9e] outline-none"
                        />
                      </div>

                      <div className="pt-4">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(col.required)}
                            onChange={(e) => handleUpdateColumn(idx, { required: e.target.checked })}
                            className="w-4 h-4 text-[#005a9e] rounded-md border-slate-300 focus:ring-[#005a9e]"
                          />
                          <span>Required</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {(col.type === 'select' || col.type === 'status') && (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">
                        Dropdown / Badge Options (Comma Separated)
                      </label>
                      <input
                        type="text"
                        value={(col.options || []).join(', ')}
                        onChange={(e) => {
                          const opts = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                          handleUpdateColumn(idx, { options: opts, defaultValue: opts[0] });
                        }}
                        placeholder="Option 1, Option 2, Option 3"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#005a9e] outline-none"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Table Styling & Horizontal Title Banner */}
        {activeTab === 'styling' && (
          <div className="bg-white rounded-b-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Excel Table Formatting & Horizontal Banner Styling
              </h3>
              <p className="text-xs text-slate-500">
                Customize fonts, bold/italic styles, colors, and the table name title banner embedded within the table
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Type className="w-4 h-4 text-[#005a9e]" />
                  <span>Typography & Text Formatting</span>
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Font Family
                    </label>
                    <select
                      value={styling.fontFamily || FONT_OPTIONS[0].value}
                      onChange={(e) => setStyling({ ...styling, fontFamily: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#005a9e] outline-none"
                    >
                      {FONT_OPTIONS.map(f => (
                        <option key={f.label} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Font Size
                      </label>
                      <select
                        value={styling.fontSize || '12px'}
                        onChange={(e) => setStyling({ ...styling, fontSize: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#005a9e] outline-none"
                      >
                        <option value="11px">11px (Compact)</option>
                        <option value="12px">12px (Standard)</option>
                        <option value="13px">13px (Medium)</option>
                        <option value="14px">14px (Large)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Text Color
                      </label>
                      <input
                        type="color"
                        value={styling.textColor || '#0f172a'}
                        onChange={(e) => setStyling({ ...styling, textColor: e.target.value })}
                        className="w-full h-9 p-1 rounded-xl border border-slate-300 bg-white cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Font Weight & Emphasis
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setStyling({ ...styling, isBold: !styling.isBold })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                          styling.isBold ? 'bg-[#005a9e] text-white border-[#005a9e]' : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        <Bold className="w-3.5 h-3.5" />
                        <span>Bold</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStyling({ ...styling, isItalic: !styling.isItalic })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                          styling.isItalic ? 'bg-[#005a9e] text-white border-[#005a9e]' : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        <Italic className="w-3.5 h-3.5" />
                        <span>Italic</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStyling({ ...styling, isUnderline: !styling.isUnderline })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                          styling.isUnderline ? 'bg-[#005a9e] text-white border-[#005a9e]' : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        <Underline className="w-3.5 h-3.5" />
                        <span>Underline</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Banner */}
              <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[#005a9e]" />
                    <span>Table Header Title Banner</span>
                  </h4>

                  <label className="flex items-center gap-1.5 text-xs font-bold text-blue-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={styling.showTableTitleBanner !== false}
                      onChange={(e) => setStyling({ ...styling, showTableTitleBanner: e.target.checked })}
                      className="w-4 h-4 text-[#005a9e] rounded-md border-slate-300 focus:ring-[#005a9e]"
                    />
                    <span>Show on Top Line</span>
                  </label>
                </div>

                {styling.showTableTitleBanner !== false && (
                  <div className="space-y-3 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-bold text-blue-900 mb-1">
                        Banner Theme Colors
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {BANNER_THEMES.map(theme => (
                          <button
                            key={theme.name}
                            type="button"
                            onClick={() => setStyling({ 
                              ...styling, 
                              titleBannerBgColor: theme.bg, 
                              titleBannerTextColor: theme.text 
                            })}
                            style={{ backgroundColor: theme.bg, color: theme.text }}
                            className={`p-2 rounded-xl text-[11px] font-bold border transition-all text-center cursor-pointer ${
                              styling.titleBannerBgColor === theme.bg ? 'ring-2 ring-blue-500 scale-102 shadow-xs' : 'opacity-85 hover:opacity-100'
                            }`}
                          >
                            {theme.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-blue-900 mb-1">
                          Banner Font Size
                        </label>
                        <select
                          value={styling.titleBannerFontSize || '16px'}
                          onChange={(e) => setStyling({ ...styling, titleBannerFontSize: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-blue-200 bg-white font-bold text-slate-800"
                        >
                          <option value="14px">14px (Standard)</option>
                          <option value="16px">16px (Prominent)</option>
                          <option value="18px">18px (Large Display)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-blue-900 mb-1">
                          Alignment
                        </label>
                        <div className="flex items-center bg-white rounded-xl p-1 border border-blue-200">
                          <button
                            type="button"
                            onClick={() => setStyling({ ...styling, titleBannerAlignment: 'left' })}
                            className={`flex-1 p-1 rounded-lg text-xs font-bold cursor-pointer ${
                              styling.titleBannerAlignment === 'left' ? 'bg-[#005a9e] text-white' : 'text-slate-600'
                            }`}
                          >
                            Left
                          </button>
                          <button
                            type="button"
                            onClick={() => setStyling({ ...styling, titleBannerAlignment: 'center' })}
                            className={`flex-1 p-1 rounded-lg text-xs font-bold cursor-pointer ${
                              styling.titleBannerAlignment === 'center' ? 'bg-[#005a9e] text-white' : 'text-slate-600'
                            }`}
                          >
                            Center
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Starter Rows */}
        {activeTab === 'starter_rows' && (
          <div className="bg-white rounded-b-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Pre-Filled Starter Rows for Healthcare Staff (Optional)
              </h3>
              <p className="text-xs text-slate-500">
                Provide pre-filled initial records so users immediately understand what data to enter.
              </p>
            </div>

            <TableGridEditor
              columns={columns}
              rows={defaultRows}
              onChangeRows={setDefaultRows}
              allowAddRows={true}
              minRows={0}
              styling={styling}
              onChangeStyling={setStyling}
              title={title}
            />
          </div>
        )}

        {/* TAB 4: Live Preview */}
        {activeTab === 'preview' && (
          <div className="bg-white rounded-b-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#005a9e] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-xs font-bold text-blue-900 block">
                    Interactive Live Staff Experience Preview
                  </strong>
                  <span className="text-xs text-blue-800">
                    This is how staff will see, enter, format, and submit their Excel table to the Admin Master Excel.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-300 text-[#005a9e] rounded-xl text-xs font-bold hover:bg-blue-50 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Test</span>
              </button>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">{title || 'Untitled Excel Form'}</h2>
              {description && <p className="text-xs text-slate-600">{description}</p>}
              {instructions && (
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-200">
                  <strong className="font-semibold text-slate-900">Admin Instructions: </strong>
                  {instructions}
                </div>
              )}
            </div>

            <TableGridEditor
              columns={columns}
              rows={defaultRows}
              onChangeRows={setDefaultRows}
              allowAddRows={allowAddRows}
              minRows={minRows}
              maxRows={maxRows}
              styling={styling}
              onChangeStyling={setStyling}
              title={title}
            />
          </div>
        )}

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500">
            {assignedTo === 'all' ? (
              <span>Excel Form will be sent to <strong>all healthcare staff users</strong></span>
            ) : (
              <span>Excel Form will be sent to <strong>{assignedUserIds.length} selected staff users</strong></span>
            )}
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#005a9e] hover:bg-[#004b85] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{editTableId ? 'Update & Save Excel Form' : 'Send Excel Form to Staff'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
