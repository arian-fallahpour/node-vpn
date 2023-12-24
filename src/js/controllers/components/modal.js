import { modalView } from "../../views/modals/modal";

const exit = () => {};

const init = () => {
  modalView.addHandlerExit(exit);
};
init();
