import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  Tag, 
  FileText, 
  Printer, 
  Edit3, 
  Star,
  Info
} from 'lucide-react';
import { Form, FormField, Submission, User } from '../../types';
import { storageService } from '../../services/storageService';

interface ReportFormViewProps {
  formId: number;
  currentUser: User;
  onBack: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ReportFormView: React.FC<ReportFormViewProps> = ({
  formId,
  currentUser,
  onBack,
  onShowToast
}) => {
  const form = storageService.getFormById(formId);
  const existingSubmission = storageService.getSubmissionForUserAndForm(currentUser.id, formId);

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isEditingSubmitted, setIsEditingSubmitted] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingSubmission) {
      setFormData(existingSubmission.data || {});
      setIsSubmitted(existingSubmission.status === 'submitted');
      setLastSavedTime(existingSubmission.updated_at ? new Date(existingSubmission.updated_at).toLocaleTimeString() : null);
    } else if (form) {
      // populate defaults if any
      const initial: Record<string, any> = {};
      form.fields.forEach(field => {
        if (field.default_value) {
          initial[field.id.toString()] = field.default_value;
        }
      });
      setFormData(initial);
    }
  }, [formId, existingSubmission, form]);

  if (!form) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Form Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">This report form may have been removed by an administrator.</p>
        <button
          onClick={onBack}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Dashboard
        </button>
      </div>
    );
  }

  const handleFieldChange = (fieldId: number, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId.toString()]: value
    }));
    setValidationError(null);
  };

  const handleCheckboxToggle = (fieldId: number, option: string) => {
    const key = fieldId.toString();
    const currentArray: string[] = Array.isArray(formData[key]) ? formData[key] : [];
    const exists = currentArray.includes(option);
    const updated = exists ? currentArray.filter(item => item !== option) : [...currentArray, option];
    handleFieldChange(fieldId, updated);
  };

  const handleSaveDraft = () => {
    setValidationError(null);
    setLoading(true);

    const result = storageService.saveSubmission(form.id, currentUser.id, 'draft', formData);
    setLoading(false);

    if (result.success) {
      const timeStr = new Date().toLocaleTimeString();
      setLastSavedTime(timeStr);
      onShowToast('Draft Saved', `Your progress was saved at ${timeStr}.`, 'info');
    } else {
      setValidationError(result.error || 'Failed to save draft');
    }
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate required fields
    for (const field of form.fields) {
      if (field.required) {
        const val = formData[field.id.toString()];
        if (
          val === undefined ||
          val === null ||
          (typeof val === 'string' && val.trim() === '') ||
          (Array.isArray(val) && val.length === 0)
        ) {
          setValidationError(`Required Field Missing: "${field.field_label}"`);
          const element = document.getElementById(`field-${field.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }
      }
    }

    setLoading(true);
    const result = storageService.saveSubmission(form.id, currentUser.id, 'submit', formData);
    setLoading(false);

    if (result.success) {
      setIsSubmitted(true);
      setIsEditingSubmitted(false);
      setLastSavedTime(new Date().toLocaleTimeString());
      onShowToast('Report Submitted', 'Your report has been formally submitted for review.', 'success');
    } else {
      setValidationError(result.error || 'Failed to submit report');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isReadOnly = isSubmitted && !isEditingSubmitted;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          {isReadOnly && (
            <>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print / Export</span>
              </button>

              <button
                onClick={() => setIsEditingSubmitted(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Submission</span>
              </button>
            </>
          )}

          {isEditingSubmitted && (
            <button
              onClick={() => setIsEditingSubmitted(false)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel Edit Mode
            </button>
          )}
        </div>
      </div>

      {/* Submission Status Alert Banner */}
      {isSubmitted && !isEditingSubmitted ? (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold">Report Formally Submitted</h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Submitted on {existingSubmission?.submitted_at ? new Date(existingSubmission.submitted_at).toLocaleString() : 'Recently'} by {currentUser.username}.
              </p>
              {existingSubmission?.reviewer_notes && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-white/80 border border-emerald-200 text-xs">
                  <span className="font-semibold text-emerald-900">Admin Feedback: </span>
                  <span className="text-emerald-800">{existingSubmission.reviewer_notes}</span>
                </div>
              )}
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-800">
            Read-Only
          </span>
        </div>
      ) : existingSubmission && existingSubmission.status === 'draft' ? (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h3 className="text-sm font-bold">Draft in Progress</h3>
              <p className="text-xs text-amber-800">
                Last modified: {lastSavedTime ? `${lastSavedTime}` : 'Earlier'}. Remember to submit when finished.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-200 text-amber-800">
            Draft
          </span>
        </div>
      ) : null}

      {/* Main Form Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Form Header */}
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/40">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
              <Tag className="w-3 h-3 text-indigo-500" />
              {form.category || 'General'}
            </span>
            {form.due_date && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                Due: {form.due_date}
              </span>
            )}
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
              {form.fields.length} Questionnaire Fields
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {form.title}
          </h1>

          {form.description && (
            <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-3xl">
              {form.description}
            </p>
          )}

          <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center gap-4 text-xs text-slate-500">
            <span>Respondent: <strong className="text-slate-800 font-semibold">{currentUser.username}</strong> ({currentUser.email})</span>
            <span>•</span>
            <span>Department: <strong className="text-slate-800 font-semibold">{currentUser.department || 'Operations'}</strong></span>
          </div>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="mx-6 sm:mx-8 mt-6 p-4 rounded-xl border border-rose-200 bg-rose-50 flex items-start gap-3 text-rose-800 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{validationError}</div>
          </div>
        )}

        {/* Dynamic Fields Form */}
        <form onSubmit={handleSubmitReport} className="p-6 sm:p-8 space-y-6">
          {form.fields.map((field: FormField, index: number) => {
            const fieldKey = field.id.toString();
            const fieldValue = formData[fieldKey] !== undefined ? formData[fieldKey] : '';

            return (
              <div 
                key={field.id}
                id={`field-${field.id}`}
                className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/30 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <label className="block text-sm font-bold text-slate-900">
                    <span className="text-slate-400 text-xs mr-1.5 font-normal">#{index + 1}</span>
                    {field.field_label}
                    {field.required && (
                      <span className="text-rose-500 ml-1 font-bold" title="Required field">*</span>
                    )}
                  </label>
                  {field.required && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                      Required
                    </span>
                  )}
                </div>

                {field.help_text && (
                  <p className="text-xs text-slate-500 mb-2.5 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    {field.help_text}
                  </p>
                )}

                {/* Field Type Specific Controls */}
                <div className="mt-1">
                  {/* TEXT INPUT */}
                  {field.field_type === 'text' && (
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={fieldValue}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder || "Type your response..."}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-100 disabled:text-slate-700 transition-colors"
                    />
                  )}

                  {/* TEXTAREA */}
                  {field.field_type === 'textarea' && (
                    <textarea
                      rows={4}
                      disabled={isReadOnly}
                      value={fieldValue}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder || "Detailed notes or summary..."}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-100 disabled:text-slate-700 transition-colors resize-y"
                    />
                  )}

                  {/* NUMBER */}
                  {field.field_type === 'number' && (
                    <input
                      type="number"
                      disabled={isReadOnly}
                      value={fieldValue}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder || "0"}
                      className="w-full sm:w-64 px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-100 disabled:text-slate-700 transition-colors"
                    />
                  )}

                  {/* SELECT DROPDOWN */}
                  {field.field_type === 'select' && (
                    <select
                      disabled={isReadOnly}
                      value={fieldValue}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-100 disabled:text-slate-700 transition-colors"
                    >
                      <option value="">-- Please select an option --</option>
                      {field.options?.map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {/* RADIO BUTTONS */}
                  {field.field_type === 'radio' && (
                    <div className="space-y-2 mt-1">
                      {field.options?.map((opt, i) => (
                        <label
                          key={i}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                            fieldValue === opt
                              ? 'border-indigo-500 bg-indigo-50/40 text-indigo-950 font-medium'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          } ${isReadOnly ? 'pointer-events-none opacity-80' : ''}`}
                        >
                          <input
                            type="radio"
                            name={`radio-field-${field.id}`}
                            value={opt}
                            disabled={isReadOnly}
                            checked={fieldValue === opt}
                            onChange={() => handleFieldChange(field.id, opt)}
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* CHECKBOXES (MULTI-SELECT) */}
                  {field.field_type === 'checkbox' && (
                    <div className="space-y-2 mt-1">
                      {field.options?.map((opt, i) => {
                        const checked = Array.isArray(fieldValue) && fieldValue.includes(opt);
                        return (
                          <label
                            key={i}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                              checked
                                ? 'border-indigo-500 bg-indigo-50/40 text-indigo-950 font-medium'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                            } ${isReadOnly ? 'pointer-events-none opacity-80' : ''}`}
                          >
                            <input
                              type="checkbox"
                              disabled={isReadOnly}
                              checked={checked}
                              onChange={() => handleCheckboxToggle(field.id, opt)}
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                            <span className="text-sm">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* DATE */}
                  {field.field_type === 'date' && (
                    <input
                      type="date"
                      disabled={isReadOnly}
                      value={fieldValue}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className="w-full sm:w-64 px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-100 disabled:text-slate-700 transition-colors"
                    />
                  )}

                  {/* RATING (1-5 STARS OR NUMBERS) */}
                  {field.field_type === 'rating' && (
                    <div className="flex items-center gap-2 pt-1">
                      {[1, 2, 3, 4, 5].map((starNum) => {
                        const isSelected = parseInt(fieldValue, 10) >= starNum;
                        return (
                          <button
                            key={starNum}
                            type="button"
                            disabled={isReadOnly}
                            onClick={() => handleFieldChange(field.id, starNum.toString())}
                            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl border transition-all ${
                              isSelected
                                ? 'bg-amber-50 border-amber-400 text-amber-600 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                            } ${isReadOnly ? 'cursor-default' : 'hover:scale-105'}`}
                          >
                            <Star className={`w-5 h-5 ${isSelected ? 'fill-amber-400 text-amber-500' : ''}`} />
                            <span className="text-[10px] font-bold mt-0.5">{starNum}</span>
                          </button>
                        );
                      })}
                      <span className="text-xs font-semibold text-slate-500 ml-2">
                        {fieldValue ? `Rating: ${fieldValue} / 5` : 'Select score'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Form Action Controls */}
          {!isReadOnly && (
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {lastSavedTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Last saved: {lastSavedTime}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id="save-draft-btn"
                  onClick={handleSaveDraft}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-slate-500" />
                  <span>Save Draft</span>
                </button>

                <button
                  type="submit"
                  id="submit-report-btn"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-100 hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Official Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
