/**
=========================================================
* PickleTour React - v2.2.0
=========================================================
*/

// Nút của Material Dashboard → nút DreamsPOS (giữ nguyên props cũ: color, variant, size, circular, iconOnly)
/* eslint-disable react/prop-types */
import { forwardRef } from "react";
import PropTypes from "prop-types";

import { Button } from "dreamspos/ui";

const MDButton = forwardRef(
  ({ color, variant, size, circular, iconOnly, children, sx, ...rest }, ref) => (
    <Button
      {...rest}
      ref={ref}
      color={color === "white" || color === "light" ? "inherit" : color}
      variant={variant === "gradient" ? "contained" : variant}
      size={size}
      sx={[
        circular && { borderRadius: "50px" },
        iconOnly && {
          minWidth: 0,
          width: size === "small" ? 30 : 38,
          height: size === "small" ? 30 : 38,
          p: 0,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Button>
  )
);

MDButton.defaultProps = {
  size: "medium",
  variant: "contained",
  color: "white",
  circular: false,
  iconOnly: false,
};

MDButton.propTypes = {
  size: PropTypes.oneOf(["small", "medium", "large"]),
  variant: PropTypes.oneOf(["text", "contained", "outlined", "gradient"]),
  color: PropTypes.oneOf([
    "white",
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "error",
    "light",
    "dark",
  ]),
  circular: PropTypes.bool,
  iconOnly: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

export default MDButton;
