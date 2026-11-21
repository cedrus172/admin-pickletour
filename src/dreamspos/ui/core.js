// Tiện ích dùng chung của bộ thành phần DreamsPOS.
/* eslint-disable react/prop-types */
import { createContext } from "react";

export const cx = (...parts) => parts.filter(Boolean).join(" ");

// Tên màu của MUI → tông màu của DreamsPOS/Bootstrap. `info` của trang quản trị chính là màu cam chủ đạo.
const TONES = {
  primary: "primary",
  info: "primary",
  secondary: "secondary",
  success: "success",
  error: "danger",
  danger: "danger",
  warning: "warning",
  dark: "dark",
  light: "inherit",
  white: "inherit",
  inherit: "inherit",
  default: "default",
};
export const toneOf = (color, fallback = "primary") => TONES[color] || fallback;

// Bỏ các prop riêng của MUI để không rơi xuống thẻ DOM
export const omit = (obj, keys) => {
  const out = {};
  Object.keys(obj).forEach((k) => {
    if (!keys.includes(k)) out[k] = obj[k];
  });
  return out;
};

export const RIPPLE_PROPS = [
  "disableRipple",
  "disableFocusRipple",
  "disableTouchRipple",
  "disableElevation",
  "centerRipple",
  "focusRipple",
  "TouchRippleProps",
  "touchRippleRef",
  "focusVisibleClassName",
  "LinkComponent",
  "classes",
];

// `sx` có đặt màu nền riêng không (khi đó không gắn lớp màu cứng của theme)
export const hasCustomBg = (sx) =>
  Boolean(
    sx &&
      typeof sx === "object" &&
      !Array.isArray(sx) &&
      ("bgcolor" in sx || "background" in sx || "backgroundColor" in sx)
  );

export const setRef = (ref, value) => {
  if (typeof ref === "function") ref(value);
  // eslint-disable-next-line no-param-reassign
  else if (ref) ref.current = value;
};

// Ngữ cảnh của một ô nhập: FormControl truyền cỡ/trạng thái xuống InputLabel, Select, FormHelperText
export const FieldContext = createContext(null);
// Ngữ cảnh của bảng: cỡ ô, đang ở phần đầu bảng hay không
export const TableContext = createContext({ size: "medium", head: false });
// Ngữ cảnh của khối xếp gập
export const AccordionContext = createContext({
  expanded: false,
  toggle: () => {},
  disabled: false,
});
