/**
=========================================================
* PickleTour React - v2.2.0
=========================================================
*/

// Ảnh đại diện của Material Dashboard → ảnh đại diện DreamsPOS
/* eslint-disable react/prop-types */
import { forwardRef } from "react";
import PropTypes from "prop-types";

import { Avatar } from "dreamspos/ui";

const SIZES = { xs: 24, sm: 36, md: 48, lg: 58, xl: 74, xxl: 110 };

const MDAvatar = forwardRef(({ bgColor, size, shadow, sx, ...rest }, ref) => (
  <Avatar
    ref={ref}
    {...rest}
    sx={[
      { width: SIZES[size] || 48, height: SIZES[size] || 48 },
      bgColor && bgColor !== "transparent" && { bgcolor: `${bgColor}.main`, color: "#fff" },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  />
));

MDAvatar.defaultProps = {
  bgColor: "transparent",
  size: "md",
  shadow: "none",
};

MDAvatar.propTypes = {
  bgColor: PropTypes.oneOf([
    "transparent",
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "error",
    "light",
    "dark",
  ]),
  size: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl", "xxl"]),
  shadow: PropTypes.oneOf(["none", "xs", "sm", "md", "lg", "xl", "xxl", "inset"]),
};

export default MDAvatar;
