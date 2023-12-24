import "../../sass/pages/forgotPassword.scss";
import "../preload";

import { element } from "../base";

import * as authentication from "./components/authentication";
import * as sliderController from "./components/slider";

import { credentialsView } from "../views/authView";

const init = () => {
  sliderController.init(element.slider, {
    type: "progressive",
    stages: ["Email", "Success"],
    number: 0,
  });

  credentialsView.addHandlerSubmit(authentication.forgotPassword);
};
init();
