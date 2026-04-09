import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import App from "./App";
import ClientProofingPage from "./pages/ClientProofingPage";
import "./index.css";

const path = window.location.pathname;
const clientMatch = path.match(/^\/client\/([^/]+)\/?$/);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {clientMatch ? <ClientProofingPage slug={clientMatch[1]} /> : <App />}
    <Analytics />
  </React.StrictMode>,
);
