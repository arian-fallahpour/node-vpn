import "core-js/stable";
import "regenerator-runtime/runtime";
import "dragscroll";

import { classes } from "./base";

import "./controllers/components/authentication";
import "./controllers/components/modal";

import preloadView from "./views/preloadView";

const init = () => {
  preloadView.preventPreloadTransitions();
  preloadView.removeFocusAfterClick();
  preloadView.addbuttonRipple();
  preloadView.skewParagraph();
};
init();
