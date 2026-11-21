/**
=========================================================
* PickleTour  React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useMemo } from "react";

// porp-types is a library for typechecking of props
import PropTypes from "prop-types";

// react-chartjs-2 components
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// @mui material components
import Icon from "@mui/material/Icon";

// PickleTour React components

// ReportsLineChart configurations
import configs from "examples/Charts/LineCharts/ReportsLineChart/configs";
import { DP_TONES } from "examples/Cards/StatisticsCards/ComplexStatisticsCard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function ReportsLineChart({ color, title, description, date, chart }) {
  const tone = DP_TONES[color] || DP_TONES.primary;
  const { data, options } = configs(chart.labels || [], chart.datasets || {}, tone);

  return (
    <div className="card h-100 mb-0 dp-chart-card">
      <div className="card-header">
        <h5 className="card-title">{title}</h5>
        {description ? <div className="dp-chart-desc">{description}</div> : null}
      </div>
      <div className="card-body">
        {useMemo(
          () => (
            <div style={{ height: "12.5rem" }}>
              <Line data={data} options={options} redraw />
            </div>
          ),
          [color, chart]
        )}
        <div className="dp-chart-date">
          <Icon fontSize="small">schedule</Icon>
          <span>{date}</span>
        </div>
      </div>
    </div>
  );
}

ReportsLineChart.defaultProps = {
  color: "info",
  description: "",
};

// Typechecking props for the ReportsLineChart
ReportsLineChart.propTypes = {
  color: PropTypes.oneOf(["primary", "secondary", "info", "success", "warning", "error", "dark"]),
  title: PropTypes.string.isRequired,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  date: PropTypes.string.isRequired,
  chart: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.array, PropTypes.object])).isRequired,
};

export default ReportsLineChart;
