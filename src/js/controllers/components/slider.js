import Slider from "../../views/sliderView";
import * as model from "../../models/sliderModel";

const handleLoad = (sliderNumber) => {
  const slider = model.state.sliders[sliderNumber];
  const page = 1;

  // Automatically set all slider pages to page one
  model.state.currentPages[slider.number] = page;

  // Render dots with correct # of slides
  slider.renderDots();

  // manage Buttons and dots
  slider.manageButtons(page, true);
  slider.manageDots(page, true);

  // Set dots
  slider.setDot(page);

  // Change slider in UI
  slider.setSlide(page);
};

export const handleLoop = (sliderNumber) => {
  const slider = model.state.sliders[sliderNumber];

  // Change slide page in model
  const page = model.nextSlide(slider.length, slider.type, slider.number);

  // manage Buttons and dots
  slider.manageButtons(page);
  slider.manageDots(page);

  // Change slider in UI
  slider.setSlide(page);

  // Update dots
  slider.setDot(page);
};

export const nextSlide = (sliderNumber) => {
  const slider = model.state.sliders[sliderNumber];

  // Change slide page in model
  const page = model.nextSlide(slider.length, slider.type, slider.number);

  // manage Buttons and dots
  slider.manageButtons(page);
  slider.manageDots(page);

  // Change slider in UI
  slider.setSlide(page);

  // Update dots
  slider.setDot(page);
};

export const backSlide = (sliderNumber) => {
  const slider = model.state.sliders[sliderNumber];

  // Change slide page in model
  const page = model.backSlide(slider.type, slider.number);

  // manage Buttons and dots
  slider.manageButtons(page);
  slider.manageDots(page);

  // Change slider in UI
  slider.setSlide(page);

  // Update dots
  slider.setDot(page);
};

export const setSlide = (sliderNumber, page) => {
  const slider = model.state.sliders[sliderNumber];

  // Change slide page in model
  model.state.currentPages[slider.number] = page;

  // manage Buttons and dots
  slider.manageButtons(page);
  slider.manageDots(page);

  // Change slider in UI
  slider.setSlide(page);

  // Update dots
  slider.setDot(page);
};

export const disableSlider = (sliderNumber) => {
  const slider = model.state.sliders[sliderNumber];

  slider.disable();
};

export const enableSlider = (sliderNumber) => {
  const slider = model.state.sliders[sliderNumber];

  slider.enable();
};

export const getSliders = () => {
  return model.state.sliders;
};

/** Make sure to add data fields to the slider */
export const init = (sliderElement, options = {}) => {
  if (!sliderElement) return;

  const sliderView = new Slider(sliderElement, options);
  model.state.sliders[options.number] = sliderView;

  sliderView.addHandlerDOMLoad(handleLoad);
  sliderView.addHandlerLoop(handleLoop);
  sliderView.addHandlerNext(nextSlide);
  sliderView.addHandlerBack(backSlide);
  sliderView.addHandlerDot(setSlide);
};
