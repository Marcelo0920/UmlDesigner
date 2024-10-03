import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { login, setDefaultSession } from "../actions/auth";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = ({
  login,
  isAuthenticated,
  loading,
  loginSuccess,
  error,
  setDefaultSession,
}) => {
  const [formData, setFormData] = useState({
    correo: "",
    password: "",
  });

  const { correo, password } = formData;
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
    if (loginSuccess) {
      setDefaultSession();
    }
  }, [isAuthenticated, loginSuccess, navigate, setDefaultSession]);

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    console.log(correo);
    login(correo, password);
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="correo">Email:</label>
          <input
            type="email"
            id="correo"
            name="correo"
            value={correo}
            onChange={onChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={onChange}
            required
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

Login.propTypes = {
  login: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool,
  loading: PropTypes.bool,
  loginSuccess: PropTypes.bool,
  error: PropTypes.string,
  setDefaultSession: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
  loading: state.auth.loading,
  loginSuccess: state.auth.loginSuccess,
  error: state.auth.error,
});

export default connect(mapStateToProps, { login, setDefaultSession })(Login);
