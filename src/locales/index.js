import ko from './ko';
import en from './en';
import zhHK from './zh-HK';

export const locales = {
  ko: { name: "한국어", data: ko },
  en: { name: "English", data: en },
  "zh-HK": { name: "繁體中文", data: zhHK }
};

export const defaultLang = "ko";
