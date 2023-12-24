import { element, elements, classes, ids } from "../base";
import View from "./view";
import { getElement, combineClasses, parseCardExpiry } from "../helper";

export class OrderView extends View {
  _parentElement = document.querySelector(`${classes.slide}--1`);
  _contentElement = element.plans;

  addHandlerDOMLoad(handler) {
    window.addEventListener("DOMContentLoaded", handler);
  }

  addHandlerRemoveProduct(handler) {
    this._contentElement.addEventListener("click", (e) => {
      const btn = e.target.closest(classes.checkoutCardRemove);
      if (!btn) return;

      const card = e.target.closest(classes.checkoutCard);
      handler(card.dataset.type, card.dataset.id);
    });
  }

  addHandlerOptionsNext(handler) {
    element.orderOptionsBtn.addEventListener("click", (e) => handler(0));
  }

  addHandlerPaymentNext(handler) {
    element.orderPaymentBtn.addEventListener("click", (e) => {
      const btn = e.target.closest(classes.orderPaymentBtn);
      if (!btn) return;

      handler(btn);
    });
  }

  _durationStamp(product) {
    return `${new Intl.DateTimeFormat("en-US").format(
      new Date(Date.now())
    )} - ${new Intl.DateTimeFormat("en-US").format(
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * product.durationMonths)
    )}`;
  }

  _generateMarkup() {
    const plan = this._data.plan;
    const product = plan ? plan.product : undefined;
    if (!product) return "";

    return `
      <div class="checkoutCard" data-id="${product._id}" data-type="${product.type}">
        <div class="checkoutCard__image"><img src="/img/app/${product.photo}"/></div>
        <div class="checkoutCard__content">
          <div class="checkoutCard__main">
            <h5 class="header-5 checkoutCard__name">one month plan</h5>
            <div class="checkoutCard__duration">
              <div class="bt bi-stopwatch"></div>
              ${product.durationMonths} month${product.durationMonths > 1 ? "s" : ""}
            </div>
          </div>
          ${
            product.type === "item"
              ? `
            <div class="checkoutCard__quantity">
              <div class="inputQuantity">
                <button class="btn btn__glass"><i class="bi bi-caret-left-fill"></i></button>
                <input type="number" min="1" max="10" id="quantity" value="1" />
                <button class="btn btn__glass"><i class="bi bi-caret-right-fill"></i></button>
              </div>
            </div>
          `
              : ""
          }
          <div class="checkoutCard__price">
            <div class="checkoutCard__price--cost">$${product.price}</div>
            <div class="checkoutCard__price--time">monthly</div>
          </div>
          <button class="btn btn__glass checkoutCard__remove">
            <svg class="bi" width="1em" height="1em" fill="currentColor">
              <use xlink:href="/img/bootstrap-icons.svg#trash3"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }
}

export class OrderCostView extends View {
  _parentElement = element.orderCost;
  _contentElement = element.orderCostContent;

  _priceMarkup(product) {
    return `
      <div class="price">
        <h6 class="header-6">${product.name}</h6>
        <div class="price__cost">
          <span class="price__cost--money">$${product.price}</span>
          <span class="price__cost--duration">${product.durationMonths} mon</span>
        </div>
        <div class="price__total">$${product.price * product.durationMonths}</div>
      </div>
    `;
  }

  _generateMarkup() {
    const plan = this._data.plan;
    const product = Object.keys(plan).length > 0 ? plan.product : {};

    return `
      <div class="prices">
        ${Object.keys(product).length > 0 ? this._priceMarkup(product) : ""}
      </div>
      <div class="total">
        <span class="total--total">total</span>
        <span class="total--cost">
          ${product.price ? `$${product.price * product.durationMonths}` : "--.--"}
        </span>
      </div>
    `;
  }
}

export class OrderOptionsView extends View {
  _parentElement = getElement(`${classes.slide}--2`);
  _contentElement = element.orderOptions;

  _paymentMethodMarkup() {
    return `
      <form class="paymentMethod">
        <h5 class="header-5">payment method</h5>
        <div class="inputRadio">
          <input type="radio" name="paymentMethod" id="creditDebit" value="card" checked="checked" />
          <label for="creditDebit"><span></span>Credit/Debit</label>
        </div>
        <div class="inputRadio">
          <input type="radio" name="paymentMethod" id="existingCard" value="existingCard" />
          <label for="existingCard"><span></span>Existing card</label>
        </div>
        <div class="inputRadio">
          <input type="radio" name="paymentMethod" id="apple" value="apple" />
          <label for="apple"><span></span>apple pay</label>
        </div>
      </form>
    `;
  }

  _paymentOptionsMarkup(options) {
    return `
      <form class="paymentOptions">
        <h5 class="header-5">payment options</h5>
        <div class="paymentOption"><label for="option-recurring">
            <h6 class="header-6">Recurring payments</h6>
          </label>
          <div class="inputSwitch">
            <input 
              type="checkbox" 
              id="option-recurring" 
              name="recurring" 
              title="Toggle dark mode" 
              ${options.recurring ? "checked" : ""}
            />
            <label for="option-recurring"></label>
          </div>
          <p class="paragraph">Your card will be saved, and it will be charged after every billing cycle. You can remove your card or turn this option off in the settings.</p>
        </div>
      </form>
    `;
  }

  _generateMarkup() {
    const plan = this._data.plan;
    const options = plan.options;

    const markup = [this._paymentMethodMarkup(), this._paymentOptionsMarkup(options)];
    return markup.join("");
  }

  getPaymentMethod() {
    return this.getFormData(getElement(classes.paymentMethod)).paymentMethod;
  }

  getPaymentOptions() {
    return this.getFormData(getElement(classes.paymentOptions));
  }
}

// FORM VIEWS
export class CardFormView extends View {
  _parentElement = document.querySelector(`${classes.slide}--3`);
  _contentElement = element.paymentForms;
  _formElement = classes.newCard;

  numberElement;
  expiryElement;
  cvcElement;

  addHandlerSubmit(handler) {
    this._contentElement.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!this.isCorrectForm(e.target)) return;

      const formData = this.getFormData(e.target);
      const btn = getElement(classes.paymentFormSubmit);

      formData.number = this.numberElement;
      formData.expiry = this.expiryElement;
      formData.cvc = this.cvcElement;

      handler(formData, btn);
    });
  }

  _generateMarkup() {
    const product = this._data.plan.product;

    let price;

    if (product.type === "plan") price = product.price * product.durationMonths;
    else price = price * product.price;

    return `
      <form class="paymentForm newCard">
        <div class="paymentForm__header">
          <p class="paragraph u-center-text">Enter your card's details below</p>
          <div class="notice"></div>
        </div>
        <div class="newCard__inputs">
          <div class="inputField" id="card-name">
            <input type="text" name="name" placeholder="Name" title="Type your card name" />
            <label for="name">cardholder</label>
          </div>
          <div class="inputField" id="card-postalCode">
            <input type="text" name="postalCode" placeholder="M5T 1T4" title="Type your postal code" />
            <label for="postalCode">postal code</label>
          </div>
          <div class="inputField" id="card-number" data-label="card number"></div>
          <div class="inputField" id="card-expiry" data-label="expiry"></div>
          <div class="inputField" id="card-cvc" data-label="cvc"></div>
        </div>
        <button class="btn btn__primary paymentForm__submit" title="Pay $${price}">
          <span>pay $${price}</span>
          <i class="bi bi-credit-card-2-front-fill"></i>
          <i class="bi bi-check-lg success-icon"></i>
        </button>
      </form>
      <div class="supportedCards">
        <div class="supportedCards__card"><img src="/img/app/cards/amex.svg" /></div>
        <div class="supportedCards__card"><img src="/img/app/cards/diners.svg" /></div>
        <div class="supportedCards__card"><img src="/img/app/cards/discover.svg" /></div>
        <div class="supportedCards__card"><img src="/img/app/cards/jcb.svg" /></div>
        <div class="supportedCards__card"><img src="/img/app/cards/maestro.svg" /></div>
        <div class="supportedCards__card"><img src="/img/app/cards/mastercard.svg" /></div>
        <div class="supportedCards__card"><img src="/img/app/cards/visa.svg" /></div>
      </div>
    `;
  }

  setupForm(stripe) {
    this.createStripeElements(stripe);
    this.mountStripeElements();
  }

  createStripeElements(stripe) {
    const elements = stripe.elements({
      font: {
        cssSrc:
          "https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap",
      },
    });

    this.numberElement = elements.create("cardNumber", this.numberOptions());
    this.expiryElement = elements.create("cardExpiry", this.expiryOptions());
    this.cvcElement = elements.create("cardCvc", this.cvcOptions());
  }

  mountStripeElements() {
    this.numberElement.mount(`#${ids.cardNumber}`);
    this.expiryElement.mount(`#${ids.cardExpiry}`);
    this.cvcElement.mount(`#${ids.cardCvc}`);
  }

  baseStripeOptions() {
    return {
      classes: {
        base: "inputStripe",
        empty: "inputStripe inputStripe--empty",
        focus: "inputStripe inputStripe--focus",
        invalid: "inputStripe",
        complete: "inputStripe",
      },
      style: {
        base: {
          fontFamily: "'Roboto', sans-serif",
          fontSmoothing: "antialiased",
          fontSize: " 15px",
          fontWeight: "400",
          letterSpacing: "0.8px",
          lineHeight: "1.5",

          "::placeholder": {
            fontFamily: "'Roboto', sans-serif",
            fontSmoothing: "antialiased",
            fontSize: " 15px",
            fontWeight: "400",
            letterSpacing: "0.8px",
            lineHeight: "1.6",
            color: "transparent",

            transition: "all .2s",
          },

          ":focus": {
            "::placeholder": {
              color: "#a7a7a7",
            },
          },
        },
      },
    };
  }

  numberOptions() {
    return {
      ...this.baseStripeOptions(),
      classes: {
        base: "inputStripe inputStripe--number",
        empty: "inputStripe inputStripe--empty",
        complete: "inputStripe inputStripe--numberDefault",
        focus: "inputStripe inputStripe--numberFocus",
        invalid: "inputStripe inputStripe--numberDefault",
      },
      showIcon: true,
      placeholder: "1234 1234 1234 1234",
    };
  }

  expiryOptions() {
    return {
      ...this.baseStripeOptions(),
      placeholder: "MM / YY",
    };
  }

  cvcOptions() {
    return {
      ...this.baseStripeOptions(),
      placeholder: "123",
    };
  }
}

export class ExistingMethodView extends View {
  _parentElement = document.querySelector(`${classes.slide}--3`);
  _contentElement = element.paymentForms;
  _formElement = classes.existingCard;

  addHandlerSubmit(handler) {
    this._contentElement.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!this.isCorrectForm(e.target)) return;

      const card = getElement(`${classes.card}.selected`);
      const btn = getElement(classes.paymentFormSubmit);

      handler(card.dataset.id, btn);
    });
  }

  addHandlerSelectCard(handler) {
    this._contentElement.addEventListener("click", (e) => {
      const btn = e.target.closest(classes.card);
      if (!btn) return;

      const id = btn.classList.contains(classes.selected.slice(1)) ? "" : btn.dataset.id;
      handler(btn, id);
    });
  }

  _cardsMarkup(cards) {
    const markup = [];

    cards.forEach((card, i) => {
      markup.push(`
        <button class="btn card" data-id="${card.id}" type="button">
          <img 
            class="card__img" 
            src="/img/app/cards/${card.card.brand}.svg" 
            alt="${card.card.brand} image" 
          />
          <div class="card__info">
            <h6 class="header-6 u-none-text">${card.card.last4} ending</h6>
            <p class="paragraph">${parseCardExpiry(card.card.exp_month, card.card.exp_year)}</p>
          </div>
          <div class="card__status">
            ${i === 0 ? `<div class="default">default</div>` : ``}
          </div>
        </button>
      `);
    });

    return markup.join(" ");
  }

  _generateMarkup() {
    const cards = this._data.paymentMethods;
    const product = this._data.plan.product;

    let price;

    if (product.type === "plan") price = product.price * product.durationMonths;
    else price = price * product.price;

    return `
      <form class="paymentForm existingCard">
        <div class="paymentForm__header">
          <p class="paragraph u-center-text">Choose a card to complete the payment</p>
          <div class="notice"></div>
        </div>
        <div class="cards">${this._cardsMarkup(cards)}</div>
        <button class="btn btn__primary paymentForm__submit" title="Pay $${price}" disabled>
          <span>pay $${price}</span>
          <i class="bi bi-credit-card-2-front-fill"></i>
          <i class="bi bi-check-lg success-icon"></i>
        </button>
      </form>
    `;
  }

  toggleCardSelect(btn) {
    const className = classes.selected.slice(1);

    // Get selected card
    const selected = getElement(combineClasses([...btn.classList, className]));

    // Manage selection/deselection
    if (selected) selected.classList.remove(className);
    if (selected === btn) return;
    btn.classList.add(className);
  }

  toggleSubmitButton(cardId) {
    getElement(classes.paymentFormSubmit).disabled = !cardId;
  }

  setupForm(stripe) {}
}

export class ApplePayView extends View {
  _parentElement = document.querySelector(`${classes.slide}--3`);
  _contentElement = element.paymentForms;

  _generateMarkup() {
    return `
      <div>apple pay</div>
    `;
  }

  setupForm(stripe) {}
}

export const orderView = new OrderView();
export const orderCostView = new OrderCostView();
export const orderOptionsView = new OrderOptionsView();

export const cardFormView = new CardFormView();
export const existingMethodView = new ExistingMethodView();
export const applePayView = new ApplePayView();

export const formViews = {
  card: cardFormView,
  existingCard: existingMethodView,
  apple: applePayView,
};
