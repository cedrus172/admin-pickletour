// Hộp thoại theo mẫu .modal của Bootstrap/DreamsPOS. Động cơ Modal của MUI lo giữ tiêu điểm,
// phím Esc, khoá cuộn trang và xếp chồng; phần hiển thị là .modal-dialog > .modal-content.
/* eslint-disable react/prop-types, react/jsx-props-no-spreading */
import { forwardRef, useRef } from "react";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";

import { cx, omit } from "./core";

const WIDTHS = { xs: 444, sm: 600, md: 900, lg: 1200, xl: 1536 };
const DIALOG_DROP = [
  "classes",
  "TransitionComponent",
  "TransitionProps",
  "transitionDuration",
  "PaperComponent",
  "BackdropComponent",
  "aria-describedby",
];

export const Dialog = forwardRef(function Dialog(props, ref) {
  const {
    open,
    onClose,
    maxWidth = "sm",
    fullWidth = false,
    fullScreen = false,
    scroll,
    PaperProps = {},
    children,
    className,
    sx,
    keepMounted,
    disableEscapeKeyDown,
    onBackdropClick,
    "aria-labelledby": labelledBy,
    ...other
  } = props;
  const rest = omit(other, DIALOG_DROP);
  const downOnBackdrop = useRef(false);
  const { className: paperClass, sx: paperSx, style: paperStyle, ...paperRest } = PaperProps;
  const width = maxWidth && WIDTHS[maxWidth] ? WIDTHS[maxWidth] : null;
  return (
    <Modal
      open={Boolean(open)}
      onClose={onClose}
      keepMounted={keepMounted}
      disableEscapeKeyDown={disableEscapeKeyDown}
      className={cx("dp-modal-root", className)}
      sx={sx}
      {...rest}
    >
      <div
        ref={ref}
        className="modal dp-ui dp-modal show"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onMouseDown={(event) => {
          downOnBackdrop.current = event.target === event.currentTarget;
        }}
        onClick={(event) => {
          if (!downOnBackdrop.current || event.target !== event.currentTarget) return;
          downOnBackdrop.current = false;
          if (onBackdropClick) onBackdropClick(event);
          if (onClose) onClose(event, "backdropClick");
        }}
      >
        <div
          className={cx(
            "modal-dialog modal-dialog-centered modal-dialog-scrollable",
            fullScreen && "modal-fullscreen",
            !fullWidth && !fullScreen && "dp-modal-auto"
          )}
          style={fullScreen ? undefined : { maxWidth: width ? width + 32 : "none" }}
        >
          <Box
            className={cx("modal-content", paperClass)}
            sx={paperSx}
            style={paperStyle}
            {...omit(paperRest, ["elevation", "variant", "square"])}
          >
            {children}
          </Box>
        </div>
      </div>
    </Modal>
  );
});

export const DialogTitle = forwardRef(function DialogTitle(props, ref) {
  const { className, children, component, ...rest } = props;
  return (
    <div className="modal-header dp-ui">
      <Box
        ref={ref}
        component={component || "h5"}
        className={cx("modal-title", className)}
        {...rest}
      >
        {children}
      </Box>
    </div>
  );
});

export const DialogContent = forwardRef(function DialogContent(props, ref) {
  const { className, dividers, ...rest } = props;
  return <Box ref={ref} className={cx("modal-body dp-ui", className)} {...rest} />;
});

export const DialogActions = forwardRef(function DialogActions(props, ref) {
  const { className, disableSpacing, ...rest } = props;
  return <Box ref={ref} className={cx("modal-footer dp-ui", className)} {...rest} />;
});

export const DialogContentText = forwardRef(function DialogContentText(props, ref) {
  const { className, ...rest } = props;
  return <Box ref={ref} component="p" className={cx("dp-modal-text dp-ui", className)} {...rest} />;
});
