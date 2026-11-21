// Bảng (.table của DreamsPOS), phân trang (.pagination của Bootstrap) và tab (.nav-tabs).
/* eslint-disable react/prop-types, react/jsx-props-no-spreading */
import { Children, cloneElement, forwardRef, isValidElement, useContext, useMemo } from "react";
import Box from "@mui/material/Box";
import usePagination from "@mui/material/usePagination";

import { cx, omit, TableContext, RIPPLE_PROPS } from "./core";

/* ── Bảng ── */
export const TableContainer = forwardRef(function TableContainer(props, ref) {
  const { className, ...rest } = props;
  return (
    <Box
      ref={ref}
      className={cx("table-responsive dp-ui dp-table-container", className)}
      {...rest}
    />
  );
});

export const Table = forwardRef(function Table(props, ref) {
  const { size = "medium", stickyHeader, padding, className, children, ...rest } = props;
  const ctx = useMemo(() => ({ size, head: false }), [size]);
  return (
    <TableContext.Provider value={ctx}>
      <Box
        ref={ref}
        component="table"
        className={cx(
          "table dp-ui dp-table",
          size === "small" && "table-sm",
          stickyHeader && "dp-table-sticky",
          className
        )}
        {...rest}
      >
        {children}
      </Box>
    </TableContext.Provider>
  );
});

export const TableHead = forwardRef(function TableHead(props, ref) {
  const { children, ...rest } = props;
  const parent = useContext(TableContext);
  const ctx = useMemo(() => ({ ...parent, head: true }), [parent]);
  return (
    <TableContext.Provider value={ctx}>
      <Box ref={ref} component="thead" {...rest}>
        {children}
      </Box>
    </TableContext.Provider>
  );
});

export const TableBody = forwardRef(function TableBody(props, ref) {
  return <Box ref={ref} component="tbody" {...props} />;
});

export const TableFooter = forwardRef(function TableFooter(props, ref) {
  return <Box ref={ref} component="tfoot" {...props} />;
});

export const TableRow = forwardRef(function TableRow(props, ref) {
  const { hover, selected, className, ...rest } = props;
  return (
    <Box
      ref={ref}
      component="tr"
      className={cx(
        "MuiTableRow-root",
        hover && "dp-tr-hover",
        selected && "table-active Mui-selected",
        className
      )}
      {...rest}
    />
  );
});

export const TableCell = forwardRef(function TableCell(props, ref) {
  const { align, padding, size, variant, component, sortDirection, className, scope, ...rest } =
    props;
  const { head } = useContext(TableContext);
  const isHead = variant ? variant === "head" : head;
  const Comp = component || (isHead ? "th" : "td");
  return (
    <Box
      ref={ref}
      component={Comp}
      scope={scope || (isHead && Comp === "th" ? "col" : undefined)}
      className={cx(
        "MuiTableCell-root",
        isHead && Comp !== "th" && "dp-th",
        align && align !== "inherit" && `dp-ta-${align}`,
        padding === "checkbox" && "dp-td-checkbox",
        padding === "none" && "dp-td-none",
        className
      )}
      {...rest}
    />
  );
});

/* ── Phân trang ── */
const PAGE_GLYPH = { first: "«", previous: "‹", next: "›", last: "»" };
const PAGE_LABEL = {
  first: "Trang đầu",
  previous: "Trang trước",
  next: "Trang sau",
  last: "Trang cuối",
};

export const Pagination = forwardRef(function Pagination(props, ref) {
  const {
    page,
    count,
    defaultPage,
    onChange,
    size,
    color,
    shape,
    variant,
    disabled,
    showFirstButton,
    showLastButton,
    hidePrevButton,
    hideNextButton,
    siblingCount,
    boundaryCount,
    className,
    renderItem,
    getItemAriaLabel,
    ...rest
  } = props;
  const { items } = usePagination({
    page,
    count,
    defaultPage,
    onChange,
    disabled,
    showFirstButton,
    showLastButton,
    hidePrevButton,
    hideNextButton,
    siblingCount,
    boundaryCount,
  });
  return (
    <Box
      ref={ref}
      component="nav"
      aria-label="Phân trang"
      className={cx("dp-ui", className)}
      {...rest}
    >
      <ul
        className={cx(
          "pagination dp-pagination",
          size === "small" && "pagination-sm",
          size === "large" && "pagination-lg"
        )}
      >
        {items.map((item, index) => {
          const { type, selected, onClick } = item;
          if (type === "start-ellipsis" || type === "end-ellipsis") {
            return (
              // eslint-disable-next-line react/no-array-index-key
              <li key={`${type}-${index}`} className="page-item disabled">
                <span className="page-link dp-page-gap">…</span>
              </li>
            );
          }
          const isPage = type === "page";
          return (
            <li
              // eslint-disable-next-line react/no-array-index-key
              key={`${type}-${item.page}-${index}`}
              className={cx("page-item", selected && "active", item.disabled && "disabled")}
            >
              <button
                type="button"
                className="page-link"
                onClick={onClick}
                disabled={item.disabled}
                aria-current={selected ? "page" : undefined}
                aria-label={isPage ? `Trang ${item.page}` : PAGE_LABEL[type]}
              >
                {isPage ? item.page : PAGE_GLYPH[type]}
              </button>
            </li>
          );
        })}
      </ul>
    </Box>
  );
});

/* ── Tab ── */
export const Tab = forwardRef(function Tab(props, ref) {
  const {
    label,
    icon,
    iconPosition,
    value,
    selected,
    onChange,
    onClick,
    disabled,
    fullWidth,
    wrapped,
    indicator,
    selectionFollowsFocus,
    textColor,
    className,
    children,
    component,
    ...other
  } = props;
  const rest = omit(other, RIPPLE_PROPS);
  const Comp = component || "button";
  const iconNode = icon ? <span className="dp-tab-icon">{icon}</span> : null;
  return (
    <li className="nav-item" role="presentation">
      <Box
        ref={ref}
        component={Comp}
        type={Comp === "button" ? "button" : undefined}
        role="tab"
        aria-selected={Boolean(selected)}
        tabIndex={selected ? 0 : -1}
        className={cx("nav-link dp-ui MuiTab-root", selected && "active Mui-selected", className)}
        disabled={Comp === "button" ? disabled : undefined}
        onClick={(event) => {
          if (!selected && onChange) onChange(event, value);
          if (onClick) onClick(event);
        }}
        {...rest}
      >
        {iconPosition !== "end" ? iconNode : null}
        {label}
        {children}
        {iconPosition === "end" ? iconNode : null}
      </Box>
    </li>
  );
});

const TABS_DROP = [
  "classes",
  "TabIndicatorProps",
  "TabScrollButtonProps",
  "ScrollButtonComponent",
  "scrollButtons",
  "allowScrollButtonsMobile",
  "textColor",
  "indicatorColor",
  "selectionFollowsFocus",
  "visibleScrollbar",
  "action",
];

export const Tabs = forwardRef(function Tabs(props, ref) {
  const { value, onChange, variant, orientation, centered, className, children, ...other } = props;
  const rest = omit(other, TABS_DROP);
  let index = 0;
  const tabs = Children.map(children, (child) => {
    if (!isValidElement(child)) return null;
    const childValue = child.props.value === undefined ? index : child.props.value;
    index += 1;
    return cloneElement(child, {
      value: childValue,
      selected: childValue === value,
      onChange,
      fullWidth: variant === "fullWidth",
    });
  });
  return (
    <Box
      ref={ref}
      className={cx(
        "dp-ui dp-tabs",
        variant === "scrollable" && "dp-tabs-scroll",
        variant === "fullWidth" && "dp-full",
        centered && "dp-tabs-center",
        orientation === "vertical" && "dp-tabs-vertical",
        className
      )}
      {...rest}
    >
      <ul
        className="nav nav-tabs"
        role="tablist"
        aria-orientation={orientation === "vertical" ? "vertical" : undefined}
        onKeyDown={(event) => {
          const keys =
            orientation === "vertical" ? ["ArrowUp", "ArrowDown"] : ["ArrowLeft", "ArrowRight"];
          if (!keys.includes(event.key)) return;
          const list = Array.from(
            event.currentTarget.querySelectorAll('[role="tab"]:not(:disabled)')
          );
          const at = list.indexOf(document.activeElement);
          if (at < 0) return;
          event.preventDefault();
          const next = list[(at + (event.key === keys[1] ? 1 : list.length - 1)) % list.length];
          next.focus();
          next.click();
        }}
      >
        {tabs}
      </ul>
    </Box>
  );
});
