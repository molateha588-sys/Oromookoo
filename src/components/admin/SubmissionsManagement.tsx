import React, { useState } from 'react';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  User as UserIcon, 
  Tag, 
  Calendar,
  FileSpreadsheet
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { SubmissionDetailModal } from './SubmissionDetailModal';

interface SubmissionsManagementProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const SubmissionsManagement: React.FC<SubmissionsManagementProps> = ({
  onShowToast
}) => {
  const [selectedFormId, setSelectedFormId] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'submitted' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingSubmissionId, setViewingSubmissionId] = useState<number | null>(null);

  const submissions = storageService.getSubmissions();
  const forms = storageService.getForms();
  const users = storageService.getUsers();

  const enrichedSubmissions = submissions.map(sub => {
    const form = forms.find(f => f.id === sub.form_id);
    const user = users.find(u => u.id === sub.user_id);
    return {
      ...sub,
      formTitle: form ? form.title : `Form #${sub.form_id}`,
      formCategory: form?.category || 'General',
      username: user ? user.username : `User #${sub.user_id}`,
      userEmail: user?.email || '',
      fullName: user?.full_name || (user ? `@${user.username}` : `User #${sub.user_id}`),
      fieldsCount: form ? form.fields.length : 0
    };
  });

  const filtered = enrichedSubmissions.filter(sub => {
    const matchesForm = selectedFormId === 'all' || sub.form_id.toString() === selectedFormId;
    const matchesUser = selectedUserId === 'all' || sub.user_id.toString() === selectedUserId;
    const matchesStatus = selectedStatus === 'all' || sub.status === selectedStatus;
    const matchesSearch = 
      sub.formTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.userEmail.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesForm && matchesUser && matchesStatus && matchesSearch;
  });

  const handleDeleteSubmission = (subId: number) => {
    if (window.confirm('Are you sure you want to remove this submission record?')) {
      storageService.deleteSubmission(subId);
      onShowToast('Submission Deleted', 'The submission record was removed.', 'info');
    }
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      onShowToast('Export Warning', 'No records to export.', 'info');
      return;
    }

    const headers = ['Submission ID', 'Form Title', 'Category', 'Username', 'Email', 'Full Name', 'Status', 'Submitted At', 'Last Updated', 'Data JSON'];
    const rows = filtered.map(s => [
      s.id,
      `"${s.formTitle.replace(/"/g, '""')}"`,
      `"${s.formCategory}"`,
      `"${s.username}"`,
      `"${s.userEmail}"`,
      `"${s.fullName}"`,
      s.status,
      s.submitted_at || '',
      s.updated_at,
      `"${JSON.stringify(s.data).replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `report_portal_submissions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast('CSV Exported', `Downloaded ${filtered.length} submission rows.`, 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">All Organization Submissions</h1>
          </div>
          <p className="text-xs text-slate-500">
            Audit, review, and export all responses collected across your enterprise
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export CSV Spreadsheet</span>
        </button>
      </div>

      {/* Filter and Query Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Form Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Filter by Form
            </label>
            <select
              value={selectedFormId}
              onChange={(e) => setSelectedFormId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="all">All Forms ({forms.length})</option>
              {forms.map(f => (
                <option key={f.id} value={f.id.toString()}>{f.title}</option>
              ))}
            </select>
          </div>

          {/* User Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Filter by User
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="all">All Users ({users.length})</option>
              {users.map(u => (
                <option key={u.id} value={u.id.toString()}>{u.username} ({u.role})</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Submission Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted Only</option>
              <option value="draft">Drafts Only</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Search Keywords
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="User, form title..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Quick summary line */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing <strong>{filtered.length}</strong> of {submissions.length} total entries</span>
          {(selectedFormId !== 'all' || selectedUserId !== 'all' || selectedStatus !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedFormId('all');
                setSelectedUserId('all');
                setSelectedStatus('all');
                setSearchQuery('');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Submissions Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900">No submissions found</h3>
          <p className="text-xs text-slate-500 mt-1">No responses match the active filter criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-6">Submitter</th>
                  <th className="py-3.5 px-4">Report Form</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Submitted At</th>
                  <th className="py-3.5 px-4">Last Activity</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map(sub => {
                  const isSubmitted = sub.status === 'submitted';

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                          {sub.username}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{sub.fullName} • {sub.userEmail}</div>
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-900 max-w-xs truncate">
                        {sub.formTitle}
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                          {sub.formCategory}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        {isSubmitted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Draft Saved
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-500">
                        {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : '—'}
                      </td>

                      <td className="py-4 px-4 text-slate-500">
                        {sub.updated_at ? new Date(sub.updated_at).toLocaleString() : '—'}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setViewingSubmissionId(sub.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold transition-colors"
                            title="Inspect full questionnaire answers"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          <button
                            onClick={() => handleDeleteSubmission(sub.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Submission"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submission Detail Modal */}
      <SubmissionDetailModal
        submissionId={viewingSubmissionId}
        onClose={() => setViewingSubmissionId(null)}
        onShowToast={onShowToast}
      />
    </div>
  );
};
