// plugins/fontawesome.js
import { library, config } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faGoogle, faFacebook } from "@fortawesome/free-brands-svg-icons";
import {
  faFileWord,
  faFileExcel,
  faFilePowerpoint,
  faFileText,
  faFile,
  faFilePdf,
  faFileImage,
  faFileVideo,
} from "@fortawesome/free-regular-svg-icons";

// 添加圖標到庫中
library.add(
  faGoogle,
  faFacebook,
  faFileWord,
  faFileExcel,
  faFilePowerpoint,
  faFileText,
  faFile,
  faFilePdf,
  faFileImage,
  faFileVideo
);

// 防止 Font Awesome 自動添加 CSS
config.autoAddCss = false;

// 導出 FontAwesomeIcon 組件
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component("font-awesome-icon", FontAwesomeIcon);
});
