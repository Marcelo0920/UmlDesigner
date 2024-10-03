import axios from "axios";

const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common["sec"] = token;
  } else {
    delete axios.defaults.headers.common["sec"];
  }
};

export default setAuthToken;
