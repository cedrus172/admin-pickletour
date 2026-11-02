/**
=========================================================
* PickleTour React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// PickleTour React Base Styles
import colors from "assets/theme-dark/base/colors";

const { info, dark, text, background } = colors;

// Quill (react-quill, theme "snow") mặc định thiết kế cho nền sáng: icon/chữ
// tối → gần như không đọc được trên nền navy. Chỉnh lại cho dark mode.
const QL_BORDER = "rgba(255, 255, 255, 0.14)";
const quillDark = {
  ".ql-toolbar.ql-snow": {
    background: "rgba(255, 255, 255, 0.04)",
    borderColor: `${QL_BORDER} !important`,
  },
  ".ql-container.ql-snow": {
    borderColor: QL_BORDER,
  },
  ".ql-snow .ql-stroke, .ql-snow .ql-stroke-miter": {
    stroke: `${text.main} !important`,
  },
  ".ql-snow .ql-fill, .ql-snow .ql-stroke.ql-fill": {
    fill: `${text.main} !important`,
  },
  ".ql-snow .ql-picker, .ql-snow .ql-picker-label": {
    color: `${text.main} !important`,
  },
  [[
    ".ql-snow.ql-toolbar button:hover .ql-stroke",
    ".ql-snow.ql-toolbar button.ql-active .ql-stroke",
    ".ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke",
    ".ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke",
  ].join(", ")]: {
    stroke: `${info.main} !important`,
  },
  [[
    ".ql-snow.ql-toolbar button:hover .ql-fill",
    ".ql-snow.ql-toolbar button.ql-active .ql-fill",
  ].join(", ")]: {
    fill: `${info.main} !important`,
  },
  [[
    ".ql-snow.ql-toolbar button:hover",
    ".ql-snow.ql-toolbar button.ql-active",
    ".ql-snow .ql-picker-label:hover",
    ".ql-snow .ql-picker-label.ql-active",
    ".ql-snow .ql-picker-item:hover",
    ".ql-snow .ql-picker-item.ql-selected",
  ].join(", ")]: {
    color: `${info.main} !important`,
  },
  ".ql-snow .ql-picker-options": {
    backgroundColor: `${background.card} !important`,
    borderColor: `${QL_BORDER} !important`,
  },
  ".ql-editor": {
    color: "#ffffffde",
  },
  ".ql-editor p, .ql-editor li, .ql-editor h1, .ql-editor h2, .ql-editor h3, .ql-editor blockquote": {
    color: "inherit",
  },
  ".ql-editor.ql-blank::before": {
    color: "rgba(255, 255, 255, 0.45) !important",
  },
  ".ql-snow .ql-editor a": {
    color: info.main,
  },
  ".ql-snow .ql-editor pre.ql-syntax, .ql-snow .ql-editor code": {
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    color: "#e6edf3",
  },
  ".ql-snow .ql-tooltip": {
    backgroundColor: background.card,
    borderColor: QL_BORDER,
    color: text.main,
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.45)",
  },
  ".ql-snow .ql-tooltip input[type=text]": {
    backgroundColor: background.default,
    borderColor: QL_BORDER,
    color: "#ffffff",
  },
};

const globals = {
  ...quillDark,
  html: {
    scrollBehavior: "smooth",
  },
  "*, *::before, *::after": {
    margin: 0,
    padding: 0,
  },
  "a, a:link, a:visited": {
    textDecoration: "none !important",
  },
  "a.link, .link, a.link:link, .link:link, a.link:visited, .link:visited": {
    color: `${dark.main} !important`,
    transition: "color 150ms ease-in !important",
  },
  "a.link:hover, .link:hover, a.link:focus, .link:focus": {
    color: `${info.main} !important`,
  },
};

export default globals;
