/**
 * 构建 CSV 字符串
 * @param {string[]} headers - 表头
 * @param {string[][]} rows - 数据行
 * @returns {string} CSV 内容（含 UTF-8 BOM）
 */
export function buildCSV(headers, rows) {
  const BOM = '\uFEFF'
  const escapeCell = (cell) => {
    if (cell == null) return ''
    const str = String(cell)
    // 包含逗号、引号、换行需用引号包裹
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const headerLine = headers.map(escapeCell).join(',')
  const dataLines = rows.map((row) => row.map(escapeCell).join(','))

  return BOM + [headerLine, ...dataLines].join('\n')
}
