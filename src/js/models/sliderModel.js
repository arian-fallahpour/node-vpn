export const state = {
  currentPages: [],
  sliders: [],
};

export const nextSlide = (sliderLength, sliderType, sliderNumber) => {
  // Reached limit
  if (state.currentPages[sliderNumber] + 1 > sliderLength) {
    // Loop
    if (sliderType === "loop") {
      state.currentPages[sliderNumber] = 1;
      return state.currentPages[sliderNumber];
    }

    // Normal
    return state.currentPages[sliderNumber];
  }

  // Not reached limit
  state.currentPages[sliderNumber] += 1;
  return state.currentPages[sliderNumber];
};

export const backSlide = (sliderType, sliderNumber) => {
  // Reached limit
  if (state.currentPages[sliderNumber] - 1 < 1) {
    // Loop
    if (sliderType === "loop") {
      state.currentPages[sliderNumber] = 3;
      return state.currentPages[sliderNumber];
    }

    // Normal
    return state.currentPages[sliderNumber];
  }

  // Not reached limit
  state.currentPages[sliderNumber] -= 1;
  return state.currentPages[sliderNumber];
};
