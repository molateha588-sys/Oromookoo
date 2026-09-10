import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  FileSpreadsheet, 
  Calendar, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Download,
  Check,
  Edit3,
  Printer,
  Eye
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { User, EditableTableTemplate, UserTableSubmission, TableRowData, TableStyleConfig } from '../../types';
import { TableGridEditor } from '../common/TableGridEditor';

interface UserTableFillViewProps {
  tableId: number;
  currentUser: User;
  onBack: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const UserTableFillView: React.FC<UserTableFillViewProps> = ({
  tableId,
  currentUser,
  onBack,
  onShowToast
}) => {
  const [template, setTemplate] = useState<EditableTableTemplate | null>(null);
  const [submission, setSubmission] = useState<UserTableSubmission | null>(null);
  const [rows, setRows] = useState<TableRowData[]>([]);
  const [userNotes, setUserNotes] = useState('');
  const [highlightRequired, setHighlightRequired] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true);
  const [styling, setStyling] = useState<TableStyleConfig | undefined>(undefined);
  const [lastAutosavedTime, setLastAutosavedTime] = useState<string | null>(null);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const isInitialMount = React.useRef(true);

  // Load table template and existing user submission (strictly isolated to currentUser.id)
  useEffect(() => {
    const tpl = storageService.getTableTemplateById(tableId);
    if (!tpl) {
      onShowToast('Excel Form Not Found', 'The requested Excel form does not exist or has been removed.', 'error');
      onBack();
      return;
    }
    setTemplate(tpl);
    setStyling(tpl.styling);

    // Get this user's specific submission
    const existingSub = storageService.getTableSubmissionForUserAndTable(currentUser.id, tableId);
    if (existingSub) {
      setSubmission(existingSub);
      setRows(existingSub.rows || []);
      setUserNotes(existingSub.user_notes || '');
      setLastAutosavedTime(new Date(existingSub.updated_at).toLocaleTimeString());
      // If already submitted, start in edit mode but let user toggle view/edit mode freely
      setIsEditMode(true);
    } else {
      // Initialize with template default rows if available, or one empty row
      const initialRows = (tpl.default_rows && tpl.default_rows.length > 0)
        ? JSON.parse(JSON.stringify(tpl.default_rows))
        : [{}];
      setRows(initialRows);
      setIsEditMode(true);
    }
  }, [tableId, currentUser.id]);

  // Real-time debounced auto-save to storage service with current username
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!template) return;

    setIsAutosaving(true);
    const timer = setTimeout(() => {
      // Determine action based on current submission state
      const targetAction = submission?.status === 'submitted' ? 'submit' : 'draft';
      const res = storageService.saveTableSubmission(tableId, currentUser.id, targetAction, rows, userNotes);
      if (res.success && res.submission) {
        setSubmission(res.submission);
        setLastAutosavedTime(new Date().toLocaleTimeString());
      }
      setIsAutosaving(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [rows, userNotes, tableId, currentUser.id]);

  if (!template) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-slate-500">
        Loading Excel form...
      </div>
    );
  }

  const isSubmitted = submission?.status === 'submitted';

  // Save as Draft
  const handleSaveDraft = () => {
    setIsSaving(true);
    const res = storageService.saveTableSubmission(tableId, currentUser.id, 'draft', rows, userNotes);
    setIsSaving(false);

    if (res.success && res.submission) {
      setSubmission(res.submission);
      onShowToast('Draft Saved', 'Your Excel form data is safely saved. You can edit and complete it anytime.', 'success');
    } else {
      onShowToast('Save Error', res.error || 'Failed to save draft.', 'error');
    }
  };

  // Final Submit to Admin
  const handleSubmitToAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setHighlightRequired(true);

    const res = storageService.saveTableSubmission(tableId, currentUser.id, 'submit', rows, userNotes);

    if (res.success && res.submission) {
      setSubmission(res.submission);
      onShowToast(
        'Submitted & Auto-Saved', 
        `Your filled Excel data for "${template.title}" is auto-saved in the Admin Master Excel under assigned username @${currentUser.username}. You can re-edit anytime.`, 
        'success'
      );
    } else {
      onShowToast('Submission Incomplete', res.error || 'Please fill all required cells before submitting.', 'error');
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset this table to the admin starter template rows? Any unsaved edits will be discarded.')) {
      const initialRows = (template.default_rows && template.default_rows.length > 0)
        ? JSON.parse(JSON.stringify(template.default_rows))
        : [{}];
      setRows(initialRows);
      onShowToast('Reset Table', 'Table reset to initial starter rows.', 'info');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Navigation & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-xs transition-colors self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Excel Forms</span>
        </button>

        {/* Status Pill & User Isolation Badge */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Assigned to: <strong>{currentUser.username}</strong> (User ID: #{currentUser.id})</span>
          </span>

          {isSubmitted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Submitted & Auto-Saved</span>
            </span>
          ) : submission?.status === 'draft' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Draft Saved</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
              <span>Ready for Input</span>
            </span>
          )}

          {submission?.reviewer_status && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              submission.reviewer_status === 'approved'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              <span>Review: {submission.reviewer_status.toUpperCase()}</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6 print-container">
        {/* Table Banner */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                <span>Excel Spreadsheet Form</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                {template.category || 'Data Table'}
              </span>
              {template.due_date && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Due: {template.due_date}</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{template.title}</span>
            </h1>
            {template.description && (
              <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
                {template.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors shadow-xs"
              title="Print your filled Excel form"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Form</span>
            </button>

            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors shrink-0"
              title="Reset rows to admin default"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Excel Help & Live Autosave Notice with Operational Statement */}
        <div className="no-print p-4 rounded-2xl bg-emerald-50/90 border border-emerald-300 space-y-2.5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-950 leading-relaxed">
                <div className="flex items-center gap-2 mb-0.5">
                  <strong className="font-bold text-emerald-950">
                    Live Autosave to Admin Master Excel Active
                  </strong>
                  <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-200 text-emerald-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    @{currentUser.username}
                  </span>
                </div>
                <span>
                  Fill your data below. You can freely <strong>edit your input data anytime</strong> if you make an error, and all changes are automatically stored and auto-saved in one organized Excel table on the Admin Dashboard.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 bg-white/80 px-3 py-1.5 rounded-xl border border-emerald-200 text-[11px] font-bold text-emerald-800">
              {isAutosaving ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>Autosaving changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Autosaved {lastAutosavedTime ? `at ${lastAutosavedTime}` : 'live'}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Admin Instructions Banner */}
        {template.instructions && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-800 leading-relaxed">
              <strong className="font-bold block mb-0.5 text-slate-900">Instructions from Admin:</strong>
              {template.instructions}
            </div>
          </div>
        )}

        {/* Reviewer Feedback Card (if Admin provided notes) */}
        {submission?.reviewer_notes && (
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
            <MessageSquare className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <strong className="font-bold block mb-0.5 text-amber-950">Admin Reviewer Feedback:</strong>
              <p className="whitespace-pre-wrap">{submission.reviewer_notes}</p>
            </div>
          </div>
        )}

        {/* Interactive Spreadsheet Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Excel Data Cells ({rows.length} {rows.length === 1 ? 'row' : 'rows'})
              </label>
              {isSubmitted && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Editing Active Submission
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400">
              Click any cell to edit • Press Tab/Enter • Values calculate live in the footer
            </span>
          </div>

          <TableGridEditor
            columns={template.columns}
            rows={rows}
            onChangeRows={setRows}
            readOnly={false}
            allowAddRows={template.allow_add_rows !== false}
            minRows={template.min_rows || 1}
            maxRows={template.max_rows || 100}
            highlightEmptyRequired={highlightRequired}
            styling={styling}
            onChangeStyling={setStyling}
            allowStyling={true}
            title={template.title}
          />
        </div>

        {/* User Notes to Admin */}
        <div className="pt-4 border-t border-slate-100 space-y-2 no-print">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Comments / Notes for Admin (Optional)
          </label>
          <textarea
            rows={2}
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            placeholder="Add any explanations or notes for the admin..."
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>

        {/* Submission Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-slate-100 no-print">
          <div className="text-xs text-slate-500">
            {submission?.updated_at ? (
              <span>Last saved: {new Date(submission.updated_at).toLocaleString()}</span>
            ) : (
              <span>Unsaved changes in this session</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-xs transition-colors"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span>Save Progress as Draft</span>
            </button>

            <button
              type="button"
              onClick={handleSubmitToAdmin}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitted ? 'Save & Update Submitted Data' : 'Submit Table to Admin'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
