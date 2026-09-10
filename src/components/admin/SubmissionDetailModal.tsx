import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  User as UserIcon, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Tag, 
  MessageSquare, 
  Save, 
  Star,
  ExternalLink
} from 'lucide-react';
import { Submission, Form, User } from '../../types';
import { storageService } from '../../services/storageService';

interface SubmissionDetailModalProps {
  submissionId: number | null;
  onClose: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({
  submissionId,
  onClose,
  onShowToast
}) => {
  if (!submissionId) return null;

  const submission = storageService.getSubmissionById(submissionId);
  const form = submission ? storageService.getFormById(submission.form_id) : null;
  const user = submission ? storageService.getUserById(submission.user_id) : null;

  const [notes, setNotes] = useState(submission?.reviewer_notes || '');
  const [savingNotes, setSavingNotes] = useState(false);

  if (!submission || !form || !user) return null;

  const handleSaveNotes = () => {
    setSavingNotes(true);
    storageService.updateReviewerNotes(submission.id, notes);
    setSavingNotes(false);
    onShowToast('Feedback Saved', 'Reviewer feedback notes updated for this submission.', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const isSubmitted = submission.status === 'submitted';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{form.title}</h3>
                {isSubmitted ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Submitted
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    Draft
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Submission #{submission.id} • {form.category || 'General'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              title="Print / Save as PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {/* Submitter Info Grid */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">Submitter</span>
              <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                {user.username}
              </div>
              <span className="text-slate-500 text-[11px]">{user.email}</span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">Staff Profile</span>
              <div className="font-bold text-slate-900 mt-0.5">{user.full_name || `@${user.username}`}</div>
            </div>

            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">Submission Date</span>
              <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : 'Draft not submitted'}
              </div>
              <span className="text-slate-400 text-[11px]">Updated: {new Date(submission.updated_at).toLocaleString()}</span>
            </div>
          </div>

          {/* Questions & Answers Section */}
          <div className="space-y-5">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Questionnaire Responses ({form.fields.length} Fields)
            </h4>

            {form.fields.map((field, idx) => {
              const answer = submission.data[field.id.toString()];
              const hasAnswer = answer !== undefined && answer !== null && answer !== '';

              return (
                <div key={field.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      <span className="text-slate-400 mr-1.5">#{idx + 1}</span>
                      {field.field_label}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-slate-400">
                      {field.field_type}
                    </span>
                  </div>

                  <div className="pt-1">
                    {!hasAnswer ? (
                      <span className="text-xs text-slate-400 italic">No response provided</span>
                    ) : field.field_type === 'rating' ? (
                      <div className="flex items-center gap-1.5 text-amber-500">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${parseInt(answer, 10) >= star ? 'fill-amber-400 text-amber-500' : 'text-slate-200'}`}
                          />
                        ))}
                        <span className="text-xs font-bold text-slate-700 ml-1.5">({answer} / 5)</span>
                      </div>
                    ) : Array.isArray(answer) ? (
                      <div className="flex flex-wrap gap-1.5">
                        {answer.map((item, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : field.field_type === 'textarea' ? (
                      <p className="text-xs text-slate-900 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {answer}
                      </p>
                    ) : (
                      <p className="text-xs font-semibold text-slate-900">
                        {answer}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Admin Reviewer Notes Section */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Admin Review & Internal Feedback Notes</span>
            </div>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add official reviewer feedback, follow-up actions, or approval notes..."
              className="w-full p-3 text-xs border border-indigo-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Feedback</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-400">Report Portal Security Audited</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
