import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Copy, 
  Calendar, 
  Layers, 
  Eye, 
  Tag, 
  CheckCircle2, 
  Clock, 
  Sparkles
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { Form } from '../../types';

interface FormsManagementProps {
  onNavigateToBuilder: (formId?: number) => void;
  onPreviewForm: (formId: number) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const FormsManagement: React.FC<FormsManagementProps> = ({
  onNavigateToBuilder,
  onPreviewForm,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const allForms = storageService.getForms();
  const allSubmissions = storageService.getSubmissions();

  const categories = ['all', ...Array.from(new Set(allForms.map(f => f.category || 'General')))];

  const filteredForms = allForms.filter(form => {
    const matchesSearch = form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (form.description && form.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || (form.category || 'General') === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleDeleteForm = (form: Form) => {
    if (window.confirm(`Are you sure you want to delete form "${form.title}"? All existing submissions and drafts for this form will also be deleted.`)) {
      const result = storageService.deleteForm(form.id);
      if (result.success) {
        onShowToast('Form Deleted', `Template "${form.title}" was removed.`, 'info');
      } else {
        onShowToast('Error', result.error || 'Failed to delete form', 'error');
      }
    }
  };

  const handleDuplicateForm = (form: Form) => {
    const duplicated = storageService.createForm({
      title: `${form.title} (Copy)`,
      description: form.description,
      category: form.category,
      due_date: form.due_date,
      fields: form.fields.map(f => ({
        ...f,
        id: Date.now() + Math.floor(Math.random() * 1000)
      }))
    });
    onShowToast('Template Duplicated', `Created copy as "${duplicated.title}".`, 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Report Forms & Questionnaire Catalog</h1>
          </div>
          <p className="text-xs text-slate-500">
            Build custom dynamic reports, configure questionnaire fields, and assign templates to staff
          </p>
        </div>

        <button
          onClick={() => onNavigateToBuilder()}
          id="btn-create-new-form"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Template</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? `All Templates (${allForms.length})` : cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>
      </div>

      {/* Forms Grid */}
      {filteredForms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900">No report templates match criteria</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or create a new template.</p>
          <button
            onClick={() => onNavigateToBuilder()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
          >
            Create Form Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map(form => {
            const formSubs = allSubmissions.filter(s => s.form_id === form.id);
            const submittedCount = formSubs.filter(s => s.status === 'submitted').length;
            const draftCount = formSubs.filter(s => s.status === 'draft').length;

            return (
              <div
                key={form.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-lg hover:border-indigo-200 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-indigo-500" />
                      {form.category || 'General'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDuplicateForm(form)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Duplicate Template"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteForm(form)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {form.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {form.description || 'No detailed instructions configured.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 space-y-4">
                  {/* Meta stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>{form.fields.length} Custom Fields</span>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-emerald-600 font-bold flex items-center gap-1" title="Submitted">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {submittedCount}
                      </span>
                      <span className="text-amber-600 font-bold flex items-center gap-1" title="Drafts">
                        <Clock className="w-3.5 h-3.5" />
                        {draftCount}
                      </span>
                    </div>
                  </div>

                  {form.due_date && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Schedule: {form.due_date}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onPreviewForm(form.id)}
                      className="py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => onNavigateToBuilder(form.id)}
                      className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Schema</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
