import "../../sass/pages/home.scss";
import "../preload";

import { element } from "../base";

import * as sliderController from "./components/slider";

window.addEventListener("load", () => {
  // sliderController.setSlide(0, 3);
});

const init = () => {
  sliderController.init(element.sliderHeader, {
    type: "normal",
    number: 0,
  });
};
init();
