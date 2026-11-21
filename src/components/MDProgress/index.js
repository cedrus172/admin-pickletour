/**
=========================================================
* PickleTour React - v2.2.0
=========================================================
*/

// Thanh tiến độ của Material Dashboard → .progress của DreamsPOS
import { forwardRef } from "react";
import PropTypes from "prop-types";

import MDTypography from "components/MDTypography";
import { LinearProgress } from "dreamspos/ui";

const MDProgress = forwardRef(({ variant, color, value, label, ...rest }, ref) => (
  <>
    {label && (
      <MDTypography variant="button" fontWeight="medium" color="text">
        {value}%
      </MDTypography>
    )}
    <LinearProgress
      {...rest}
      ref={ref}
      variant="determinate"
      value={value}
      color={color === "dark" || color === "light" ? "secondary" : color}
      sx={{ height: 6 }}
    />
  </>
));

MDProgress.defaultProps = {
  variant: "contained",
  color: "info",
  value: 0,
  label: false,
};

MDProgress.propTypes = {
  variant: PropTypes.oneOf(["contained", "gradient"]),
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
  value: PropTypes.number,
  label: PropTypes.bool,
};

export default MDProgress;
