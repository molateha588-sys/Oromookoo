import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  Save, 
  Eye, 
  Sparkles, 
  Layers, 
  Check, 
  AlertCircle, 
  Type, 
  AlignLeft, 
  Hash, 
  ListOrdered, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  Star,
  Copy,
  Tag
} from 'lucide-react';
import { Form, FormField, FormFieldType } from '../../types';
import { storageService } from '../../services/storageService';

interface FormBuilderViewProps {
  editFormId?: number | null;
  onBack: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const FormBuilderView: React.FC<FormBuilderViewProps> = ({
  editFormId,
  onBack,
  onShowToast
}) => {
  const isEditing = !!editFormId;
  const existingForm = editFormId ? storageService.getFormById(editFormId) : null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Operations');
  const [dueDate, setDueDate] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingForm) {
      setTitle(existingForm.title);
      setDescription(existingForm.description || '');
      setCategory(existingForm.category || 'Operations');
      setDueDate(existingForm.due_date || '');
      setFields(JSON.parse(JSON.stringify(existingForm.fields)));
    } else {
      // Default starter fields for a new form
      setFields([
        {
          id: Date.now() + 1,
          form_id: 0,
          field_label: 'Primary Project or Topic Title',
          field_type: 'text',
          required: true,
          order_index: 1,
          placeholder: 'e.g. Q3 Growth Initiative'
        },
        {
          id: Date.now() + 2,
          form_id: 0,
          field_label: 'Current Status Assessment',
          field_type: 'select',
          required: true,
          order_index: 2,
          options: ['On Track', 'Needs Attention', 'Critical Blocker']
        },
        {
          id: Date.now() + 3,
          form_id: 0,
          field_label: 'Detailed Summary & Action Items',
          field_type: 'textarea',
          required: true,
          order_index: 3,
          placeholder: 'Describe progress, key numbers, or blockers...'
        }
      ]);
    }
  }, [editFormId, existingForm]);

  const handleAddField = (type: FormFieldType = 'text') => {
    const newField: FormField = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      form_id: editFormId || 0,
      field_label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      field_type: type,
      required: false,
      order_index: fields.length + 1,
      placeholder: '',
      help_text: '',
      options: ['select', 'radio', 'checkbox'].includes(type) ? ['Option 1', 'Option 2', 'Option 3'] : undefined
    };
    setFields([...fields, newField]);
  };

  const handleUpdateField = (fieldId: number, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === fieldId ? { ...f, ...updates } : f));
  };

  const handleDeleteField = (fieldId: number) => {
    if (fields.length <= 1) {
      setError('A report form must contain at least 1 field.');
      return;
    }
    setFields(fields.filter(f => f.id !== fieldId));
    setError(null);
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;

    const copy = [...fields];
    const temp = copy[index];
    copy[index] = copy[newIndex];
    copy[newIndex] = temp;
    // update order_index
    copy.forEach((f, idx) => { f.order_index = idx + 1; });
    setFields(copy);
  };

  const handleAddOption = (fieldId: number) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    const currentOptions = field.options || [];
    const newOptions = [...currentOptions, `Option ${currentOptions.length + 1}`];
    handleUpdateField(fieldId, { options: newOptions });
  };

  const handleUpdateOption = (fieldId: number, optIndex: number, val: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field || !field.options) return;
    const newOptions = [...field.options];
    newOptions[optIndex] = val;
    handleUpdateField(fieldId, { options: newOptions });
  };

  const handleDeleteOption = (fieldId: number, optIndex: number) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field || !field.options || field.options.length <= 1) return;
    const newOptions = field.options.filter((_, i) => i !== optIndex);
    handleUpdateField(fieldId, { options: newOptions });
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Form title is required');
      return;
    }

    if (fields.length === 0) {
      setError('Please add at least one questionnaire field');
      return;
    }

    // Check empty labels
    for (const f of fields) {
      if (!f.field_label.trim()) {
        setError('All fields must have a non-empty label');
        return;
      }
    }

    if (isEditing && editFormId) {
      const result = storageService.updateForm(editFormId, {
        title: title.trim(),
        description: description.trim(),
        category,
        due_date: dueDate.trim() || undefined,
        fields
      });
      if (result.success) {
        onShowToast('Form Updated', `Template "${title}" updated successfully.`, 'success');
        onBack();
      } else {
        setError(result.error || 'Failed to update form');
      }
    } else {
      const created = storageService.createForm({
        title: title.trim(),
        description: description.trim(),
        category,
        due_date: dueDate.trim() || undefined,
        fields
      });
      onShowToast('Form Created', `New template "${created.title}" is now live for users.`, 'success');
      onBack();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Forms Catalog</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowLivePreview(!showLivePreview)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              showLivePreview
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{showLivePreview ? 'Hide Preview' : 'Show Live Preview'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveForm}
            id="save-form-builder-btn"
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 hover:shadow-lg transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Save Changes' : 'Publish Form'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 flex items-start gap-2.5 text-rose-800 text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Main Grid: Builder Left, Live Preview Right */}
      <div className={`grid grid-cols-1 ${showLivePreview ? 'lg:grid-cols-12 gap-8' : 'gap-8'}`}>
        {/* Builder Editor (7 cols if preview shown) */}
        <div className={`${showLivePreview ? 'lg:col-span-7' : 'max-w-4xl mx-auto w-full'} space-y-6`}>
          {/* Form Meta Box */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>General Template Settings</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="builder-form-title">
                Report Title *
              </label>
              <input
                id="builder-form-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Monthly IT Infrastructure Review"
                className="w-full px-3.5 py-2 text-sm font-bold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="builder-form-category">
                  Category
                </label>
                <select
                  id="builder-form-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  <option value="Operations">Operations</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Procurement">Procurement</option>
                  <option value="Compliance">Compliance</option>
                  <option value="HR & Team">HR & Team</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="builder-form-due-date">
                  Due Date / Recurrence Schedule
                </label>
                <input
                  id="builder-form-due-date"
                  type="text"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder="e.g. Every Friday by 5:00 PM"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="builder-form-desc">
                Instructions / Description
              </label>
              <textarea
                id="builder-form-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Give your team context on what to include and why this report is required..."
                className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-y"
              />
            </div>
          </div>

          {/* Form Fields Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Questionnaire Fields ({fields.length})</h3>
                <p className="text-xs text-slate-500">Configure questions, input formats, and response constraints</p>
              </div>

              {/* Quick Add Dropdown / Toolbar */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddField('text')}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Add Short Text input"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddField('textarea')}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Add Multiline Textarea"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Textarea</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddField('select')}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Add Dropdown Select"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Dropdown</span>
                </button>
              </div>
            </div>

            {/* Field Cards */}
            <div className="space-y-4">
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 hover:border-slate-300 transition-colors"
                >
                  {/* Field Card Header & Reorder Controls */}
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        Field Configuration
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveField(idx, 'up')}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-md"
                        title="Move Up"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === fields.length - 1}
                        onClick={() => handleMoveField(idx, 'down')}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-md"
                        title="Move Down"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteField(field.id)}
                        className="p-1 text-rose-400 hover:text-rose-700 rounded-md ml-1"
                        title="Delete Field"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Main Field Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-8">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Question / Label *
                      </label>
                      <input
                        type="text"
                        required
                        value={field.field_label}
                        onChange={(e) => handleUpdateField(field.id, { field_label: e.target.value })}
                        placeholder="e.g. Describe project status..."
                        className="w-full px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Field Type
                      </label>
                      <select
                        value={field.field_type}
                        onChange={(e) => {
                          const newType = e.target.value as FormFieldType;
                          const updates: Partial<FormField> = { field_type: newType };
                          if (['select', 'radio', 'checkbox'].includes(newType) && !field.options) {
                            updates.options = ['Option 1', 'Option 2', 'Option 3'];
                          }
                          handleUpdateField(field.id, updates);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      >
                        <option value="text">Short Text</option>
                        <option value="textarea">Multiline Paragraph</option>
                        <option value="number">Numeric</option>
                        <option value="select">Dropdown Select</option>
                        <option value="radio">Single Choice Radio</option>
                        <option value="checkbox">Multi-select Checkboxes</option>
                        <option value="date">Date Picker</option>
                        <option value="rating">1-5 Rating Scale</option>
                      </select>
                    </div>
                  </div>

                  {/* Placeholder & Helper Text */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Placeholder / Ghost text
                      </label>
                      <input
                        type="text"
                        value={field.placeholder || ''}
                        onChange={(e) => handleUpdateField(field.id, { placeholder: e.target.value })}
                        placeholder="Optional prompt or hint..."
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Help text / Guidance
                      </label>
                      <input
                        type="text"
                        value={field.help_text || ''}
                        onChange={(e) => handleUpdateField(field.id, { help_text: e.target.value })}
                        placeholder="Instructions under label..."
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  {/* Options List for Select, Radio, Checkbox */}
                  {['select', 'radio', 'checkbox'].includes(field.field_type) && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700">Options Choices</span>
                        <button
                          type="button"
                          onClick={() => handleAddOption(field.id)}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                          + Add Option
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {field.options?.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleUpdateOption(field.id, optIdx, e.target.value)}
                              className="flex-1 px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                            />
                            {field.options && field.options.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteOption(field.id, optIdx)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Required Switch */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!field.required}
                        onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-semibold text-slate-700">
                        Mark field as mandatory (Required to submit)
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Field Button */}
            <button
              type="button"
              onClick={() => handleAddField('text')}
              className="w-full py-3 border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-2xl text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Field</span>
            </button>
          </div>
        </div>

        {/* Live Preview Panel (5 cols on large screens) */}
        {showLivePreview && (
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-24 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-xs font-bold uppercase tracking-wider">Live User Preview</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                  Interactive
                </span>
              </div>

              <div className="p-6 space-y-4 max-h-[calc(100vh-14rem)] overflow-y-auto">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                      {category}
                    </span>
                    {dueDate && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        Due: {dueDate}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {title || 'Untitled Report Form'}
                  </h3>
                  {description && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {description}
                    </p>
                  )}
                </div>

                <div className="space-y-4 pt-2 border-t border-slate-100">
                  {fields.map((field, idx) => (
                    <div key={field.id} className="space-y-1">
                      <label className="block text-xs font-bold text-slate-800">
                        <span className="text-slate-400 mr-1">#{idx + 1}</span>
                        {field.field_label || 'Untitled Field'}
                        {field.required && <span className="text-rose-500 ml-1">*</span>}
                      </label>

                      {field.field_type === 'text' && (
                        <input
                          type="text"
                          placeholder={field.placeholder || 'Text input...'}
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50"
                          disabled
                        />
                      )}

                      {field.field_type === 'textarea' && (
                        <textarea
                          rows={2}
                          placeholder={field.placeholder || 'Multiline response...'}
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50"
                          disabled
                        />
                      )}

                      {field.field_type === 'number' && (
                        <input
                          type="number"
                          placeholder={field.placeholder || '0'}
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50"
                          disabled
                        />
                      )}

                      {field.field_type === 'select' && (
                        <select className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50" disabled>
                          <option>-- Select an option --</option>
                          {field.options?.map((opt, i) => (
                            <option key={i}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {field.field_type === 'radio' && (
                        <div className="space-y-1">
                          {field.options?.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                              <input type="radio" disabled checked={i === 0} className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {field.field_type === 'checkbox' && (
                        <div className="space-y-1">
                          {field.options?.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                              <input type="checkbox" disabled checked={i === 0} className="w-3.5 h-3.5 text-indigo-600 rounded" />
                              <span>{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {field.field_type === 'date' && (
                        <input type="date" disabled className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50" />
                      )}

                      {field.field_type === 'rating' && (
                        <div className="flex items-center gap-1 text-amber-400">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-500" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
