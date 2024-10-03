import {
  USER_LOADED,
  AUTH_ERROR,
  LOGIN_FAILED,
  LOGIN_SUCCESS,
  LOG_OUT,
  LOGIN_START,
  DEFAULT_SESSION,
} from "../actions/type";

import Cookies from "js-cookie";

const initialState = {
  token: Cookies.get("token"),
  isAuthenticated: null,
  loading: false,
  loginSuccess: false,
  user: null,
  error: null,
};

export default function (state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case USER_LOADED:
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: payload,
        error: null,
      };

    case LOGIN_START:
      console.log(state.loading);
      return {
        ...state,
        loading: true,
        error: null,
      };

    case LOGIN_SUCCESS:
      Cookies.set("sec", payload.token, { expires: 7 });
      return {
        ...state,
        payload,
        isAuthenticated: true,
        loginSuccess: true,
        loading: false,
        error: null,
      };

    case LOGIN_FAILED:
      Cookies.remove("sec");
      return {
        ...state,
        payload,
        isAuthenticated: false,
        loading: false,
        error: "Bad Login",
      };

    case DEFAULT_SESSION:
      return {
        ...state,
        loginSuccess: false,
      };

    case AUTH_ERROR:
    case LOG_OUT:
      Cookies.remove("sec");
      return {
        ...state,
        token: null,
        user: null,
        isAuthenticated: false,
        loading: false,
      };

    default:
      return state;
  }
}
