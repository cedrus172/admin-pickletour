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
import typography from "assets/theme-dark/base/typography";

// PickleTour React Helper Functions
import pxToRem from "assets/theme-dark/functions/pxToRem";

const { white, text, info, secondary, success, warning, error } = colors;
const { size } = typography;

const contained = {
  base: {
    backgroundColor: white.main,
    minHeight: pxToRem(37),
    color: text.main,
    padding: `${pxToRem(9)} ${pxToRem(24)}`,

    "&:hover": {
      backgroundColor: white.main,
    },

    "&:active, &:active:focus, &:active:hover": {
      opacity: 0.85,
    },

    "& .material-icon, .material-icons-round, svg": {
      fontSize: `${pxToRem(16)} !important`,
    },
  },

  small: {
    minHeight: pxToRem(29),
    padding: `${pxToRem(6)} ${pxToRem(18)}`,
    fontSize: size.xs,

    "& .material-icon, .material-icons-round, svg": {
      fontSize: `${pxToRem(12)} !important`,
    },
  },

  large: {
    minHeight: pxToRem(44),
    padding: `${pxToRem(12)} ${pxToRem(64)}`,
    fontSize: size.sm,

    "& .material-icon, .material-icons-round, svg": {
      fontSize: `${pxToRem(22)} !important`,
    },
  },

  primary: {
    backgroundColor: info.main,

    "&:hover": {
      backgroundColor: info.main,
    },

    "&:focus:not(:hover)": {
      backgroundColor: info.focus,
    },
  },

  secondary: {
    backgroundColor: secondary.main,

    "&:hover": {
      backgroundColor: secondary.main,
    },

    "&:focus:not(:hover)": {
      backgroundColor: secondary.focus,
    },
  },

  // Các màu MUI còn thiếu slot override -> tránh nút rơi về nền trắng.
  info: {
    backgroundColor: info.main,
    color: white.main,
    "&:hover": { backgroundColor: info.main },
    "&:focus:not(:hover)": { backgroundColor: info.focus },
  },

  success: {
    backgroundColor: success.main,
    color: white.main,
    "&:hover": { backgroundColor: success.main },
    "&:focus:not(:hover)": { backgroundColor: success.focus },
  },

  warning: {
    backgroundColor: warning.main,
    color: white.main,
    "&:hover": { backgroundColor: warning.main },
    "&:focus:not(:hover)": { backgroundColor: warning.focus },
  },

  error: {
    backgroundColor: error.main,
    color: white.main,
    "&:hover": { backgroundColor: error.main },
    "&:focus:not(:hover)": { backgroundColor: error.focus },
  },
};

export default contained;
