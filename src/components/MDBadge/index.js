/**
=========================================================
* PickleTour React - v2.2.0
=========================================================
*/

// Nhãn của Material Dashboard → nhãn trạng thái DreamsPOS (.badges)
import { forwardRef } from "react";
import PropTypes from "prop-types";

import { Chip } from "dreamspos/ui";

const MDBadge = forwardRef(
  (
    {
      color,
      variant,
      size,
      circular,
      indicator,
      border,
      container,
      children,
      badgeContent,
      ...rest
    },
    ref
  ) => (
    <Chip
      {...rest}
      ref={ref}
      label={badgeContent ?? children}
      color={color === "dark" || color === "light" ? "secondary" : color}
      size={size === "md" || size === "lg" ? "medium" : "small"}
      sx={circular ? { borderRadius: "50px" } : undefined}
    />
  )
);

MDBadge.defaultProps = {
  color: "info",
  variant: "gradient",
  size: "sm",
  circular: false,
  indicator: false,
  border: false,
  children: false,
  container: false,
  badgeContent: undefined,
};

MDBadge.propTypes = {
  color: PropTypes.oneOf([
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "error",
    "light",
    "dark",
  ]),
  variant: PropTypes.oneOf(["gradient", "contained"]),
  size: PropTypes.oneOf(["xs", "sm", "md", "lg"]),
  circular: PropTypes.bool,
  indicator: PropTypes.bool,
  border: PropTypes.bool,
  children: PropTypes.node,
  container: PropTypes.bool,
  badgeContent: PropTypes.node,
};

export default MDBadge;
