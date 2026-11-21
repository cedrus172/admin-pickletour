// Thẻ thống kê theo mẫu "dash-widget" của DreamsPOS (ô biểu tượng tròn + số + nhãn).
// Giữ nguyên props của bản Material Dashboard cũ nên các trang đang dùng không phải sửa.
import PropTypes from "prop-types";
import Icon from "@mui/material/Icon";

export const DP_TONES = {
  primary: "#FF9F43",
  info: "#FF9F43",
  secondary: "#637381",
  success: "#28C76F",
  warning: "#FFB400",
  error: "#EA5455",
  dark: "#1B2850",
  light: "#637381",
  white: "#637381",
};

function ComplexStatisticsCard({ color, title, count, percentage, icon }) {
  const tone = DP_TONES[color] || DP_TONES.primary;
  const pctTone = DP_TONES[percentage?.color] || DP_TONES.success;
  return (
    <div className="dash-widget dp-stat w-100" style={{ marginBottom: 0 }}>
      <div className="dash-widgetimg">
        <span style={{ background: `${tone}1F`, color: tone }}>
          <Icon fontSize="medium" color="inherit">
            {icon}
          </Icon>
        </span>
      </div>
      <div className="dash-widgetcontent">
        <h5>{count}</h5>
        <h6>{title}</h6>
        {percentage?.amount || percentage?.label ? (
          <p className="dp-stat-note">
            <strong style={{ color: pctTone }}>{percentage.amount}</strong> {percentage.label}
          </p>
        ) : null}
      </div>
    </div>
  );
}

ComplexStatisticsCard.defaultProps = {
  color: "info",
  percentage: {
    color: "success",
    text: "",
    label: "",
  },
};

ComplexStatisticsCard.propTypes = {
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
  title: PropTypes.string.isRequired,
  count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  percentage: PropTypes.shape({
    color: PropTypes.oneOf([
      "primary",
      "secondary",
      "info",
      "success",
      "warning",
      "error",
      "dark",
      "white",
    ]),
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string,
  }),
  icon: PropTypes.node.isRequired,
};

export default ComplexStatisticsCard;
