import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileSpreadsheet, 
  Edit3, 
  Trash2, 
  Users, 
  Link2, 
  ExternalLink, 
  Check, 
  Copy, 
  Calendar, 
  Eye, 
  Send,
  Layers,
  Sparkles,
  Table as TableIcon,
  X,
  PlusCircle
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { EditableTableTemplate, TableColumn } from '../../types';

interface AdminTablesManagementProps {
  onCreateTable?: () => void;
  onNavigateToBuilder?: (tableId?: number) => void;
  onEditTable?: (id: number) => void;
  onPreviewTable?: (id: number) => void;
  onViewUserSubmissions?: (tableId?: number) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminTablesManagement: React.FC<AdminTablesManagementProps> = ({
  onCreateTable,
  onNavigateToBuilder,
  onEditTable,
  onPreviewTable,
  onViewUserSubmissions,
  onShowToast
}) => {
  const [tables, setTables] = useState<EditableTableTemplate[]>(() => storageService.getTableTemplates());
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isQuickCreateModalOpen, setIsQuickCreateModalOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState('Malaria Surveillance');
  const [quickDescription, setQuickDescription] = useState('');

  const users = storageService.getUsers();
  const allSubmissions = storageService.getTableSubmissions();

  // Listen to live database events
  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      setTables(storageService.getTableTemplates());
    });
    return unsubscribe;
  }, []);

  const handleStartCreate = () => {
    if (onCreateTable) {
      onCreateTable();
    } else if (onNavigateToBuilder) {
      onNavigateToBuilder();
    } else {
      setIsQuickCreateModalOpen(true);
    }
  };

  const handleEdit = (id: number) => {
    if (onEditTable) {
      onEditTable(id);
    } else if (onNavigateToBuilder) {
      onNavigateToBuilder(id);
    }
  };

  const handleInspect = (tableId?: number) => {
    if (onViewUserSubmissions) {
      onViewUserSubmissions(tableId);
    } else if (onPreviewTable && tableId) {
      onPreviewTable(tableId);
    }
  };

  const handleCopyLink = (tableId: number) => {
    const url = storageService.generateTableFillUrl(tableId);
    navigator.clipboard.writeText(url);
    setCopiedId(tableId);
    onShowToast('Table Link Copied', 'Direct fill URL copied to clipboard. Staff can click to log in and fill this table.', 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = (id: number, title: string) => {
    if (window.confirm(`Are you sure you want to delete the table "${title}"? All user submitted data for this table will also be removed.`)) {
      storageService.deleteTableTemplate(id);
      setTables(storageService.getTableTemplates());
      onShowToast('Table Deleted', `"${title}" has been deleted.`, 'info');
    }
  };

  const handleQuickCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) {
      onShowToast('Missing Title', 'Please enter a spreadsheet table title.', 'error');
      return;
    }

    const defaultCols: TableColumn[] = [
      { id: 'col_facility', label: 'Health Facility / Site', type: 'text', required: true, align: 'left' },
      { id: 'col_total_cases', label: 'Total case', type: 'number', summary: 'sum', required: true, align: 'right' },
      { id: 'col_pv', label: 'P.V', type: 'number', summary: 'sum', required: true, align: 'right' },
      { id: 'col_pf', label: 'P.F', type: 'number', summary: 'sum', required: true, align: 'right' },
      { id: 'col_total', label: 'Total', type: 'number', summary: 'sum', required: true, align: 'right' }
    ];

    const newTemplate = storageService.createTableTemplate({
      title: quickTitle.trim(),
      category: quickCategory.trim() || 'Public Health',
      description: quickDescription.trim() || 'Health operational spreadsheet',
      columns: defaultCols,
      assigned_to: 'all',
      styling: {
        headerBgColor: '#005a9e',
        headerTextColor: '#ffffff',
        showTableTitleBanner: true,
        titleBannerBgColor: '#005a9e'
      }
    });

    setTables(storageService.getTableTemplates());
    setIsQuickCreateModalOpen(false);
    setQuickTitle('');
    setQuickDescription('');
    onShowToast('Excel Table Created', `"${newTemplate.title}" created with default surveillance columns and assigned to staff.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#005a9e] border border-blue-200">
              Admin Biiroo Eegumsa Fayyaa Center
            </span>
            <span className="text-xs text-slate-500 font-semibold">• {tables.length} Active Tables</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Editable Excel Tables & Staff Assignment
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Prepare custom spreadsheet tables, send them to staff members, and track real-time submitted data automatically organized by username.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleInspect()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-[#005a9e]" />
            <span>Staff Records Vault</span>
          </button>

          <button
            onClick={handleStartCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#005a9e] hover:bg-[#004b85] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Excel Table</span>
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tables.map(table => {
          const tableSubs = allSubmissions.filter(s => s.table_id === table.id);
          const submittedCount = tableSubs.filter(s => s.status === 'submitted').length;
          const draftCount = tableSubs.filter(s => s.status === 'draft').length;

          let targetLabel = 'All Staff Members';
          if (table.assigned_to === 'specific_users') {
            const count = table.assigned_user_ids?.length || 0;
            targetLabel = `${count} Assigned Staff`;
          }

          return (
            <div
              key={table.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#005a9e] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <TableIcon className="w-4 h-4" />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyLink(table.id)}
                      className="p-1.5 text-slate-400 hover:text-[#005a9e] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Copy direct filling URL for staff"
                    >
                      {copiedId === table.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleEdit(table.id)}
                      className="p-1.5 text-slate-400 hover:text-[#005a9e] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Table Schema & Columns"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(table.id, table.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Table"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#005a9e] mb-0.5">
                    {table.category || 'Public Health'}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-[#005a9e] transition-colors">
                    {table.title}
                  </h3>
                  {table.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {table.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{table.columns?.length || 0} Columns</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-600">{targetLabel}</span>
                </div>

                <div className="flex items-center gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Submitted</span>
                    <span className="font-bold text-emerald-600">{submittedCount} Staff</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Drafts</span>
                    <span className="font-bold text-amber-600">{draftCount} In Progress</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => handleInspect(table.id)}
                  className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-[#005a9e] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Staff Rows</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Create Table Modal */}
      {isQuickCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#005a9e] flex items-center justify-center font-bold">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Create New Excel Table</h3>
                  <p className="text-[11px] text-slate-400">Instantly create and assign to staff users</p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickCreateModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Spreadsheet Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Malaria Case Report"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category / Domain</label>
                <input
                  type="text"
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={quickDescription}
                  onChange={(e) => setQuickDescription(e.target.value)}
                  placeholder="Optional brief notes about this surveillance spreadsheet..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickCreateModalOpen(false);
                    if (onCreateTable) onCreateTable();
                    else if (onNavigateToBuilder) onNavigateToBuilder();
                  }}
                  className="text-xs text-[#005a9e] hover:underline font-bold"
                >
                  Open Full Table Designer →
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQuickCreateModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#005a9e] hover:bg-[#004b85] text-white font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
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

