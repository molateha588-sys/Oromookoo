import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Search, 
  Download, 
  FileSpreadsheet, 
  AlertCircle, 
  HelpCircle, 
  Check, 
  ChevronDown, 
  Calculator, 
  ArrowUpDown, 
  Sparkles, 
  Upload, 
  CornerDownRight, 
  Maximize2, 
  Table as TableIcon, 
  Layers, 
  CheckCircle2, 
  Info, 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Palette, 
  Type, 
  Printer, 
  Edit3, 
  Sliders,
  TrendingUp,
  Activity,
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon,
  ChevronUp,
  Zap,
  RefreshCw,
  Minus
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import { TableColumn, TableRowData, TableColumnType, TableStyleConfig } from '../../types';

interface TableGridEditorProps {
  columns: TableColumn[];
  rows: TableRowData[];
  onChangeRows?: (rows: TableRowData[]) => void;
  readOnly?: boolean;
  allowAddRows?: boolean;
  minRows?: number;
  maxRows?: number;
  highlightEmptyRequired?: boolean;
  title?: string;
  styling?: TableStyleConfig;
  onChangeStyling?: (styling: TableStyleConfig) => void;
  allowStyling?: boolean;
  onPrint?: () => void;
  onUpdateTitle?: (newTitle: string) => void;
}

const DEFAULT_STYLING: TableStyleConfig = {
  fontFamily: 'Segoe UI, sans-serif',
  fontSize: '12px',
  textColor: '#0f172a',
  isBold: false,
  isItalic: false,
  isUnderline: false,
  textAlign: 'left',
  headerBgColor: '#0f172a',
  headerTextColor: '#ffffff',
  showTableTitleBanner: true,
  tableNameInHeader: '',
  titleBannerBgColor: '#047857', // Emerald green
  titleBannerTextColor: '#ffffff',
  titleBannerFontSize: '15px',
  titleBannerAlignment: 'left',
  titleBannerBold: true,
  titleBannerItalic: false,
  borderColor: '#cbd5e1'
};

const FONT_FAMILIES = [
  { label: 'Segoe UI', value: 'Segoe UI, -apple-system, BlinkMacSystemFont, sans-serif' },
  { label: 'Calibri', value: 'Calibri, Candara, Segoe, Segoe UI, Optima, Arial, sans-serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Courier New (Mono)', value: '"Courier New", Courier, monospace' }
];

const FONT_SIZES = [
  { label: '11px (Compact)', value: '11px' },
  { label: '12px (Standard)', value: '12px' },
  { label: '13px (Medium)', value: '13px' },
  { label: '14px (Large)', value: '14px' },
  { label: '16px (Display)', value: '16px' }
];

const COLOR_PALETTE = [
  { label: 'Dark Slate', value: '#0f172a' },
  { label: 'Charcoal', value: '#334155' },
  { label: 'Emerald Green', value: '#047857' },
  { label: 'Forest Green', value: '#14532d' },
  { label: 'Navy Blue', value: '#1e3a8a' },
  { label: 'Royal Indigo', value: '#3730a3' },
  { label: 'Deep Purple', value: '#581c87' },
  { label: 'Crimson Red', value: '#991b1b' },
  { label: 'Ruby Rose', value: '#be123c' },
  { label: 'Dark Amber', value: '#92400e' },
  { label: 'Pure White', value: '#ffffff' },
  { label: 'Light Green', value: '#ecfdf5' },
  { label: 'Light Blue', value: '#eff6ff' },
  { label: 'Light Yellow', value: '#fefce8' }
];

export const TableGridEditor: React.FC<TableGridEditorProps> = ({
  columns,
  rows,
  onChangeRows,
  readOnly = false,
  allowAddRows = true,
  minRows = 1,
  maxRows = 100,
  highlightEmptyRequired = false,
  title,
  styling: propStyling,
  onChangeStyling,
  allowStyling = true,
  onPrint,
  onUpdateTitle
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColId, setSortColId] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Styling state merged with defaults
  const [currentStyling, setCurrentStyling] = useState<TableStyleConfig>(() => ({
    ...DEFAULT_STYLING,
    tableNameInHeader: title || '',
    ...propStyling
  }));

  // Show/hide rich format tools drawer
  const [showFormatTools, setShowFormatTools] = useState(false);
  const [editingTitleInline, setEditingTitleInline] = useState(false);
  const [tableTitleText, setTableTitleText] = useState(title || propStyling?.tableNameInHeader || '');

  // Keep state updated when props change
  useEffect(() => {
    if (propStyling) {
      setCurrentStyling(prev => ({
        ...prev,
        ...propStyling,
        tableNameInHeader: propStyling.tableNameInHeader || title || prev.tableNameInHeader
      }));
    }
  }, [propStyling, title]);

  useEffect(() => {
    if (title) {
      setTableTitleText(title);
    }
  }, [title]);

  const updateStyling = (updates: Partial<TableStyleConfig>) => {
    const updated = { ...currentStyling, ...updates };
    setCurrentStyling(updated);
    if (onChangeStyling) {
      onChangeStyling(updated);
    }
  };

  // Excel Cell Focus Coordinates (e.g. rowIndex, colIndex)
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>({ row: 0, col: 0 });
  const [formulaValue, setFormulaValue] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Chart Follow State
  const [showLiveChart, setShowLiveChart] = useState<boolean>(true);
  const [chartType, setChartType] = useState<'curve' | 'area' | 'bar' | 'pie'>('curve');
  const [selectedColFilter, setSelectedColFilter] = useState<string>('all');
  const [deltaFeedback, setDeltaFeedback] = useState<{ text: string; type: 'increase' | 'decrease' } | null>(null);
  const prevTotalRef = useRef<number | null>(null);

  // Column letters map A, B, C, D...
  const getColumnLetter = (index: number): string => {
    let letter = '';
    let temp = index;
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  };

  // Helper to create a blank row with default column values
  const createEmptyRow = (): TableRowData => {
    const row: TableRowData = {};
    columns.forEach(col => {
      if (col.defaultValue !== undefined) {
        row[col.id] = col.defaultValue;
      } else if (col.type === 'checkbox') {
        row[col.id] = false;
      } else if (col.type === 'number' || col.type === 'currency') {
        row[col.id] = '';
      } else if (col.type === 'select' || col.type === 'status') {
        row[col.id] = col.options && col.options.length > 0 ? col.options[0] : '';
      } else {
        row[col.id] = '';
      }
    });
    return row;
  };

  // Sync formula bar with active cell value
  useEffect(() => {
    if (!activeCell || !rows[activeCell.row] || !columns[activeCell.col]) {
      setFormulaValue('');
      return;
    }
    const val = rows[activeCell.row][columns[activeCell.col].id];
    setFormulaValue(val !== undefined && val !== null ? String(val) : '');
  }, [activeCell, rows, columns]);

  // Cell change handler
  const handleCellChange = (rowIndex: number, columnId: string, value: any) => {
    if (readOnly || !onChangeRows) return;
    const newRows = [...rows];
    newRows[rowIndex] = {
      ...newRows[rowIndex],
      [columnId]: value
    };
    onChangeRows(newRows);
  };

  // Formula bar edit handler
  const handleFormulaBarChange = (newVal: string) => {
    setFormulaValue(newVal);
    if (!activeCell || readOnly || !onChangeRows) return;
    const col = columns[activeCell.col];
    if (!col) return;

    let parsedVal: any = newVal;
    if (col.type === 'number' || col.type === 'currency') {
      parsedVal = newVal === '' ? '' : Number(newVal);
    } else if (col.type === 'checkbox') {
      parsedVal = newVal.toLowerCase() === 'true' || newVal.toLowerCase() === 'yes';
    }

    handleCellChange(activeCell.row, col.id, parsedVal);
  };

  const handleAddRow = () => {
    if (readOnly || !onChangeRows) return;
    if (rows.length >= maxRows) return;
    const newRows = [...rows, createEmptyRow()];
    onChangeRows(newRows);
    setActiveCell({ row: newRows.length - 1, col: 0 });
  };

  const handleInsertRowAbove = (index: number) => {
    if (readOnly || !onChangeRows) return;
    if (rows.length >= maxRows) return;
    const newRows = [...rows];
    newRows.splice(index, 0, createEmptyRow());
    onChangeRows(newRows);
    setActiveCell({ row: index, col: 0 });
  };

  const handleDuplicateRow = (index: number) => {
    if (readOnly || !onChangeRows) return;
    if (rows.length >= maxRows) return;
    const duplicated = { ...rows[index] };
    const newRows = [...rows];
    newRows.splice(index + 1, 0, duplicated);
    onChangeRows(newRows);
    setActiveCell({ row: index + 1, col: 0 });
  };

  const handleDeleteRow = (index: number) => {
    if (readOnly || !onChangeRows) return;
    if (rows.length <= (minRows || 0)) return;
    const newRows = rows.filter((_, i) => i !== index);
    onChangeRows(newRows);
    if (activeCell && activeCell.row >= newRows.length) {
      setActiveCell({ row: Math.max(0, newRows.length - 1), col: activeCell.col });
    }
  };

  const handleSort = (colId: string) => {
    if (sortColId === colId) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColId(null);
      }
    } else {
      setSortColId(colId);
      setSortDirection('asc');
    }
  };

  // Keyboard navigation & Excel Shortcuts
  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    if (readOnly) return;

    if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
      if (colIndex < columns.length - 1) {
        setActiveCell({ row: rowIndex, col: colIndex + 1 });
      } else if (rowIndex < rows.length - 1) {
        setActiveCell({ row: rowIndex + 1, col: 0 });
      }
    } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
      if (colIndex > 0) {
        setActiveCell({ row: rowIndex, col: colIndex - 1 });
      } else if (rowIndex > 0) {
        setActiveCell({ row: rowIndex - 1, col: columns.length - 1 });
      }
    } else if (e.key === 'ArrowDown' || (e.key === 'Enter' && !e.shiftKey)) {
      if (rowIndex < rows.length - 1) {
        setActiveCell({ row: rowIndex + 1, col: colIndex });
      }
    } else if (e.key === 'ArrowUp' || (e.key === 'Enter' && e.shiftKey)) {
      if (rowIndex > 0) {
        setActiveCell({ row: rowIndex - 1, col: colIndex });
      }
    }
  };

  // Excel Paste handler (pastes tab-delimited or newline-delimited data directly into grid)
  const handlePasteIntoGrid = (e: React.ClipboardEvent, startRow: number, startCol: number) => {
    if (readOnly || !onChangeRows) return;
    const clipboardData = e.clipboardData.getData('text');
    if (!clipboardData) return;

    if (clipboardData.includes('\t') || clipboardData.includes('\n')) {
      e.preventDefault();
      const lines = clipboardData.trim().split(/\r?\n/);
      const newRows = [...rows];

      lines.forEach((line, lIdx) => {
        const targetRowIdx = startRow + lIdx;
        if (targetRowIdx >= maxRows) return;

        while (newRows.length <= targetRowIdx) {
          newRows.push(createEmptyRow());
        }

        const cellValues = line.split('\t');
        cellValues.forEach((cellVal, cIdx) => {
          const targetColIdx = startCol + cIdx;
          if (targetColIdx < columns.length) {
            const col = columns[targetColIdx];
            let parsedVal: any = cellVal.trim();
            if (col.type === 'number' || col.type === 'currency') {
              const num = parseFloat(parsedVal.replace(/[^0-9.-]/g, ''));
              parsedVal = isNaN(num) ? '' : num;
            } else if (col.type === 'checkbox') {
              parsedVal = ['true', 'yes', '1', 'y'].includes(parsedVal.toLowerCase());
            }
            newRows[targetRowIdx] = {
              ...newRows[targetRowIdx],
              [col.id]: parsedVal
            };
          }
        });
      });

      onChangeRows(newRows);
    }
  };

  // Import from Excel or CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !onChangeRows) return;
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (json.length === 0) return;

        const headers = json[0] as string[];
        const dataRows = json.slice(1);

        const newRows: TableRowData[] = dataRows.map(rowArr => {
          const rowObj: TableRowData = {};
          columns.forEach(col => {
            const matchedIdx = headers.findIndex(h => 
              String(h).trim().toLowerCase() === col.label.trim().toLowerCase()
            );
            if (matchedIdx !== -1 && rowArr[matchedIdx] !== undefined) {
              rowObj[col.id] = rowArr[matchedIdx];
            } else {
              rowObj[col.id] = '';
            }
          });
          return rowObj;
        }).filter(r => Object.values(r).some(v => v !== ''));

        if (newRows.length > 0) {
          onChangeRows(newRows);
        }
      } catch (err) {
        console.error('Error parsing uploaded file', err);
      }
    };

    reader.readAsBinaryString(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filtered and sorted rows for display
  const displayRows = useMemo(() => {
    let result = rows.map((row, originalIndex) => ({ row, originalIndex }));

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(({ row }) => {
        return Object.values(row).some(val => 
          String(val ?? '').toLowerCase().includes(term)
        );
      });
    }

    if (sortColId) {
      const col = columns.find(c => c.id === sortColId);
      result.sort((a, b) => {
        const valA = a.row[sortColId];
        const valB = b.row[sortColId];

        if (valA === undefined || valA === null || valA === '') return 1;
        if (valB === undefined || valB === null || valB === '') return -1;

        if (col?.type === 'number' || col?.type === 'currency') {
          const numA = parseFloat(valA) || 0;
          const numB = parseFloat(valB) || 0;
          return sortDirection === 'asc' ? numA - numB : numB - numA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortDirection === 'asc' 
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      });
    }

    return result;
  }, [rows, searchTerm, sortColId, sortDirection, columns]);

  // Calculated column summaries
  const columnSummaries = useMemo(() => {
    const sums: Record<string, { type: string; value: string | number }> = {};

    columns.forEach(col => {
      if (!col.summary || col.summary === 'none') return;

      const numericValues = rows
        .map(r => parseFloat(r[col.id]))
        .filter(n => !isNaN(n));

      if (col.summary === 'sum') {
        const total = numericValues.reduce((acc, curr) => acc + curr, 0);
        sums[col.id] = {
          type: 'SUM',
          value: col.type === 'currency' 
            ? `$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
            : total.toLocaleString()
        };
      } else if (col.summary === 'avg') {
        const avg = numericValues.length > 0
          ? numericValues.reduce((acc, curr) => acc + curr, 0) / numericValues.length
          : 0;
        sums[col.id] = {
          type: 'AVERAGE',
          value: col.type === 'currency' 
            ? `$${avg.toFixed(2)}` 
            : avg.toFixed(2)
        };
      } else if (col.summary === 'count') {
        const nonNullCount = rows.filter(r => r[col.id] !== undefined && r[col.id] !== null && r[col.id] !== '').length;
        sums[col.id] = {
          type: 'COUNT',
          value: `${nonNullCount}`
        };
      }
    });

    return sums;
  }, [columns, rows]);

  // Dynamic Numeric Columns for Live Chart Tracking
  const numericColumns = useMemo(() => {
    return columns.filter(c => 
      c.type === 'number' || 
      c.type === 'currency' || 
      c.summary === 'sum' || 
      c.summary === 'avg' ||
      ['pv', 'pf', 'total', 'case', 'count', 'amount'].some(term => 
        c.id.toLowerCase().includes(term) || c.label.toLowerCase().includes(term)
      )
    );
  }, [columns]);

  // Primary X-Axis Label Column (Health Post, Facility, Village, Item, or First Column)
  const primaryLabelColumn = useMemo(() => {
    const candidate = columns.find(c => 
      (c.type === 'text' || c.type === 'select') && 
      !['id', 'code', 'num', 'row'].includes(c.id.toLowerCase())
    );
    return candidate || columns[0];
  }, [columns]);

  const SERIES_PALETTE = [
    { stroke: '#0085ff', fill: '#0085ff', gradient: 'colorBlue' },
    { stroke: '#d97706', fill: '#f59e0b', gradient: 'colorAmber' },
    { stroke: '#ef4444', fill: '#ef4444', gradient: 'colorRed' },
    { stroke: '#10b981', fill: '#10b981', gradient: 'colorGreen' },
    { stroke: '#8b5cf6', fill: '#8b5cf6', gradient: 'colorPurple' },
    { stroke: '#06b6d4', fill: '#06b6d4', gradient: 'colorCyan' },
    { stroke: '#f97316', fill: '#f97316', gradient: 'colorOrange' },
    { stroke: '#ec4899', fill: '#ec4899', gradient: 'colorPink' }
  ];

  // Prepared row-level chart series data
  const chartRowData = useMemo(() => {
    return rows.map((r, idx) => {
      const rawLabel = primaryLabelColumn ? r[primaryLabelColumn.id] : '';
      const label = rawLabel && String(rawLabel).trim() !== '' 
        ? String(rawLabel) 
        : `Row ${idx + 1}`;

      const point: Record<string, any> = {
        index: idx + 1,
        rowNum: idx + 1,
        shortName: label.length > 18 ? label.slice(0, 16) + '…' : label,
        fullName: label
      };

      let rowSum = 0;
      numericColumns.forEach(col => {
        const raw = r[col.id];
        const val = parseFloat(raw);
        const num = isNaN(val) ? 0 : val;
        point[col.id] = num;
        point[col.label] = num;
        rowSum += num;
      });
      point['__rowTotal'] = rowSum;

      return point;
    });
  }, [rows, numericColumns, primaryLabelColumn]);

  // Aggregate stats across the entire table
  const chartAggregates = useMemo(() => {
    const colTotals: Record<string, number> = {};
    let grandSum = 0;
    let maxRowVal = 0;
    let peakRowLabel = 'N/A';

    numericColumns.forEach(c => {
      colTotals[c.id] = 0;
    });

    rows.forEach((r, idx) => {
      let rowSum = 0;
      numericColumns.forEach(c => {
        const val = parseFloat(r[c.id]);
        if (!isNaN(val)) {
          colTotals[c.id] = (colTotals[c.id] || 0) + val;
          rowSum += val;
          grandSum += val;
        }
      });
      if (rowSum > maxRowVal) {
        maxRowVal = rowSum;
        const raw = primaryLabelColumn ? r[primaryLabelColumn.id] : '';
        peakRowLabel = raw ? String(raw) : `Row #${idx + 1}`;
      }
    });

    const avgPerRow = rows.length > 0 ? Math.round((grandSum / rows.length) * 10) / 10 : 0;

    // Pie distribution data
    const pieData = numericColumns.map((col, idx) => ({
      name: col.label,
      value: colTotals[col.id] || 0,
      color: SERIES_PALETTE[idx % SERIES_PALETTE.length].fill
    })).filter(d => d.value > 0);

    return {
      colTotals,
      grandSum,
      maxRowVal,
      peakRowLabel,
      avgPerRow,
      pieData
    };
  }, [rows, numericColumns, primaryLabelColumn]);

  // Detect live changes to Grand Total and trigger responsive feedback
  useEffect(() => {
    if (prevTotalRef.current !== null && prevTotalRef.current !== chartAggregates.grandSum) {
      const diff = chartAggregates.grandSum - prevTotalRef.current;
      const type = diff > 0 ? 'increase' : 'decrease';
      const text = diff > 0 ? `+${diff.toLocaleString()} added` : `${diff.toLocaleString()} updated`;
      
      setDeltaFeedback({ text, type });
      const timer = setTimeout(() => {
        setDeltaFeedback(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
    prevTotalRef.current = chartAggregates.grandSum;
  }, [chartAggregates.grandSum]);

  // Export current table directly to Excel (.xlsx)
  const handleExportExcel = () => {
    if (rows.length === 0) return;

    const exportRows = rows.map((r, i) => {
      const rowObj: Record<string, any> = { 'Row #': i + 1 };
      columns.forEach(col => {
        rowObj[col.label] = r[col.id] ?? '';
      });
      return rowObj;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${(currentStyling.tableNameInHeader || title || 'Excel_Form').replace(/\s+/g, '_')}_${Date.now()}.xlsx`);
  };

  const handlePrintAction = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleSaveTitleInline = () => {
    setEditingTitleInline(false);
    updateStyling({ tableNameInHeader: tableTitleText });
    if (onUpdateTitle) {
      onUpdateTitle(tableTitleText);
    }
  };

  const getStatusBadgeStyle = (val: string) => {
    const lower = String(val || '').toLowerCase();
    if (lower.includes('complet') || lower.includes('approv') || lower.includes('health') || lower.includes('tier 1')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    }
    if (lower.includes('progress') || lower.includes('review') || lower.includes('monitor') || lower.includes('tier 2')) {
      return 'bg-amber-50 text-amber-800 border-amber-300';
    }
    if (lower.includes('block') || lower.includes('reject') || lower.includes('critical') || lower.includes('tier 4')) {
      return 'bg-rose-50 text-rose-800 border-rose-300';
    }
    return 'bg-indigo-50 text-indigo-800 border-indigo-200';
  };

  const activeCellCoord = useMemo(() => {
    if (!activeCell) return 'A1';
    const letter = getColumnLetter(activeCell.col);
    return `${letter}${activeCell.row + 1}`;
  }, [activeCell]);

  const effectiveTitle = currentStyling.tableNameInHeader || title || 'Spreadsheet Form';

  return (
    <div className="space-y-3 select-none printable-area" style={{ fontFamily: currentStyling.fontFamily || 'inherit' }}>
      {/* EXCEL RIBBON & FORMATTING TOOLBAR */}
      <div className="no-print bg-slate-900 text-white rounded-2xl p-2.5 shadow-md flex flex-col gap-2.5 border border-slate-800">
        {/* Top Row: Navigation, Cell Coordinate, Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-800 rounded-xl px-2.5 py-1 text-xs border border-slate-700 font-mono font-bold text-emerald-400">
              <span>{activeCellCoord}</span>
            </div>

            {!readOnly && allowAddRows && (
              <button
                type="button"
                id="grid-add-row-btn"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                title="Add row to bottom of spreadsheet"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            )}

            {/* Rich Styling Toolbar Toggle */}
            {allowStyling && (
              <button
                type="button"
                onClick={() => setShowFormatTools(!showFormatTools)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                  showFormatTools 
                    ? 'bg-emerald-700 text-white border-emerald-500 shadow-xs' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title="Toggle Excel formatting toolbar (Font, Bold, Italic, Colors, Table Title banner)"
              >
                <Palette className="w-3.5 h-3.5 text-emerald-400" />
                <span>Format Table</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showFormatTools ? 'rotate-180' : ''}`} />
              </button>
            )}

            {!readOnly && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
                  title="Import data from Excel (.xlsx) or CSV file"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Import File</span>
                </button>
              </>
            )}

            {/* Chart Follows Data Toggle */}
            {numericColumns.length > 0 && (
              <button
                type="button"
                onClick={() => setShowLiveChart(!showLiveChart)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                  showLiveChart 
                    ? 'bg-[#005a9e] hover:bg-[#004a82] text-white border-blue-400 shadow-xs ring-1 ring-blue-400/40' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title="Toggle Real-Time Chart that dynamically follows all spreadsheet cell inputs"
              >
                <Activity className="w-3.5 h-3.5 text-cyan-300" />
                <span>Chart Follows Data</span>
                <span className={`w-2 h-2 rounded-full ${showLiveChart ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`}></span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
              title="Download this table as Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export .XLSX</span>
            </button>

            {/* Print Table Button */}
            <button
              type="button"
              onClick={handlePrintAction}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              title="Print formatted Excel spreadsheet report"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-200" />
              <span>Print Table</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search table rows..."
                className="w-full pl-8 pr-2.5 py-1 text-xs rounded-xl bg-slate-800 text-white border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <span className="text-[11px] text-slate-400 font-semibold hidden lg:inline">
              {rows.length} rows
            </span>
          </div>
        </div>

        {/* EXPANDABLE EXCEL FORMATTING RIBBON */}
        {showFormatTools && allowStyling && (
          <div className="pt-2.5 border-t border-slate-800 flex flex-wrap items-center gap-3 bg-slate-950/60 p-3 rounded-xl">
            {/* Font Family Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Font:</span>
              <select
                value={currentStyling.fontFamily || FONT_FAMILIES[0].value}
                onChange={(e) => updateStyling({ fontFamily: e.target.value })}
                className="bg-slate-800 text-slate-100 text-xs px-2.5 py-1 rounded-lg border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
              >
                {FONT_FAMILIES.map(f => (
                  <option key={f.label} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Font Size Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Size:</span>
              <select
                value={currentStyling.fontSize || '12px'}
                onChange={(e) => updateStyling({ fontSize: e.target.value })}
                className="bg-slate-800 text-slate-100 text-xs px-2.5 py-1 rounded-lg border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
              >
                {FONT_SIZES.map(s => (
                  <option key={s.label} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Bold, Italic, Underline Toggles */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => updateStyling({ isBold: !currentStyling.isBold })}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  currentStyling.isBold ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Toggle Bold text"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => updateStyling({ isItalic: !currentStyling.isItalic })}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  currentStyling.isItalic ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Toggle Italic text"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => updateStyling({ isUnderline: !currentStyling.isUnderline })}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  currentStyling.isUnderline ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Toggle Underline text"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Text Alignment */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => updateStyling({ textAlign: 'left' })}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  currentStyling.textAlign === 'left' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Align Left"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => updateStyling({ textAlign: 'center' })}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  currentStyling.textAlign === 'center' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Align Center"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => updateStyling({ textAlign: 'right' })}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  currentStyling.textAlign === 'right' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Align Right"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Text Color Picker */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Color:</span>
              <div className="flex items-center gap-1">
                {COLOR_PALETTE.slice(0, 6).map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => updateStyling({ textColor: c.value })}
                    style={{ backgroundColor: c.value }}
                    className={`w-5 h-5 rounded-full border border-slate-600 transition-transform ${
                      currentStyling.textColor === c.value ? 'ring-2 ring-emerald-400 scale-110' : 'hover:scale-105'
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Table Horizontal Title Banner Theme */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <span className="text-[10px] uppercase font-bold text-emerald-400">Title Banner:</span>
              <button
                type="button"
                onClick={() => updateStyling({ showTableTitleBanner: !currentStyling.showTableTitleBanner })}
                className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors ${
                  currentStyling.showTableTitleBanner 
                    ? 'bg-emerald-600 text-white border-emerald-500' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {currentStyling.showTableTitleBanner ? 'Banner: Visible' : 'Banner: Hidden'}
              </button>

              {currentStyling.showTableTitleBanner && (
                <div className="flex items-center gap-1">
                  {[
                    { label: 'Emerald Excel', bg: '#047857', text: '#ffffff' },
                    { label: 'Slate Dark', bg: '#0f172a', text: '#ffffff' },
                    { label: 'Royal Navy', bg: '#1e3a8a', text: '#ffffff' },
                    { label: 'Deep Indigo', bg: '#3730a3', text: '#ffffff' },
                    { label: 'Burgundy', bg: '#991b1b', text: '#ffffff' }
                  ].map(b => (
                    <button
                      key={b.label}
                      type="button"
                      onClick={() => updateStyling({ titleBannerBgColor: b.bg, titleBannerTextColor: b.text })}
                      style={{ backgroundColor: b.bg }}
                      className={`w-5 h-5 rounded border border-slate-600 ${
                        currentStyling.titleBannerBgColor === b.bg ? 'ring-2 ring-white scale-110' : ''
                      }`}
                      title={`Banner Theme: ${b.label}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* EXCEL FORMULA BAR */}
      <div className="no-print bg-slate-100 rounded-xl p-2 flex items-center gap-2 border border-slate-300 text-xs">
        <div className="flex items-center gap-1 px-2 py-0.5 bg-white rounded-lg border border-slate-300 font-mono font-bold text-slate-700 min-w-[48px] justify-center">
          {activeCellCoord}
        </div>
        <div className="font-serif italic font-bold text-slate-500 px-1 text-sm">
          fx
        </div>
        <div className="h-4 w-px bg-slate-300 mx-0.5"></div>
        <input
          type="text"
          value={formulaValue}
          onChange={(e) => handleFormulaBarChange(e.target.value)}
          disabled={readOnly}
          placeholder={readOnly ? 'Formula view mode' : 'Edit active cell value or paste Excel content...'}
          className="flex-1 bg-white px-3 py-1 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 text-slate-900 font-medium"
        />
      </div>

      {/* DYNAMIC LIVE CHART (FOLLOWS SPREADSHEET ENTRIES REAL-TIME) */}
      {showLiveChart && numericColumns.length > 0 && rows.length > 0 && (
        <div className="no-print bg-white rounded-2xl border-2 border-blue-200/80 shadow-xs p-4 sm:p-5 space-y-4 transition-all animate-fadeIn">
          {/* Chart Header & Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Live Chart (Autofollows Spreadsheet)
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                    Live Sync
                  </span>
                  {deltaFeedback && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black animate-bounce ${
                      deltaFeedback.type === 'increase' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      <Zap className="w-2.5 h-2.5" />
                      {deltaFeedback.text}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Dynamic visualizer reflects every cell update across {rows.length} rows and {numericColumns.length} quantified metric columns
                </p>
              </div>
            </div>

            {/* Chart Type Selector & Metric Filter */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Metric Column Filter */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-0.5 border border-slate-200 text-xs">
                <span className="text-[10px] font-bold text-slate-500 px-2 uppercase">Metric:</span>
                <select
                  value={selectedColFilter}
                  onChange={(e) => setSelectedColFilter(e.target.value)}
                  className="bg-white text-slate-800 font-bold text-xs px-2 py-1 rounded-lg border border-slate-200 focus:outline-hidden"
                >
                  <option value="all">All Numeric Metrics</option>
                  {numericColumns.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Chart Modes */}
              <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setChartType('curve')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    chartType === 'curve' 
                      ? 'bg-white text-blue-700 shadow-2xs border border-slate-200' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Spline Line Tracking"
                >
                  <LineIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Curves</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChartType('area')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    chartType === 'area' 
                      ? 'bg-white text-blue-700 shadow-2xs border border-slate-200' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Gradient Area Waves"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Area</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChartType('bar')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    chartType === 'bar' 
                      ? 'bg-white text-blue-700 shadow-2xs border border-slate-200' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Grouped Column Bars"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Bars</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChartType('pie')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    chartType === 'pie' 
                      ? 'bg-white text-blue-700 shadow-2xs border border-slate-200' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Metrics Composition Breakdown"
                >
                  <PieIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>

              {/* Close / Collapse */}
              <button
                type="button"
                onClick={() => setShowLiveChart(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Hide chart preview"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Plotted Sum</span>
              <span className="text-base font-black text-blue-600 font-mono">
                {chartAggregates.grandSum.toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Highest Row Peak</span>
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-xs font-bold text-slate-800 truncate">{chartAggregates.peakRowLabel}</span>
                <span className="text-sm font-black text-amber-600 font-mono">{chartAggregates.maxRowVal.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Average Per Row</span>
              <span className="text-base font-black text-emerald-600 font-mono">
                {chartAggregates.avgPerRow.toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Spreadsheet Rows</span>
              <div className="flex items-center justify-between">
                <span className="text-base font-black text-slate-800 font-mono">{rows.length}</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Follows Live
                </span>
              </div>
            </div>
          </div>

          {/* Chart Canvas Area */}
          <div className="h-60 sm:h-64 w-full bg-slate-50/50 rounded-xl border border-slate-200/80 p-2 pt-3">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'pie' ? (
                <PieChart>
                  <Tooltip
                    formatter={(val: any) => [Number(val).toLocaleString(), 'Value']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <Pie
                    data={chartAggregates.pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {chartAggregates.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              ) : chartType === 'bar' ? (
                <BarChart data={chartRowData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="shortName" 
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                    interval={0}
                    angle={chartRowData.length > 8 ? -25 : 0}
                    textAnchor={chartRowData.length > 8 ? 'end' : 'middle'}
                    height={chartRowData.length > 8 ? 45 : 25}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                  <Tooltip
                    formatter={(val: any, name: any) => [Number(val).toLocaleString(), name]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '4px' }} />
                  {numericColumns
                    .filter(c => selectedColFilter === 'all' || selectedColFilter === c.id)
                    .map((col, idx) => (
                      <Bar
                        key={col.id}
                        dataKey={col.id}
                        name={col.label}
                        fill={SERIES_PALETTE[idx % SERIES_PALETTE.length].fill}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                </BarChart>
              ) : chartType === 'area' ? (
                <AreaChart data={chartRowData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    {SERIES_PALETTE.map((p, idx) => (
                      <linearGradient key={`grad-${idx}`} id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={p.fill} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={p.fill} stopOpacity={0.0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="shortName" 
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                    interval={0}
                    angle={chartRowData.length > 8 ? -25 : 0}
                    textAnchor={chartRowData.length > 8 ? 'end' : 'middle'}
                    height={chartRowData.length > 8 ? 45 : 25}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                  <Tooltip
                    formatter={(val: any, name: any) => [Number(val).toLocaleString(), name]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '4px' }} />
                  {numericColumns
                    .filter(c => selectedColFilter === 'all' || selectedColFilter === c.id)
                    .map((col, idx) => (
                      <Area
                        key={col.id}
                        type="monotone"
                        dataKey={col.id}
                        name={col.label}
                        stroke={SERIES_PALETTE[idx % SERIES_PALETTE.length].stroke}
                        strokeWidth={2.5}
                        fill={`url(#grad-${idx % SERIES_PALETTE.length})`}
                      />
                    ))}
                </AreaChart>
              ) : (
                <LineChart data={chartRowData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="shortName" 
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                    interval={0}
                    angle={chartRowData.length > 8 ? -25 : 0}
                    textAnchor={chartRowData.length > 8 ? 'end' : 'middle'}
                    height={chartRowData.length > 8 ? 45 : 25}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                  <Tooltip
                    formatter={(val: any, name: any) => [Number(val).toLocaleString(), name]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '4px' }} />
                  {numericColumns
                    .filter(c => selectedColFilter === 'all' || selectedColFilter === c.id)
                    .map((col, idx) => (
                      <Line
                        key={col.id}
                        type="monotone"
                        dataKey={col.id}
                        name={col.label}
                        stroke={SERIES_PALETTE[idx % SERIES_PALETTE.length].stroke}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: SERIES_PALETTE[idx % SERIES_PALETTE.length].stroke }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* INTERACTIVE EXCEL GRID WITH HORIZONTAL TITLE BANNER */}
      <div 
        className="overflow-x-auto rounded-2xl border-2 border-slate-300 bg-white shadow-sm max-h-[600px] print-container"
        style={{
          color: currentStyling.textColor || '#0f172a',
          fontSize: currentStyling.fontSize || '12px',
          fontWeight: currentStyling.isBold ? 'bold' : 'normal',
          fontStyle: currentStyling.isItalic ? 'italic' : 'normal',
          textDecoration: currentStyling.isUnderline ? 'underline' : 'none'
        }}
      >
        <table className="w-full text-left border-collapse">
          {/* Top Column Letters Row (A, B, C...) - Screen only */}
          <thead className="no-print">
            <tr className="bg-slate-200/90 border-b border-slate-300 text-slate-600 font-bold text-[10px] text-center select-none">
              <th className="py-1 px-2 w-12 border-r border-slate-300 bg-slate-300/80">
                
              </th>
              {columns.map((col, cIdx) => (
                <th 
                  key={`letter-${col.id}`}
                  style={{ width: col.width || 'auto' }}
                  className="py-1 px-3 border-r border-slate-300"
                >
                  {getColumnLetter(cIdx)}
                </th>
              ))}
              {numericColumns.length > 0 && (
                <th className="py-1 px-3 border-r border-slate-300 bg-amber-200/60 text-amber-900 text-right">
                  {getColumnLetter(columns.length)} (Σ)
                </th>
              )}
              {!readOnly && (
                <th className="py-1 px-2 w-20 border-r border-slate-300">
                  
                </th>
              )}
            </tr>
          </thead>

          {/* TABLE HEADER INCLUDING HORIZONTAL TITLE BANNER ROW */}
          <thead>
            {/* HORIZONTAL TABLE TITLE BANNER ROW INSIDE THE SPREADSHEET */}
            {currentStyling.showTableTitleBanner !== false && (
              <tr 
                style={{
                  backgroundColor: currentStyling.titleBannerBgColor || '#047857',
                  color: currentStyling.titleBannerTextColor || '#ffffff'
                }}
                className="border-b-2 border-slate-400"
              >
                <th 
                  colSpan={columns.length + (numericColumns.length > 0 ? 1 : 0) + (readOnly ? 1 : 2)}
                  className="py-3 px-4 select-none"
                  style={{
                    textAlign: currentStyling.titleBannerAlignment || 'left',
                    fontSize: currentStyling.titleBannerFontSize || '15px',
                    fontWeight: currentStyling.titleBannerBold !== false ? 'bold' : 'normal',
                    fontStyle: currentStyling.titleBannerItalic ? 'italic' : 'normal'
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-300 shrink-0" />
                      
                      {editingTitleInline ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={tableTitleText}
                            onChange={(e) => setTableTitleText(e.target.value)}
                            onBlur={handleSaveTitleInline}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveTitleInline()}
                            autoFocus
                            className="px-2 py-0.5 bg-black/30 text-white rounded border border-white/40 text-sm font-bold focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={handleSaveTitleInline}
                            className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-xs font-bold"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="tracking-tight">{effectiveTitle}</span>
                          {!readOnly && allowStyling && (
                            <button
                              type="button"
                              onClick={() => setEditingTitleInline(true)}
                              className="no-print p-1 hover:bg-white/20 rounded opacity-70 hover:opacity-100 transition-opacity"
                              title="Edit table title inside banner"
                            >
                              <Edit3 className="w-3 h-3 text-white" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] font-normal opacity-80 hidden sm:block">
                      Official Excel Data Sheet • Auto-Saved by User ID
                    </div>
                  </div>
                </th>
              </tr>
            )}

            {/* Column Labels & Types Header Row */}
            <tr 
              style={{
                backgroundColor: currentStyling.headerBgColor || '#0f172a',
                color: currentStyling.headerTextColor || '#ffffff'
              }}
              className="border-b-2 border-slate-300 font-bold text-[11px]"
            >
              <th className="py-2.5 px-2 w-12 text-center border-r border-slate-700/60 bg-black/20">
                #
              </th>
              {columns.map((col, cIdx) => (
                <th
                  key={col.id}
                  style={{ width: col.width || 'auto' }}
                  className="py-2.5 px-3 border-r border-slate-700/60 select-none group cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => handleSort(col.id)}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1 font-extrabold tracking-tight">
                      {col.label}
                      {col.required && <span className="text-rose-400 font-black">*</span>}
                    </span>
                    <span className="text-slate-400 group-hover:text-white no-print">
                      <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </div>
                  <div className="text-[9px] font-medium opacity-70 uppercase tracking-tight">
                    {col.type} {col.summary && col.summary !== 'none' ? `[${col.summary}]` : ''}
                  </div>
                </th>
              ))}
              {numericColumns.length > 0 && (
                <th className="py-2.5 px-3 border-r border-slate-700/60 bg-emerald-950 text-amber-300 text-right min-w-[140px]">
                  <div className="flex items-center justify-end gap-1 font-extrabold tracking-tight">
                    <span className="text-amber-400">Σ</span>
                    <span>Grand Total Sum</span>
                  </div>
                  <div className="text-[9px] font-medium text-amber-300/70 uppercase tracking-tight">
                    [Row Sum]
                  </div>
                </th>
              )}
              {!readOnly && (
                <th className="py-2.5 px-2 w-20 text-center font-bold no-print">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 font-sans">
            {displayRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (numericColumns.length > 0 ? 1 : 0) + (readOnly ? 1 : 2)} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileSpreadsheet className="w-8 h-8 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">No rows in this spreadsheet yet</p>
                    {!readOnly && allowAddRows && (
                      <button
                        type="button"
                        onClick={handleAddRow}
                        className="mt-1 text-xs text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 no-print"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Click here to add Row #1</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              displayRows.map(({ row, originalIndex }) => {
                // Calculate row total sum along this row
                let rowSum = 0;
                columns.forEach(col => {
                  if (col.type === 'number' || col.type === 'currency' || col.summary === 'sum') {
                    const rawVal = row[col.id];
                    if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
                      const num = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal).replace(/[^0-9.-]/g, ''));
                      if (!isNaN(num)) {
                        rowSum += num;
                      }
                    }
                  }
                });

                return (
                <tr 
                  key={originalIndex}
                  className="hover:bg-emerald-50/20 transition-colors group"
                >
                  {/* Row Number (Excel Row Header) */}
                  <td 
                    className="py-1.5 px-2 text-center font-bold text-slate-500 border-r border-slate-300 bg-slate-100 select-none group-hover:bg-slate-200 transition-colors"
                  >
                    {originalIndex + 1}
                  </td>

                  {/* Column Cell Editors */}
                  {columns.map((col, colIdx) => {
                    const cellVal = row[col.id];
                    const isSelected = activeCell?.row === originalIndex && activeCell?.col === colIdx;
                    const isMissing = highlightEmptyRequired && col.required && (cellVal === undefined || cellVal === null || cellVal === '');

                    return (
                      <td 
                        key={col.id}
                        onClick={() => setActiveCell({ row: originalIndex, col: colIdx })}
                        onPaste={(e) => handlePasteIntoGrid(e, originalIndex, colIdx)}
                        className={`p-0 border-r border-slate-200 align-middle relative ${
                          isSelected ? 'ring-2 ring-emerald-600 ring-inset z-10 bg-emerald-50/30' : ''
                        } ${isMissing ? 'bg-rose-50 border-rose-300' : ''}`}
                        style={{ textAlign: col.align || currentStyling.textAlign || 'left' }}
                      >
                        {readOnly ? (
                          <div className="px-3 py-2 text-slate-900 font-medium truncate">
                            {col.type === 'checkbox' ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                cellVal ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {cellVal ? 'YES' : 'NO'}
                              </span>
                            ) : col.type === 'currency' ? (
                              <span className="font-bold text-slate-900">
                                {cellVal !== '' && cellVal !== undefined ? `$${Number(cellVal).toLocaleString()}` : '—'}
                              </span>
                            ) : col.type === 'status' ? (
                              <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${getStatusBadgeStyle(cellVal)}`}>
                                {cellVal || '—'}
                              </span>
                            ) : (
                              <span>{cellVal !== undefined && cellVal !== null && cellVal !== '' ? String(cellVal) : '—'}</span>
                            )}
                          </div>
                        ) : (
                          // Interactive Inline Editable Cell
                          <div className="w-full h-full">
                            {col.type === 'text' && (
                              <input
                                type="text"
                                value={cellVal ?? ''}
                                onFocus={() => setActiveCell({ row: originalIndex, col: colIdx })}
                                onChange={(e) => handleCellChange(originalIndex, col.id, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, originalIndex, colIdx)}
                                placeholder={col.placeholder || ''}
                                className="w-full px-2.5 py-2 text-xs border-0 bg-transparent focus:outline-hidden focus:bg-white text-slate-900 font-medium"
                                style={{ textAlign: col.align || currentStyling.textAlign || 'left' }}
                              />
                            )}

                            {col.type === 'number' && (
                              <div className="relative flex items-center group/num">
                                <input
                                  type="number"
                                  step="any"
                                  value={cellVal ?? ''}
                                  onFocus={() => setActiveCell({ row: originalIndex, col: colIdx })}
                                  onChange={(e) => handleCellChange(originalIndex, col.id, e.target.value === '' ? '' : Number(e.target.value))}
                                  onKeyDown={(e) => handleKeyDown(e, originalIndex, colIdx)}
                                  placeholder={col.placeholder || '0'}
                                  className="w-full px-2.5 py-2 pr-7 text-xs border-0 bg-transparent focus:outline-hidden focus:bg-white text-slate-900 font-mono font-bold text-right"
                                />
                                <div className="absolute right-0.5 inset-y-0.5 hidden group-hover/num:flex group-focus-within/num:flex flex-col justify-center gap-0.5 bg-slate-100/90 rounded px-0.5 shadow-2xs">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const current = parseFloat(cellVal) || 0;
                                      handleCellChange(originalIndex, col.id, current + 1);
                                    }}
                                    className="p-0.5 hover:bg-emerald-200 text-slate-700 hover:text-emerald-900 rounded text-[9px] leading-none"
                                    title="Increment +1 (Chart follows instantly)"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const current = parseFloat(cellVal) || 0;
                                      handleCellChange(originalIndex, col.id, Math.max(0, current - 1));
                                    }}
                                    className="p-0.5 hover:bg-rose-200 text-slate-700 hover:text-rose-900 rounded text-[9px] leading-none"
                                    title="Decrement -1 (Chart follows instantly)"
                                  >
                                    <Minus className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {col.type === 'currency' && (
                              <div className="relative flex items-center px-2 group/curr">
                                <span className="text-slate-400 font-bold text-xs">$</span>
                                <input
                                  type="number"
                                  step="any"
                                  value={cellVal ?? ''}
                                  onFocus={() => setActiveCell({ row: originalIndex, col: colIdx })}
                                  onChange={(e) => handleCellChange(originalIndex, col.id, e.target.value === '' ? '' : Number(e.target.value))}
                                  onKeyDown={(e) => handleKeyDown(e, originalIndex, colIdx)}
                                  placeholder={col.placeholder || '0.00'}
                                  className="w-full px-1.5 py-2 pr-6 text-xs border-0 bg-transparent focus:outline-hidden focus:bg-white text-slate-900 font-mono font-bold text-right"
                                />
                                <div className="absolute right-0.5 inset-y-0.5 hidden group-hover/curr:flex group-focus-within/curr:flex flex-col justify-center gap-0.5 bg-slate-100/90 rounded px-0.5 shadow-2xs">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const current = parseFloat(cellVal) || 0;
                                      handleCellChange(originalIndex, col.id, current + 10);
                                    }}
                                    className="p-0.5 hover:bg-emerald-200 text-slate-700 rounded text-[9px] leading-none"
                                    title="Add $10"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const current = parseFloat(cellVal) || 0;
                                      handleCellChange(originalIndex, col.id, Math.max(0, current - 10));
                                    }}
                                    className="p-0.5 hover:bg-rose-200 text-slate-700 rounded text-[9px] leading-none"
                                    title="Subtract $10"
                                  >
                                    <Minus className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {col.type === 'date' && (
                              <input
                                type="date"
                                value={cellVal ?? ''}
                                onFocus={() => setActiveCell({ row: originalIndex, col: colIdx })}
                                onChange={(e) => handleCellChange(originalIndex, col.id, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, originalIndex, colIdx)}
                                className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-hidden focus:bg-white text-slate-900 font-medium"
                              />
                            )}

                            {col.type === 'select' && (
                              <select
                                value={cellVal ?? ''}
                                onFocus={() => setActiveCell({ row: originalIndex, col: colIdx })}
                                onChange={(e) => handleCellChange(originalIndex, col.id, e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-hidden focus:bg-white text-slate-900 font-medium"
                              >
                                <option value="">— Select —</option>
                                {(col.options || []).map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            )}

                            {col.type === 'status' && (
                              <select
                                value={cellVal ?? ''}
                                onFocus={() => setActiveCell({ row: originalIndex, col: colIdx })}
                                onChange={(e) => handleCellChange(originalIndex, col.id, e.target.value)}
                                className={`w-full px-2 py-1.5 text-xs border-0 focus:outline-hidden font-bold ${getStatusBadgeStyle(cellVal)}`}
                              >
                                <option value="">— Choose Status —</option>
                                {(col.options || ['In Progress', 'Completed', 'Under Review', 'Blocked']).map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            )}

                            {col.type === 'checkbox' && (
                              <label className="flex items-center justify-center py-2 cursor-pointer w-full h-full">
                                <input
                                  type="checkbox"
                                  checked={Boolean(cellVal)}
                                  onFocus={() => setActiveCell({ row: originalIndex, col: colIdx })}
                                  onChange={(e) => handleCellChange(originalIndex, col.id, e.target.checked)}
                                  className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                />
                              </label>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {/* Grand Total Sum for this row (Sum Along the Row) */}
                  {numericColumns.length > 0 && (
                    <td className="p-2 border-r border-slate-200 bg-amber-50/50 text-right font-mono font-black text-amber-950 text-xs">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[10px] text-amber-600 font-bold">Σ</span>
                        <span>{rowSum.toLocaleString()}</span>
                      </div>
                    </td>
                  )}

                  {/* Actions Column */}
                  {!readOnly && (
                    <td className="py-1 px-2 text-center align-middle whitespace-nowrap bg-slate-50/50 no-print">
                      <div className="inline-flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleInsertRowAbove(originalIndex)}
                          className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50"
                          title="Insert row above"
                        >
                          <CornerDownRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateRow(originalIndex)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                          title="Duplicate row"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(originalIndex)}
                          disabled={rows.length <= (minRows || 0)}
                          className={`p-1 rounded ${
                            rows.length <= (minRows || 0)
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          title="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
                );
              })
            )}
          </tbody>

          {/* EXCEL SUMMARY FOOTER (CALCULATIONS) */}
          {Object.keys(columnSummaries).length > 0 && (
            <tfoot>
              <tr className="bg-slate-200/90 border-t-2 border-slate-400 font-bold text-slate-900">
                <td className="py-2.5 px-2 text-center text-emerald-700 text-xs uppercase font-mono">
                  Σ
                </td>
                {columns.map((col) => {
                  const summary = columnSummaries[col.id];
                  return (
                    <td key={`sum-${col.id}`} className="py-2.5 px-3 border-r border-slate-300 font-mono">
                      {summary ? (
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-500 font-bold uppercase">{summary.type}</span>
                          <span className="text-xs font-black text-emerald-800">{summary.value}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">—</span>
                      )}
                    </td>
                  );
                })}
                {numericColumns.length > 0 && (
                  <td className="py-2.5 px-3 border-r border-slate-300 bg-amber-100/70 font-mono text-right font-black text-amber-950 text-xs">
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] text-amber-800 font-bold uppercase">GRAND SUM</span>
                      <span className="text-xs font-black text-amber-950">
                        {rows.reduce((acc, r) => {
                          let rSum = 0;
                          columns.forEach(col => {
                            if (col.type === 'number' || col.type === 'currency' || col.summary === 'sum') {
                              const rawVal = r[col.id];
                              if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
                                const num = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal).replace(/[^0-9.-]/g, ''));
                                if (!isNaN(num)) rSum += num;
                              }
                            }
                          });
                          return acc + rSum;
                        }, 0).toLocaleString()}
                      </span>
                    </div>
                  </td>
                )}
                {!readOnly && <td className="no-print"></td>}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="no-print flex items-center justify-between text-[11px] text-slate-500 px-1">
        <span>Press <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-700 font-mono">Tab</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-700 font-mono">Enter</kbd> to move between cells • Copy & Paste from Excel supported</span>
        <span>{rows.length} of {maxRows} max rows</span>
      </div>
    </div>
  );
};
