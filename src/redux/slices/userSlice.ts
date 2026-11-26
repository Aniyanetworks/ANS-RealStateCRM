/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice } from "@reduxjs/toolkit";

export type IUserState = {
  user: any | null;
  accessToken: string | null;
  tradeSheetRepresentationData: any | null;
  tradeSheetRepresentationTypeData: any | null;
  tradeSheetData: any | null;
};

const initialState: IUserState = {
  user: localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")!)
    : null,
  accessToken: localStorage.getItem("accessToken") || null,
  tradeSheetRepresentationTypeData: localStorage.getItem("tradeSheetRepresentationTypeData")
  ? JSON.parse(localStorage.getItem("tradeSheetRepresentationTypeData")!)
  : null,
  tradeSheetRepresentationData: localStorage.getItem("tradeSheetRepresentationData")
    ? JSON.parse(localStorage.getItem("tradeSheetRepresentationData")!)
    : null,
    tradeSheetData: localStorage.getItem("tradeSheetData")
  ? JSON.parse(localStorage.getItem("tradeSheetData")!)
  : null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },

    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
      localStorage.setItem("accessToken", action.payload);
    },

    clearUser: (state) => {
      state.user = null;
      state.accessToken = null;
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.clear();
    },
    setTradeSheetRepresentationType: (state, action) => {
      state.tradeSheetRepresentationTypeData = action.payload;
      localStorage.setItem("tradeSheetRepresentationTypeData", JSON.stringify(action.payload));
    },
    setTradeSheetRepresentation: (state, action) => {
      state.tradeSheetRepresentationData = action.payload;
      localStorage.setItem("tradeSheetRepresentationData", JSON.stringify(action.payload));
    },
    setTradeSheetData: (state, action) => {
      state.tradeSheetData = action.payload;
      localStorage.setItem("tradeSheetData", JSON.stringify(action.payload));
    },
  },
});

export const { setUser, setAccessToken, clearUser, setTradeSheetRepresentation, setTradeSheetData,setTradeSheetRepresentationType } = userSlice.actions;

export default userSlice.reducer;
