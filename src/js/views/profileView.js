import { element, elements, classes } from "../base";

import { getElement, parseCardExpiry } from "../helper";
import View from "./view";

// MAIN VIEW
class SettingsView extends View {
  _parentElement = element.settings;
  _contentElement = element.settingsContent;

  addHandlerLoad(handler) {
    window.addEventListener("load", handler);
  }

  addHandlerTabClick(handler) {
    this._parentElement.addEventListener("click", (e) => {
      const btn = e.target.closest(classes.tabBtn);
      if (!btn) return;

      this.manageButtons(btn.dataset.page);
      handler(btn.dataset.page);
    });
  }

  manageButtons(page) {
    document
      .querySelectorAll(`${classes.tabBtn}`)
      .forEach((btn) => (btn.disabled = btn.dataset.page === page));
  }
}

// PAGE VIEWS
class ProfileView extends View {
  _parentElement = element.settingsMain;
  _contentElement = element.settingsContent;

  _editProfileMarkup(user) {
    return `
      <form class="settings__section editProfile">
        <h5 class="header-5 u-center-text">edit profile</h5>
        <div class="notice editProfile__error"></div>
        <div class="editProfile__inputs">
          <div class="inputField">
            <input type="text" id="email" name="email" placeholder="test@example.com" spellcheck="false" title="Type your email" value="${user.email}"/>
            <label for="email">email</label>
          </div>
          <div class="inputField">
            <input type="text" id="fullName" name="fullName" placeholder="John Smith" spellcheck="false" title="Type your full name" value="${user.fullName}"/>
            <label for="fullName">full name</label>
          </div>
          <div class="editProfile__pic">
            <img class="profile__img editProfile__img" src="/img/users/${user.photo}" />
            <input class="editProfile__file" type="file" name="photo" id="photo" value="Change photo" accept="image/*" />
            <label class="btn btn__text" for="photo">Change profile</label>
          </div>
        </div>
        <button class="btn btn__primary u-align-self-end editProfile__btn" title="Edit profile">
          <span>update profile</span>
          <i class="bi bi-check-lg success-icon"></i>
        </button>
      </form>
    `;
  }

  _paymentMethodsMarkup() {
    return `
      <div class="settings__section paymentMethods">
        <h5 class="header-5 u-center-text">payment methods</h5>
        <p class="paragraph">Payment methods are automatically added during the checkout process</p>
        <div class="notice"></div>
        <div class="cards">
          <div class="revealMethods">
            <div class="revealMethods__panel">
              <i class="bi bi-shield-lock revealMethods__icon"></i>
              <p class="paragraph">Reveal payment methods?</p>
              <button class="btn btn__primary revealMethods__btn">reveal</button>
            </div>
          </div>
        </div>
        <div class="paymentMethods__btns">
          <button class="btn btn__primary paymentMethods__add">add card</button>
        </div>
      </div>
    `;
  }

  _generateMarkup() {
    const user = this._data.user;

    const markup = [this._editProfileMarkup(user), this._paymentMethodsMarkup()];

    return markup.join(" ");
  }
}

class OptionsView extends View {
  _parentElement = element.settingsMain;
  _contentElement = element.settingsContent;

  _optionsMarkup() {
    return `
      <form class="settings__section options">
        <h5 class="header-5 u-center-text">options</h5>
        <div class="notice"></div>
        <div class="options__inputs">
          <div class="inputSwitch">
            <label for="darkmode">Darkmode</label>
            <input type="checkbox" id="darkmode" name="darkmode" title="Toggle dark mode" />
          </div>
        </div>
        <button class="btn btn__secondary u-align-self-end" title="Save changes">
            <span class="content">save</span>
        </button>
      </form>
    `;
  }

  _generateMarkup() {
    return this._optionsMarkup();
  }
}

class SecurityView extends View {
  _parentElement = element.settingsMain;
  _contentElement = element.settingsContent;

  _changePasswordMarkup() {
    return `
      <form class="settings__section changePassword">
        <h5 class="header-5 u-center-text">change password</h5>
        <div class="notice"></div>
        <div class="changePassword__inputs">
          <div class="inputField">
            <input type="password" id="currentPassword" name="currentPassword" placeholder="current password" title="Type your current password" />
            <label for="currentPassword">current password</label>
          </div>
          <div class="inputField">
            <input type="password" id="newPassword" name="newPassword" placeholder="new password" title="Type your new password" />
            <label for="newPassword">new password</label>
          </div>
        </div>
        <button class="btn btn__primary u-align-self-end changePassword__btn" title="Change password">
          <span>change password</span>
          <i class="bi bi-check-lg success-icon"></i>
        </button>
      </form>
    `;
  }

  _forgotPasswordMarkup() {
    return `
      <form class="settings__section forgotPassword">
        <h5 class="header-5 u-center-text">Forgot password</h5>
        <div class="notice"></div>
        <div class="settings__text u-center-text">
          <p class="paragraph">If you forgot your password, we can send you a reset link to your email.</p>
        </div>
        <div class="forgotPassword__main u-align-self-center">
          <p class="paragraph forgotPassword__time hide">You may resend in <span class="forgotPassword__time--seconds">10</span> seconds</p><button class="btn btn__primary forgotPassword__btn" title="send reset link"><span>send link</span><i class="bi bi-check-lg success-icon"></i></button>
        </div>
      </form>
    `;
  }

  _enable2faMarkup() {
    return `
      <form class="settings__section enableTwoFactor">
        <h5 class="header-5 u-center-text">enable 2fa</h5>
        <div class="notice"></div>
        <div class="settings__text">
          <h6 class="header-6 u-margin-bottom-sm">enable two factor authentication?</h6>
          <p class="paragraph">Once enabled, you will be sent a confirmation email. Click on the link in that email to enable 2fa. From then, you will be required to enter a code sent to your email every time you log in.</p>
        </div>
        <button class="btn btn__secondary u-align-self-center enableTwoFactor__btn" title="Enable 2fa">
          <span>enable 2FA</span>
          <i class="bi bi-check-lg success-icon"></i>
        </button>
      </form>
    `;
  }

  _disable2faMarkup() {
    return `
      <form class="settings__section disableTwoFactor">
        <h5 class="header-5 u-center-text">disable 2fa</h5>
        <div class="notice"></div>
        <div class="settings__text">
          <h6 class="header-6 u-margin-bottom-sm">disable two factor authentication?</h6>
          <p class="paragraph">Once disabled, you will no longer require a code every time you log in. This may result in hackers being able to get into your account more easily. You will need to click on a link sent to your email in order to disable 2fa.</p>
        </div>
        <button class="btn btn__red u-align-self-center disableTwoFactor__btn" title="Disable 2fa">
            <span>disable 2FA</span>
            <i class="bi bi-check-lg success-icon"></i>
        </button>
      </form>
    `;
  }

  _generateMarkup() {
    const user = this._data.user;

    const markup = [
      this._changePasswordMarkup(),
      this._forgotPasswordMarkup(),
      user.twoFactor ? this._disable2faMarkup() : this._enable2faMarkup(),
    ];

    return markup.join(" ");
  }
}

class PlanView extends View {
  _parentElement = element.settingsMain;
  _contentElement = element.settingsContent;

  _currentPlanMarkup(plan) {
    const primary = getComputedStyle(document.body).getPropertyValue("--c-primary");
    const secondary = getComputedStyle(document.body).getPropertyValue("--c-secondary");

    return `
      <div class="settings__section currentPlan">
        <h5 class="header-5 u-center-text">current plan</h5>
        <div class="notice"></div>
        <div class="currentPlan__content">
          <div class="progressBar">
            <div 
              class="progressBar__filler" 
              style="transform: rotate(${180 * plan.progress + 45}deg)"
            ></div>
            <div 
              class="circle circle--static" 
              style="background-color:${0.5 > 0 ? primary : secondary};"
            ></div>
            <div 
              class="circle circle--left"
              style="transform: translate(0, -50%) rotate(${180 * plan.progress}deg)"
            ></div>
            <div 
              class="circle circle--right"
              style="background-color:${plan.progress >= 1 ? primary : secondary};"
            ></div>
          </div>
          <div class="planTimeLeft">
            <span class="planTimeLeft--daysLeft">
              ${plan.progress <= 1 ? `${plan.daysLeft}d left!` : "Complete!"}
            </span>
            <span class="planTimeLeft--progress header-gradient">
              ${Math.floor(plan.progress * 100)}%
            </span>
            <span class="planTimeLeft--name">${plan.product.name}</span>
          </div>
          <div class="currentPlan__start">start</div>
          <div class="currentPlan__end">end</div>
        </div>
        ${
          plan.progress >= 1
            ? `<a class="btn btn__secondary u-align-self-center" title="Renew vpn plan" href="#">renew plan</a>`
            : ``
        }
      </div>
    `;
  }

  _cancelPaymentMarkup() {
    return `
      <div class="settings__section cancelPayment">
        <h5 class="header-5 u-center-text">Cancel plan</h5>
          <div class="notice"></div>
          <div class="settings__text">
            <h6 class="header-6">Please read:</h6>
            <p class="paragraph">If you wish to cancel your current plan, you will be refunded the portion that you did not use out of your plan. Ex: if you cancelled after 10 days of your monthly plan, you will only pay for those 10 days</p>
            <p class="paragraph"> <span class="warning">Please note:</span> You may only cancel if you are using the monthly plan.</p>
        </div>
        <button class="btn btn__red u-align-self-center" title="Cancel vpn plan">
          <span>cancel plan</span>
        </button>
      </div>  
    `;
  }

  _getPlanMarkup() {
    return `
      <div class="settings__section getPlan">
        <h4 class="header-4 u-none-text">No plans active!</h4>
        <p class="paragraph">Please enroll in one of our vpn plans to get started!</p><a class="btn btn__primary" href="/#section-plans">view plans</a>
      </div>
    `;
  }

  _generateMarkup() {
    let markup;
    const { plan } = this._data;

    if (Object.keys(plan).length) markup = [this._currentPlanMarkup(plan)];
    else markup = [this._getPlanMarkup()];

    return markup.join(" ");
  }
}

class UsersView extends View {
  _parentElement = element.settingsMain;
  _contentElement = element.settingsContent;

  _userCardMarkup(user) {
    const nameArr = user.fullName.split(" ");
    const name = `${nameArr[0]}. ${nameArr[1].charAt(0)}`;

    return `
      <div class="userCard">
        <div class="userCard__photo">
          <img 
            class="profile__img userCard__img" 
            src="/img/users/${user.photo}" 
            alt="Photo of ${user.fullName}" 
          />
        </div>
        <h6 class="header-6 u-center-text">${name}</h6>
        <ul class="userCard__list u-center-text">
          <li class="userCard__item">5 total months</li>
          <li class="userCard__item">${user.active ? "" : "not "}active</li>
        </ul>
        <button class="btn btn__primary userCard__btn" title="View user">view</button>
      </div>
    `;
  }

  _manageUsersMarkup(users) {
    return `
      <div class="settings__section users">
        <h5 class="header-5 u-center-text">manage users</h5>
        <form class="search">
          <div class="inputField inputField--search">
            <input type="text" id="search" name="search" spellcheck="false" placeholder="search by name" title="Type your search" />
            <label for="search">search by name</label>
            <button class="btn btn__secondary"><i class="bi bi-search"></i></button>
          </div>
        </form>
        <div class="notice"></div>
        <div class="users__content">
          ${users.map((user) => this._userCardMarkup(user)).join(" ")}
        </div>
        <div class="users__nav">
          <button class="btn btn__text" title="back">back</button>
          <button class="btn btn__primary" title="back">next</button>
        </div>
      </div>
    `;
  }

  _generateMarkup() {
    const { users } = this._data;

    return this._manageUsersMarkup(users);
  }
}

// SECTION VIEWS
class EditProfileView extends View {
  _parentElement = classes.editProfile;
  _formElement = classes.editProfile;

  addHandlerSubmit(handler) {
    element.settingsContent.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!this.isCorrectForm(e.target)) return;

      const btn = getElement(classes.editProfileBtn);
      handler(this.getFormData(), btn);
    });
  }
}

class MethodsView extends View {
  _parentElement = classes.paymentMethods;
  _contentElement = classes.cards;

  addHandlerReveal(handler) {
    element.settingsContent.addEventListener("click", (e) => {
      const btn = e.target.closest(classes.revealMethodsBtn);
      if (!btn) return;

      handler();
    });
  }

  addHandlerDetach(handler) {
    element.settingsContent.addEventListener("click", (e) => {
      const btn = e.target.closest(classes.detachCardBtn);
      if (!btn) return;

      const id = e.target.closest(classes.card).dataset.id;

      handler(id, btn);
    });
  }

  _cardMarkup(method) {
    return `
      <div class="card" data-id="${method.id}">
        <img 
          class="card__img" 
          src="/img/app/cards/${method.card.brand}.svg" 
          alt="${method.card.brand} image" 
          title="${method.card.brand}"
        />
        <div class="card__info">
          <h6 class="header-6 u-none-text">${method.card.last4} ending</h6>
          <p class="paragraph">${parseCardExpiry(method.card.exp_month, method.card.exp_year)}</p>
        </div>
        <button class="btn btn__glass card__remove-btn" title="remove card">
          <svg class="bi" width="1em" height="1em" fill="currentColor"><use xlink:href="/img/bootstrap-icons.svg#trash3"></use></svg>
        </button>
      </div>
    `;
  }

  _generateMarkup() {
    const methods = this._data.paymentMethods;
    if (!methods.length) this.renderInfo("You do not have any existing payment methods");

    const markup = methods.map((method) => this._cardMarkup(method));

    return markup.join(" ");
  }
}

class ChangePasswordView extends View {
  _parentElement = classes.changePassword;
  _formElement = classes.changePassword;

  addHandlerSubmit(handler) {
    element.settingsContent.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!this.isCorrectForm(e.target)) return;

      const btn = getElement(classes.changePasswordBtn);
      handler(this.getFormData(), btn);
    });
  }
}

class ForgotPasswordView extends View {
  _parentElement = classes.forgotPassword;
  _formElement = classes.forgotPassword;

  addHandlerSubmit(handler) {
    element.settingsContent.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!this.isCorrectForm(e.target)) return;

      const btn = getElement(classes.forgotPasswordBtn);

      handler(btn);
    });
  }

  startBtnCountdown(btn, secondsLeft) {
    const container = getElement(classes.forgotPasswordTime);
    const placeholder = getElement(classes.forgotPasswordSeconds);
    let seconds = secondsLeft || 60;

    // Disable button
    this.removeButtonSuccess(btn);
    btn.disabled = true;

    // Set seconds and reveal container
    placeholder.textContent = seconds;
    container.classList.remove("hide");

    // Start countdown
    const countdown = setInterval(function () {
      placeholder.textContent = seconds;
      seconds--;

      // Stop countdown
      if (seconds <= 0) {
        clearInterval(countdown);

        container.classList.add("hide");
        btn.disabled = false;
      }
    }, 1000);
  }
}

class EnableFactorView extends View {
  _parentElement = classes.enableFactorAuth;
  _formElement = classes.enableFactorAuth;

  addHandlerSubmit(handler) {
    element.settingsContent.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!this.isCorrectForm(e.target)) return;

      const btn = getElement(classes.enableFactorAuthBtn);
      handler(true, btn);
    });
  }
}

class DisableFactorView extends View {
  _parentElement = classes.disableFactorAuth;
  _formElement = classes.disableFactorAuth;

  addHandlerSubmit(handler) {
    element.settingsContent.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!this.isCorrectForm(e.target)) return;

      const btn = getElement(classes.disableFactorAuthBtn);
      handler(false, btn);
    });
  }
}

export const settingsView = new SettingsView();

export const profileView = new ProfileView();
export const optionsView = new OptionsView();
export const securityView = new SecurityView();
export const planView = new PlanView();
export const usersView = new UsersView();

export const editProfileView = new EditProfileView();
export const methodsView = new MethodsView();
export const changePasswordView = new ChangePasswordView();
export const forgotPasswordView = new ForgotPasswordView();
export const enableFactorView = new EnableFactorView();
export const disableFactorView = new DisableFactorView();

export const pageViews = {
  profile: profileView,
  options: optionsView,
  security: securityView,
  plan: planView,
  users: usersView,
  products: undefined,
};

export const sectionViews = {
  profile: [editProfileView, methodsView],
  options: [],
  security: [changePasswordView, forgotPasswordView, enableFactorView, disableFactorView],
  plan: [],
  users: [],
  products: [],
};
