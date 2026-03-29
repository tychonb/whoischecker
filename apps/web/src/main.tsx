import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { useEffect } from "react";

import { apiClient } from "./api/client";
import { queryClient } from "./lib/query-client";
import { router } from "./routes/router";
import { useAppShellStore } from "./store/app-shell-store";
import "./styles/globals.css";

function AppBootstrap() {
  const setSessionUser = useAppShellStore((state) => state.setSessionUser);
  const setCsrfToken = useAppShellStore((state) => state.setCsrfToken);
  const setSessionResolved = useAppShellStore((state) => state.setSessionResolved);

  useEffect(() => {
    let cancelled = false;

    void apiClient
      .getSession()
      .then((sessionUser) => {
        if (cancelled) {
          return;
        }

        setSessionUser(sessionUser);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setSessionUser(null);
        setCsrfToken(null);
      })
      .finally(() => {
        if (!cancelled) {
          setSessionResolved(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [setCsrfToken, setSessionResolved, setSessionUser]);

  return <RouterProvider router={router} />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppBootstrap />
    </QueryClientProvider>
  </React.StrictMode>,
);
