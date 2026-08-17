import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// 🔥 THIS IS IMPORTANT
import "./index.css"; // or "./App.css" if that is your main file
import "./App.css";
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
