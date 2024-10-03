import axios from "axios";
import {
  USER_LOADED,
  LOGIN_FAILED,
  LOGIN_SUCCESS,
  LOG_OUT,
  AUTH_ERROR,
  LOGIN_START,
  DEFAULT_SESSION,
} from "./type";

import setAuthToken from "../utils/setAuthToken";
import Cookies from "js-cookie";

//LOAD USER
export const loadUser = () => async (dispatch) => {
  const token = Cookies.get("sec");

  const config = {
    headers: {
      "Content-Type": "application/json",
      sec: Cookies.get("sec"),
    },
  };

  if (token) {
    setAuthToken(token);

    try {
      console.log("trying this");
      const res = await axios.get(
        "http://localhost:5000/user/loaduser",
        config
      );

      console.log(res.data);

      dispatch({
        type: USER_LOADED,
        payload: res.data,
      });
    } catch (error) {
      dispatch({
        type: AUTH_ERROR,
      });
    }
  }
};

//LOGIN
export const login = (email, password) => async (dispatch) => {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  console.log(email);

  const body = JSON.stringify({ email, password });

  console.log(body);

  dispatch({
    type: LOGIN_START,
  });

  try {
    const res = await axios.post(
      "http://localhost:5000/user/login",
      body,
      config
    );

    console.log(res.data.token);

    dispatch({
      type: LOGIN_SUCCESS,
      payload: res.data,
    });

    dispatch(loadUser());
  } catch (error) {
    dispatch({
      type: LOGIN_FAILED,
    });
  }
};

//create user

export const register = (formData) => async (dispatch) => {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const body = JSON.stringify(formData);

  dispatch({
    type: LOGIN_START,
  });

  console.log(body);

  try {
    const res = await axios.post(
      "http://localhost:5000/user/register",
      body,
      config
    );

    console.log(res.data.token);

    dispatch({
      type: LOGIN_SUCCESS,
      payload: res.data,
    });
  } catch (error) {
    console.log(error.response.data.error);

    dispatch({
      type: LOGIN_FAILED,
    });
  }
};

export const setDefaultSession = () => (dispatch) => {
  dispatch({ type: DEFAULT_SESSION });
};

//LOGOUT
export const logout = () => (dispatch) => {
  dispatch({ type: LOG_OUT });
  window.location.reload();
};
