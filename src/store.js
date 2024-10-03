import { configureStore } from "@reduxjs/toolkit";
import thunk from "redux-thunk";
import rootReducer from "./reducers";

//configuracion del estado inicial
const initialState = {};

//middleware que se aplicara al store
const middleware = [thunk];

//crear el store con rootReducer, estado inicial y middleware
const store = configureStore({
  reducer: rootReducer,
  preloadedState: initialState,
  middleware: middleware,
  devTools: process.env.NODE_ENV !== "production",
});

export default store;
