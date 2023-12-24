import "../../sass/pages/signup.scss";
import "../preload";

import * as authentication from "./components/authentication";

import { credentialsView } from "../views/authView";

const init = () => {
  credentialsView.addHandlerSubmit(authentication.signup);
};
init();
