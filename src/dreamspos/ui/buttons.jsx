// Nút bấm theo mẫu DreamsPOS (.btn của Bootstrap + bảng màu theme). Giữ nguyên props của MUI
// (variant, color, size, startIcon, endIcon, fullWidth, component, href…) để các trang không phải sửa.
/* eslint-disable react/prop-types, react/jsx-props-no-spreading */
import { Children, cloneElement, forwardRef, isValidElement } from "react";
import Box from "@mui/material/Box";

import { cx, toneOf, omit, RIPPLE_PROPS, hasCustomBg } from "./core";

const BS_VARIANT = { contained: "btn-", outlined: "btn-outline-" };

export const Button = forwardRef(function Button(props, ref) {
  const {
    variant = "text",
    color = "primary",
    size = "medium",
    startIcon,
    endIcon,
    fullWidth,
    disabled,
    component,
    href,
    className,
    children,
    type,
    sx,
    ...other
  } = props;
  const rest = omit(other, RIPPLE_PROPS);
  const Comp = component || (href ? "a" : "button");
  const native = Comp === "button";
  const tone = toneOf(color);
  const look = variant === "gradient" ? "contained" : variant;
  // lớp màu gốc của Bootstrap/theme (btn-primary, btn-outline-danger…) — bỏ khi trang tự đặt màu nền
  const neutral = tone === "inherit" || tone === "default";
  const bsClass =
    BS_VARIANT[look] && !neutral && !hasCustomBg(sx) ? `${BS_VARIANT[look]}${tone}` : null;
  return (
    <Box
      ref={ref}
      component={Comp}
      className={cx(
        "btn dp-ui dp-btn",
        `dp-btn-${look}`,
        `dp-tone-${tone}`,
        bsClass,
        size === "small" && "btn-sm",
        size === "large" && "btn-lg",
        fullWidth && "w-100",
        disabled && !native && "disabled",
        className
      )}
      href={href}
      type={native ? type || "button" : type}
      disabled={native ? disabled : undefined}
      aria-disabled={!native && disabled ? true : undefined}
      tabIndex={!native && disabled ? -1 : undefined}
      sx={sx}
      {...rest}
    >
      {startIcon ? <span className="dp-btn-icon">{startIcon}</span> : null}
      {children}
      {endIcon ? <span className="dp-btn-icon">{endIcon}</span> : null}
    </Box>
  );
});

export const Fab = forwardRef(function Fab(props, ref) {
  const { variant, color = "default", className, ...rest } = props;
  return (
    <Button
      ref={ref}
      variant="contained"
      color={color === "default" ? "inherit" : color}
      className={cx("dp-fab", variant === "extended" && "dp-fab-extended", className)}
      {...rest}
    />
  );
});

export const IconButton = forwardRef(function IconButton(props, ref) {
  const {
    color = "default",
    size = "medium",
    edge,
    disabled,
    component,
    href,
    className,
    children,
    type,
    ...other
  } = props;
  const rest = omit(other, RIPPLE_PROPS);
  const Comp = component || (href ? "a" : "button");
  const native = Comp === "button";
  const tone = toneOf(color, "default");
  return (
    <Box
      ref={ref}
      component={Comp}
      className={cx(
        "dp-ui dp-iconbtn",
        tone !== "default" && tone !== "inherit" && `dp-tone-${tone}`,
        size === "small" && "dp-iconbtn-sm",
        size === "large" && "dp-iconbtn-lg",
        edge && `dp-edge-${edge}`,
        disabled && !native && "disabled",
        className
      )}
      style={tone === "inherit" ? { color: "inherit" } : undefined}
      href={href}
      type={native ? type || "button" : type}
      disabled={native ? disabled : undefined}
      aria-disabled={!native && disabled ? true : undefined}
      {...rest}
    >
      {children}
    </Box>
  );
});

export const ToggleButton = forwardRef(function ToggleButton(props, ref) {
  const {
    value,
    selected,
    onChange,
    onClick,
    size,
    color = "primary",
    fullWidth,
    disabled,
    className,
    children,
    ...other
  } = props;
  const rest = omit(other, RIPPLE_PROPS);
  return (
    <Box
      ref={ref}
      component="button"
      type="button"
      className={cx(
        "btn dp-ui dp-toggle",
        `dp-tone-${toneOf(color === "standard" ? "primary" : color)}`,
        size === "small" && "btn-sm",
        selected && "active Mui-selected",
        fullWidth && "w-100",
        className
      )}
      aria-pressed={Boolean(selected)}
      disabled={disabled}
      onClick={(event) => {
        if (onClick) {
          onClick(event, value);
          if (event.defaultPrevented) return;
        }
        if (onChange) onChange(event, value);
      }}
      {...rest}
    >
      {children}
    </Box>
  );
});

const isSelected = (v, candidate) => {
  if (candidate === undefined || v === undefined) return false;
  return Array.isArray(candidate) ? candidate.indexOf(v) >= 0 : v === candidate;
};

export const ToggleButtonGroup = forwardRef(function ToggleButtonGroup(props, ref) {
  const {
    value,
    onChange,
    exclusive,
    size,
    color,
    fullWidth,
    disabled,
    orientation,
    className,
    children,
    ...rest
  } = props;
  const handleChange = (event, buttonValue) => {
    if (!onChange) return;
    if (exclusive) {
      onChange(event, value === buttonValue ? null : buttonValue);
      return;
    }
    const idx = value ? value.indexOf(buttonValue) : -1;
    let next;
    if (value && idx >= 0) {
      next = value.slice();
      next.splice(idx, 1);
    } else next = value ? value.concat(buttonValue) : [buttonValue];
    onChange(event, next);
  };
  return (
    <Box
      ref={ref}
      role="group"
      className={cx(
        "btn-group dp-ui dp-toggle-group",
        orientation === "vertical" && "btn-group-vertical",
        fullWidth && "dp-full",
        className
      )}
      {...rest}
    >
      {Children.map(children, (child) => {
        if (!isValidElement(child)) return null;
        return cloneElement(child, {
          onChange: handleChange,
          selected:
            child.props.selected === undefined
              ? isSelected(child.props.value, value)
              : child.props.selected,
          size: child.props.size || size,
          color: child.props.color || color,
          disabled: child.props.disabled || disabled,
        });
      })}
    </Box>
  );
});
