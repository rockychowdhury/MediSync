import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "./index";

/** Typed useDispatch hook */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/** Typed useSelector hook */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
