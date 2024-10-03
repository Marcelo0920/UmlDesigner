import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { useEffect } from "react";
import UmlDesigner from "./components/UmlDesigner.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

import Cookies from "js-cookie";
import { loadUser } from "./actions/auth.js";
import setAuthToken from "./utils/setAuthToken.js";
import store from "./store.js";

if (Cookies.get("sec")) {
  setAuthToken(Cookies.get("sec"));
}

function App() {
  useEffect(() => {
    store.dispatch(loadUser());
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/designer/:id" element={<UmlDesigner />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
