import { element, elements, classes } from "../base";
import { getElement, getElements, combineClasses } from "../helper";

export default class View {
  _data;

  init() {
    const elements = ["_parentElement", "_contentElement", "_formElement"];

    elements.forEach((str) => {
      const el = this[str];

      if (el && `${el}`.startsWith(".")) {
        const exists = getElement(el);
        if (exists) this[str] = exists;
      } else if (el) {
        const exists = getElement(combineClasses(el.classList));
        if (exists) this[str] = exists;
      }
    });
  }

  // Main features
  render(data) {
    if (data) this._data = data;

    // 2. Get markup
    const markup = this._generateMarkup();

    // 3. Clear parent
    this.clear();

    // 4. Insert markup into HTML
    this._contentElement.insertAdjacentHTML("beforeend", markup);

    // Initialize after changes
    this.init();
  }

  clear() {
    if (!this._contentElement) return;
    this._contentElement.innerHTML = "";
  }

  // Buttons loaders/success
  renderButtonLoader(button) {
    button.classList.add(classes.btnLoading.slice(1));
    button.disabled = true;
  }

  removeButtonLoader(button) {
    button.classList.remove(classes.btnLoading.slice(1));
    button.disabled = false;
  }

  renderButtonSuccess(button) {
    button.classList.add(classes.btnSuccess.slice(1));
    button.disabled = true;
  }

  removeButtonSuccess(button) {
    button.classList.remove(classes.btnSuccess.slice(1));
    button.disabled = false;
  }

  // Notice
  getNoticeDOM() {
    const notices = Array.from(getElements(classes.notice));
    return notices.find((notice) => notice.closest(combineClasses(this._parentElement.classList)));
  }

  getNoticeChildDOM(noticeElement = this.getNoticeDOM()) {
    return noticeElement.children[0];
  }

  clearNotice(noticeElement = this.getNoticeDOM()) {
    noticeElement.innerHTML = "";
  }

  errorMarkup(message) {
    return `
      <div class="error">
        <i class="bi bi-exclamation-circle-fill"></i>
        <p class="paragraph">${message}</p>
      </div>
    `;
  }

  infoMarkup(message) {
    return `
      <div class="info">
        <i class="bi bi-info-circle-fill"></i>
        <p class="paragraph">${message}</p>
      </div>
    `;
  }

  loaderMarkup() {
    return `
      <div class="loader">
        <div class="loader__spinner"></div>
      </div>
    `;
  }

  renderError(message, noticeElement = this.getNoticeDOM()) {
    const markup = this.errorMarkup(message);

    // Get child that is already in it
    const notice = this.getNoticeChildDOM(noticeElement);

    // Do nothing if same message and same error class
    if (notice && notice.textContent.trim() === message && notice.classList[0] === "error") return;

    // Clear error container
    this.clearNotice(noticeElement);

    // Insert markup
    noticeElement.insertAdjacentHTML("beforeend", markup);
  }

  renderInfo(message, noticeElement = this.getNoticeDOM()) {
    const markup = this.infoMarkup(message);

    // Get child that is already in it
    const notice = this.getNoticeChildDOM(noticeElement);

    // Do nothing if same message and same error class
    if (notice && notice.textContent.trim() === message && notice.classList[0] === "info") return;

    // Clear info container
    this.clearNotice(noticeElement);

    // Insert markup
    noticeElement.insertAdjacentHTML("beforeend", markup);
  }

  renderLoader(noticeElement = this.getNoticeDOM()) {
    const markup = this.loaderMarkup();

    this.clearNotice();

    noticeElement.insertAdjacentHTML("beforeend", markup);
  }

  removeLoader(noticeElement = this.getNoticeDOM()) {
    this.clearNotice(noticeElement);
  }

  // Form
  isCorrectForm(target) {
    if (target && this._formElement && this._formElement.nodeType)
      return this._formElement.isSameNode(target);

    return false;
  }

  getFormData(formElement = this._formElement) {
    return Object.fromEntries(new FormData(formElement));
  }

  resetForm(formElement = this._formElement) {
    formElement.reset();
  }

  resetInputs(...ids) {
    ids.forEach((id) => {
      document.getElementById(id).value = "";
    });
  }
}
