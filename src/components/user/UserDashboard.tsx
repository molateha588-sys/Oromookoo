import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Search, 
  FileSpreadsheet, 
  Table as TableIcon,
  Download,
  AlertCircle,
  PlusCircle,
  Activity,
  Send,
  Sparkles,
  Edit3,
  Calendar,
  CheckCircle,
  FileCheck,
  Tag,
  ShieldCheck,
  ChevronRight,
  MapPin,
  Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { User, FormWithStatus, TableWithStatus } from '../../types';
import { storageService } from '../../services/storageService';

interface UserDashboardProps {
  currentUser: User;
  onSelectForm: (formId: number) => void;
  onSelectTable: (tableId: number) => void;
  onNavigateToSubmissions: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  currentUser,
  onSelectForm,
  onSelectTable,
  onNavigateToSubmissions
}) => {
  // Report Form state
  const [reportType, setReportType] = useState('Acute Fever');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [affectedCount, setAffectedCount] = useState<number | ''>('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('low');
  const [notes, setNotes] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Tab selection: Assigned Excel Tables (default), Quick Report, Forms
  const [activeTab, setActiveTab] = useState<'tables' | 'report' | 'forms'>('tables');
  const [tableSearchTerm, setTableSearchTerm] = useState('');
  const [tableStatusFilter, setTableStatusFilter] = useState<'all' | 'submitted' | 'draft' | 'pending'>('all');

  const forms = storageService.getUserFormsWithStatus(currentUser.id);
  const tables = storageService.getUserAssignedTablesWithStatus(currentUser.id);
  const submissions = storageService.getUserSubmissions(currentUser.id);

  const handleSubmitQuickReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!village || !affectedCount || Number(affectedCount) < 1) {
      alert('Please fill all required fields');
      return;
    }

    // Save as submission in storage
    const customTitle = `${reportType} – ${affectedCount} people`;
    const newSubmission = storageService.createSubmission({
      form_id: forms[0]?.id || 1,
      user_id: currentUser.id,
      data: {
        report_type: reportType,
        village,
        district: district || 'N/A',
        affected_count: Number(affectedCount),
        severity,
        notes: notes || 'No additional notes provided.',
        report_title: customTitle,
        reported_at: new Date().toISOString()
      },
      status: 'pending',
      notes: `Location: ${village}, ${district || ''} | Severity: ${severity.toUpperCase()}`
    });

    setSubmitSuccess(`Report #${newSubmission.id} submitted successfully! Live sync updated.`);
    setVillage('');
    setDistrict('');
    setAffectedCount('');
    setNotes('');
    setSeverity('low');

    setTimeout(() => {
      setSubmitSuccess(null);
    }, 4000);
  };

  const handleExportTableToExcel = (table: TableWithStatus, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const sub = storageService.getTableSubmissionForUserAndTable(currentUser.id, table.id);
    const rows = (sub?.rows && sub.rows.length > 0) 
      ? sub.rows 
      : (table.default_rows && table.default_rows.length > 0 ? table.default_rows : [{}]);

    const formattedData = rows.map((r, i) => {
      const rowObj: Record<string, any> = { 'Row #': i + 1 };
      table.columns.forEach(col => {
        rowObj[col.label] = r[col.id] ?? '';
      });
      return rowObj;
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'User Table');
    XLSX.writeFile(workbook, `${table.title.replace(/\s+/g, '_')}_${currentUser.username}.xlsx`);
  };

  const filteredTables = tables.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(tableSearchTerm.toLowerCase())) ||
      (t.category && t.category.toLowerCase().includes(tableSearchTerm.toLowerCase()));

    const matchesStatus = 
      tableStatusFilter === 'all' ||
      (tableStatusFilter === 'submitted' && t.status === 'submitted') ||
      (tableStatusFilter === 'draft' && t.status === 'draft') ||
      (tableStatusFilter === 'pending' && t.status === 'Not started');

    return matchesSearch && matchesStatus;
  });

  const submittedTablesCount = tables.filter(t => t.status === 'submitted').length;
  const draftTablesCount = tables.filter(t => t.status === 'draft').length;
  const pendingTablesCount = tables.filter(t => t.status === 'Not started').length;
  const completionPercentage = tables.length > 0 ? Math.round((submittedTablesCount / tables.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* User Welcome & Operations Hero */}
      <div className="bg-gradient-to-r from-[#005a9e] via-[#0b7285] to-[#0d5c75] rounded-3xl p-6 sm:p-7 text-white shadow-md border border-blue-900/30 flex flex-col md:flex-row md:items-center md:justify-between gap-5 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-white/20 text-cyan-100 border border-white/25">
              Healthcare Staff Workspace
            </span>
            <span className="text-xs text-cyan-100/90 font-medium">
              • ID #{currentUser.id} • {currentUser.department || 'Field Station / Center'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Welcome, {currentUser.full_name || currentUser.username}
          </h1>
          <p className="text-xs sm:text-sm text-cyan-100/90 max-w-2xl font-medium">
            Fill assigned spreadsheet tables, correct entries anytime with real-time auto-save to the Admin Master Excel, and report field surveillance data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            onClick={() => {
              setActiveTab('report');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Rapid Health Report</span>
          </button>

          <button
            onClick={onNavigateToSubmissions}
            className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            <span>My Submission History</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {submitSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-3 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs font-semibold flex-1">{submitSuccess}</div>
          <button
            onClick={() => setSubmitSuccess(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Assigned Tables
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {tables.length}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              Structured Excel templates
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#005a9e] flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Completed & Submitted
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {submittedTablesCount}
            </div>
            <div className="text-xs text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{completionPercentage}% completion rate</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              In-Progress / Drafts
            </div>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {draftTablesCount + pendingTablesCount}
            </div>
            <div className="text-xs text-amber-700 font-medium mt-0.5">
              {draftTablesCount} draft, {pendingTablesCount} to start
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Form Reports
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {submissions.length}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              Across {forms.length} report formats
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-cyan-50 text-[#0b7285] flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tables')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'tables'
              ? 'bg-[#005a9e] text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>My Assigned Excel Tables ({tables.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'report'
              ? 'bg-[#005a9e] text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Rapid Health Data Report</span>
        </button>

        <button
          onClick={() => setActiveTab('forms')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'forms'
              ? 'bg-[#005a9e] text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Form Templates ({forms.length})</span>
        </button>
      </div>

      {/* TAB 1: ASSIGNED EXCEL TABLES */}
      {activeTab === 'tables' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 mr-1">Status:</span>
              <button
                onClick={() => setTableStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  tableStatusFilter === 'all'
                    ? 'bg-[#005a9e] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({tables.length})
              </button>

              <button
                onClick={() => setTableStatusFilter('submitted')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  tableStatusFilter === 'submitted'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Submitted ({submittedTablesCount})
              </button>

              <button
                onClick={() => setTableStatusFilter('draft')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  tableStatusFilter === 'draft'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Drafts ({draftTablesCount})
              </button>

              <button
                onClick={() => setTableStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  tableStatusFilter === 'pending'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Ready to Fill ({pendingTablesCount})
              </button>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={tableSearchTerm}
                onChange={(e) => setTableSearchTerm(e.target.value)}
                placeholder="Search assigned spreadsheets..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#005a9e] focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Tables Grid */}
          {filteredTables.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
              <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">No Excel tables found</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No assigned spreadsheets match your search criteria. Clear search or check back later.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTables.map(table => {
                const isSubmitted = table.status === 'submitted';
                const isDraft = table.status === 'draft';
                const userSub = storageService.getTableSubmissionForUserAndTable(currentUser.id, table.id);
                const rowCount = userSub?.rows?.length || table.default_rows?.length || 0;

                return (
                  <div
                    key={table.id}
                    onClick={() => onSelectTable(table.id)}
                    className={`bg-white rounded-3xl border p-5 flex flex-col justify-between transition-all cursor-pointer hover:shadow-md group ${
                      isSubmitted
                        ? 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/10'
                        : isDraft
                        ? 'border-amber-200 hover:border-amber-400 bg-amber-50/10'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Header tags */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#005a9e] text-[10px] font-bold uppercase tracking-wider border border-blue-200">
                          {table.category || 'Excel Spreadsheet'}
                        </span>

                        {isSubmitted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Submitted & Synced</span>
                          </span>
                        ) : isDraft ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Draft Saved</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                            <span>Ready for Input</span>
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-[#005a9e] transition-colors leading-snug">
                          {table.title}
                        </h3>
                        {table.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-medium">
                            {table.description}
                          </p>
                        )}
                      </div>

                      {/* Specs */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <TableIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{table.columns.length} Columns</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-slate-400" />
                          <span>{rowCount} Data Rows</span>
                        </div>

                        {table.due_date && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Calendar className="w-3 h-3" />
                            <span>Due {table.due_date}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleExportTableToExcel(table, e)}
                        className="px-2.5 py-1.5 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Download as Excel file"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>.xlsx</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectTable(table.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                          isSubmitted
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-[#005a9e] hover:bg-[#004b85] text-white'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isSubmitted ? 'Edit Submission' : isDraft ? 'Resume Draft' : 'Open & Fill'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RAPID HEALTH DATA REPORT */}
      {activeTab === 'report' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-cyan-700 font-bold text-xs uppercase tracking-wider mb-1">
                <Activity className="w-4 h-4" />
                <span>Field Surveillance & Clinical Incident Intake</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Rapid Health Data Report Form
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Submit fast epidemic notifications, disease clusters, or facility logistical counts.
              </p>
            </div>

            <form onSubmit={handleSubmitQuickReport} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Health Incident / Report Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-[#005a9e] focus:outline-none"
                  >
                    <option value="Acute Fever">Acute Febrile Illness</option>
                    <option value="Waterborne Diarrhea">AWD / Waterborne Diarrhea</option>
                    <option value="Maternal Emergency">Maternal / Obstetric Emergency</option>
                    <option value="Malaria Outbreak">Malaria Surge Surveillance</option>
                    <option value="Vaccine Supply Shortage">Vaccine / Cold Chain Stockout</option>
                    <option value="Nutritional Screening">Severe Acute Malnutrition (SAM)</option>
                    <option value="General Health Data">General Facility Weekly Data</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Number of Affected Cases / Patients <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 14"
                    value={affectedCount}
                    onChange={(e) => setAffectedCount(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-[#005a9e] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Village / Health Post / Kebele <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Harar Field Post A"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      required
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-[#005a9e] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    District / Woreda Zone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Eastern Health Sector"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-[#005a9e] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Severity Assessment
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSeverity('low')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      severity === 'low'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🟢 Low / Routine
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverity('medium')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      severity === 'medium'
                        ? 'bg-amber-50 border-amber-400 text-amber-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🟡 Moderate Concern
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverity('high')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      severity === 'high'
                        ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🔴 High Urgency / Critical
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Clinical Notes & Observations
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide clinical observations, patient symptoms, supply requirements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-[#005a9e] focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500 font-medium">
                  Submitting as: <strong className="text-slate-800">@{currentUser.username}</strong>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#005a9e] hover:bg-[#004b85] text-white font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Health Report</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Guide Card */}
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-md border border-slate-800 space-y-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-500/30">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">
                Synchronized Data Protocol
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                All submitted reports immediately update the central Admin surveillance feed and live statistical totals.
              </p>
              <div className="pt-2 border-t border-white/10 text-[11px] text-cyan-200">
                • Need to enter multiple rows? Use the <strong>Assigned Excel Tables</strong> tab for full spreadsheet capabilities.
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Recent Submissions
              </h4>
              {submissions.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-2">
                  No submissions logged yet today.
                </div>
              ) : (
                <div className="space-y-2">
                  {submissions.slice(0, 3).map(s => (
                    <div key={s.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>Report #{s.id}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                          {s.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {new Date(s.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FORM TEMPLATES */}
      {activeTab === 'forms' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight mb-1">
              Standard Health Reporting Questionnaires
            </h2>
            <p className="text-xs text-slate-500">
              Select a structured questionnaire template created by Biiroo Eegumsa Fayyaa administration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map(form => (
              <div
                key={form.id}
                onClick={() => onSelectForm(form.id)}
                className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 text-[#0b7285] text-[10px] font-bold uppercase tracking-wider border border-cyan-200">
                      {form.category || 'Clinical Form'}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      {form.fields.length} questions
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#005a9e] transition-colors">
                    {form.title}
                  </h3>

                  {form.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {form.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">
                    Status: {form.status}
                  </span>
                  <span className="text-xs font-bold text-[#005a9e] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Fill Questionnaire</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
