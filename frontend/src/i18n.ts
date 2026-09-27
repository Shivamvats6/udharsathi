import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import hi from "./locales/hi.json";

const savedLang = (localStorage.getItem("finwise_lang") as "en" | "hi") || "en";

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hi: { translation: hi } },
  lng: savedLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export function setAppLanguage(lang: "en" | "hi") {
  localStorage.setItem("finwise_lang", lang);
  i18n.changeLanguage(lang);
}

export default i18n;
