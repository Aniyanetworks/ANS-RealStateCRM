import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./router/routes";
import { Provider } from "react-redux";
import store from "./redux/store";
import AntdConfigProvider from "./providers/AntdConfigProvider";
import ErrorBoundary from "./components/ErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <AntdConfigProvider>
        <ErrorBoundary>
          <Suspense fallback={<div style={{ minHeight: "100vh", background: "#e9f3f1" }} />}>
            <RouterProvider router={router} />
          </Suspense>
        </ErrorBoundary>
      </AntdConfigProvider>
    </Provider>
  </StrictMode>
);
