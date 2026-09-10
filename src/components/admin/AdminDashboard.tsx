import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  FileSpreadsheet, 
  ClipboardList, 
  CheckCircle2, 
  PlusCircle, 
  ArrowRight, 
  Search, 
  Eye, 
  Table as TableIcon, 
  Download, 
  UserCheck, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Send, 
  Calendar as CalendarIcon, 
  Layers, 
  Activity, 
  FileDown, 
  Clock, 
  Edit3,
  ExternalLink,
  Sparkles,
  Filter,
  CheckCircle,
  AlertCircle,
  LayoutGrid,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  Bell,
  Settings,
  MoreHorizontal,
  Headphones,
  MessageSquare,
  CreditCard,
  Receipt,
  Check,
  X,
  User,
  Shield,
  Stethoscope,
  Building2,
  CalendarDays,
  LogOut,
  ArrowUpRight,
  BarChart3,
  LineChart as LineChartIcon,
  Sliders,
  ArrowUpDown,
  Maximize2,
  Minimize2,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Tag
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { storageService } from '../../services/storageService';
import { EditableTableTemplate, UserTableSubmission, TableRowData, TableColumn } from '../../types';
import { exportMasterExcelWorkbook, exportTableByTitleExcel } from '../../utils/excelExport';
import { SubmissionDetailModal } from './SubmissionDetailModal';
import { UserLoginLinksModal } from './UserLoginLinksModal';

interface AdminDashboardProps {
  onNavigate: (view: string, extra?: any) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

// Custom SVG Component for Data Curve Nodes: Displays both Column Name and User Staff Name cleanly
interface CustomCurvePointNodeProps {
  cx?: number;
  cy?: number;
  payload?: any;
  value?: any;
  index?: number;
  dataKey?: string;
  stroke?: string;
  staffName?: string;
  staffUsername?: string;
  columnName?: string;
  color?: string;
  showLabels?: boolean;
  totalPoints?: number;
  onHoverPoint?: (data: any) => void;
}

const CustomCurvePointNode: React.FC<CustomCurvePointNodeProps> = ({
  cx,
  cy,
  payload,
  value,
  index = 0,
  dataKey,
  stroke,
  staffName,
  staffUsername,
  columnName,
  color,
  showLabels = true,
  totalPoints = 1,
  onHoverPoint
}) => {
  if (cx === undefined || cy === undefined || isNaN(cx) || isNaN(cy)) return null;

  const nodeColor = color || stroke || '#0085ff';
  const resolvedUser = staffName || payload?.staffName || payload?.name || (dataKey && !['grandTotal', 'Grand Total', 'total'].includes(dataKey) ? dataKey : 'Staff Member');
  const resolvedUserHandle = staffUsername || payload?.username || payload?.rawUsername || '';
  const resolvedColumn = columnName || payload?.fullName || payload?.caseName || (dataKey && !['grandTotal', 'Grand Total'].includes(dataKey) ? dataKey : 'Metric Column');
  const rawNum = typeof value === 'number' ? value : Number(payload?.[dataKey || ''] ?? value ?? 0);
  const formattedVal = isNaN(rawNum) ? '0' : rawNum.toLocaleString();

  // Position badge nicely above the curve node with alternating height to prevent overlap
  const isAlternate = (index % 2 === 1);
  const badgeY = isAlternate ? cy - 26 : cy - 34;

  const displayUser = resolvedUser.length > 13 ? resolvedUser.substring(0, 11) + '…' : resolvedUser;
  const displayCol = resolvedColumn.length > 13 ? resolvedColumn.substring(0, 11) + '…' : resolvedColumn;
  const badgeText = `${displayUser} • ${displayCol}: ${formattedVal}`;
  const badgeWidth = Math.max(95, Math.min(185, badgeText.length * 6.6 + 18));

  return (
    <g 
      className="cursor-pointer transition-transform duration-200"
      onMouseEnter={() => {
        if (onHoverPoint) {
          onHoverPoint({
            userName: resolvedUser,
            userHandle: resolvedUserHandle,
            columnName: resolvedColumn,
            value: rawNum,
            color: nodeColor
          });
        }
      }}
    >
      {/* Outer Soft Ambient Halo Ring */}
      <circle cx={cx} cy={cy} r={7.5} fill={nodeColor} fillOpacity={0.22} />
      
      {/* High-Contrast Center Dot */}
      <circle cx={cx} cy={cy} r={4} fill="#ffffff" stroke={nodeColor} strokeWidth={2.5} />
      <circle cx={cx} cy={cy} r={1.5} fill={nodeColor} />

      {/* On-Curve Badge with Column Name & User Name */}
      {showLabels && (
        <g transform={`translate(${cx}, ${badgeY})`}>
          {/* Subtle vertical connector stem */}
          <line 
            x1={0} 
            y1={17} 
            x2={0} 
            y2={cy - badgeY} 
            stroke={nodeColor} 
            strokeWidth={1.2} 
            strokeDasharray="2 2" 
            opacity={0.7} 
          />
          
          {/* Pill Badge Container */}
          <rect
            x={-badgeWidth / 2}
            y={0}
            width={badgeWidth}
            height={18}
            rx={5}
            ry={5}
            fill="#0f172a"
            stroke={nodeColor}
            strokeWidth={1.3}
            style={{ filter: 'drop-shadow(0 2px 4px rgba(15, 23, 42, 0.45))' }}
          />

          {/* User Name on Left */}
          <text
            x={-badgeWidth / 2 + 5}
            y={12}
            fill={nodeColor}
            fontSize="8.5"
            fontWeight="800"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {displayUser}
          </text>

          {/* Column Name & Value on Right */}
          <text
            x={badgeWidth / 2 - 5}
            y={12}
            textAnchor="end"
            fill="#f8fafc"
            fontSize="8.5"
            fontWeight="700"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {displayCol}: <tspan fill="#34d399" fontWeight="900">{formattedVal}</tspan>
          </text>
        </g>
      )}
    </g>
  );
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigate,
  onShowToast
}) => {
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);
  
  // Active Admin View mode
  const [activeAdminView, setActiveAdminView] = useState<'overview' | 'master_spreadsheet'>('overview');

  // Master Spreadsheet Dashboard states
  const [dashboardSelectedTableId, setDashboardSelectedTableId] = useState<number | 'all'>('all');
  const [dashboardUsernameFilter, setDashboardUsernameFilter] = useState<string>('all');
  const [dashboardSearchTerm, setDashboardSearchTerm] = useState('');
  const [dashboardOrderSort, setDashboardOrderSort] = useState<'newest' | 'oldest' | 'facility_asc' | 'total_desc'>('total_desc');
  
  // Case Tracking Graph & Visualization states
  // Primary tracking graph mode: 'staff_on_x' (visualize by user staff name), 'staff_lines', 'cases_on_x' (column grand totals), 'facility_bars'
  const [trackingGraphMode, setTrackingGraphMode] = useState<'staff_on_x' | 'staff_lines' | 'cases_on_x' | 'facilities_lines' | 'facility_bars'>('staff_on_x');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'stepped'>('bar');
  const [donutRatioMode, setDonutRatioMode] = useState<'columns' | 'staff'>('staff');
  const [chartGranularity, setChartGranularity] = useState<'facility' | 'individual'>('facility');
  const [chartSortBy, setChartSortBy] = useState<'default_order' | 'quantity_desc' | 'quantity_asc'>('default_order');
  const [chartMetricFilter, setChartMetricFilter] = useState<'all' | 'pv_pf' | 'total_case' | 'total'>('all');
  const [chartScrollExpanded, setChartScrollExpanded] = useState<boolean>(false);
  const [tableVersion, setTableVersion] = useState(0);

  // On-Curve Labels & Active Curve Point Inspector
  const [showCurveLabels, setShowCurveLabels] = useState<boolean>(true);
  const [activeHoverCurvePoint, setActiveHoverCurvePoint] = useState<{
    userName?: string;
    userHandle?: string;
    columnName?: string;
    value?: number;
    color?: string;
  } | null>(null);

  // Real-time delta tracker to highlight quantity decreases / increases
  const [lastQuantityDelta, setLastQuantityDelta] = useState<{
    caseName: string;
    diff: number;
    facility?: string;
    timestamp: number;
  } | null>(null);

  // Mini Calendar State
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<number>(23);
  const [calendarMonth, setCalendarMonth] = useState('December 2025');

  // Dispatch modal
  const [dispatchTableId, setDispatchTableId] = useState<number | null>(null);
  const [selectedUserIdsForDispatch, setSelectedUserIdsForDispatch] = useState<number[]>([]);

  // Column Management States
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [newColumnLabel, setNewColumnLabel] = useState('');
  const [newColumnType, setNewColumnType] = useState<string>('number');
  const [newColumnSummary, setNewColumnSummary] = useState<'none' | 'sum' | 'avg' | 'count'>('sum');
  const [newColumnRequired, setNewColumnRequired] = useState(false);

  const [editingColumnModal, setEditingColumnModal] = useState<{
    tableId: number;
    columnId: string;
    currentLabel: string;
  } | null>(null);
  const [renamedColumnLabel, setRenamedColumnLabel] = useState('');

  // Quick Master Excel Template Creation Modal State
  const [isCreateMasterTableModalOpen, setIsCreateMasterTableModalOpen] = useState(false);
  const [newMasterTableTitle, setNewMasterTableTitle] = useState('');
  const [newMasterTableCategory, setNewMasterTableCategory] = useState('Malaria & Epidemic Surveillance');
  const [newMasterTableDesc, setNewMasterTableDesc] = useState('Live multi-staff aggregated clinical case surveillance table.');

  // Subscribe to real-time storage events so any additions/updates across all users, columns, rows, or tables reflect dynamically
  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      setTableVersion(v => v + 1);
    });
    return unsubscribe;
  }, []);

  // Raw data from storageService
  const rawUsers = storageService.getUsers().filter(u => u.role === 'user');
  const forms = storageService.getForms();
  const submissions = storageService.getSubmissions();
  const tableTemplates = storageService.getTableTemplates();
  const tableSubmissions = storageService.getTableSubmissions();

  // Aggregate Master Spreadsheet Rows grouped by username for the active template
  const aggregatedMasterData = useMemo(() => {
    const selectedTemplate = dashboardSelectedTableId === 'all' 
      ? tableTemplates[0] 
      : tableTemplates.find(t => t.id === dashboardSelectedTableId);

    if (!selectedTemplate) return { template: null, userSections: [], grandTotalRows: 0, flatRows: [], columnSums: {} };

    const matchingSubmissions = tableSubmissions.filter(s => s.table_id === selectedTemplate.id);

    const userSections: Array<{
      user: { id: number; username: string; email: string; full_name?: string };
      submission: UserTableSubmission | null;
      rows: Array<{ rowData: TableRowData; rowIndex: number }>;
      status: string;
      lastUpdated?: string;
    }> = [];

    rawUsers.forEach(u => {
      if (dashboardUsernameFilter !== 'all' && u.username !== dashboardUsernameFilter) {
        return;
      }

      const userSub = matchingSubmissions.find(s => s.user_id === u.id) || null;
      let rowsList: TableRowData[] = [];
      if (userSub && userSub.rows && userSub.rows.length > 0) {
        rowsList = userSub.rows;
      } else if (selectedTemplate.default_rows && selectedTemplate.default_rows.length > 0) {
        rowsList = selectedTemplate.default_rows.map(r => ({ ...r, username: u.username }));
      } else {
        rowsList = [];
      }

      const filteredRows = rowsList
        .map((r, idx) => ({ rowData: r, rowIndex: idx }))
        .filter(({ rowData }) => {
          if (!dashboardSearchTerm) return true;
          const term = dashboardSearchTerm.toLowerCase();
          return Object.values(rowData).some(val => 
            String(val || '').toLowerCase().includes(term)
          );
        });

      userSections.push({
        user: u,
        submission: userSub,
        rows: filteredRows,
        status: userSub ? (userSub.status === 'submitted' ? 'Submitted' : 'Draft') : 'Not Started',
        lastUpdated: userSub?.updated_at
      });
    });

    const flatRows: Array<{
      user: { id: number; username: string; email: string; full_name?: string };
      rowData: TableRowData;
      rowIndex: number;
      status: string;
      lastUpdated?: string;
    }> = [];

    userSections.forEach(sec => {
      sec.rows.forEach(r => {
        flatRows.push({
          user: sec.user,
          rowData: r.rowData,
          rowIndex: r.rowIndex,
          status: sec.status,
          lastUpdated: sec.lastUpdated
        });
      });
    });

    // Sorting flat rows and user sections
    if (dashboardOrderSort === 'facility_asc') {
      flatRows.sort((a, b) => {
        const nameA = a.rowData.col_facility || a.rowData.facility || a.rowData.name || '';
        const nameB = b.rowData.col_facility || b.rowData.facility || b.rowData.name || '';
        return String(nameA).localeCompare(String(nameB));
      });
    } else if (dashboardOrderSort === 'total_desc') {
      flatRows.sort((a, b) => {
        const totalA = Number(a.rowData.col_total || a.rowData.total || a.rowData.col_total_cases || 0);
        const totalB = Number(b.rowData.col_total || b.rowData.total || b.rowData.col_total_cases || 0);
        return totalB - totalA;
      });
    }

    const grandTotalRows = flatRows.length;

    // Numeric summary calculation
    const columnSums: Record<string, number> = {};
    if (selectedTemplate) {
      selectedTemplate.columns.forEach(col => {
        if (col.type === 'number' || col.type === 'currency' || col.summary === 'sum') {
          let sum = 0;
          flatRows.forEach(item => {
            const val = parseFloat(item.rowData[col.id]);
            if (!isNaN(val)) {
              sum += val;
            }
          });
          columnSums[col.id] = sum;
        }
      });
    }

    return {
      template: selectedTemplate,
      userSections,
      flatRows,
      columnSums,
      grandTotalRows
    };
  }, [
    tableTemplates, 
    tableSubmissions, 
    dashboardSelectedTableId, 
    dashboardUsernameFilter, 
    dashboardSearchTerm, 
    dashboardOrderSort,
    rawUsers,
    tableVersion
  ]);

  // Extract and compute Master Excel Grand Total metrics by Column Name
  // X-axis: Master Excel Column Names (col.label)
  // Y-axis: Grand total of each respective column quantified from Master Excel table
  const caseTrackingMetrics = useMemo(() => {
    const records = aggregatedMasterData.flatRows;
    const template = aggregatedMasterData.template;
    const colSums = aggregatedMasterData.columnSums;

    const PALETTE = [
      { color: '#0085ff', badge: 'bg-blue-50 text-[#0085ff] border-blue-200', fill: '#0085ff' },
      { color: '#f59e0b', badge: 'bg-amber-50 text-amber-700 border-amber-200', fill: '#f59e0b' },
      { color: '#ef4444', badge: 'bg-rose-50 text-rose-700 border-rose-200', fill: '#ef4444' },
      { color: '#10b981', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', fill: '#10b981' },
      { color: '#8b5cf6', badge: 'bg-purple-50 text-purple-700 border-purple-200', fill: '#8b5cf6' },
      { color: '#06b6d4', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200', fill: '#06b6d4' },
      { color: '#f97316', badge: 'bg-orange-50 text-orange-700 border-orange-200', fill: '#f97316' },
      { color: '#ec4899', badge: 'bg-pink-50 text-pink-700 border-pink-200', fill: '#ec4899' }
    ];

    // Identify numeric / quantified columns from the active Master Excel template
    let quantifiedCols = (template?.columns || []).filter(c => 
      c.type === 'number' || 
      c.type === 'currency' || 
      c.summary === 'sum' ||
      ['pv', 'pf', 'total', 'case', 'patient', 'count', 'amount', 'test'].some(term => 
        c.id.toLowerCase().includes(term) || c.label.toLowerCase().includes(term)
      )
    );

    // Fallback default columns if template has no columns defined yet
    if (quantifiedCols.length === 0) {
      quantifiedCols = [
        { id: 'col_total_cases', label: 'Total case', type: 'number', summary: 'sum' },
        { id: 'col_pv', label: 'P.V', type: 'number', summary: 'sum' },
        { id: 'col_pf', label: 'P.F', type: 'number', summary: 'sum' },
        { id: 'col_total', label: 'Total', type: 'number', summary: 'sum' }
      ] as any;
    }

    // Facility maps for breakdowns across columns
    const facilityDataMap = new Map<string, {
      name: string;
      shortName: string;
      username: string;
      values: Record<string, number>;
      total_case: number;
      pv: number;
      pf: number;
      total: number;
    }>();

    records.forEach((rec, idx) => {
      const row = rec.rowData;
      const rawName = row.col_facility || row.facility || row.name || row.col_activity || row.col_name;
      const facilityLabel = rawName ? String(rawName).trim() : `Facility #${idx + 1}`;
      const shortName = facilityLabel.length > 14 ? facilityLabel.substring(0, 12) + '...' : facilityLabel;

      if (!facilityDataMap.has(facilityLabel)) {
        facilityDataMap.set(facilityLabel, {
          name: facilityLabel,
          shortName,
          username: rec.user.username,
          values: {},
          total_case: 0,
          pv: 0,
          pf: 0,
          total: 0
        });
      }

      const facObj = facilityDataMap.get(facilityLabel)!;
      quantifiedCols.forEach(c => {
        const rawVal = row[c.id];
        const num = parseFloat(rawVal);
        const val = isNaN(num) ? 0 : num;
        facObj.values[c.id] = (facObj.values[c.id] || 0) + val;
      });

      // Maintain legacy aliases for backwards compatibility
      facObj.total_case = Number(row.col_total_cases ?? row.col_total_case ?? row.total_case ?? facObj.values['col_total_cases'] ?? 0);
      facObj.pv = Number(row.col_pv ?? row.pv ?? facObj.values['col_pv'] ?? 0);
      facObj.pf = Number(row.col_pf ?? row.pf ?? facObj.values['col_pf'] ?? 0);
      facObj.total = Number(row.col_total ?? row.total ?? facObj.values['col_total'] ?? (facObj.pv + facObj.pf || facObj.total_case));
    });

    // 1. PRIMARY TRACKING DATASET: Master Excel Column Names on X-Axis, Respective Column Grand Totals on Y-Axis
    const baseCases = quantifiedCols.map((col, idx) => {
      const paletteItem = PALETTE[idx % PALETTE.length];
      const grandTotalVal = colSums[col.id] !== undefined ? colSums[col.id] : (
        records.reduce((acc, r) => {
          const v = parseFloat(r.rowData[col.id]);
          return acc + (isNaN(v) ? 0 : v);
        }, 0)
      );

      return {
        id: col.id,
        columnId: col.id,
        caseName: col.label, // Respective Column Name on X-Axis
        shortName: col.label.length > 16 ? col.label.substring(0, 14) + '…' : col.label,
        fullName: col.label,
        headerColumnLabel: col.label,
        grandTotal: grandTotalVal, // Quantified Grand Total for this Column on Y-Axis
        category: col.type === 'currency' ? 'Currency' : 'Spreadsheet Metric',
        color: paletteItem.color,
        badgeBg: paletteItem.badge,
        dotFill: paletteItem.fill,
        description: `Grand Total calculated across all submitted facility rows for column "${col.label}"`
      };
    });

    // Specific shortcut sums for quick cards
    const grandTotalCases = colSums['col_total_cases'] ?? colSums['total_cases'] ?? (baseCases.find(b => b.id.includes('case'))?.grandTotal || 0);
    const grandTotalPV = colSums['col_pv'] ?? colSums['pv'] ?? (baseCases.find(b => b.id.includes('pv'))?.grandTotal || 0);
    const grandTotalPF = colSums['col_pf'] ?? colSums['pf'] ?? (baseCases.find(b => b.id.includes('pf'))?.grandTotal || 0);
    const grandTotalCombined = colSums['col_total'] ?? colSums['total'] ?? (baseCases.find(b => b.id === 'col_total' || b.id === 'total')?.grandTotal || (grandTotalPV + grandTotalPF || grandTotalCases));

    // Filter according to Metric Filter
    let filteredCasePoints = baseCases;
    if (chartMetricFilter === 'pv_pf') {
      filteredCasePoints = baseCases.filter(c => c.id.toLowerCase().includes('pv') || c.id.toLowerCase().includes('pf'));
    } else if (chartMetricFilter === 'total_case') {
      filteredCasePoints = baseCases.filter(c => c.id.toLowerCase().includes('case') || c.id.toLowerCase().includes('total_case'));
    } else if (chartMetricFilter === 'total') {
      filteredCasePoints = baseCases.filter(c => c.id === 'col_total' || c.id === 'total' || c.caseName.toLowerCase() === 'total');
    } else if (chartMetricFilter !== 'all') {
      filteredCasePoints = baseCases.filter(c => c.id === chartMetricFilter);
    }

    // Optional Sort of X-Axis column names by their Grand Total
    if (chartSortBy === 'quantity_desc') {
      filteredCasePoints = [...filteredCasePoints].sort((a, b) => b.grandTotal - a.grandTotal);
    } else if (chartSortBy === 'quantity_asc') {
      filteredCasePoints = [...filteredCasePoints].sort((a, b) => a.grandTotal - b.grandTotal);
    }

    // 2. MULTI-FACILITY TRACING DATA: Each facility as a trace across the X-axis column names
    const facilitiesList = Array.from(facilityDataMap.values());
    const facilityPalette = ['#0085ff', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1'];

    const multiTraceChartData = filteredCasePoints.map(cp => {
      const pointObj: Record<string, any> = {
        caseName: cp.caseName,
        shortName: cp.shortName,
        fullName: cp.fullName,
        'Grand Total': cp.grandTotal,
        grandTotal: cp.grandTotal,
        color: cp.color
      };

      facilitiesList.forEach(fac => {
        pointObj[fac.name] = fac.values[cp.id] ?? 0;
      });

      return pointObj;
    });

    // 3. FACILITY-BASED COMPARISON DATA (For secondary facility view)
    const facilityBarChartData = facilitiesList.map(fac => {
      const facPoint: Record<string, any> = {
        name: fac.name,
        shortName: fac.shortName,
        username: fac.username,
        total_case: fac.total_case,
        pv: fac.pv,
        pf: fac.pf,
        total: fac.total
      };
      quantifiedCols.forEach(c => {
        facPoint[c.id] = fac.values[c.id] ?? 0;
      });
      return facPoint;
    });

    // 4. USER / STAFF-BASED METRICS DATASET: Visualizing data in respective to each user staff name!
    const staffPalette = ['#0085ff', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#a855f7'];
    
    // Group records by user staff member
    const staffDataMap = new Map<string, {
      userId: number;
      username: string;
      rawUsername: string;
      staffName: string;
      shortName: string;
      fullName: string;
      submittedRowCount: number;
      values: Record<string, number>;
      grandTotal: number;
      color: string;
      badgeBg: string;
    }>();

    // Initialize all active / filtered users
    const activeUsers = dashboardUsernameFilter === 'all' 
      ? rawUsers 
      : rawUsers.filter(u => u.username === dashboardUsernameFilter);

    activeUsers.forEach((u, uIdx) => {
      const paletteColor = staffPalette[uIdx % staffPalette.length];
      const displayName = u.full_name || u.username;
      const short = displayName.length > 14 ? displayName.substring(0, 12) + '…' : displayName;
      
      staffDataMap.set(u.username, {
        userId: u.id,
        username: `@${u.username}`,
        rawUsername: u.username,
        staffName: displayName,
        shortName: short,
        fullName: `${displayName} (@${u.username})`,
        submittedRowCount: 0,
        values: {},
        grandTotal: 0,
        color: paletteColor,
        badgeBg: PALETTE[uIdx % PALETTE.length]?.badge || 'bg-blue-50 text-blue-700 border-blue-200'
      });
    });

    // Aggregate flat records into each staff's totals
    records.forEach(rec => {
      const uname = rec.user.username;
      if (!staffDataMap.has(uname)) {
        const displayName = rec.user.full_name || uname;
        const short = displayName.length > 14 ? displayName.substring(0, 12) + '…' : displayName;
        const uIdx = staffDataMap.size;
        staffDataMap.set(uname, {
          userId: rec.user.id,
          username: `@${uname}`,
          rawUsername: uname,
          staffName: displayName,
          shortName: short,
          fullName: `${displayName} (@${uname})`,
          submittedRowCount: 0,
          values: {},
          grandTotal: 0,
          color: staffPalette[uIdx % staffPalette.length],
          badgeBg: PALETTE[uIdx % PALETTE.length]?.badge || 'bg-blue-50 text-blue-700 border-blue-200'
        });
      }

      const staffObj = staffDataMap.get(uname)!;
      staffObj.submittedRowCount += 1;

      quantifiedCols.forEach(col => {
        const rawVal = rec.rowData[col.id];
        const num = parseFloat(rawVal);
        const val = isNaN(num) ? 0 : num;
        staffObj.values[col.id] = (staffObj.values[col.id] || 0) + val;
        staffObj.grandTotal += val;
      });
    });

    const staffMetricsList = Array.from(staffDataMap.values());

    // Staff Points on X-Axis for Bar and Line visualization
    const staffBarChartData = staffMetricsList.map(st => {
      const point: Record<string, any> = {
        staffName: st.staffName,
        shortName: st.shortName,
        fullName: st.fullName,
        username: st.username,
        rawUsername: st.rawUsername,
        grandTotal: st.grandTotal,
        'Grand Total': st.grandTotal,
        color: st.color,
        submittedRowCount: st.submittedRowCount
      };
      quantifiedCols.forEach(c => {
        point[c.id] = st.values[c.id] ?? 0;
        point[c.label] = st.values[c.id] ?? 0;
      });
      return point;
    });

    // Staff Traces across Master Columns on X-Axis
    const staffMultiTraceChartData = filteredCasePoints.map(cp => {
      const pointObj: Record<string, any> = {
        caseName: cp.caseName,
        shortName: cp.shortName,
        fullName: cp.fullName,
        'Grand Total': cp.grandTotal,
        grandTotal: cp.grandTotal,
        color: cp.color
      };

      staffMetricsList.forEach(st => {
        pointObj[st.staffName] = st.values[cp.id] ?? 0;
        pointObj[st.username] = st.values[cp.id] ?? 0;
      });

      return pointObj;
    });

    // Compute dynamic maximum quantity across data to scale Y-axis with headroom
    const maxValInCases = Math.max(
      ...filteredCasePoints.map(d => d.grandTotal),
      ...facilitiesList.map(f => Object.values(f.values).reduce((a, b) => Math.max(a, b), 0)),
      ...staffMetricsList.map(s => Math.max(s.grandTotal, ...Object.values(s.values), 0)),
      10
    );
    const dynamicYMax = Math.ceil(maxValInCases * 1.18);

    const highestCase = filteredCasePoints.length > 0 
      ? filteredCasePoints.reduce((prev, curr) => (curr.grandTotal > prev.grandTotal ? curr : prev), filteredCasePoints[0])
      : null;
    const lowestCase = filteredCasePoints.length > 0
      ? filteredCasePoints.reduce((prev, curr) => (curr.grandTotal < prev.grandTotal ? curr : prev), filteredCasePoints[0])
      : null;

    const highestStaff = staffMetricsList.length > 0
      ? staffMetricsList.reduce((prev, curr) => (curr.grandTotal > prev.grandTotal ? curr : prev), staffMetricsList[0])
      : null;

    const grandSumAcrossCases = baseCases.reduce((acc, c) => acc + (c.grandTotal || 0), 0);

    return {
      quantifiedCols,
      grandTotalCases,
      grandTotalPV,
      grandTotalPF,
      grandTotalCombined,
      grandSumAcrossCases,
      casePoints: filteredCasePoints,
      allColumnPoints: baseCases,
      multiTraceChartData,
      facilityBarChartData,
      facilitiesList,
      facilityPalette,
      staffMetricsList,
      staffBarChartData,
      staffMultiTraceChartData,
      staffPalette,
      highestStaff,
      maxValInCases,
      dynamicYMax,
      highestCase,
      lowestCase,
      totalFacilitiesCount: facilitiesList.length,
      grandTotalRows: records.length
    };
  }, [aggregatedMasterData, tableVersion, chartSortBy, chartMetricFilter, dashboardUsernameFilter, rawUsers]);

  // Donut chart distribution across Master Excel Columns Grand Totals or Staff Share
  const donutCaseDistribution = useMemo(() => {
    if (donutRatioMode === 'staff') {
      const { staffMetricsList } = caseTrackingMetrics;
      const totalStaffSum = staffMetricsList.reduce((acc, s) => acc + s.grandTotal, 0) || 1;
      const items = staffMetricsList.map(st => {
        const pct = Math.round((st.grandTotal / totalStaffSum) * 100);
        return {
          name: st.staffName,
          fullName: st.fullName,
          username: st.username,
          value: st.grandTotal,
          percentage: pct,
          color: st.color,
          submittedRowCount: st.submittedRowCount
        };
      }).filter(item => item.value > 0);

      if (items.length === 0) {
        return staffMetricsList.slice(0, 4).map(st => ({
          name: st.staffName,
          fullName: st.fullName,
          username: st.username,
          value: st.grandTotal,
          percentage: 0,
          color: st.color,
          submittedRowCount: st.submittedRowCount
        }));
      }

      return items;
    }

    const { allColumnPoints } = caseTrackingMetrics;
    const totalSum = allColumnPoints.reduce((acc, c) => acc + c.grandTotal, 0) || 1;

    const items = allColumnPoints.map(col => {
      const pct = Math.round((col.grandTotal / totalSum) * 100);
      return {
        name: col.fullName,
        fullName: col.fullName,
        username: '',
        value: col.grandTotal,
        percentage: pct,
        color: col.color,
        submittedRowCount: 0
      };
    }).filter(item => item.value > 0);

    if (items.length === 0) {
      return allColumnPoints.slice(0, 4).map(col => ({
        name: col.fullName,
        fullName: col.fullName,
        username: '',
        value: col.grandTotal,
        percentage: 0,
        color: col.color,
        submittedRowCount: 0
      }));
    }

    return items;
  }, [caseTrackingMetrics, donutRatioMode]);

  // Handle direct cell editing inside the Dashboard Master Spreadsheet with live tracking delta detection
  const handleDashboardCellChange = (
    templateId: number,
    userId: number,
    rowIndexInUser: number,
    colId: string,
    newValue: any
  ) => {
    const existingSubmission = storageService.getTableSubmissionForUserAndTable(userId, templateId);
    const existingRows = existingSubmission?.rows ? [...existingSubmission.rows] : [{}];

    while (existingRows.length <= rowIndexInUser) {
      existingRows.push({});
    }

    const previousValue = Number(existingRows[rowIndexInUser]?.[colId] ?? 0);
    const numericNewValue = Number(newValue);

    if (!isNaN(previousValue) && !isNaN(numericNewValue) && previousValue !== numericNewValue) {
      const diff = numericNewValue - previousValue;
      const targetUser = storageService.getUserById(userId);
      const facName = existingRows[rowIndexInUser]?.col_facility || `@${targetUser?.username || 'user'}`;
      const colDef = aggregatedMasterData.template?.columns.find(c => c.id === colId);
      const caseLabel = colDef ? colDef.label : (colId === 'col_pv' ? 'P.V' : colId === 'col_pf' ? 'P.F' : colId === 'col_total' ? 'Total' : colId === 'col_total_cases' ? 'Total case' : colId);

      setLastQuantityDelta({
        caseName: caseLabel,
        diff,
        facility: String(facName),
        timestamp: Date.now()
      });
    }

    const updatedRow = {
      ...existingRows[rowIndexInUser],
      [colId]: newValue
    };

    // Auto-calculate Total if P.V or P.F changed and col_total is present
    if (colId === 'col_pv' || colId === 'col_pf') {
      const pv = Number(colId === 'col_pv' ? newValue : (updatedRow.col_pv || 0));
      const pf = Number(colId === 'col_pf' ? newValue : (updatedRow.col_pf || 0));
      if (!isNaN(pv) || !isNaN(pf)) {
        updatedRow.col_total = (pv || 0) + (pf || 0);
        if (!updatedRow.col_total_cases) {
          updatedRow.col_total_cases = updatedRow.col_total;
        }
      }
    }

    const targetUser = storageService.getUserById(userId);
    const username = targetUser?.username || `user_${userId}`;
    updatedRow.username = username;

    existingRows[rowIndexInUser] = updatedRow;

    storageService.saveTableSubmission(templateId, userId, 'submit', existingRows);
    setTableVersion(v => v + 1);
  };

  // Quick quantity adjustment handler (+5, -5, +1, -1) to easily test decrease/increase reactivity
  const handleQuickQuantityAdjust = (
    templateId: number,
    userId: number,
    rowIndexInUser: number,
    colId: string,
    delta: number
  ) => {
    const existingSubmission = storageService.getTableSubmissionForUserAndTable(userId, templateId);
    const existingRows = existingSubmission?.rows ? [...existingSubmission.rows] : [{}];
    const currentRow = existingRows[rowIndexInUser] || {};
    const currentVal = Number(currentRow[colId] ?? 0) || 0;
    const nextVal = Math.max(0, currentVal + delta);

    handleDashboardCellChange(templateId, userId, rowIndexInUser, colId, nextVal);
    onShowToast(
      delta < 0 ? 'Quantity Decreased' : 'Quantity Increased',
      `${colId === 'col_pv' ? 'P.V' : colId === 'col_pf' ? 'P.F' : 'Total case'} ${delta < 0 ? 'reduced by' : 'increased by'} ${Math.abs(delta)}. Graph automatically updated.`,
      delta < 0 ? 'info' : 'success'
    );
  };

  // Add new row under a user
  const handleAddRowForUser = (templateId: number, userId: number) => {
    const targetUser = storageService.getUserById(userId);
    const username = targetUser?.username || `user_${userId}`;
    
    storageService.addSubmissionRow(templateId, userId, { 
      username,
      col_facility: 'New Health Center',
      col_total_cases: 0,
      col_pv: 0,
      col_pf: 0,
      col_total: 0,
      col_status: 'Confirmed'
    });
    setTableVersion(v => v + 1);
    onShowToast('Row Added', `New case tracking row added for @${username}`, 'success');
  };

  // Delete row from user
  const handleDeleteRowForUser = (templateId: number, userId: number, rowIndex: number) => {
    storageService.deleteSubmissionRow(templateId, userId, rowIndex);
    setTableVersion(v => v + 1);
    onShowToast('Row Removed', 'Row deleted from table', 'info');
  };

  // Add row to active table (either for filtered user or first user)
  const handleAddNewRowQuick = () => {
    const targetTemplate = dashboardSelectedTableId === 'all' 
      ? tableTemplates[0] 
      : tableTemplates.find(t => t.id === dashboardSelectedTableId);
    
    if (!targetTemplate) return;

    let targetUserId = rawUsers[0]?.id || 1;
    if (dashboardUsernameFilter !== 'all') {
      const foundUser = rawUsers.find(u => u.username === dashboardUsernameFilter);
      if (foundUser) targetUserId = foundUser.id;
    }

    handleAddRowForUser(targetTemplate.id, targetUserId);
  };

  // Add new dynamic column to active Master Excel Template
  const handleAddColumnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnLabel.trim()) {
      onShowToast('Label Required', 'Please provide a label for the column.', 'error');
      return;
    }

    const targetTemplate = dashboardSelectedTableId === 'all' 
      ? tableTemplates[0] 
      : tableTemplates.find(t => t.id === dashboardSelectedTableId);

    if (!targetTemplate) return;

    const res = storageService.addColumnToTemplate(targetTemplate.id, {
      label: newColumnLabel.trim(),
      type: newColumnType as any,
      summary: newColumnSummary,
      required: newColumnRequired,
      align: newColumnType === 'number' || newColumnType === 'currency' ? 'right' : 'left'
    });

    if (res.success) {
      setIsAddColumnModalOpen(false);
      setNewColumnLabel('');
      setNewColumnType('number');
      setNewColumnSummary('sum');
      setNewColumnRequired(false);
      setTableVersion(v => v + 1);
      onShowToast('Column Added', `Dynamic column "${newColumnLabel}" added. Charts and visualizer updated.`, 'success');
    } else {
      onShowToast('Failed to Add Column', res.error || 'Unknown error', 'error');
    }
  };

  // Rename dynamic column in Master Excel Template
  const handleRenameColumnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingColumnModal || !renamedColumnLabel.trim()) return;

    const res = storageService.updateTableColumnHeader(
      editingColumnModal.tableId,
      editingColumnModal.columnId,
      renamedColumnLabel.trim()
    );

    if (res.success) {
      setEditingColumnModal(null);
      setRenamedColumnLabel('');
      setTableVersion(v => v + 1);
      onShowToast('Column Renamed', `Column updated to "${renamedColumnLabel.trim()}". Visualizer reflects new name.`, 'success');
    } else {
      onShowToast('Failed to Rename', res.error || 'Unknown error', 'error');
    }
  };

  // Delete dynamic column from Master Excel Template
  const handleDeleteColumn = (tableId: number, columnId: string, label: string) => {
    if (confirm(`Are you sure you want to delete column "${label}"? Dynamic charts will auto-recalculate.`)) {
      const res = storageService.deleteColumnFromTemplate(tableId, columnId);
      if (res.success) {
        setTableVersion(v => v + 1);
        onShowToast('Column Deleted', `Column "${label}" removed from table and visualizer.`, 'info');
      } else {
        onShowToast('Cannot Delete Column', res.error || 'Could not delete column', 'error');
      }
    }
  };

  // Create brand new Master Excel Template
  const handleCreateMasterTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMasterTableTitle.trim()) {
      onShowToast('Title Required', 'Please specify a title for the new Master Excel table.', 'error');
      return;
    }

    const defaultCols: TableColumn[] = [
      { id: 'col_facility', label: 'Health Facility / Site', type: 'text', required: true, align: 'left' },
      { id: 'col_total_cases', label: 'Total case', type: 'number', summary: 'sum', required: true, align: 'right' },
      { id: 'col_pv', label: 'P.V', type: 'number', summary: 'sum', required: true, align: 'right' },
      { id: 'col_pf', label: 'P.F', type: 'number', summary: 'sum', required: true, align: 'right' },
      { id: 'col_total', label: 'Total', type: 'number', summary: 'sum', required: true, align: 'right' }
    ];

    const newTable = storageService.createTableTemplate({
      title: newMasterTableTitle.trim(),
      category: newMasterTableCategory.trim() || 'Malaria Surveillance',
      description: newMasterTableDesc.trim() || 'Master surveillance spreadsheet',
      columns: defaultCols,
      assigned_to: 'all',
      styling: {
        headerBgColor: '#0085ff',
        headerTextColor: '#ffffff',
        showTableTitleBanner: true,
        titleBannerBgColor: '#0085ff'
      }
    });

    if (newTable && newTable.id) {
      setDashboardSelectedTableId(newTable.id);
      setIsCreateMasterTableModalOpen(false);
      setNewMasterTableTitle('');
      setTableVersion(v => v + 1);
      onShowToast('Master Excel Created', `New Master Table "${newTable.title}" created and activated in visualizer.`, 'success');
    } else {
      onShowToast('Creation Failed', 'Could not create master spreadsheet table.', 'error');
    }
  };

  return (
    <div className="w-full bg-[#3b82f6]/20 p-2 sm:p-5 lg:p-6 min-h-screen">
      {/* Outer Rounded Container Card matching the design photo */}
      <div className="bg-[#f8fafc] rounded-[28px] sm:rounded-[36px] border border-white/60 shadow-2xl p-4 sm:p-6 lg:p-7 flex flex-col xl:flex-row gap-6">
        
        {/* Left Sidebar Menu matching photo */}
        <aside className="w-full xl:w-60 shrink-0 bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="space-y-6">
            {/* Logo Brand: Synexa™ */}
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="w-9 h-9 rounded-2xl bg-[#0085ff] flex items-center justify-center text-white font-black shadow-md shadow-blue-500/25">
                <span className="text-xl leading-none">S</span>
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">Synexa</span>
                <span className="text-[10px] font-bold text-slate-400">™</span>
              </div>
            </div>

            {/* Main Menu Navigation */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
                Main Menu
              </div>

              <button
                onClick={() => setActiveAdminView('overview')}
                className={`w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl flex items-center gap-3 transition-all cursor-pointer ${
                  activeAdminView === 'overview'
                    ? 'bg-[#0085ff] text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => onNavigate('admin-master-excel')}
                className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-3 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Master Excel</span>
              </button>

              <button
                onClick={() => onNavigate('admin-submissions')}
                className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-3 transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Submissions</span>
              </button>
            </div>

            {/* Other Menu Navigation */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
                Other Menu
              </div>

              <button
                onClick={() => onNavigate('admin-users')}
                className="w-full text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-3.5 py-2 rounded-xl flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>Doctors / Staff</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('admin-forms')}
                className="w-full text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-3.5 py-2 rounded-xl flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Layers className="w-4 h-4 text-slate-500" />
                  <span>Surveillance Forms</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('admin-tables')}
                className="w-full text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-3.5 py-2 rounded-xl flex items-center gap-3 transition-all cursor-pointer"
              >
                <CalendarIcon className="w-4 h-4 text-slate-500" />
                <span>Templates</span>
              </button>

              <button
                onClick={() => onNavigate('admin-user-vault')}
                className="w-full text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-3.5 py-2 rounded-xl flex items-center gap-3 transition-all cursor-pointer"
              >
                <TableIcon className="w-4 h-4 text-slate-500" />
                <span>User Vault</span>
              </button>

              <button
                onClick={() => {
                  const success = exportMasterExcelWorkbook();
                  if (success) {
                    onShowToast('Excel Workbook Exported', 'Downloaded complete multi-sheet workbook.', 'success');
                  }
                }}
                className="w-full text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-3.5 py-2 rounded-xl flex items-center gap-3 transition-all cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-slate-500" />
                <span>Payments</span>
              </button>

              <button
                onClick={() => {
                  const success = exportMasterExcelWorkbook();
                  if (success) {
                    onShowToast('Invoice & Summary Exported', 'Master records downloaded.', 'success');
                  }
                }}
                className="w-full text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-3.5 py-2 rounded-xl flex items-center gap-3 transition-all cursor-pointer"
              >
                <Receipt className="w-4 h-4 text-slate-500" />
                <span>Invoice</span>
              </button>

              <button
                onClick={() => setIsLinksModalOpen(true)}
                className="w-full text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-3.5 py-2 rounded-xl flex items-center gap-3 transition-all cursor-pointer"
              >
                <Headphones className="w-4 h-4 text-slate-500" />
                <span>Support</span>
              </button>

              <button
                onClick={() => onShowToast('System Communications', 'All staff notifications active.', 'info')}
                className="w-full text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-3.5 py-2 rounded-xl flex items-center gap-3 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-slate-500" />
                <span>Messages</span>
              </button>
            </div>
          </div>

          {/* Bottom Logout Button */}
          <div className="pt-6">
            <button
              onClick={() => {
                storageService.logout();
                window.location.reload();
              }}
              className="w-full bg-[#ffebeb] hover:bg-[#fed7d7] text-[#ff4b4b] font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 space-y-6 overflow-hidden">
          
          {/* Top Bar Header matching photo */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Case Surveillance Dashboard
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Tracking Total case, P.V, P.F, and Total from Master Excel Table
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Search pill */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, facility or data..."
                  value={dashboardSearchTerm}
                  onChange={(e) => setDashboardSearchTerm(e.target.value)}
                  className="bg-white border border-slate-200/80 rounded-full pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 w-56 sm:w-72 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                />
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onShowToast('Outbox Logs', 'Email notifications active.', 'info')}
                  className="w-9 h-9 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
                  title="Messages & Outbox"
                >
                  <Mail className="w-4 h-4" />
                </button>

                <button 
                  onClick={() => onShowToast('Notifications', 'All surveillance monitors active.', 'info')}
                  className="w-9 h-9 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs transition-colors relative cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-2"></span>
                </button>

                <button 
                  onClick={() => {
                    setTableVersion(v => v + 1);
                    onShowToast('Refreshed', 'Calculated Total case, P.V, P.F and Total from Master Excel.', 'success');
                  }}
                  className="w-9 h-9 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
                  title="Refresh Metrics"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              {/* Profile Capsule */}
              <div className="flex items-center gap-3 bg-white border border-slate-200/80 rounded-full pl-1.5 pr-4 py-1 shadow-2xs cursor-pointer">
                <img
                  src="https://images.unsplash.com/photo-1594824813596-f3bdfb3c5885?auto=format&fit=crop&q=80&w=120"
                  alt="Doctor avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    Dr. Angela L.
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    Epidemiologist / Admin
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </div>
            </div>
          </header>

          {/* DASHBOARD CONTENT (Directly tracks Total case, P.V, P.F and Total) */}
          <div className="space-y-6 animate-in fade-in duration-150">
            
            {/* Row 1: Today's Overview (Total case, P.V, P.F & Grand Total KPI Cards) + Mini Calendar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Columns: Dynamic KPI Cards for all Quantified Columns of active Master Table */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#0085ff]" />
                      <span>Case Metrics Overview</span>
                    </h2>
                    {aggregatedMasterData.template && (
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full truncate max-w-[200px]">
                        {aggregatedMasterData.template.title}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Active Master Table Quick Switcher */}
                    <div className="flex items-center gap-1.5">
                      <select
                        value={dashboardSelectedTableId}
                        onChange={(e) => setDashboardSelectedTableId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 cursor-pointer focus:ring-1 focus:ring-blue-500 max-w-[160px] truncate"
                        title="Switch Master Table to visualize"
                      >
                        {tableTemplates.map(tpl => (
                          <option key={tpl.id} value={tpl.id}>{tpl.title}</option>
                        ))}
                      </select>

                      <button
                        onClick={() => setIsCreateMasterTableModalOpen(true)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0085ff] font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer border border-blue-200"
                        title="Create brand new Master Excel table"
                      >
                        <Plus className="w-3 h-3" />
                        <span>New Table</span>
                      </button>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                      Grand Total: {caseTrackingMetrics.allColumnPoints.reduce((acc, c) => acc + c.grandTotal, 0).toLocaleString()}
                    </span>
                    <button 
                      onClick={() => {
                        setTableVersion(v => v + 1);
                        onShowToast('Synchronized', 'Live case metrics refreshed from Master Excel.', 'info');
                      }}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                      title="Refresh metrics"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Dynamic KPI Cards mapping every Master Excel Column */}
                <div className={`grid grid-cols-1 ${
                  caseTrackingMetrics.allColumnPoints.length === 1 
                    ? 'sm:grid-cols-1' 
                    : caseTrackingMetrics.allColumnPoints.length === 2 
                    ? 'sm:grid-cols-2' 
                    : caseTrackingMetrics.allColumnPoints.length === 3 
                    ? 'sm:grid-cols-3' 
                    : 'sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                } gap-4`}>
                  {caseTrackingMetrics.allColumnPoints.map((col, idx) => {
                    const totalSumAll = caseTrackingMetrics.allColumnPoints.reduce((acc, c) => acc + c.grandTotal, 0) || 1;
                    const percentage = Math.round((col.grandTotal / totalSumAll) * 100);
                    const initials = col.fullName.replace(/[^a-zA-Z0-9]/g, ' ').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || `C${idx + 1}`;

                    return (
                      <div 
                        key={col.id} 
                        className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4 hover:shadow-md transition-shadow relative overflow-hidden group"
                      >
                        {/* Top Indicator */}
                        <div className="flex items-center justify-between">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs"
                            style={{ backgroundColor: `${col.color}18`, color: col.color }}
                          >
                            {initials}
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${col.badgeBg}`}>
                            {col.category || 'Metric'}
                          </span>
                        </div>

                        <div>
                          <div className="text-sm font-bold text-slate-900 flex items-baseline justify-between gap-2">
                            <span className="truncate" title={col.fullName}>{col.fullName}</span>
                            <span className="text-lg font-black shrink-0" style={{ color: col.color }}>
                              {col.grandTotal.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                            Column #{idx + 1} &bull; {percentage}% of total quantified
                          </div>
                        </div>

                        {/* Visual Proportion Bar */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500"
                              style={{ 
                                width: `${Math.max(4, percentage)}%`,
                                backgroundColor: col.color 
                              }}
                            ></div>
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 shrink-0">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right 1 Column: Interactive Mini Calendar Widget */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    {calendarMonth}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setCalendarMonth('November 2025')}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setCalendarMonth('December 2025')}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 uppercase">
                  <span>Mo</span>
                  <span>Tu</span>
                  <span>We</span>
                  <span>Th</span>
                  <span>Fr</span>
                  <span>Sa</span>
                  <span>Su</span>
                </div>

                {/* Calendar Numbers Grid */}
                <div className="grid grid-cols-7 gap-y-1.5 text-center text-xs font-semibold text-slate-700">
                  <span className="text-slate-300 py-1">29</span>
                  <span className="text-slate-300 py-1">30</span>
                  <span className="text-slate-300 py-1">1</span>
                  <span className="py-1">2</span>
                  <span className="py-1">3</span>
                  <span className="py-1">4</span>
                  <span className="py-1">5</span>

                  <span className="py-1">6</span>
                  <span className="py-1">7</span>
                  <span className="py-1">8</span>
                  <span className="py-1">9</span>
                  <span className="py-1">10</span>
                  <span className="py-1">11</span>
                  <span className="py-1">12</span>

                  <span className="py-1">13</span>
                  <span className="py-1">14</span>
                  <span className="py-1">15</span>
                  <span className="py-1">16</span>
                  <span className="py-1">17</span>
                  <span className="py-1">18</span>
                  <span className="py-1">19</span>

                  <span className="py-1">20</span>
                  <span className="py-1">21</span>
                  <span className="py-1">22</span>
                  
                  {/* Active Highlight Day: 23 in Blue Circle */}
                  <button 
                    onClick={() => setSelectedCalendarDate(23)}
                    className="w-7 h-7 rounded-full bg-[#0085ff] text-white font-bold flex items-center justify-center mx-auto shadow-md shadow-blue-500/30"
                  >
                    23
                  </button>

                  <span className="py-1">24</span>
                  <span className="py-1">25</span>
                  <span className="py-1">26</span>

                  <span className="py-1">27</span>
                  <span className="py-1">28</span>
                  <span className="py-1">29</span>
                  <span className="py-1">30</span>
                  <span className="py-1">31</span>
                  <span className="text-slate-300 py-1">1</span>
                  <span className="text-slate-300 py-1">2</span>
                </div>
              </div>

            </div>

            {/* Row 2: Tracking Graph & Species Ratio Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Main Tracking Graph (Visualizes data respective to user staff name, columns, and master excel table) */}
              <div className="lg:col-span-8 bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
                
                {/* Tracking Graph Header & Live Autofollow Status */}
                <div className="space-y-3">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center flex-wrap gap-2">
                        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-[#0085ff]" />
                          <span>
                            {trackingGraphMode === 'staff_on_x' 
                              ? 'Staff Case Metrics Visualizer (By Staff Name)'
                              : trackingGraphMode === 'staff_lines'
                              ? 'Staff Contribution Curves Across Columns'
                              : trackingGraphMode === 'facility_bars'
                              ? 'Facility Breakdown Visualizer'
                              : 'Master Excel Column Grand Totals Tracking Graph'}
                          </span>
                        </h3>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Live Table Sync Active</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {trackingGraphMode === 'staff_on_x' ? (
                          <>
                            <strong className="text-slate-700">X-Axis:</strong> User Staff Names &bull; <strong className="text-slate-700">Y-Axis:</strong> Respective Cases & Column Metrics &bull; Auto-syncs with Master Excel
                          </>
                        ) : trackingGraphMode === 'staff_lines' ? (
                          <>
                            <strong className="text-slate-700">X-Axis:</strong> Master Columns &bull; <strong className="text-slate-700">Curves:</strong> Individual Staff Members &bull; Dynamic Tracking
                          </>
                        ) : (
                          <>
                            <strong className="text-slate-700">X-Axis:</strong> Master Excel Column Names &bull; <strong className="text-slate-700">Y-Axis:</strong> Respective Column Grand Totals
                          </>
                        )}
                      </p>
                    </div>

                    {/* Graph Style & Mode Switchers */}
                    <div className="flex items-center flex-wrap gap-1.5">
                      {/* Tracking Mode Switcher */}
                      <div className="flex items-center bg-slate-100/90 p-0.5 rounded-xl text-[10px] font-bold">
                        <button
                          onClick={() => setTrackingGraphMode('staff_on_x')}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                            trackingGraphMode === 'staff_on_x'
                              ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                          title="Visualize data in respective to user staff name on X-Axis"
                        >
                          <Users className="w-3 h-3 text-blue-600" />
                          <span>By Staff Name</span>
                        </button>
                        <button
                          onClick={() => setTrackingGraphMode('staff_lines')}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            trackingGraphMode === 'staff_lines'
                              ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                          title="Individual Staff comparison curves across columns"
                        >
                          Staff Curves
                        </button>
                        <button
                          onClick={() => setTrackingGraphMode('cases_on_x')}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            trackingGraphMode === 'cases_on_x'
                              ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                          title="Master Excel Column Names on X-Axis, Quantified Grand Totals on Y-Axis"
                        >
                          Column Totals
                        </button>
                        <button
                          onClick={() => setTrackingGraphMode('facility_bars')}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            trackingGraphMode === 'facility_bars'
                              ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                          title="Breakdown by facility names"
                        >
                          Facilities
                        </button>
                      </div>

                      {/* Visual Curve Style */}
                      <div className="flex items-center bg-slate-50 p-0.5 rounded-xl border border-slate-200/80">
                        <button
                          onClick={() => setChartType('bar')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            chartType === 'bar' ? 'bg-[#0085ff] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                          }`}
                          title="Quantified Peak Bars"
                        >
                          Bars
                        </button>
                        <button
                          onClick={() => setChartType('line')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            chartType === 'line' ? 'bg-[#0085ff] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                          }`}
                          title="Tracking Curve Spline"
                        >
                          Curve
                        </button>
                        <button
                          onClick={() => setChartType('area')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            chartType === 'area' ? 'bg-[#0085ff] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                          }`}
                          title="Luminous Gradient Area"
                        >
                          Area
                        </button>
                        <button
                          onClick={() => setChartType('stepped')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            chartType === 'stepped' ? 'bg-[#0085ff] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                          }`}
                          title="Discrete Quantifier Steps"
                        >
                          Stepped
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Filter & Sort Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    {/* Real-time Dynamic Delta Banner when values change */}
                    {lastQuantityDelta && (Date.now() - lastQuantityDelta.timestamp < 12000) ? (
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-extrabold transition-all animate-fadeIn ${
                        lastQuantityDelta.diff < 0 
                          ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {lastQuantityDelta.diff < 0 ? (
                          <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                        ) : (
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span>
                          {lastQuantityDelta.diff < 0 ? 'Decreased' : 'Increased'}: {lastQuantityDelta.caseName} ({lastQuantityDelta.diff > 0 ? `+${lastQuantityDelta.diff}` : lastQuantityDelta.diff}) in {lastQuantityDelta.facility} &rarr; Graph auto-scaled!
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>
                          {trackingGraphMode === 'staff_on_x' 
                            ? `Visualizing ${caseTrackingMetrics.staffMetricsList.length} staff member${caseTrackingMetrics.staffMetricsList.length === 1 ? '' : 's'} across Master Excel metrics`
                            : 'Quantified directly from columns of Master Excel'}
                        </span>
                      </div>
                    )}

                    {/* Filter Columns / Staff Displayed */}
                    <div className="flex items-center flex-wrap gap-2">
                      {/* Filter by Staff */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400">Staff Filter:</span>
                        <select
                          value={dashboardUsernameFilter}
                          onChange={(e: any) => setDashboardUsernameFilter(e.target.value)}
                          className="text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 cursor-pointer focus:ring-1 focus:ring-blue-500 max-w-[150px]"
                        >
                          <option value="all">All Staff ({rawUsers.length})</option>
                          {rawUsers.map(u => (
                            <option key={u.id} value={u.username}>{u.full_name || u.username} (@{u.username})</option>
                          ))}
                        </select>
                      </div>

                      {/* Filter Columns */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400">Metric Column:</span>
                        <select
                          value={chartMetricFilter}
                          onChange={(e: any) => setChartMetricFilter(e.target.value)}
                          className="text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 cursor-pointer focus:ring-1 focus:ring-blue-500 max-w-[150px]"
                        >
                          <option value="all">All Columns ({caseTrackingMetrics.allColumnPoints.length})</option>
                          {caseTrackingMetrics.allColumnPoints.map(col => (
                            <option key={col.id} value={col.id}>{col.fullName} (Total: {col.grandTotal.toLocaleString()})</option>
                          ))}
                        </select>
                      </div>

                      {/* Sort X-Axis */}
                      <div className="flex items-center gap-1">
                        <select
                          value={chartSortBy}
                          onChange={(e: any) => setChartSortBy(e.target.value)}
                          className="text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 cursor-pointer focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="default_order">Order: Default</option>
                          <option value="quantity_desc">Total (High to Low)</option>
                          <option value="quantity_asc">Total (Low to High)</option>
                        </select>
                      </div>

                      {/* On-Curve Name Badges Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowCurveLabels(!showCurveLabels)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer border ${
                          showCurveLabels 
                            ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs' 
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800'
                        }`}
                        title="Display Column Name and User Name directly on curve points"
                      >
                        <Tag className="w-3 h-3 text-blue-600" />
                        <span>Curve Badges: <strong className={showCurveLabels ? 'text-blue-700' : 'text-slate-400'}>{showCurveLabels ? 'ON' : 'OFF'}</strong></span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Staff / Column Quick Ribbon */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-center scrollbar-thin">
                  {trackingGraphMode === 'staff_on_x' ? (
                    caseTrackingMetrics.staffMetricsList.map((st) => (
                      <div 
                        key={st.username} 
                        onClick={() => setDashboardUsernameFilter(dashboardUsernameFilter === st.rawUsername ? 'all' : st.rawUsername)}
                        className={`min-w-[130px] flex-1 p-2 rounded-2xl bg-white border border-slate-100 shadow-2xs transition-all hover:border-blue-200 cursor-pointer ${
                          dashboardUsernameFilter === st.rawUsername ? 'ring-2 ring-blue-500/40 bg-blue-50/20' : ''
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1 text-[10px] font-bold truncate" style={{ color: st.color }}>
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: st.color }}></span>
                          <span className="truncate">{st.staffName}</span>
                        </div>
                        <div className="text-sm font-black text-slate-900 mt-0.5" style={{ color: st.color }}>
                          {st.grandTotal.toLocaleString()} <span className="text-[10px] font-medium text-slate-400">cases</span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium truncate">
                          {st.username} &bull; {st.submittedRowCount} rows
                        </div>
                      </div>
                    ))
                  ) : (
                    caseTrackingMetrics.allColumnPoints.map((col, idx) => (
                      <div 
                        key={col.id} 
                        onClick={() => setChartMetricFilter(chartMetricFilter === col.id ? 'all' : col.id)}
                        className={`min-w-[120px] flex-1 p-2 rounded-2xl bg-white border border-slate-100 shadow-2xs transition-all hover:border-blue-200 cursor-pointer ${
                          chartMetricFilter === col.id ? 'ring-2 ring-blue-500/30 bg-blue-50/20' : ''
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1 text-[9px] font-bold uppercase truncate" style={{ color: col.color }}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: col.color }}></span>
                          <span className="truncate">{col.fullName}</span>
                        </div>
                        <div className="text-sm font-black text-slate-900 mt-0.5" style={{ color: col.color }}>
                          {col.grandTotal.toLocaleString()}
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium truncate">
                          Column #{idx + 1}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Primary Tracking Graph Canvas */}
                <div className="w-full">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {trackingGraphMode === 'staff_on_x' ? (
                        /* MODE: USER STAFF NAMES ON X-AXIS */
                        chartType === 'bar' ? (
                          <BarChart data={caseTrackingMetrics.staffBarChartData} margin={{ top: 20, right: 20, left: -10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="shortName" 
                              tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 800 }} 
                              axisLine={{ stroke: '#cbd5e1' }}
                              tickLine={false}
                            />
                            <YAxis 
                              domain={[0, caseTrackingMetrics.dynamicYMax]}
                              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                              axisLine={false} 
                              tickLine={false} 
                              tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
                            />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0]?.payload;
                                  return (
                                    <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-2xl text-[11px] font-bold shadow-xl space-y-1.5 min-w-[220px]">
                                      <div className="text-xs text-slate-200 font-extrabold border-b border-slate-800 pb-1 flex items-center justify-between">
                                        <span>{data.staffName}</span>
                                        <span className="text-[10px] text-blue-400">{data.username}</span>
                                      </div>
                                      <div className="text-emerald-400 text-sm font-black flex items-center justify-between">
                                        <span>Total Submitted Cases:</span>
                                        <span>{data.grandTotal.toLocaleString()}</span>
                                      </div>
                                      <div className="space-y-0.5 border-t border-slate-800 pt-1">
                                        {caseTrackingMetrics.allColumnPoints.map(col => (
                                          <div key={col.id} className="flex items-center justify-between text-[10px] text-slate-300">
                                            <span style={{ color: col.color }}>{col.fullName}:</span>
                                            <span className="font-bold">{Number(data[col.id] || 0).toLocaleString()}</span>
                                          </div>
                                        ))}
                                      </div>
                                      <div className="text-[9px] text-slate-400 font-normal">
                                        {data.submittedRowCount} data rows in Master Excel
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            {chartMetricFilter === 'all' ? (
                              caseTrackingMetrics.quantifiedCols.map((col, idx) => (
                                <Bar 
                                  key={col.id}
                                  dataKey={col.id} 
                                  name={col.label}
                                  fill={caseTrackingMetrics.allColumnPoints[idx % caseTrackingMetrics.allColumnPoints.length]?.color || '#0085ff'}
                                  radius={[6, 6, 0, 0]}
                                />
                              ))
                            ) : (
                              <Bar 
                                dataKey={chartMetricFilter} 
                                name={caseTrackingMetrics.allColumnPoints.find(c => c.id === chartMetricFilter)?.fullName || 'Metric'}
                                radius={[8, 8, 0, 0]} 
                                maxBarSize={55}
                              >
                                {caseTrackingMetrics.staffBarChartData.map((entry, idx) => (
                                  <Cell key={`cell-staff-${idx}`} fill={entry.color} />
                                ))}
                              </Bar>
                            )}
                          </BarChart>
                        ) : chartType === 'area' ? (
                          <AreaChart 
                            data={caseTrackingMetrics.staffBarChartData} 
                            margin={{ top: 35, right: 35, left: -10, bottom: 15 }}
                            onMouseMove={(e: any) => {
                              if (e && e.activePayload && e.activePayload.length > 0) {
                                const topPayload = e.activePayload[0];
                                const selectedColName = chartMetricFilter === 'all' ? 'Total Cases' : (caseTrackingMetrics.allColumnPoints.find(c => c.id === chartMetricFilter)?.fullName || 'Metric');
                                setActiveHoverCurvePoint({
                                  userName: topPayload.payload?.staffName,
                                  userHandle: topPayload.payload?.username,
                                  columnName: selectedColName,
                                  value: Number(topPayload.value || 0),
                                  color: '#0085ff'
                                });
                              }
                            }}
                            onMouseLeave={() => setActiveHoverCurvePoint(null)}
                          >
                            <defs>
                              <linearGradient id="areaStaffTrack" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0085ff" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#0085ff" stopOpacity={0.02}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="shortName" 
                              tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 800 }} 
                              axisLine={{ stroke: '#cbd5e1' }}
                              tickLine={false}
                            />
                            <YAxis 
                              domain={[0, caseTrackingMetrics.dynamicYMax]}
                              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                              axisLine={false} 
                              tickLine={false} 
                              tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
                            />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0]?.payload;
                                  const colTitle = chartMetricFilter === 'all' ? 'Total Cases' : (caseTrackingMetrics.allColumnPoints.find(c => c.id === chartMetricFilter)?.fullName || 'Metric');
                                  return (
                                    <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-2xl text-[11px] font-bold shadow-xl space-y-1 min-w-[210px] border border-slate-700">
                                      <div className="text-xs text-slate-200 font-extrabold border-b border-slate-800 pb-1 flex items-center justify-between">
                                        <span>{data.staffName}</span>
                                        <span className="text-[10px] text-blue-400">@{data.username}</span>
                                      </div>
                                      <div className="text-blue-400 text-sm font-black flex items-center justify-between">
                                        <span>{colTitle}:</span>
                                        <span className="text-emerald-400 font-mono font-black">{Number(data[chartMetricFilter === 'all' ? 'grandTotal' : chartMetricFilter] || 0).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey={chartMetricFilter === 'all' ? 'grandTotal' : chartMetricFilter} 
                              stroke="#0085ff" 
                              strokeWidth={3} 
                              fill="url(#areaStaffTrack)" 
                              dot={<CustomCurvePointNode columnName={chartMetricFilter === 'all' ? 'Total Cases' : (caseTrackingMetrics.allColumnPoints.find(c => c.id === chartMetricFilter)?.fullName || 'Metric')} color="#0085ff" showLabels={showCurveLabels} totalPoints={caseTrackingMetrics.staffBarChartData.length} onHoverPoint={setActiveHoverCurvePoint} />}
                              activeDot={{ r: 8, fill: '#0085ff', stroke: '#ffffff', strokeWidth: 3 }}
                            />
                          </AreaChart>
                        ) : (
                          /* Line / Stepped for Staff */
                          <LineChart 
                            data={caseTrackingMetrics.staffBarChartData} 
                            margin={{ top: 35, right: 35, left: -10, bottom: 15 }}
                            onMouseMove={(e: any) => {
                              if (e && e.activePayload && e.activePayload.length > 0) {
                                const topPayload = e.activePayload[0];
                                const selectedColName = chartMetricFilter === 'all' ? 'Total Cases' : (caseTrackingMetrics.allColumnPoints.find(c => c.id === chartMetricFilter)?.fullName || 'Metric');
                                setActiveHoverCurvePoint({
                                  userName: topPayload.payload?.staffName,
                                  userHandle: topPayload.payload?.username,
                                  columnName: selectedColName,
                                  value: Number(topPayload.value || 0),
                                  color: '#0085ff'
                                });
                              }
                            }}
                            onMouseLeave={() => setActiveHoverCurvePoint(null)}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="shortName" 
                              tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 800 }} 
                              axisLine={{ stroke: '#cbd5e1' }}
                              tickLine={false}
                            />
                            <YAxis 
                              domain={[0, caseTrackingMetrics.dynamicYMax]}
                              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                              axisLine={false} 
                              tickLine={false} 
                            />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0]?.payload;
                                  const colTitle = chartMetricFilter === 'all' ? 'Total Cases' : (caseTrackingMetrics.allColumnPoints.find(c => c.id === chartMetricFilter)?.fullName || 'Metric');
                                  return (
                                    <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-2xl text-[11px] font-bold shadow-xl space-y-1.5 min-w-[210px] border border-slate-700">
                                      <div className="text-xs text-slate-200 font-extrabold border-b border-slate-800 pb-1 flex items-center justify-between">
                                        <span>{data.staffName}</span>
                                        <span className="text-[10px] text-blue-400">@{data.username}</span>
                                      </div>
                                      <div className="text-emerald-400 text-sm font-black flex items-center justify-between">
                                        <span>{colTitle}:</span>
                                        <span className="font-mono">{Number(data[chartMetricFilter === 'all' ? 'grandTotal' : chartMetricFilter] || 0).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Line 
                              type={chartType === 'stepped' ? 'stepAfter' : 'monotone'} 
                              dataKey={chartMetricFilter === 'all' ? 'grandTotal' : chartMetricFilter} 
                              stroke="#0085ff" 
                              strokeWidth={3.5} 
                              dot={<CustomCurvePointNode columnName={chartMetricFilter === 'all' ? 'Total Cases' : (caseTrackingMetrics.allColumnPoints.find(c => c.id === chartMetricFilter)?.fullName || 'Metric')} color="#0085ff" showLabels={showCurveLabels} totalPoints={caseTrackingMetrics.staffBarChartData.length} onHoverPoint={setActiveHoverCurvePoint} />}
                              activeDot={{ r: 8, fill: '#0085ff', stroke: '#ffffff', strokeWidth: 3 }}
                              name="Total Cases"
                            />
                          </LineChart>
                        )
                      ) : trackingGraphMode === 'staff_lines' ? (
                        /* MODE: STAFF CURVES TRACING ACROSS COLUMNS */
                        <LineChart 
                          data={caseTrackingMetrics.staffMultiTraceChartData} 
                          margin={{ top: 35, right: 35, left: -10, bottom: 15 }}
                          onMouseMove={(e: any) => {
                            if (e && e.activePayload && e.activePayload.length > 0) {
                              const topPayload = e.activePayload[0];
                              setActiveHoverCurvePoint({
                                userName: topPayload.name || topPayload.dataKey,
                                columnName: e.activeLabel || topPayload.payload?.fullName || topPayload.payload?.caseName,
                                value: Number(topPayload.value || 0),
                                color: topPayload.color
                              });
                            }
                          }}
                          onMouseLeave={() => setActiveHoverCurvePoint(null)}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="caseName" 
                            tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 800 }} 
                            axisLine={{ stroke: '#cbd5e1' }}
                            tickLine={false}
                          />
                          <YAxis 
                            domain={[0, caseTrackingMetrics.dynamicYMax]}
                            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                            axisLine={false} 
                            tickLine={false} 
                          />
                          <Tooltip 
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-slate-900/95 backdrop-blur-sm text-white px-3.5 py-2.5 rounded-2xl text-[11px] font-bold shadow-xl space-y-1.5 min-w-[240px] max-h-64 overflow-y-auto border border-slate-700">
                                    <div className="text-xs text-blue-400 font-extrabold border-b border-slate-800 pb-1 flex items-center justify-between">
                                      <span>Column: {label}</span>
                                      <span className="text-[10px] text-slate-400 font-normal">Master Excel</span>
                                    </div>
                                    <div className="space-y-1">
                                      {payload.map((p: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between gap-3 text-[11px] py-0.5 border-b border-slate-800/40" style={{ color: p.color }}>
                                          <span className="font-semibold flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }}></span>
                                            {p.name}
                                          </span>
                                          <span className="font-mono font-black text-white bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                                            {Number(p.value).toLocaleString()} cases
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Grand Total" 
                            stroke="#0f172a" 
                            strokeWidth={2.5} 
                            strokeDasharray="4 4" 
                            dot={<CustomCurvePointNode staffName="All Users (Grand Total Σ)" columnName="Grand Total" color="#0f172a" showLabels={showCurveLabels} totalPoints={caseTrackingMetrics.staffMultiTraceChartData.length} onHoverPoint={setActiveHoverCurvePoint} />} 
                          />
                          {caseTrackingMetrics.staffMetricsList.map((st) => (
                            <Line 
                              key={st.username} 
                              type="monotone" 
                              dataKey={st.staffName} 
                              stroke={st.color} 
                              strokeWidth={2.5} 
                              dot={<CustomCurvePointNode staffName={st.staffName} staffUsername={st.username} color={st.color} showLabels={showCurveLabels} totalPoints={caseTrackingMetrics.staffMultiTraceChartData.length} onHoverPoint={setActiveHoverCurvePoint} />} 
                              activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2.5 }}
                            />
                          ))}
                        </LineChart>
                      ) : trackingGraphMode === 'cases_on_x' ? (
                        /* MODE 1: Specific Cases on X-Axis, Grand Total Quantified on Y-Axis */
                        chartType === 'bar' ? (
                          <BarChart data={caseTrackingMetrics.casePoints} margin={{ top: 20, right: 20, left: -10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="caseName" 
                              tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 800 }} 
                              axisLine={{ stroke: '#cbd5e1' }}
                              tickLine={false}
                            />
                            <YAxis 
                              domain={[0, caseTrackingMetrics.dynamicYMax]}
                              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                              axisLine={false} 
                              tickLine={false} 
                              tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
                            />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0]?.payload;
                                  return (
                                    <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-2xl text-[11px] font-bold shadow-xl space-y-1 min-w-[200px] border border-slate-700">
                                      <div className="text-xs text-slate-200 font-extrabold border-b border-slate-800 pb-1">
                                        {data.fullName}
                                      </div>
                                      <div className="text-emerald-400 text-sm font-black flex items-center justify-between">
                                        <span>Grand Total:</span>
                                        <span>{data.grandTotal.toLocaleString()} cases</span>
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-normal">
                                        {data.description}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar 
                              dataKey="grandTotal" 
                              radius={[8, 8, 0, 0]} 
                              maxBarSize={55}
                            >
                              {caseTrackingMetrics.casePoints.map((entry, idx) => (
                                <Cell key={`cell-${idx}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        ) : chartType === 'area' ? (
                          <AreaChart 
                            data={caseTrackingMetrics.casePoints} 
                            margin={{ top: 35, right: 35, left: -10, bottom: 15 }}
                            onMouseMove={(e: any) => {
                              if (e && e.activePayload && e.activePayload.length > 0) {
                                const topPayload = e.activePayload[0];
                                const activeUserName = dashboardUsernameFilter === 'all' ? 'All Staff (Combined)' : (rawUsers.find(u => u.username === dashboardUsernameFilter)?.full_name || dashboardUsernameFilter);
                                setActiveHoverCurvePoint({
                                  userName: activeUserName,
                                  columnName: topPayload.payload?.fullName || topPayload.payload?.caseName,
                                  value: Number(topPayload.value || 0),
                                  color: '#0085ff'
                                });
                              }
                            }}
                            onMouseLeave={() => setActiveHoverCurvePoint(null)}
                          >
                            <defs>
                              <linearGradient id="areaGrandTotalTrack" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0085ff" stopOpacity={0.35}/>
                                <stop offset="95%" stopColor="#0085ff" stopOpacity={0.02}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="caseName" 
                              tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 800 }} 
                              axisLine={{ stroke: '#cbd5e1' }}
                              tickLine={false}
                            />
                            <YAxis 
                              domain={[0, caseTrackingMetrics.dynamicYMax]}
                              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                              axisLine={false} 
                              tickLine={false} 
                              tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
                            />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0]?.payload;
                                  return (
                                    <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-2xl text-[11px] font-bold shadow-xl space-y-1 min-w-[200px] border border-slate-700">
                                      <div className="text-xs text-slate-200 font-extrabold border-b border-slate-800 pb-1">
                                        {data.fullName}
                                      </div>
                                      <div className="text-blue-400 text-sm font-black flex items-center justify-between">
                                        <span>Grand Total:</span>
                                        <span>{data.grandTotal.toLocaleString()} cases</span>
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-normal">
                                        {data.description}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="grandTotal" 
                              stroke="#0085ff" 
                              strokeWidth={3} 
                              fill="url(#areaGrandTotalTrack)" 
                              dot={<CustomCurvePointNode staffName={dashboardUsernameFilter === 'all' ? 'All Staff (Combined)' : (rawUsers.find(u => u.username === dashboardUsernameFilter)?.full_name || dashboardUsernameFilter)} color="#0085ff" showLabels={showCurveLabels} totalPoints={caseTrackingMetrics.casePoints.length} onHoverPoint={setActiveHoverCurvePoint} />}
                              activeDot={{ r: 8, fill: '#0085ff', stroke: '#ffffff', strokeWidth: 3 }}
                            />
                          </AreaChart>
                        ) : (
                          /* Standard Line / Stepped Tracking Graph */
                          <LineChart 
                            data={caseTrackingMetrics.casePoints} 
                            margin={{ top: 35, right: 35, left: -10, bottom: 15 }}
                            onMouseMove={(e: any) => {
                              if (e && e.activePayload && e.activePayload.length > 0) {
                                const topPayload = e.activePayload[0];
                                const activeUserName = dashboardUsernameFilter === 'all' ? 'All Staff (Combined)' : (rawUsers.find(u => u.username === dashboardUsernameFilter)?.full_name || dashboardUsernameFilter);
                                setActiveHoverCurvePoint({
                                  userName: activeUserName,
                                  columnName: topPayload.payload?.fullName || topPayload.payload?.caseName,
                                  value: Number(topPayload.value || 0),
                                  color: '#0085ff'
                                });
                              }
                            }}
                            onMouseLeave={() => setActiveHoverCurvePoint(null)}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="caseName" 
                              tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 800 }} 
                              axisLine={{ stroke: '#cbd5e1' }}
                              tickLine={false}
                            />
                            <YAxis 
                              domain={[0, caseTrackingMetrics.dynamicYMax]}
                              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                              axisLine={false} 
                              tickLine={false} 
                              tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
                            />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0]?.payload;
                                  return (
                                    <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-2xl text-[11px] font-bold shadow-xl space-y-1.5 min-w-[210px] border border-slate-700">
                                      <div className="text-xs text-slate-200 font-extrabold border-b border-slate-800 pb-1 flex items-center justify-between">
                                        <span>{data.fullName}</span>
                                        <span className="text-[10px] text-slate-400">Master Column</span>
                                      </div>
                                      <div className="text-emerald-400 text-sm font-black flex items-center justify-between">
                                        <span>Grand Total:</span>
                                        <span className="font-mono">{data.grandTotal.toLocaleString()} cases</span>
                                      </div>
                                      <div className="text-[10px] text-slate-300 font-normal">
                                        {data.description}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Line 
                              type={chartType === 'stepped' ? 'stepAfter' : 'monotone'} 
                              dataKey="grandTotal" 
                              stroke="#0085ff" 
                              strokeWidth={3.5} 
                              dot={<CustomCurvePointNode staffName={dashboardUsernameFilter === 'all' ? 'All Staff (Combined)' : (rawUsers.find(u => u.username === dashboardUsernameFilter)?.full_name || dashboardUsernameFilter)} color="#0085ff" showLabels={showCurveLabels} totalPoints={caseTrackingMetrics.casePoints.length} onHoverPoint={setActiveHoverCurvePoint} />}
                              activeDot={{ r: 8, fill: '#0085ff', stroke: '#ffffff', strokeWidth: 3 }}
                              name="Grand Total"
                            />
                          </LineChart>
                        )
                      ) : (
                        /* MODE: Facility Breakdown Bars */
                        <BarChart data={caseTrackingMetrics.facilityBarChartData} margin={{ top: 15, right: 15, left: -15, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="shortName" 
                            tick={{ fontSize: 10, fill: '#475569', fontWeight: 700 }} 
                            axisLine={false} 
                            tickLine={false}
                          />
                          <YAxis 
                            domain={[0, caseTrackingMetrics.dynamicYMax]}
                            tick={{ fontSize: 10, fill: '#94a3b8' }} 
                            axisLine={false} 
                            tickLine={false} 
                          />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const current = payload[0]?.payload;
                                return (
                                  <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-2xl text-[11px] font-bold shadow-xl space-y-1 min-w-[190px]">
                                    <div className="text-slate-200 text-xs border-b border-slate-800 pb-1 font-extrabold">
                                      {current?.name}
                                    </div>
                                    {caseTrackingMetrics.allColumnPoints.map((col) => {
                                      const val = current?.[col.id] ?? 0;
                                      return (
                                        <div key={col.id} className="flex items-center justify-between" style={{ color: col.color }}>
                                          <span>{col.fullName}:</span>
                                          <span className="font-extrabold">{Number(val).toLocaleString()}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          {caseTrackingMetrics.allColumnPoints.map((col) => (
                            <Bar 
                              key={col.id}
                              dataKey={col.id} 
                              fill={col.color} 
                              name={col.fullName} 
                              radius={[4, 4, 0, 0]} 
                            />
                          ))}
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Live Curve Inspector & Focused Curve Node Pinboard */}
                <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-md border border-slate-700/70 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Active Curve Point / Selection */}
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm border border-white/20 transition-all"
                        style={{ backgroundColor: activeHoverCurvePoint?.color || '#0085ff' }}
                      >
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            On-Curve Data Focus:
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-blue-500/20 text-blue-300 border border-blue-400/30">
                            {activeHoverCurvePoint ? 'Hovered Curve Node' : 'Overview Node Focus'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                          {/* User Name Pill */}
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-blue-300 font-extrabold">
                            <User className="w-3.5 h-3.5 text-blue-400" />
                            <span>Staff: <strong className="text-white font-black">{activeHoverCurvePoint?.userName || (dashboardUsernameFilter === 'all' ? 'All Staff Members' : dashboardUsernameFilter)}</strong></span>
                            {activeHoverCurvePoint?.userHandle && (
                              <span className="text-[10px] text-slate-400 font-normal">(@{activeHoverCurvePoint.userHandle})</span>
                            )}
                          </div>

                          <span className="text-slate-500 font-bold">&bull;</span>

                          {/* Column Name Pill */}
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-emerald-300 font-extrabold">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Column: <strong className="text-white font-black">{activeHoverCurvePoint?.columnName || (chartMetricFilter === 'all' ? 'All Quantified Columns' : chartMetricFilter)}</strong></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Plotted Quantity Metric Callout */}
                    <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700 px-3.5 py-2 rounded-xl shrink-0">
                      <div className="text-right">
                        <span className="text-[9.5px] uppercase font-extrabold text-slate-400 block">Curve Value</span>
                        <span className="text-base font-black text-emerald-400 font-mono">
                          {activeHoverCurvePoint?.value !== undefined 
                            ? (activeHoverCurvePoint.value ?? 0).toLocaleString() 
                            : (caseTrackingMetrics.grandSumAcrossCases ?? 0).toLocaleString()}
                          <span className="text-[10px] font-medium text-slate-300 ml-1">cases</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Staff Curve Legend with individual point triggers */}
                  {trackingGraphMode === 'staff_lines' && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center gap-2 overflow-x-auto scrollbar-thin">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase shrink-0">Curve Traces:</span>
                      <div 
                        onMouseEnter={() => setActiveHoverCurvePoint({
                          userName: 'All Users (Grand Total Σ)',
                          columnName: 'All Master Columns',
                          value: caseTrackingMetrics.grandSumAcrossCases ?? 0,
                          color: '#0f172a'
                        })}
                        className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 cursor-pointer hover:border-slate-500"
                      >
                        <span className="w-2.5 h-0.5 bg-slate-400 border-t border-dashed border-white"></span>
                        <span>Grand Total Σ ({(caseTrackingMetrics.grandSumAcrossCases ?? 0).toLocaleString()} cases)</span>
                      </div>
                      {caseTrackingMetrics.staffMetricsList.map(st => (
                        <div 
                          key={st.username}
                          onMouseEnter={() => setActiveHoverCurvePoint({
                            userName: st.staffName,
                            userHandle: st.username,
                            columnName: 'All Master Columns',
                            value: st.grandTotal ?? 0,
                            color: st.color
                          })}
                          className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-bold cursor-pointer hover:border-slate-500 transition-colors"
                          style={{ color: st.color }}
                        >
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: st.color }}></span>
                          <span className="font-extrabold">{st.staffName}</span>
                          <span className="text-[9.5px] text-slate-400 font-medium">({(st.grandTotal ?? 0).toLocaleString()} cases)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tracking Graph Footnotes & Node Details */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    {trackingGraphMode === 'staff_on_x' ? (
                      caseTrackingMetrics.staffMetricsList.map((st) => (
                        <div key={st.username} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] font-bold ${st.badgeBg}`}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }}></span>
                          <span>{st.staffName}: <strong>{st.grandTotal.toLocaleString()}</strong></span>
                        </div>
                      ))
                    ) : (
                      caseTrackingMetrics.casePoints.map((cp) => (
                        <div key={cp.id} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] font-bold ${cp.badgeBg}`}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cp.color }}></span>
                          <span>{cp.caseName}: <strong>{cp.grandTotal.toLocaleString()}</strong></span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    Tracking graph recalculates automatically upon any table cell decrease or increase
                  </div>
                </div>
              </div>

              {/* Chart 2: Dynamic Column Metrics & Staff Contribution Ratio (Donut Chart) */}
              <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 truncate max-w-[180px]" title={aggregatedMasterData.template?.title || 'Master Excel'}>
                        {donutRatioMode === 'staff' 
                          ? 'Staff Contribution Ratio' 
                          : (aggregatedMasterData.template?.title ? `${aggregatedMasterData.template.title} Ratio` : 'Species & Metrics Ratio')}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {donutRatioMode === 'staff' ? 'Share by User Staff Name' : 'Master Column Composition'}
                      </p>
                    </div>

                    {/* Donut Mode Switcher */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                      <button
                        onClick={() => setDonutRatioMode('staff')}
                        className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                          donutRatioMode === 'staff'
                            ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Show percentage distribution by User Staff Member"
                      >
                        Staff
                      </button>
                      <button
                        onClick={() => setDonutRatioMode('columns')}
                        className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                          donutRatioMode === 'columns'
                            ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Show percentage distribution by Column Metrics"
                      >
                        Columns
                      </button>
                    </div>
                  </div>

                  {/* Donut Ring Chart */}
                  <div className="h-44 w-full flex items-center justify-center relative mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutCaseDistribution}
                          innerRadius={48}
                          outerRadius={70}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {donutCaseDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white px-2.5 py-1.5 rounded-xl text-[10px] font-bold shadow-lg">
                                  <div className="text-slate-200">{data.name} {data.username ? `(${data.username})` : ''}</div>
                                  <div className="text-amber-300 font-black">{data.value.toLocaleString()} units ({data.percentage}%)</div>
                                  {data.submittedRowCount ? (
                                    <div className="text-slate-400 text-[9px]">{data.submittedRowCount} rows in Master Excel</div>
                                  ) : null}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Centered Total Count */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-base font-black text-slate-900 leading-none">
                        {donutCaseDistribution.reduce((a, b) => a + b.value, 0).toLocaleString()}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 mt-0.5">Grand Sum</span>
                    </div>
                  </div>
                </div>

                {/* Bullet Legend with dynamic staff/column names, numbers and percentages */}
                <div className="space-y-2 text-xs font-semibold text-slate-600 border-t border-slate-100 pt-3 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                  {donutCaseDistribution.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                        <span className="font-bold text-slate-800 truncate" title={item.name}>
                          {item.name} {item.username ? <span className="text-slate-400 font-normal">({item.username})</span> : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-extrabold text-slate-900">{item.value.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-slate-400">({item.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Row 3: FULL MASTER EXCEL SPREADSHEET (Total case, P.V, P.F, Total columns) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
              
              {/* Header: Master Excel Controls & Quick Action Tools */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-[#0085ff]/10 text-[#0085ff] flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900">
                        Master Excel Data Table
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0085ff] border border-blue-100">
                        {aggregatedMasterData.grandTotalRows} Total Rows
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      Tracking Total case, P.V, P.F and Total entered by healthcare staff with instant real-time chart sync
                    </p>
                  </div>
                </div>

                {/* Filter & Action Toolbars */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Select Template */}
                  <select
                    value={dashboardSelectedTableId}
                    onChange={(e) => setDashboardSelectedTableId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                  >
                    <option value="all">Active: {tableTemplates[0]?.title || 'Select Table'}</option>
                    {tableTemplates.map(tpl => (
                      <option key={tpl.id} value={tpl.id}>{tpl.title}</option>
                    ))}
                  </select>

                  {/* Filter by User */}
                  <select
                    value={dashboardUsernameFilter}
                    onChange={(e) => setDashboardUsernameFilter(e.target.value)}
                    className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                  >
                    <option value="all">All Staff ({rawUsers.length})</option>
                    {rawUsers.map(u => (
                      <option key={u.id} value={u.username}>@{u.username}</option>
                    ))}
                  </select>

                  {/* Add Row Button */}
                  <button
                    onClick={handleAddNewRowQuick}
                    className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0085ff] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>

                  {/* Add Column Button */}
                  <button
                    onClick={() => setIsAddColumnModalOpen(true)}
                    className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs border border-purple-200"
                    title="Add dynamic column to Master Excel table and chart visualizer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-purple-600" />
                    <span>Add Column</span>
                  </button>

                  {/* Export Excel (.xlsx) */}
                  <button
                    onClick={() => {
                      if (aggregatedMasterData.template) {
                        const success = exportTableByTitleExcel(aggregatedMasterData.template.id);
                        if (success) onShowToast('Excel Exported', `Downloaded "${aggregatedMasterData.template.title}" as .xlsx`, 'success');
                      } else {
                        const success = exportMasterExcelWorkbook();
                        if (success) onShowToast('Master Workbook Exported', 'Downloaded complete multi-sheet workbook.', 'success');
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#0085ff] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-blue-500/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export (.xlsx)</span>
                  </button>

                  {/* Full Master View Navigation */}
                  <button
                    onClick={() => onNavigate('admin-master-excel')}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Open Fullscreen Master View"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Master Excel Interactive Spreadsheet Grid */}
              {aggregatedMasterData.template ? (
                <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto max-h-[480px]">
                    <table className="w-full text-left text-xs border-collapse">
                      {/* Table Headers */}
                      <thead className="bg-[#0085ff] text-white sticky top-0 z-10 shadow-xs">
                        <tr>
                          <th className="py-3 px-3.5 font-bold border-r border-blue-400/40 w-12 text-center">#</th>
                          <th className="py-3 px-3.5 font-bold border-r border-blue-400/40 w-40">Staff User</th>
                          {aggregatedMasterData.template.columns.map(col => (
                            <th key={col.id} className="py-3 px-3.5 font-bold border-r border-blue-400/40 min-w-[130px] group">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="truncate">{col.label}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  {col.required && <span className="text-amber-300 text-[10px]">*</span>}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingColumnModal({
                                        tableId: aggregatedMasterData.template!.id,
                                        columnId: col.id,
                                        currentLabel: col.label
                                      });
                                      setRenamedColumnLabel(col.label);
                                    }}
                                    className="p-0.5 rounded hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                                    title={`Rename column "${col.label}"`}
                                  >
                                    <Edit3 className="w-2.5 h-2.5" />
                                  </button>
                                  {col.id !== 'col_facility' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteColumn(aggregatedMasterData.template!.id, col.id, col.label);
                                      }}
                                      className="p-0.5 rounded hover:bg-rose-500/40 text-white/80 hover:text-rose-200 transition-colors cursor-pointer"
                                      title={`Delete column "${col.label}"`}
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </th>
                          ))}
                          {/* Add Column Table Header Button */}
                          <th className="py-3 px-2 font-bold border-r border-blue-400/40 w-10 text-center bg-blue-600/60">
                            <button
                              onClick={() => setIsAddColumnModalOpen(true)}
                              className="w-full h-full flex items-center justify-center text-blue-200 hover:text-white transition-colors cursor-pointer"
                              title="Add new column to this Master Excel table"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </th>
                          {/* Grand Total Sum Arranged as Column (Sum Along Row) */}
                          <th className="py-3 px-3.5 font-black border-r border-blue-400/40 bg-blue-700/90 text-amber-200 min-w-[140px] text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-amber-300 text-xs font-black">Σ</span>
                              <span>Grand Total Sum</span>
                            </div>
                          </th>
                          <th className="py-3 px-3.5 font-bold border-r border-blue-400/40 w-28 text-center">Status</th>
                          <th className="py-3 px-2 font-bold w-12 text-center"></th>
                        </tr>
                      </thead>

                      {/* Table Rows Grouped by User */}
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {aggregatedMasterData.userSections.map((sec, sIdx) => {
                          if (sec.rows.length === 0) {
                            return (
                              <tr key={sec.user.id} className="bg-slate-50/40 hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-3.5 text-slate-400 font-mono text-center border-r border-slate-100">
                                  {sIdx + 1}
                                </td>
                                <td className="py-3 px-3.5 border-r border-slate-100">
                                  <div className="font-bold text-slate-900">@{sec.user.username}</div>
                                  <div className="text-[10px] text-slate-400">{sec.user.email}</div>
                                </td>
                                <td 
                                  colSpan={aggregatedMasterData.template!.columns.length + 1} 
                                  className="py-3 px-3.5 text-slate-400 italic text-center border-r border-slate-100"
                                >
                                  <div className="flex items-center justify-center gap-2">
                                    <span>No records submitted yet.</span>
                                    <button
                                      onClick={() => handleAddRowForUser(aggregatedMasterData.template!.id, sec.user.id)}
                                      className="text-[#0085ff] hover:underline font-bold text-[11px]"
                                    >
                                      + Add Initial Row
                                    </button>
                                  </div>
                                </td>
                                <td className="py-3 px-3.5 text-center border-r border-slate-100">
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                    Not Started
                                  </span>
                                </td>
                                <td className="py-3 px-2 text-center"></td>
                              </tr>
                            );
                          }

                          return sec.rows.map((rowItem, rIdx) => {
                            // Calculate Grand Sum along the row across all quantified numeric columns
                            let rowGrandSum = 0;
                            aggregatedMasterData.template!.columns.forEach(col => {
                              if (col.type === 'number' || col.type === 'currency' || col.summary === 'sum') {
                                const raw = rowItem.rowData[col.id];
                                if (raw !== undefined && raw !== null && raw !== '') {
                                  const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[^0-9.-]/g, ''));
                                  if (!isNaN(num)) {
                                    rowGrandSum += num;
                                  }
                                }
                              }
                            });

                            return (
                            <tr key={`${sec.user.id}-${rIdx}`} className="hover:bg-blue-50/20 transition-colors">
                              <td className="py-2.5 px-3.5 text-slate-400 font-mono text-center border-r border-slate-100 text-[11px]">
                                {rIdx + 1}
                              </td>
                              <td className="py-2.5 px-3.5 border-r border-slate-100">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  <span>@{sec.user.username}</span>
                                </div>
                                <div className="text-[10px] text-slate-400">{sec.user.full_name || sec.user.email}</div>
                              </td>

                              {/* Editable Input Cells for each column with quick +/- adjusters */}
                              {aggregatedMasterData.template!.columns.map(col => {
                                const isNumericCol = col.type === 'number' || col.type === 'currency' || col.summary === 'sum';
                                
                                return (
                                  <td key={col.id} className="p-1 border-r border-slate-100 relative group/cell">
                                    {col.type === 'status' ? (
                                      <select
                                        value={rowItem.rowData[col.id] || col.defaultValue || 'Confirmed'}
                                        onChange={(e) => handleDashboardCellChange(
                                          aggregatedMasterData.template!.id,
                                          sec.user.id,
                                          rowItem.rowIndex,
                                          col.id,
                                          e.target.value
                                        )}
                                        className="w-full px-2 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded border border-transparent font-semibold text-slate-800"
                                      >
                                        {(col.options || ['Confirmed', 'Under Review', 'Draft', 'Action Required']).map(opt => (
                                          <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                      </select>
                                    ) : (
                                      <div className="relative flex items-center">
                                        <input
                                          type={col.type === 'number' || col.type === 'currency' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                                          value={rowItem.rowData[col.id] ?? ''}
                                          onChange={(e) => handleDashboardCellChange(
                                            aggregatedMasterData.template!.id,
                                            sec.user.id,
                                            rowItem.rowIndex,
                                            col.id,
                                            e.target.value
                                          )}
                                          placeholder={col.placeholder || '-'}
                                          className={`w-full px-2.5 py-1.5 text-xs bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded font-semibold text-slate-800 ${
                                            col.id === 'col_pv' ? 'text-amber-700 font-bold' :
                                            col.id === 'col_pf' ? 'text-rose-700 font-bold' :
                                            col.id === 'col_total' ? 'text-emerald-700 font-black' :
                                            col.id === 'col_total_cases' ? 'text-blue-700 font-bold' : ''
                                          } ${col.align === 'right' ? 'text-right pr-8' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                                        />

                                        {/* Quick +/- micro-steppers for quantified columns to easily test decrease/increase tracking */}
                                        {isNumericCol && (
                                          <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover/cell:flex items-center gap-0.5 bg-white/95 shadow-2xs border border-slate-200 rounded px-0.5 py-0.5 z-10">
                                            <button
                                              type="button"
                                              onClick={() => handleQuickQuantityAdjust(
                                                aggregatedMasterData.template!.id,
                                                sec.user.id,
                                                rowItem.rowIndex,
                                                col.id,
                                                -1
                                              )}
                                              title="Decrease quantity by 1 (Chart will auto-update)"
                                              className="w-4 h-4 rounded bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 flex items-center justify-center text-[10px] font-black cursor-pointer leading-none transition-colors"
                                            >
                                              -
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleQuickQuantityAdjust(
                                                aggregatedMasterData.template!.id,
                                                sec.user.id,
                                                rowItem.rowIndex,
                                                col.id,
                                                1
                                              )}
                                              title="Increase quantity by 1 (Chart will auto-update)"
                                              className="w-4 h-4 rounded bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-600 flex items-center justify-center text-[10px] font-black cursor-pointer leading-none transition-colors"
                                            >
                                              +
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}

                              {/* Empty cell matching Add Column Header */}
                              <td className="py-2.5 px-2 text-center border-r border-slate-100 bg-slate-50/20"></td>

                              {/* Grand Total Sum Column for this row (Sum Along the Row) */}
                              <td className="py-2.5 px-3.5 border-r border-slate-100 bg-amber-50/40 text-right">
                                <div className="flex items-center justify-end gap-1 font-mono font-black text-amber-900 text-xs">
                                  <span className="text-[10px] text-amber-600 font-bold">Σ</span>
                                  <span>{rowGrandSum.toLocaleString()}</span>
                                </div>
                              </td>

                              {/* Submission Status */}
                              <td className="py-2.5 px-3.5 text-center border-r border-slate-100">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  sec.status === 'Submitted'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {sec.status}
                                </span>
                              </td>

                              {/* Row Action: Delete */}
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  onClick={() => handleDeleteRowForUser(aggregatedMasterData.template!.id, sec.user.id, rowItem.rowIndex)}
                                  className="text-slate-300 hover:text-rose-500 p-1 rounded transition-colors cursor-pointer"
                                  title="Delete row"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        });
                        })}
                      </tbody>

                      {/* Totals & Summary Aggregate Footer */}
                      <tfoot className="bg-slate-100 text-slate-900 font-bold border-t-2 border-slate-200 sticky bottom-0">
                        <tr>
                          <td className="py-3 px-3.5 text-center font-bold text-slate-600 border-r border-slate-200">
                            Σ
                          </td>
                          <td className="py-3 px-3.5 border-r border-slate-200">
                            Column Totals ({aggregatedMasterData.grandTotalRows} Rows)
                          </td>
                          {aggregatedMasterData.template.columns.map(col => (
                            <td key={col.id} className="py-3 px-3.5 border-r border-slate-200">
                              {col.summary === 'sum' && aggregatedMasterData.columnSums?.[col.id] !== undefined ? (
                                <span className={`font-extrabold ${
                                  col.id === 'col_pv' ? 'text-[#f59e0b]' :
                                  col.id === 'col_pf' ? 'text-[#ef4444]' :
                                  col.id === 'col_total' ? 'text-[#10b981]' :
                                  col.id === 'col_total_cases' ? 'text-[#0085ff]' : 'text-slate-900'
                                }`}>
                                  {(aggregatedMasterData.columnSums[col.id] ?? 0).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal">-</span>
                              )}
                            </td>
                          ))}
                          {/* Footer empty cell matching Add Column header */}
                          <td className="py-3 px-2 border-r border-slate-200 bg-slate-50/50"></td>
                          {/* Grand Total Sum Column Footer Value (Combined Total Sum of All Rows) */}
                          <td className="py-3 px-3.5 text-right border-r border-slate-200 bg-amber-100/70 font-mono font-black text-amber-950 text-xs">
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-[10px] text-amber-700 font-bold">Total Σ:</span>
                              <span className="text-sm">
                                {Object.values(aggregatedMasterData.columnSums || {}).reduce((acc: number, v: any) => acc + (Number(v) || 0), 0).toLocaleString()}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-center border-r border-slate-200 font-bold text-emerald-700">
                            Live Synced
                          </td>
                          <td className="py-3 px-2"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No spreadsheet tables available.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Submission Detail Modal */}
      {selectedSubmissionId && (
        <SubmissionDetailModal
          submissionId={selectedSubmissionId}
          isOpen={true}
          onClose={() => setSelectedSubmissionId(null)}
          onShowToast={onShowToast}
        />
      )}

      {/* User Login Links Modal */}
      {isLinksModalOpen && (
        <UserLoginLinksModal
          isOpen={isLinksModalOpen}
          onClose={() => setIsLinksModalOpen(false)}
          onShowToast={onShowToast}
        />
      )}

      {/* Add Dynamic Column Modal */}
      {isAddColumnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Add Dynamic Column</h3>
                  <p className="text-[11px] text-slate-400">Add a dynamic column to Master Excel and visualizer</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddColumnModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddColumnSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Column Header Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mixed Infection, Severe Malaria, Rapid Diagnostic Test"
                  value={newColumnLabel}
                  onChange={(e) => setNewColumnLabel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium text-slate-900"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data Type</label>
                  <select
                    value={newColumnType}
                    onChange={(e) => setNewColumnType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium text-slate-800 cursor-pointer"
                  >
                    <option value="number">Number (Quantifiable)</option>
                    <option value="currency">Currency ($)</option>
                    <option value="text">Text / Label</option>
                    <option value="date">Date</option>
                    <option value="status">Status Badge</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Summary Total</label>
                  <select
                    value={newColumnSummary}
                    onChange={(e) => setNewColumnSummary(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium text-slate-800 cursor-pointer"
                  >
                    <option value="sum">Sum (Σ)</option>
                    <option value="avg">Average</option>
                    <option value="count">Count</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="reqColCheck"
                  checked={newColumnRequired}
                  onChange={(e) => setNewColumnRequired(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                />
                <label htmlFor="reqColCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Required field for staff submissions
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddColumnModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-md shadow-purple-500/20 cursor-pointer"
                >
                  Add Dynamic Column
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Dynamic Column Modal */}
      {editingColumnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Rename Column</h3>
                  <p className="text-[11px] text-slate-400">Updates header across table and charts</p>
                </div>
              </div>
              <button
                onClick={() => setEditingColumnModal(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRenameColumnSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Header Title</label>
                <input
                  type="text"
                  required
                  value={renamedColumnLabel}
                  onChange={(e) => setRenamedColumnLabel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingColumnModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0085ff] hover:bg-blue-600 text-white font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Master Excel Table Modal */}
      {isCreateMasterTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">New Master Excel Spreadsheet</h3>
                  <p className="text-[11px] text-slate-400">Create new surveillance data table for all staff</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateMasterTableModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMasterTableSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Spreadsheet Table Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly Rapid Diagnostic Surveillance"
                  value={newMasterTableTitle}
                  onChange={(e) => setNewMasterTableTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category / Domain</label>
                <input
                  type="text"
                  value={newMasterTableCategory}
                  onChange={(e) => setNewMasterTableCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newMasterTableDesc}
                  onChange={(e) => setNewMasterTableDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateMasterTableModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  Create &amp; Open in Visualizer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
