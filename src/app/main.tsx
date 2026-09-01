import React from "react";
import ReactDOM from "react-dom/client";
import { AppProviders } from "./providers";
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppProviders />
  </React.StrictMode>,
);
