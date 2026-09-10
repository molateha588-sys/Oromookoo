import React, { useState } from 'react';
import { 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Search, 
  Filter, 
  Calendar, 
  FileText, 
  Tag, 
  ExternalLink,
  Plus
} from 'lucide-react';
import { User, Submission, Form } from '../../types';
import { storageService } from '../../services/storageService';

interface MySubmissionsViewProps {
  currentUser: User;
  onOpenForm: (formId: number) => void;
  onNavigateToDashboard: () => void;
}

export const MySubmissionsView: React.FC<MySubmissionsViewProps> = ({
  currentUser,
  onOpenForm,
  onNavigateToDashboard
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allSubmissions = storageService.getSubmissions().filter(s => s.user_id === currentUser.id);
  const allForms = storageService.getForms();

  const enrichedSubmissions = allSubmissions.map(sub => {
    const form = allForms.find(f => f.id === sub.form_id);
    return {
      ...sub,
      form_title: form ? form.title : `Form #${sub.form_id}`,
      form_category: form ? form.category : 'General',
      form_description: form?.description,
      fields_count: form ? form.fields.length : 0
    };
  });

  const filtered = enrichedSubmissions.filter(sub => {
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    const matchesSearch = sub.form_title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Submissions & Drafts</h1>
          </div>
          <p className="text-xs text-slate-500">
            Track, review, or resume your filled questionnaires and operational reports
          </p>
        </div>

        <button
          onClick={onNavigateToDashboard}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Report Form</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filterStatus === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Submissions ({enrichedSubmissions.length})
          </button>
          <button
            onClick={() => setFilterStatus('submitted')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filterStatus === 'submitted'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Submitted ({enrichedSubmissions.filter(s => s.status === 'submitted').length})
          </button>
          <button
            onClick={() => setFilterStatus('draft')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filterStatus === 'draft'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Drafts ({enrichedSubmissions.filter(s => s.status === 'draft').length})
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by form title..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>
      </div>

      {/* Submissions List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900">No submissions recorded</h3>
          <p className="text-xs text-slate-500 mt-1">
            {filterStatus === 'all'
              ? 'You have not started or submitted any reports yet.'
              : `No submissions currently in "${filterStatus}" status.`}
          </p>
          <button
            onClick={onNavigateToDashboard}
            className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Explore Available Forms
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Report Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Submitted Date</th>
                  <th className="py-3.5 px-4">Last Updated</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map(sub => {
                  const isSubmitted = sub.status === 'submitted';
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-900 max-w-xs">
                        <div className="truncate font-bold">{sub.form_title}</div>
                        <div className="text-[11px] text-slate-400 font-normal">
                          {sub.fields_count} fields answered
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {sub.form_category || 'General'}
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
                        <button
                          onClick={() => onOpenForm(sub.form_id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            isSubmitted
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                          }`}
                        >
                          <span>{isSubmitted ? 'View Report' : 'Resume Draft'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
