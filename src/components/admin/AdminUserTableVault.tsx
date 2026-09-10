import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Eye, 
  Download, 
  MessageSquare, 
  ShieldCheck, 
  Check, 
  X, 
  Filter, 
  ArrowUpDown, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  Calendar, 
  Send 
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { User, EditableTableTemplate, UserTableSubmission, TableRowData } from '../../types';
import { TableGridEditor } from '../common/TableGridEditor';

interface AdminUserTableVaultProps {
  initialTableId?: number | null;
  onBackToTables?: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminUserTableVault: React.FC<AdminUserTableVaultProps> = ({
  initialTableId,
  onBackToTables,
  onShowToast
}) => {
  const [users, setUsers] = useState<User[]>(storageService.getUsers().filter(u => u.role === 'user'));
  const [templates, setTemplates] = useState<EditableTableTemplate[]>(storageService.getTableTemplates());
  const [submissions, setSubmissions] = useState<UserTableSubmission[]>(storageService.getTableSubmissions());
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTableFilter, setSelectedTableFilter] = useState<string>(initialTableId ? initialTableId.toString() : 'all');
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);

  // Inspector Modal State
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectUser, setInspectUser] = useState<User | null>(null);
  const [inspectTemplate, setInspectTemplate] = useState<EditableTableTemplate | null>(null);
  const [inspectSubmission, setInspectSubmission] = useState<UserTableSubmission | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [reviewerStatus, setReviewerStatus] = useState<'pending' | 'approved' | 'needs_revision'>('pending');

  const refreshData = () => {
    setUsers(storageService.getUsers().filter(u => u.role === 'user'));
    setTemplates(storageService.getTableTemplates());
    setSubmissions(storageService.getTableSubmissions());
  };

  // Group table data by User
  const userVaultData = useMemo(() => {
    return users.map(user => {
      // Get all table templates assigned to this user
      const assignedTemplates = templates.filter(tpl => {
        if (tpl.assigned_to === 'all') return true;
        if (tpl.assigned_to === 'specific_users' && tpl.assigned_user_ids?.includes(user.id)) return true;
        return false;
      });

      // Filter by selected table dropdown if active
      const filteredTemplates = selectedTableFilter === 'all'
        ? assignedTemplates
        : assignedTemplates.filter(t => t.id === parseInt(selectedTableFilter, 10));

      const userTableRecords = filteredTemplates.map(tpl => {
        const sub = submissions.find(s => s.user_id === user.id && s.table_id === tpl.id);
        return {
          template: tpl,
          submission: sub || null,
          status: sub ? sub.status : 'Not started',
          rowCount: sub ? sub.rows.length : 0,
          submittedAt: sub?.submitted_at,
          updatedAt: sub?.updated_at,
          reviewerStatus: sub?.reviewer_status || 'pending',
          reviewerNotes: sub?.reviewer_notes || ''
        };
      });

      const totalAssigned = assignedTemplates.length;
      const totalSubmitted = userTableRecords.filter(r => r.status === 'submitted').length;
      const totalDrafts = userTableRecords.filter(r => r.status === 'draft').length;

      return {
        user,
        assignedCount: totalAssigned,
        submittedCount: totalSubmitted,
        draftCount: totalDrafts,
        records: userTableRecords
      };
    }).filter(group => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        group.user.username.toLowerCase().includes(term) ||
        group.user.email.toLowerCase().includes(term) ||
        (group.user.full_name && group.user.full_name.toLowerCase().includes(term))
      );
    });
  }, [users, templates, submissions, selectedTableFilter, searchTerm]);

  const handleInspect = (user: User, template: EditableTableTemplate, submission: UserTableSubmission | null) => {
    setInspectUser(user);
    setInspectTemplate(template);
    setInspectSubmission(submission);
    setReviewerNotes(submission?.reviewer_notes || '');
    setReviewerStatus(submission?.reviewer_status || 'pending');
    setInspectModalOpen(true);
  };

  const handleSaveReviewerFeedback = () => {
    if (!inspectSubmission) {
      onShowToast('No Submission', 'This user has not yet submitted table data.', 'error');
      return;
    }

    const res = storageService.updateTableReviewerFeedback(inspectSubmission.id, {
      reviewer_notes: reviewerNotes,
      reviewer_status: reviewerStatus
    });

    if (res.success && res.submission) {
      setInspectSubmission(res.submission);
      refreshData();
      onShowToast('Feedback Saved', `Review status saved for @${inspectUser?.username}.`, 'success');
    } else {
      onShowToast('Error', res.error || 'Failed to update feedback.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#005a9e] border border-blue-200">
              Biiroo Eegumsa Fayyaa Staff Records Vault
            </span>
            <span className="text-xs text-slate-500 font-semibold">• Organized by Username</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Staff Table Submissions Vault
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            All user data tables submitted to the admin dashboard are tracked and autosaved orderly by username.
          </p>
        </div>

        {onBackToTables && (
          <button
            onClick={onBackToTables}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs transition-colors self-start cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#005a9e]" />
            <span>Manage Table Templates</span>
          </button>
        )}
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by username, full name, or Gmail..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#005a9e] outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedTableFilter}
              onChange={(e) => setSelectedTableFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#005a9e] outline-none text-slate-700"
            >
              <option value="all">All Editable Tables</option>
              {templates.map(t => (
                <option key={t.id} value={t.id.toString()}>{t.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          Showing {userVaultData.length} Healthcare Staff Profiles
        </div>
      </div>

      {/* User ID Vault Cards / Groups */}
      <div className="space-y-4">
        {userVaultData.map(({ user, assignedCount, submittedCount, draftCount, records }) => {
          const isExpanded = expandedUserId === user.id || userVaultData.length === 1;

          return (
            <div
              key={user.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-slate-300"
            >
              {/* User Group Header */}
              <div
                onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors select-none"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-11 h-11 rounded-2xl text-white flex items-center justify-center font-bold shrink-0 shadow-xs text-sm"
                    style={{ backgroundColor: user.avatar_color || '#005a9e' }}
                  >
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">
                        {user.full_name || `@${user.username}`}
                      </h3>
                      <span className="text-xs text-slate-500 font-mono">@{user.username}</span>
                    </div>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{submittedCount} Submitted</span>
                    </span>

                    {draftCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>{draftCount} Drafts</span>
                      </span>
                    )}

                    <span className="text-xs text-slate-400 font-semibold hidden md:inline">
                      {records.length} Tables Assigned
                    </span>
                  </div>

                  <div className="text-slate-400">
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Collapsible Tables List for this User */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/40 p-5 space-y-3">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Assigned Tables Stored for @{user.username}:
                  </div>

                  {records.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                      No tables match the current filter for this user.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {records.map(({ template, submission, status, rowCount, submittedAt, reviewerStatus }) => {
                        const hasSubmission = Boolean(submission);

                        return (
                          <div
                            key={template.id}
                            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between space-y-3 hover:border-blue-300 transition-colors"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <FileSpreadsheet className="w-4 h-4 text-[#005a9e] shrink-0" />
                                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                                    {template.title}
                                  </h4>
                                </div>

                                {status === 'submitted' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                                    Submitted
                                  </span>
                                ) : status === 'draft' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                                    Draft
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                    Not Started
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                <div>
                                  <span className="text-slate-400 font-medium block">Rows Filled:</span>
                                  <span className="font-bold text-slate-800">{rowCount} rows</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-medium block">Submitted Date:</span>
                                  <span className="font-medium text-slate-800 truncate block">
                                    {submittedAt ? new Date(submittedAt).toLocaleDateString() : '—'}
                                  </span>
                                </div>
                                {reviewerStatus && reviewerStatus !== 'pending' && (
                                  <div className="col-span-2">
                                    <span className="text-slate-400 font-medium block">Review Status:</span>
                                    <span className={`font-bold capitalize ${
                                      reviewerStatus === 'approved' ? 'text-emerald-700' : 'text-rose-700'
                                    }`}>
                                      {reviewerStatus.replace('_', ' ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 font-mono">
                                @{user.username}
                              </span>

                              <button
                                onClick={() => handleInspect(user, template, submission)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#005a9e] text-xs font-bold rounded-xl border border-blue-200 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{hasSubmission ? 'Inspect Filled Table' : 'Preview Blank Grid'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* INSPECT TABLE MODAL */}
      {inspectModalOpen && inspectUser && inspectTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#005a9e] text-white font-mono">
                    @{inspectUser.username}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {inspectUser.full_name || inspectUser.username} ({inspectUser.email})
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  {inspectTemplate.title}
                </h2>
                {inspectSubmission?.submitted_at && (
                  <p className="text-xs text-slate-500">
                    Submitted on {new Date(inspectSubmission.submitted_at).toLocaleString()}
                  </p>
                )}
              </div>

              <button
                onClick={() => setInspectModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {inspectSubmission?.user_notes && (
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
                  <MessageSquare className="w-4 h-4 text-[#005a9e] shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-950">
                    <strong className="block font-bold mb-0.5">Staff Notes to Admin:</strong>
                    <p className="whitespace-pre-wrap">{inspectSubmission.user_notes}</p>
                  </div>
                </div>
              )}

              {/* Filled Spreadsheet Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Submitted Rows ({inspectSubmission ? inspectSubmission.rows.length : 0} rows)
                  </h3>
                </div>

                <TableGridEditor
                  columns={inspectTemplate.columns}
                  rows={inspectSubmission ? inspectSubmission.rows : (inspectTemplate.default_rows || [])}
                  readOnly={true}
                  allowAddRows={false}
                />
              </div>

              {/* Admin Reviewer Feedback */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#005a9e]" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Admin Verification & Status
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Review Status
                    </label>
                    <select
                      value={reviewerStatus}
                      onChange={(e) => setReviewerStatus(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#005a9e] outline-none"
                    >
                      <option value="pending">Pending Review</option>
                      <option value="approved">Approved & Verified</option>
                      <option value="needs_revision">Needs Revision / Resubmit</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Feedback for Staff User
                    </label>
                    <textarea
                      rows={2}
                      value={reviewerNotes}
                      onChange={(e) => setReviewerNotes(e.target.value)}
                      placeholder="e.g. Data reviewed and validated for regional health reporting."
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#005a9e] outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveReviewerFeedback}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#005a9e] hover:bg-[#004b85] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Feedback to Staff Portal</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-xs text-slate-500">
                Staff member @{inspectUser.username} • Autosaved orderly
              </span>

              <button
                onClick={() => setInspectModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
