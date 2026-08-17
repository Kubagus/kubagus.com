import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import id from "./locales/id.json";
import en from "./locales/en.json";

export const LANG_STORAGE_KEY = "kubagus-lang";

const stored = typeof window !== "undefined" ? localStorage.getItem(LANG_STORAGE_KEY) : null;

i18n.use(initReactI18next).init({
  resources: {
    id: { translation: id },
    en: { translation: en },
  },
  lng: stored === "en" ? "en" : "id",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
