// Nhãn (badge), thông báo, vòng chờ, thanh tiến độ, khung chờ, ảnh đại diện theo mẫu DreamsPOS.
/* eslint-disable react/prop-types, react/jsx-props-no-spreading */
import { forwardRef, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import MuiCircularProgress from "@mui/material/CircularProgress";

import Feather from "dreamspos/Feather";
import { cx, toneOf, omit, hasCustomBg } from "./core";

// Lớp nhãn trạng thái có sẵn của DreamsPOS (.badges.bg-light…)
const BADGE_CLASS = {
  success: "badges bg-lightgreen",
  danger: "badges bg-lightred",
  warning: "badges bg-lightyellow",
  secondary: "badges bg-lightgrey",
  purple: "badges bg-lightpurple",
};

export const Chip = forwardRef(function Chip(props, ref) {
  const {
    label,
    size = "medium",
    color = "default",
    variant = "filled",
    icon,
    avatar,
    onDelete,
    deleteIcon,
    onClick,
    clickable,
    disabled,
    component,
    href,
    className,
    sx,
    children,
    ...other
  } = props;
  const rest = omit(other, ["classes", "skipFocusWhenDisabled"]);
  const tone = toneOf(color, "default");
  const colored = tone !== "default" && tone !== "inherit";
  const filled = variant !== "outlined";
  const canClick = clickable !== false && Boolean(onClick || clickable || href);
  const Comp = component || (href ? "a" : "span");
  return (
    <Box
      ref={ref}
      component={Comp}
      className={cx(
        "badge dp-ui dp-chip",
        filled ? "dp-chip-filled" : "dp-chip-outlined",
        colored && `dp-chip-colored dp-tone-${tone}`,
        filled && colored && !hasCustomBg(sx) && BADGE_CLASS[tone],
        size === "small" && "dp-chip-sm",
        canClick && "dp-chip-click",
        disabled && "disabled",
        className
      )}
      href={href}
      role={onClick && !href ? "button" : undefined}
      tabIndex={onClick && !href && !disabled ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick && !href
          ? (event) => {
              if (
                event.target === event.currentTarget &&
                (event.key === "Enter" || event.key === " ")
              ) {
                event.preventDefault();
                onClick(event);
              }
            }
          : undefined
      }
      sx={sx}
      {...rest}
    >
      {avatar ? <span className="dp-chip-avatar">{avatar}</span> : null}
      {icon ? <span className="dp-chip-icon MuiChip-icon">{icon}</span> : null}
      <span className="dp-chip-label MuiChip-label">{label ?? children}</span>
      {onDelete ? (
        <button
          type="button"
          className="dp-chip-x"
          aria-label="Xoá"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(event);
          }}
        >
          {deleteIcon || "×"}
        </button>
      ) : null}
    </Box>
  );
});

const ALERT_ICON = {
  info: "info",
  success: "check-circle",
  warning: "alert-triangle",
  error: "alert-circle",
};
const ALERT_TONE = { info: "primary", success: "success", warning: "warning", error: "danger" };
const ALERT_BS = {
  info: "alert-info",
  success: "alert-success",
  warning: "alert-warning",
  error: "alert-danger",
};

export const Alert = forwardRef(function Alert(props, ref) {
  const {
    severity = "success",
    color,
    variant = "standard",
    icon,
    action,
    onClose,
    closeText = "Đóng",
    iconMapping,
    className,
    children,
    role = "alert",
    ...other
  } = props;
  const rest = omit(other, [
    "classes",
    "components",
    "componentsProps",
    "slots",
    "slotProps",
    "elevation",
    "square",
  ]);
  const kind = color || severity;
  const tone = ALERT_TONE[kind] || "primary";
  let iconNode = icon;
  if (icon === undefined) {
    iconNode = (iconMapping && iconMapping[severity]) || (
      <Feather icon={ALERT_ICON[severity] || "info"} size={20} />
    );
  }
  return (
    <Box
      ref={ref}
      role={role}
      className={cx(
        "alert dp-ui dp-alert",
        ALERT_BS[kind],
        `dp-tone-${tone}`,
        variant === "filled" && "dp-alert-filled",
        variant === "outlined" && "dp-alert-outlined",
        className
      )}
      {...rest}
    >
      {iconNode !== false && iconNode != null ? (
        <span className="dp-alert-icon">{iconNode}</span>
      ) : null}
      <div className="dp-alert-msg">{children}</div>
      {action ? <div className="dp-alert-action">{action}</div> : null}
      {!action && onClose ? (
        <button
          type="button"
          className="btn-close"
          aria-label={closeText}
          title={closeText}
          onClick={onClose}
        />
      ) : null}
    </Box>
  );
});

export const AlertTitle = forwardRef(function AlertTitle(props, ref) {
  const { className, ...rest } = props;
  return <Box ref={ref} className={cx("alert-heading dp-ui", className)} {...rest} />;
});

export const CircularProgress = forwardRef(function CircularProgress(props, ref) {
  const {
    size = 40,
    color = "primary",
    thickness,
    variant,
    value,
    className,
    style,
    ...other
  } = props;
  // dạng có phần trăm: giữ vòng tiến độ của MUI (Bootstrap không có mẫu tương đương)
  if (variant === "determinate") return <MuiCircularProgress ref={ref} {...props} />;
  const rest = omit(other, ["classes", "disableShrink"]);
  const tone = toneOf(color);
  const px = typeof size === "number" ? size : parseFloat(size) || 40;
  return (
    <Box
      ref={ref}
      component="span"
      role="progressbar"
      className={cx(
        "spinner-border dp-ui dp-spinner",
        tone !== "inherit" && `dp-tone-${tone}`,
        className
      )}
      style={{
        width: size,
        height: size,
        borderWidth: Math.max(2, Math.round(px / 9)),
        ...(tone === "inherit" ? { color: "inherit" } : null),
        ...style,
      }}
      {...rest}
    />
  );
});

export const LinearProgress = forwardRef(function LinearProgress(props, ref) {
  const {
    variant = "indeterminate",
    value = 0,
    valueBuffer,
    color = "primary",
    className,
    ...other
  } = props;
  const rest = omit(other, ["classes"]);
  const tone = toneOf(color);
  const fixed = variant === "determinate" || variant === "buffer";
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <Box
      ref={ref}
      role="progressbar"
      aria-valuenow={fixed ? Math.round(pct) : undefined}
      aria-valuemin={fixed ? 0 : undefined}
      aria-valuemax={fixed ? 100 : undefined}
      className={cx(
        "progress dp-ui dp-progress",
        tone !== "inherit" && `dp-tone-${tone}`,
        className
      )}
      {...rest}
    >
      <div
        className={cx("progress-bar MuiLinearProgress-bar", !fixed && "dp-progress-indet")}
        style={fixed ? { width: `${pct}%` } : undefined}
      />
    </Box>
  );
});

export const Skeleton = forwardRef(function Skeleton(props, ref) {
  const {
    variant = "text",
    width,
    height,
    animation,
    className,
    style,
    children,
    component,
    ...other
  } = props;
  const rest = omit(other, ["classes"]);
  return (
    <Box
      ref={ref}
      component={component || "span"}
      className={cx("placeholder dp-ui dp-skeleton", `dp-skeleton-${variant}`, className)}
      style={{
        width,
        height,
        ...(animation === false ? { animation: "none" } : null),
        ...(children && !width ? { maxWidth: "fit-content" } : null),
        ...style,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
});

export const Avatar = forwardRef(function Avatar(props, ref) {
  const {
    src,
    srcSet,
    alt,
    variant = "circular",
    imgProps,
    sizes,
    className,
    children,
    component,
    ...other
  } = props;
  const rest = omit(other, ["classes", "slotProps"]);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const showImg = Boolean(src || srcSet) && !failed;
  let content = children;
  if (showImg) {
    content = (
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt || ""}
        {...imgProps}
        onError={(event) => {
          setFailed(true);
          if (imgProps?.onError) imgProps.onError(event);
        }}
      />
    );
  } else if (content == null || content === false || content === "") {
    content = alt ? String(alt).trim().charAt(0).toUpperCase() : <Feather icon="user" size={20} />;
  }
  return (
    <Box
      ref={ref}
      component={component || "div"}
      className={cx(
        "avatar dp-ui dp-avatar",
        variant === "rounded" && "dp-avatar-rounded",
        variant === "square" && "dp-avatar-square",
        className
      )}
      {...rest}
    >
      {content}
    </Box>
  );
});
