import "../../sass/pages/login.scss";
import "../preload";

import { element } from "../base";

import * as authentication from "./components/authentication";
import * as sliderController from "./components/slider";

import { credentialsView, twoFactorView } from "../views/authView";

const init = () => {
  sliderController.init(element.slider, {
    type: "progressive",
    stages: ["Credentials", "Authentication"],
    number: 0,
  });

  credentialsView.addHandlerSubmit(authentication.login);
  twoFactorView.addHandlerSubmit(authentication.authenticate);
};
init();
