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

config.autoAddCss = false;

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component("font-awesome-icon", FontAwesomeIcon);
});
