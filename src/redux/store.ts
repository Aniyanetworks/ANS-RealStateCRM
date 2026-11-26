import { configureStore, Middleware } from "@reduxjs/toolkit";
import { api } from "./api/apiSlice";
import userSlice from "./slices/userSlice";
import { appUrl } from "../utils/constant";

const errorMiddleware: Middleware = () => (next) => (action: any) => {
  if (action.type.endsWith("rejected")) {
    if (action?.payload?.data?.message?.includes("Unauthorized")) {
      localStorage.removeItem("accessToken");
      window.location.href = `${appUrl}/login`;
    }
  }
  return next(action);
};

const store = configureStore({
  reducer: {
    user: userSlice,
    [api.reducerPath]: api.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware, errorMiddleware),
  devTools: false,
});

export default store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
