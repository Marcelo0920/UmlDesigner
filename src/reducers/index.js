import { combineReducers } from "@reduxjs/toolkit";

import project from "./project";
import auth from "./auth";
import mailer from "./mailer";

export default combineReducers({
  project,
  auth,
  mailer,
});
