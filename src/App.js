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

import { useEffect } from "react";

// react-router components
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";

// @mui material components
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

// PickleTour React components

// PickleTour React example components
import Sidenav from "examples/Sidenav";

// PickleTour React themes
import theme from "assets/theme";

// PickleTour React Dark Mode themes
import themeDark from "assets/theme-dark";

// RTL plugins
import { useSelector } from "react-redux";

// PickleTour React routes
import routes from "routes";
import RequireAuth from "components/RequireAuth";
import { useVerifyQuery } from "slices/authApiSlice";
// PickleTour React contexts
import { useMaterialUIController } from "context";
import { registerRoutes } from "dreamspos/routeMeta";

// Images

registerRoutes(routes);

function AdminSessionSync() {
  const userInfo = useSelector((state) => state.auth?.userInfo || null);
  const hasLocalSession = Boolean(userInfo?.token);

  useVerifyQuery(undefined, {
    skip: !hasLocalSession,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  return null;
}

export default function App() {
  const [controller] = useMaterialUIController();
  const { layout, darkMode } = controller;
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Setting page scroll to 0 when changing the route
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  useEffect(() => {
    const handleUnauthorized = () => {
      navigate("/authentication/sign-in", {
        replace: true,
        state: { from: { pathname } },
      });
    };

    window.addEventListener("app:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("app:unauthorized", handleUnauthorized);
  }, [navigate, pathname]);

  const getRoutes = (allRoutes) =>
    allRoutes.map((route) => {
      if (route.collapse) {
        return getRoutes(route.collapse);
      }

      if (route.route) {
        const element = route.private ? (
          <RequireAuth
            roles={route.roles}
            requireAdminAndSuperAdmin={route.requireAdminAndSuperAdmin}
            requireAdminAndSuperUser={route.requireAdminAndSuperUser}
          >
            {route.component}
          </RequireAuth>
        ) : (
          route.component
        );
        return <Route exact path={route.route} element={element} key={route.key} />;
      }

      return null;
    });

  // DreamsPOS: bản tối bật bằng thuộc tính data-theme trên <body>
  useEffect(() => {
    document.body.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const closeMobileSidebar = () => {
    document.querySelector(".main-wrapper")?.classList.remove("slide-nav");
    document.querySelector(".sidebar-overlay")?.classList.remove("opened");
    document.documentElement.classList.remove("menu-opened");
  };

  return (
    <ThemeProvider theme={darkMode ? themeDark : theme}>
      <CssBaseline />
      <AdminSessionSync />
      <div className="main-wrapper">
        {layout === "dashboard" && <Sidenav routes={routes} />}
        <Routes>
          {getRoutes(routes)}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
      <div className="sidebar-overlay" onClick={closeMobileSidebar} role="presentation" />
    </ThemeProvider>
  );
}
