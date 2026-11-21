// Vùng nội dung theo khung DreamsPOS: .page-wrapper > .content
// (đầu trang + thanh bên nằm ngoài, xem App.js và examples/Navbars/DashboardNavbar).
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import PropTypes from "prop-types";

import { useMaterialUIController, setLayout } from "context";

function DashboardLayout({ children }) {
  const [, dispatch] = useMaterialUIController();
  const { pathname } = useLocation();

  useEffect(() => {
    setLayout(dispatch, "dashboard");
  }, [pathname]);

  return (
    <div className="page-wrapper">
      <div className="content" data-dashboard-content="true">
        {children}
      </div>
    </div>
  );
}

DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default DashboardLayout;
