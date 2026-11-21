import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import brandLogo from "assets/images/pickletour-logo.png";
import mailIcon from "assets/dreamspos/img/icons/mail.svg";
import loginImage from "assets/dreamspos/img/login-court.jpg";
import { useMaterialUIController, setLayout } from "context";
import { useDispatch } from "react-redux";
import { authApiSlice, useLoginMutation } from "slices/authApiSlice";
import { setCredentials } from "slices/authSlice";

export default function SignIn() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(false);
  const [login, { isLoading }] = useLoginMutation();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // Trang đăng nhập theo mẫu DreamsPOS: không có thanh bên/đầu trang, nền trắng toàn màn hình
  const [, dispatchCtrl] = useMaterialUIController();
  useEffect(() => {
    setLayout(dispatchCtrl, "page");
    document.body.classList.add("account-page");
    return () => document.body.classList.remove("account-page");
  }, [dispatchCtrl]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const { user, token } = await login(form).unwrap();
      const userInfo = { ...user, token };

      dispatch(setCredentials({ user, token }));
      dispatch(
        authApiSlice.util.upsertQueryData("verify", undefined, {
          user,
          token,
        })
      );

      if (remember) {
        localStorage.setItem("userInfo", JSON.stringify(userInfo));
      }

      const roles = new Set([
        ...(Array.isArray(user?.roles) ? user.roles : []),
        ...(user?.role ? [user.role] : []),
      ]);
      if (user?.isAdmin) roles.add("admin");

      const isAdmin = roles.has("admin");
      const isReferee = roles.has("referee");
      const redirectTo = isReferee && !isAdmin ? "/referee/matches" : from;

      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err?.data?.message || "Login failed");
    }
  };

  return (
    <div className="account-content">
      <div className="login-wrapper">
        <div className="login-content">
          <div className="login-userset">
            <form onSubmit={submit}>
              <div className="login-logo dp-login-logo">
                <img src={brandLogo} alt="PickleTour" />
                <span>PickleTour</span>
              </div>
              <div className="login-userheading">
                <h3>Đăng nhập quản trị</h3>
                <h4>Vui lòng đăng nhập bằng tài khoản quản trị của bạn</h4>
              </div>
              {error ? (
                <div className="alert alert-danger py-2" role="alert">
                  {error}
                </div>
              ) : null}
              <div className="form-login">
                <label htmlFor="dp-login-email">Email</label>
                <div className="form-addons">
                  <input
                    id="dp-login-email"
                    type="email"
                    placeholder="Nhập email"
                    autoComplete="username"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                  <img src={mailIcon} alt="" />
                </div>
              </div>
              <div className="form-login">
                <label htmlFor="dp-login-password">Mật khẩu</label>
                <div className="pass-group">
                  <input
                    id="dp-login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    className="dp-toggle-password"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? "Ẩn" : "Hiện"}
                  </button>
                </div>
              </div>
              <div className="form-login">
                <label className="dp-remember" htmlFor="dp-login-remember">
                  <input
                    id="dp-login-remember"
                    type="checkbox"
                    checked={remember}
                    onChange={() => setRemember((prev) => !prev)}
                  />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
              </div>
              <div className="form-login">
                <button className="btn btn-login" type="submit" disabled={isLoading}>
                  {isLoading ? "Đang đăng nhập…" : "Đăng nhập"}
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className="login-img">
          <img src={loginImage} alt="" />
        </div>
      </div>
    </div>
  );
}
