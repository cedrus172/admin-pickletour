// Bảng dữ liệu dùng chung — dựng theo mẫu bảng của DreamsPOS (.table-top, table.table.datanew,
// phân trang Bootstrap). Giữ nguyên props và logic react-table của bản cũ nên các trang gọi
// <DataTable table={{ columns, rows }} … /> không phải sửa gì.
import { useMemo, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useTable, usePagination, useGlobalFilter, useAsyncDebounce, useSortBy } from "react-table";

import Feather from "dreamspos/Feather";

const pageWindow = (current, total) => {
  // các số trang hiển thị quanh trang hiện tại (tối đa 7 ô)
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const start = Math.max(0, Math.min(current - 3, total - 7));
  return Array.from({ length: 7 }, (_, i) => start + i);
};

function DataTable({ entriesPerPage, canSearch, showTotalEntries, table, isSorted, noEndBorder }) {
  const defaultValue = entriesPerPage.defaultValue ? entriesPerPage.defaultValue : 10;
  const entries = entriesPerPage.entries ? entriesPerPage.entries : [5, 10, 15, 20, 25];
  const columns = useMemo(() => table.columns, [table]);
  const data = useMemo(() => table.rows, [table]);

  const tableInstance = useTable(
    { columns, data, initialState: { pageIndex: 0 } },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    rows,
    page,
    pageOptions,
    canPreviousPage,
    canNextPage,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    setGlobalFilter,
    state: { pageIndex, pageSize, globalFilter },
  } = tableInstance;

  useEffect(() => setPageSize(defaultValue || 10), [defaultValue]);

  const [search, setSearch] = useState(globalFilter);
  const onSearchChange = useAsyncDebounce((value) => {
    setGlobalFilter(value || undefined);
  }, 100);

  const entriesStart = rows.length === 0 ? 0 : pageIndex * pageSize + 1;
  const entriesEnd = Math.min(rows.length, (pageIndex + 1) * pageSize);
  const showTop = Boolean(entriesPerPage) || canSearch;
  const showFoot = showTotalEntries || pageOptions.length > 1;

  return (
    <div className="dp-table-wrap">
      {showTop ? (
        <div className="table-top" style={{ padding: "16px 16px 0" }}>
          <div className="search-set">
            {canSearch ? (
              <div className="search-input">
                <Feather icon="search" size={16} />
                <input
                  type="search"
                  placeholder="Tìm kiếm…"
                  value={search || ""}
                  onChange={({ currentTarget }) => {
                    setSearch(currentTarget.value);
                    onSearchChange(currentTarget.value);
                  }}
                  aria-label="Tìm trong bảng"
                />
              </div>
            ) : null}
          </div>
          {entriesPerPage ? (
            <div className="wordset" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>Hiển thị</span>
              <select
                className="dp-page-size"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                aria-label="Số dòng mỗi trang"
              >
                {entries.map((n) => (
                  <option key={n} value={Number(n)}>
                    {n}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: 14 }}>dòng</span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="table-responsive">
        <table {...getTableProps()} className="table datanew">
          <thead>
            {headerGroups.map((headerGroup) => {
              const { key: hgKey, ...hgProps } = headerGroup.getHeaderGroupProps();
              return (
                <tr key={hgKey} {...hgProps}>
                  {headerGroup.headers.map((column) => {
                    const { key: thKey, ...thProps } = column.getHeaderProps(
                      isSorted && column.getSortByToggleProps()
                    );
                    return (
                      <th
                        key={thKey}
                        {...thProps}
                        className={isSorted ? "dp-sortable" : undefined}
                        style={{
                          width: column.width ? column.width : "auto",
                          textAlign: column.align ? column.align : "left",
                        }}
                      >
                        {column.render("Header")}
                        {isSorted && column.isSorted ? (
                          <span style={{ marginLeft: 6, color: "#ff9f43" }}>
                            {column.isSortedDesc ? "▼" : "▲"}
                          </span>
                        ) : null}
                      </th>
                    );
                  })}
                </tr>
              );
            })}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.map((row, rowIdx) => {
              prepareRow(row);
              const { key: trKey, ...trProps } = row.getRowProps();
              const last = noEndBorder && rowIdx === page.length - 1;
              return (
                <tr key={trKey} {...trProps}>
                  {row.cells.map((cell) => {
                    const { key: tdKey, ...tdProps } = cell.getCellProps();
                    return (
                      <td
                        key={tdKey}
                        {...tdProps}
                        style={{
                          textAlign: cell.column.align ? cell.column.align : "left",
                          borderBottom: last ? "none" : undefined,
                        }}
                      >
                        {cell.render("Cell")}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {page.length === 0 ? (
              <tr>
                <td colSpan={columns.length || 1} style={{ textAlign: "center", padding: 28 }}>
                  Không có dữ liệu
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {showFoot ? (
        <div className="dp-table-foot" style={{ padding: "14px 16px" }}>
          <div>
            {showTotalEntries
              ? `Hiển thị ${entriesStart} đến ${entriesEnd} trong ${rows.length} dòng`
              : null}
          </div>
          {pageOptions.length > 1 ? (
            <ul className="pagination">
              <li className={`page-item${canPreviousPage ? "" : " disabled"}`}>
                <button
                  type="button"
                  className="page-link"
                  onClick={() => previousPage()}
                  disabled={!canPreviousPage}
                  aria-label="Trang trước"
                >
                  ‹
                </button>
              </li>
              {pageWindow(pageIndex, pageOptions.length).map((option) => (
                <li key={option} className={`page-item${pageIndex === option ? " active" : ""}`}>
                  <button type="button" className="page-link" onClick={() => gotoPage(option)}>
                    {option + 1}
                  </button>
                </li>
              ))}
              <li className={`page-item${canNextPage ? "" : " disabled"}`}>
                <button
                  type="button"
                  className="page-link"
                  onClick={() => nextPage()}
                  disabled={!canNextPage}
                  aria-label="Trang sau"
                >
                  ›
                </button>
              </li>
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

DataTable.defaultProps = {
  entriesPerPage: { defaultValue: 10, entries: [5, 10, 15, 20, 25] },
  canSearch: false,
  showTotalEntries: true,
  pagination: { variant: "gradient", color: "info" },
  isSorted: true,
  noEndBorder: false,
};

DataTable.propTypes = {
  entriesPerPage: PropTypes.oneOfType([
    PropTypes.shape({
      defaultValue: PropTypes.number,
      entries: PropTypes.arrayOf(PropTypes.number),
    }),
    PropTypes.bool,
  ]),
  canSearch: PropTypes.bool,
  showTotalEntries: PropTypes.bool,
  table: PropTypes.objectOf(PropTypes.array).isRequired,
  // giữ để tương thích với các trang đang truyền; bảng DreamsPOS không dùng
  // eslint-disable-next-line react/no-unused-prop-types
  pagination: PropTypes.shape({
    variant: PropTypes.oneOf(["contained", "gradient"]),
    color: PropTypes.oneOf([
      "primary",
      "secondary",
      "info",
      "success",
      "warning",
      "error",
      "dark",
      "light",
    ]),
  }),
  isSorted: PropTypes.bool,
  noEndBorder: PropTypes.bool,
};

export default DataTable;
