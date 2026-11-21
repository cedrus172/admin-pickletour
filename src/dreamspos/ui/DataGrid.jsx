// Bảng lưới dữ liệu theo mẫu bảng DreamsPOS (table.table + phân trang Bootstrap), nhận cùng props
// với DataGrid của @mui/x-data-grid mà các trang đang dùng: rows, columns (field, headerName, width,
// minWidth, flex, renderCell, valueGetter, valueFormatter, sortable, align, type…), getRowId, loading,
// phân trang phía trình duyệt hoặc phía máy chủ, chọn dòng bằng ô đánh dấu, onRowClick.
/* eslint-disable react/prop-types, react/jsx-props-no-spreading */
import { forwardRef, useMemo, useState } from "react";
import Box from "@mui/material/Box";

import Feather from "dreamspos/Feather";
import { cx } from "./core";
import { Pagination } from "./table";
import { Checkbox } from "./forms";
import { LinearProgress } from "./feedback";

// Thanh công cụ mặc định của x-data-grid: ở đây chỉ dùng làm dấu hiệu bật ô tìm nhanh
export function GridToolbar() {
  return null;
}

const defaultRowId = (row) => row.id;
const asText = (value) => {
  if (value == null) return "";
  if (value instanceof Date) return value.toLocaleString("vi-VN");
  if (typeof value === "object") return "";
  return String(value);
};
const compare = (a, b) => {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (a instanceof Date || b instanceof Date) return new Date(a).getTime() - new Date(b).getTime();
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  return String(a).localeCompare(String(b), "vi", { numeric: true, sensitivity: "base" });
};
const cellValue = (col, row, id) => {
  const raw = row[col.field];
  return col.valueGetter
    ? col.valueGetter({ row, id, field: col.field, value: raw, colDef: col })
    : raw;
};

export const DataGrid = forwardRef(function DataGrid(props, ref) {
  const {
    rows = [],
    columns = [],
    getRowId = defaultRowId,
    loading = false,
    autoHeight = false,
    density,
    initialState,
    // phân trang
    paginationMode = "client",
    rowCount,
    paginationModel,
    onPaginationModelChange,
    page: pageProp,
    pageSize: pageSizeProp,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions,
    rowsPerPageOptions,
    hideFooter,
    hideFooterPagination,
    // chọn dòng
    checkboxSelection,
    rowSelectionModel,
    selectionModel,
    onRowSelectionModelChange,
    onSelectionModelChange,
    isRowSelectable,
    // sự kiện + hiển thị
    onRowClick,
    onCellClick,
    getRowClassName,
    getRowHeight,
    rowHeight,
    slots,
    slotProps,
    columnVisibilityModel,
    className,
    sx,
    style,
  } = props;

  const server = paginationMode === "server";
  const initPaging = initialState?.pagination?.paginationModel || {};
  const sizeOptions = pageSizeOptions || rowsPerPageOptions || [10, 25, 50, 100];
  const [innerPage, setInnerPage] = useState(initPaging.page || 0);
  const [innerSize, setInnerSize] = useState(
    initPaging.pageSize || (sizeOptions.includes(25) ? 25 : sizeOptions[0]) || 25
  );
  const page = paginationModel?.page ?? pageProp ?? innerPage;
  const pageSize = paginationModel?.pageSize ?? pageSizeProp ?? innerSize;
  const [sortModel, setSortModel] = useState(initialState?.sorting?.sortModel || []);
  const [innerSelection, setInnerSelection] = useState([]);
  const selection = rowSelectionModel ?? selectionModel ?? innerSelection;
  const [query, setQuery] = useState("");

  const quickFilter =
    slots?.toolbar === GridToolbar && Boolean(slotProps?.toolbar?.showQuickFilter);
  const hidden = columnVisibilityModel || initialState?.columns?.columnVisibilityModel || {};
  const cols = useMemo(
    () => columns.filter((c) => !c.hide && hidden[c.field] !== false),
    [columns, JSON.stringify(hidden)]
  );
  const dense = density === "compact" || initialState?.density === "compact";

  const prepared = useMemo(() => {
    let list = rows.map((row) => ({ row, id: getRowId(row) }));
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (quickFilter && words.length) {
      list = list.filter(({ row, id }) => {
        const hay = cols
          .map((col) => {
            const value = cellValue(col, row, id);
            return asText(
              col.valueFormatter ? col.valueFormatter({ value, id, field: col.field }) : value
            );
          })
          .join(" ")
          .toLowerCase();
        return words.every((w) => hay.includes(w));
      });
    }
    if (!server && sortModel.length) {
      const sorters = sortModel
        .map(({ field, sort }) => ({ col: columns.find((c) => c.field === field), sort }))
        .filter((s) => s.col && s.sort);
      if (sorters.length) {
        list = list
          .map((item, index) => ({ item, index }))
          .sort((x, y) => {
            for (let i = 0; i < sorters.length; i += 1) {
              const { col, sort } = sorters[i];
              const a = cellValue(col, x.item.row, x.item.id);
              const b = cellValue(col, y.item.row, y.item.id);
              const diff = col.sortComparator ? col.sortComparator(a, b) : compare(a, b);
              if (diff) return sort === "desc" ? -diff : diff;
            }
            return x.index - y.index;
          })
          .map((x) => x.item);
      }
    }
    return list;
  }, [rows, getRowId, query, quickFilter, cols, columns, sortModel, server]);

  const paged = !hideFooter && !hideFooterPagination;
  const total = server ? Number(rowCount ?? prepared.length) : prepared.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible =
    !paged || server ? prepared : prepared.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const changePaging = (next) => {
    if (next.pageSize !== pageSize) {
      setInnerSize(next.pageSize);
      if (onPageSizeChange) onPageSizeChange(next.pageSize);
    }
    if (next.page !== page) {
      setInnerPage(next.page);
      if (onPageChange) onPageChange(next.page);
    }
    if (onPaginationModelChange) onPaginationModelChange(next);
  };
  const toggleSort = (col) => {
    if (col.sortable === false || server) return;
    const current = sortModel.find((s) => s.field === col.field)?.sort;
    let next = "asc";
    if (current === "asc") next = "desc";
    else if (current === "desc") next = null;
    setSortModel(next ? [{ field: col.field, sort: next }] : []);
  };
  const changeSelection = (next) => {
    setInnerSelection(next);
    if (onRowSelectionModelChange) onRowSelectionModelChange(next);
    if (onSelectionModelChange) onSelectionModelChange(next);
  };
  const selectable = (item) => !isRowSelectable || isRowSelectable({ row: item.row, id: item.id });
  const selectableIds = checkboxSelection ? visible.filter(selectable).map((item) => item.id) : [];
  const allChecked =
    selectableIds.length > 0 && selectableIds.every((id) => selection.includes(id));
  const someChecked = selectableIds.some((id) => selection.includes(id));

  const fixedHeight = typeof rowHeight === "number" ? rowHeight : null;
  const NoRows = slots?.noRowsOverlay;
  const span = cols.length + (checkboxSelection ? 1 : 0);
  const from = total === 0 ? 0 : safePage * pageSize + 1;
  const to = Math.min(total, (safePage + 1) * pageSize);

  return (
    <Box
      ref={ref}
      className={cx("dp-ui dp-grid MuiDataGrid-root", dense && "dp-grid-compact", className)}
      sx={sx}
      style={{ ...(autoHeight ? null : { height: "100%" }), ...style }}
    >
      {loading ? <LinearProgress className="dp-grid-loading" /> : null}
      {quickFilter ? (
        <div style={{ padding: "10px 12px", flex: "none" }}>
          <input
            type="search"
            className="form-control form-control-sm"
            style={{ maxWidth: 280 }}
            placeholder={slotProps?.toolbar?.quickFilterProps?.placeholder || "Tìm trong bảng…"}
            aria-label="Tìm trong bảng"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (page !== 0 && !server) changePaging({ page: 0, pageSize });
            }}
          />
        </div>
      ) : null}
      <div className="dp-grid-scroll">
        <table className="table dp-table">
          <thead className="MuiDataGrid-columnHeaders">
            <tr>
              {checkboxSelection ? (
                <th className="dp-td-checkbox" scope="col">
                  <Checkbox
                    size="small"
                    checked={allChecked}
                    indeterminate={!allChecked && someChecked}
                    onChange={() => {
                      const others = selection.filter((id) => !selectableIds.includes(id));
                      changeSelection(allChecked ? others : [...others, ...selectableIds]);
                    }}
                    inputProps={{ "aria-label": "Chọn tất cả" }}
                  />
                </th>
              ) : null}
              {cols.map((col) => {
                const sorted = sortModel.find((s) => s.field === col.field)?.sort;
                const sortable = col.sortable !== false && !server;
                const align =
                  col.headerAlign || col.align || (col.type === "number" ? "right" : null);
                return (
                  <th
                    key={col.field}
                    scope="col"
                    className={cx(
                      "MuiDataGrid-columnHeader",
                      sortable && "dp-sortable",
                      align && `dp-ta-${align}`,
                      col.headerClassName
                    )}
                    style={{
                      width: col.flex ? undefined : col.width,
                      minWidth: col.minWidth || (col.flex ? 80 : col.width),
                      maxWidth: col.maxWidth,
                    }}
                    title={col.description}
                    onClick={() => toggleSort(col)}
                    aria-sort={sorted ? `${sorted}ending` : undefined}
                  >
                    <span className="MuiDataGrid-columnHeaderTitle">
                      {col.renderHeader
                        ? col.renderHeader({ colDef: col, field: col.field })
                        : col.headerName ?? col.field}
                    </span>
                    {sorted ? (
                      <span className="dp-sort">{sorted === "asc" ? "▲" : "▼"}</span>
                    ) : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => {
              const { row, id } = item;
              const rowAuto = getRowHeight ? getRowHeight({ id, model: row }) : null;
              const height = typeof rowAuto === "number" ? rowAuto : fixedHeight;
              const checked = selection.includes(id);
              return (
                <tr
                  key={id}
                  className={cx(
                    "MuiDataGrid-row",
                    onRowClick && "dp-row-click",
                    checked && "table-active",
                    getRowClassName && getRowClassName({ row, id })
                  )}
                  style={height ? { height } : undefined}
                  onClick={onRowClick ? (event) => onRowClick({ row, id }, event) : undefined}
                >
                  {checkboxSelection ? (
                    <td className="dp-td-checkbox">
                      <Checkbox
                        size="small"
                        checked={checked}
                        disabled={!selectable(item)}
                        onClick={(event) => event.stopPropagation()}
                        onChange={() =>
                          changeSelection(
                            checked ? selection.filter((x) => x !== id) : [...selection, id]
                          )
                        }
                        inputProps={{ "aria-label": "Chọn dòng" }}
                      />
                    </td>
                  ) : null}
                  {cols.map((col) => {
                    const value = cellValue(col, row, id);
                    const formattedValue = col.valueFormatter
                      ? col.valueFormatter({ value, id, field: col.field })
                      : value;
                    const params = {
                      row,
                      id,
                      field: col.field,
                      value,
                      formattedValue,
                      colDef: col,
                    };
                    let content;
                    if (col.renderCell) content = col.renderCell(params);
                    else if (typeof formattedValue === "boolean")
                      content = formattedValue ? "✓" : "—";
                    else content = asText(formattedValue);
                    const align = col.align || (col.type === "number" ? "right" : null);
                    const extra =
                      typeof col.cellClassName === "function"
                        ? col.cellClassName(params)
                        : col.cellClassName;
                    return (
                      <td
                        key={col.field}
                        className={cx("MuiDataGrid-cell", align && `dp-ta-${align}`, extra)}
                        style={{ maxWidth: col.maxWidth }}
                        onClick={onCellClick ? (event) => onCellClick(params, event) : undefined}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={span} className="dp-grid-empty">
                  {NoRows && !loading ? (
                    <NoRows />
                  ) : (
                    <>
                      <Feather icon="inbox" size={28} />
                      {loading ? "Đang tải…" : "Không có dữ liệu"}
                    </>
                  )}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {paged ? (
        <div className="dp-grid-foot">
          <div>
            {checkboxSelection && selection.length ? `Đã chọn ${selection.length} · ` : ""}
            {`Hiển thị ${from}–${to} trong ${total}`}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {sizeOptions.length > 1 ? (
              <select
                aria-label="Số dòng mỗi trang"
                value={pageSize}
                onChange={(event) =>
                  changePaging({ page: 0, pageSize: Number(event.target.value) })
                }
              >
                {[
                  ...new Set([
                    ...sizeOptions.map((o) => (typeof o === "object" ? o.value : o)),
                    pageSize,
                  ]),
                ]
                  .sort((a, b) => a - b)
                  .map((n) => (
                    <option key={n} value={n}>
                      {n} dòng
                    </option>
                  ))}
              </select>
            ) : null}
            {pageCount > 1 ? (
              <Pagination
                size="small"
                count={pageCount}
                page={safePage + 1}
                onChange={(_, next) => changePaging({ page: next - 1, pageSize })}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </Box>
  );
});

export default DataGrid;
