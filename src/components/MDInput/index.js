/**
=========================================================
* PickleTour React - v2.2.0
=========================================================
*/

// Ô nhập của Material Dashboard → ô nhập DreamsPOS
import { forwardRef } from "react";
import PropTypes from "prop-types";

import { TextField } from "dreamspos/ui";

const MDInput = forwardRef(({ error, success, disabled, ...rest }, ref) => (
  <TextField {...rest} ref={ref} error={error} disabled={disabled} />
));

MDInput.defaultProps = {
  error: false,
  success: false,
  disabled: false,
};

MDInput.propTypes = {
  error: PropTypes.bool,
  success: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default MDInput;
