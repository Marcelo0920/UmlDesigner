import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { logout } from "../actions/auth";

import "../styles/header.css";

const Header = ({ isAuthenticated, logout }) => {
  return (
    <header className="header">
      <nav>
        <ul>
          <li>
            <Link to="/">Inicio</Link>
          </li>
          {!isAuthenticated ? (
            <>
              <li>
                <Link to="/login">Iniciar Sesion</Link>
              </li>
              <li>
                <Link to="/register">Registrarse</Link>
              </li>
            </>
          ) : (
            <li>
              <button onClick={logout}>Logout</button>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

Header.propTypes = {
  isAuthenticated: PropTypes.bool,
  logout: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
});

export default connect(mapStateToProps, { logout })(Header);
