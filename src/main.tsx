import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { useAppStore } from "./stores/app-store";

if (typeof window !== "undefined") {
  (window as any).useAppStore = useAppStore;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
