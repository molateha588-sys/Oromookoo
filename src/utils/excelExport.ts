import * as XLSX from 'xlsx';
import { EditableTableTemplate, UserTableSubmission, User, TableColumn, TableRowData } from '../types';
import { storageService } from '../services/storageService';

export interface ConsolidatedExcelRow {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  tableId: number;
  tableTitle: string;
  category: string;
  rowNumber: number;
  submittedAt: string;
  status: string;
  reviewerStatus: string;
  [columnLabel: string]: any;
}

/**
 * Builds a flat consolidated master list of all rows submitted across all users.
 */
export function buildMasterExcelData(
  users?: User[],
  templates?: EditableTableTemplate[],
  submissions?: UserTableSubmission[]
): ConsolidatedExcelRow[] {
  const uList = users || storageService.getUsers();
  const tList = templates || storageService.getTableTemplates();
  const sList = submissions || storageService.getTableSubmissions();

  const result: ConsolidatedExcelRow[] = [];

  // Sort submissions by user ID then submitted date
  const sortedSubs = [...sList].sort((a, b) => a.user_id - b.user_id);

  sortedSubs.forEach(sub => {
    const user = uList.find(u => u.id === sub.user_id);
    const template = tList.find(t => t.id === sub.table_id);
    if (!user || !template) return;

    const rows = sub.rows && sub.rows.length > 0 ? sub.rows : [{}];

    rows.forEach((row, rowIndex) => {
      const flatRow: ConsolidatedExcelRow = {
        userId: user.id,
        username: user.username,
        fullName: user.full_name || user.username,
        email: user.email,
        tableId: template.id,
        tableTitle: template.title,
        category: template.category || 'General',
        rowNumber: rowIndex + 1,
        submittedAt: sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : (sub.updated_at ? new Date(sub.updated_at).toLocaleString() : 'Draft'),
        status: sub.status,
        reviewerStatus: sub.reviewer_status || 'pending'
      };

      // Map each column label and value
      template.columns.forEach(col => {
        let val = row[col.id];
        if (col.type === 'currency' && typeof val === 'number') {
          flatRow[`[${template.title}] ${col.label}`] = val;
        } else if (col.type === 'checkbox') {
          flatRow[`[${template.title}] ${col.label}`] = val ? 'YES' : 'NO';
        } else {
          flatRow[`[${template.title}] ${col.label}`] = val ?? '';
        }
      });

      result.push(flatRow);
    });
  });

  return result;
}

/**
 * Exports all user submissions for a specific Table Title into an organized Excel (.xlsx) file.
 * Structure: ONLY 'Username' and 'Data Sent' columns.
 * Auto-saved and ordered according to their assigned Username, ending with 'Total' row at the bottom.
 */
export function exportTableByTitleExcel(
  templateOrId: EditableTableTemplate | number,
  users?: User[],
  submissions?: UserTableSubmission[]
): boolean {
  try {
    const tList = storageService.getTableTemplates();
    const template = typeof templateOrId === 'number' 
      ? tList.find(t => t.id === templateOrId)
      : templateOrId;

    if (!template) return false;

    const uList = users || storageService.getUsers();
    const sList = submissions || storageService.getTableSubmissions();

    const wb = XLSX.utils.book_new();
    const tableSubs = sList.filter(s => s.table_id === template.id);

    // Group and sort submissions alphabetically by assigned Username
    const userRowsList: Array<{ username: string; row: TableRowData }> = [];

    tableSubs.forEach(sub => {
      const user = uList.find(u => u.id === sub.user_id);
      if (!user) return;

      const rows = sub.rows && sub.rows.length > 0 ? sub.rows : [{}];
      rows.forEach(r => {
        userRowsList.push({
          username: user.username,
          row: r
        });
      });
    });

    // Alphabetical order by username
    userRowsList.sort((a, b) => a.username.localeCompare(b.username));

    // Calculate column sums for numeric/currency columns
    const columnTotals: Record<string, number> = {};
    const hasNumericCol: Record<string, boolean> = {};

    template.columns.forEach(col => {
      if (col.type === 'number' || col.type === 'currency') {
        columnTotals[col.label] = 0;
        hasNumericCol[col.label] = true;
      }
    });

    // Build formatted rows for export
    const excelRows: Record<string, any>[] = userRowsList.map(item => {
      const rowRecord: Record<string, any> = {
        'Username': item.username
      };

      let rowGrandTotal = 0;

      template.columns.forEach(col => {
        const val = item.row[col.id];
        if (hasNumericCol[col.label]) {
          const numVal = typeof val === 'number' ? val : (parseFloat(val) || 0);
          columnTotals[col.label] = (columnTotals[col.label] || 0) + numVal;
          rowRecord[col.label] = numVal;
          rowGrandTotal += numVal;
        } else if (col.type === 'checkbox') {
          rowRecord[col.label] = val ? 'YES' : 'NO';
        } else {
          rowRecord[col.label] = val ?? '';
        }
      });

      // Grand Total Sum Column for this row
      rowRecord['Grand Total Sum (Row Σ)'] = rowGrandTotal;

      return rowRecord;
    });

    // Append 'Total' row at the bottom if numeric columns exist or rows exist
    if (excelRows.length > 0) {
      const totalRow: Record<string, any> = {
        'Username': 'Column Totals'
      };

      let allRowsGrandTotal = 0;

      template.columns.forEach(col => {
        if (hasNumericCol[col.label]) {
          const colSum = columnTotals[col.label] || 0;
          totalRow[col.label] = colSum;
          allRowsGrandTotal += colSum;
        } else {
          totalRow[col.label] = '';
        }
      });

      totalRow['Grand Total Sum (Row Σ)'] = allRowsGrandTotal;

      excelRows.push(totalRow);
    } else {
      excelRows.push({
        'Username': 'No data sent by users yet'
      });
    }

    const ws = XLSX.utils.json_to_sheet(excelRows);

    // Set auto column widths
    const colWidths = [{ wch: 22 }]; // Username column
    template.columns.forEach(c => {
      colWidths.push({ wch: Math.max(c.label.length + 5, 18) });
    });
    colWidths.push({ wch: 22 }); // Grand Total Sum column
    ws['!cols'] = colWidths;

    const cleanSheetName = template.title.slice(0, 30).replace(/[\\/?*[\]]/g, '_');
    XLSX.utils.book_append_sheet(wb, ws, cleanSheetName);

    const safeFilename = template.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Biiroo_Fayyaa_${safeFilename}_${timestamp}.xlsx`);
    return true;
  } catch (err) {
    console.error('Error exporting table by title to Excel:', err);
    return false;
  }
}

/**
 * Exports all tables and submissions across all users into a multi-sheet master workbook.
 */
export function exportMasterExcelWorkbook(
  users?: User[],
  templates?: EditableTableTemplate[],
  submissions?: UserTableSubmission[],
  filenamePrefix = 'Biiroo_Eegumsa_Fayyaa_Master_Data'
): boolean {
  try {
    const uList = users || storageService.getUsers();
    const tList = templates || storageService.getTableTemplates();
    const sList = submissions || storageService.getTableSubmissions();

    if (tList.length === 0 && sList.length === 0) {
      return false;
    }

    const wb = XLSX.utils.book_new();

    // 1. MASTER CONSOLIDATED SHEET (All tables ordered by Username)
    const masterFlatRows: Record<string, any>[] = [];

    const sortedSubs = [...sList].sort((a, b) => {
      const userA = uList.find(u => u.id === a.user_id)?.username || '';
      const userB = uList.find(u => u.id === b.user_id)?.username || '';
      return userA.localeCompare(userB);
    });

    sortedSubs.forEach(sub => {
      const user = uList.find(u => u.id === sub.user_id);
      const template = tList.find(t => t.id === sub.table_id);
      if (!user || !template) return;

      const rows = sub.rows && sub.rows.length > 0 ? sub.rows : [{}];
      rows.forEach((r, idx) => {
        const flat: Record<string, any> = {
          'Username': user.username,
          'Full Name': user.full_name || user.username,
          'Email': user.email,
          'Table Title': template.title,
          'Category': template.category || 'Health Operations',
          'Row #': idx + 1,
          'Submitted At': sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'Draft'
        };

        template.columns.forEach(col => {
          flat[`${col.label}`] = r[col.id] ?? '';
        });

        masterFlatRows.push(flat);
      });
    });

    if (masterFlatRows.length > 0) {
      const masterWs = XLSX.utils.json_to_sheet(masterFlatRows);
      XLSX.utils.book_append_sheet(wb, masterWs, 'Master Consolidated');
    }

    // 2. SEPARATE SHEET FOR EACH TABLE TITLE WITH USERNAMES AND TOTAL ROW
    tList.forEach(tpl => {
      const tplSubs = sList.filter(s => s.table_id === tpl.id);
      const userRowsList: Array<{ username: string; row: TableRowData }> = [];

      tplSubs.forEach(sub => {
        const user = uList.find(u => u.id === sub.user_id);
        if (!user) return;
        const rows = sub.rows && sub.rows.length > 0 ? sub.rows : [{}];
        rows.forEach(r => {
          userRowsList.push({
            username: user.username,
            row: r
          });
        });
      });

      userRowsList.sort((a, b) => a.username.localeCompare(b.username));

      const columnSums: Record<string, { sum: number; isNumeric: boolean }> = {};
      tpl.columns.forEach(c => {
        columnSums[c.id] = { sum: 0, isNumeric: c.type === 'number' || c.type === 'currency' };
      });

      const tplRows: Record<string, any>[] = userRowsList.map(item => {
        const rowObj: Record<string, any> = {
          'Username': item.username
        };

        let rowGrandSum = 0;

        tpl.columns.forEach(c => {
          const val = item.row[c.id];
          if (columnSums[c.id].isNumeric) {
            const num = typeof val === 'number' ? val : (parseFloat(val) || 0);
            columnSums[c.id].sum += num;
            rowObj[c.label] = num;
            rowGrandSum += num;
          } else if (c.type === 'checkbox') {
            rowObj[c.label] = val ? 'YES' : 'NO';
          } else {
            rowObj[c.label] = val ?? '';
          }
        });

        rowObj['Grand Total Sum (Row Σ)'] = rowGrandSum;

        return rowObj;
      });

      if (tplRows.length > 0) {
        const totalRowObj: Record<string, any> = {
          'Username': 'Column Totals'
        };

        let sheetGrandTotal = 0;

        tpl.columns.forEach(c => {
          if (columnSums[c.id].isNumeric) {
            const sumVal = columnSums[c.id].sum;
            totalRowObj[c.label] = sumVal;
            sheetGrandTotal += sumVal;
          } else {
            totalRowObj[c.label] = '';
          }
        });

        totalRowObj['Grand Total Sum (Row Σ)'] = sheetGrandTotal;

        tplRows.push(totalRowObj);
      }

      if (tplRows.length > 0) {
        const tplWs = XLSX.utils.json_to_sheet(tplRows);
        const sheetTitle = tpl.title.slice(0, 28).replace(/[\\/?*[\]]/g, '_');
        XLSX.utils.book_append_sheet(wb, tplWs, sheetTitle);
      }
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    XLSX.writeFile(wb, `${filenamePrefix}_${timestamp}.xlsx`);
    return true;
  } catch (err) {
    console.error('Error generating master excel workbook:', err);
    return false;
  }
}

/**
 * Exports a single user's table submission to a clean Excel file
 */
export function exportSingleUserTableExcel(
  user: User,
  template: EditableTableTemplate,
  submission: UserTableSubmission | null,
  rows: TableRowData[]
): boolean {
  try {
    const wb = XLSX.utils.book_new();

    const formattedRows = rows.map((r, i) => {
      const rowObj: Record<string, any> = {
        'Row #': i + 1,
        'Username': user.username,
        'Full Name': user.full_name || user.username
      };

      template.columns.forEach(c => {
        rowObj[c.label] = r[c.id] ?? '';
      });

      return rowObj;
    });

    const ws = XLSX.utils.json_to_sheet(formattedRows);
    const sheetName = template.title.slice(0, 30).replace(/[\\/?*[\]]/g, '_');
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const cleanTitle = template.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    XLSX.writeFile(wb, `Biiroo_Fayyaa_${user.username}_${cleanTitle}.xlsx`);
    return true;
  } catch (err) {
    console.error('Error exporting single user table:', err);
    return false;
  }
}
