import Router from "@/router/router";
import loader from "@/views/loading.html?raw";
import error from "@/views/error.html?raw";

export default abstract class AbstractView implements View.AbstractViewType {
  readonly popupElementId: string = "__popup__";
  readonly popupCloseElementId: string = "__popupClose__";
  popupControls: View.PopupControls | null = null;
  staticRenderElementId: string = "__main__";
  dynamicRenderElementId: string | null = null;
  #canRenderStaticLoadingState: boolean = true;
  #canRenderDynamicLoadingState: boolean = true;
  isPopupView: boolean = false;
  readonly #loadingStateRenderDelay: number = 100; // ms
  readonly #staticViewTitle: string = "IT Legend";
  readonly params: { [k: string]: string } = {};
  readonly searchParams: URLSearchParams | null = null;
  readonly myPathQuery: string = Router.getPathQuery();

  /** This will hold a global data to be used anywhere in the app */
  globalState: Info.GlobalStateType = {
    isLoggedIn: false,
    profileData: null,
  };

  /** This functon will always check if the server still know me or not */
  async checkServerLoginSession(): Promise<void> {
    const serverResponse = (await Router.dummyFetch(
      "http://localhost:3000/api/profile",
      {
        cachable: false,
      },
      {
        method: "GET",
        credentials: "include",
      }
    )) as Server.ProfileResponse;

    if (serverResponse.success) {
      const profileData = serverResponse.data;

      this.globalState = {
        isLoggedIn: true,
        profileData,
      };
    } else {
      this.globalState = {
        isLoggedIn: false,
        profileData: null,
      };

      if (Router.currentPath !== "/account") {
        Router.navigateTo({
          path: "/account",
          renderTargetId: null,
        });
        this.showPopupMsg({ type: "error", msg: serverResponse.msg });
      }
      this.setCartIconCounter(0);
    }
  }

  /** This function will update the value of the cart items counter on the header icon */
  async updateCartIconCounter(): Promise<void> {
    if (!this.globalState.isLoggedIn) return;

    const serverResponse = (await Router.dummyFetch(
      "http://localhost:3000/api/cart-count",
      {
        cachable: false,
      },
      {
        method: "GET",
        credentials: "include",
      }
    )) as Server.CartCountResponse;

    this.setCartIconCounter(serverResponse.data.cartCount);
  }

  /** This function will set the value of the cart items counter on the header icon to a new Value */
  async setCartIconCounter(newValue: number): Promise<void> {
    const cartIcon = document.getElementById(
      "_cart_icon_"
    )! as HTMLAnchorElement & { dataset: { itemCount: string } };
    cartIcon.dataset.itemCount = `${newValue}`;
  }

  /** This function will show a popup messgae with the data you need */
  async showPopupMsg({
    type,
    msg,
  }: {
    type: Info.PopupMessageType;
    msg: string;
  }): Promise<void> {
    const typeMap: Record<
      Info.PopupMessageType,
      { cls: string; txt: Info.PopupMessageName }
    > = {
      info: { cls: "fa-solid fa-circle-info", txt: "Info" },
      error: { cls: "fa-solid fa-circle-xmark", txt: "Error" },
      warning: { cls: "fa-solid fa-triangle-exclamation", txt: "Warning" },
    };

    const msgType = typeMap[type];

    const popoverEle = document.getElementById("_popup_msg_") as HTMLDivElement;
    popoverEle.querySelector("i")!.className = msgType.cls;
    popoverEle.querySelector(".type")!.textContent = msgType.txt;
    popoverEle.querySelector(".msg")!.textContent = msg;
    popoverEle.showPopover();
  }

  constructor(title?: string) {
    if (title) this.setTitle(title);
  }

  setTitle(title: string): void {
    document.title = this.#staticViewTitle + " | " + title;
  }

  loaderHTML(): string {
    return loader;
  }

  async staticLoading(): Promise<void> {
    setTimeout(() => {
      if (
        !this.#canRenderStaticLoadingState ||
        Router.currentPath !== location.pathname
      ) {
        return;
      }
      document.getElementById(
        this.isPopupView ? this.popupElementId : this.staticRenderElementId
      )!.innerHTML = this.loaderHTML();
    }, this.#loadingStateRenderDelay);
  }

  async dynamicLoading(): Promise<void> {
    setTimeout(() => {
      if (
        !this.#canRenderDynamicLoadingState ||
        Router.currentPath !== location.pathname
      ) {
        return;
      }
      document.getElementById(this.dynamicRenderElementId!)!.innerHTML =
        this.loaderHTML();
    }, this.#loadingStateRenderDelay);
  }

  errorHTML(): string {
    return error;
  }

  async error(err: Error | string): Promise<void> {
    this.#canRenderStaticLoadingState = false;
    this.#canRenderDynamicLoadingState = false;

    if (typeof err === "string") {
      err = new Error(err);
    }

    const renderElement = document.getElementById(
      this.isPopupView ? this.popupElementId : this.staticRenderElementId
    )!;
    renderElement.innerHTML = this.errorHTML();
    // add error information
    renderElement.querySelector(".error-name")!.textContent = err.name!;
    renderElement.querySelector(".error-message")!.textContent = err.message;
  }

  async getStaticHTML(): Promise<string> {
    return "";
  }

  async #getStaticRenderHTMLTemplate(): Promise<HTMLTemplateElement> {
    const template = await AbstractView.createHTMLTemplate({
      htmlString: await this.getStaticHTML(),
    });
    await this.beforeStaticHTMLRender(template);
    return template;
  }

  async #renderStaticHTML(): Promise<void> {
    this.staticLoading(); // show loader until data load
    const html = await this.#getStaticRenderHTMLTemplate();
    // prevent loading state render
    this.#canRenderStaticLoadingState = false;

    // render only if still on the same pathQuery
    if (!Router.isTheSamePathQuery(this.myPathQuery)) {
      return;
    }

    const renderElement = document.getElementById(
      this.isPopupView ? this.popupElementId : this.staticRenderElementId
    )!;
    renderElement.innerHTML = html.getHTML();
    await this.afterStaticHTMLRender();
    Router.setActiveLinks();
  }

  async getDynamicHTML(): Promise<string> {
    return "";
  }

  async #getDynamicRenderHTMLTemplate(): Promise<HTMLTemplateElement> {
    const template = await AbstractView.createHTMLTemplate({
      htmlString: await this.getDynamicHTML(),
    });
    await this.beforeDynamicHTMLRender(template);
    return template;
  }

  async #renderDynamicHTML(): Promise<void> {
    this.dynamicLoading(); // show loader until data load
    const html = await this.#getDynamicRenderHTMLTemplate();
    // prevent loading state render
    this.#canRenderDynamicLoadingState = false;

    // render only if still on the same pathQuery
    if (!Router.isTheSamePathQuery(this.myPathQuery)) {
      return;
    }

    const renderElement = document.getElementById(
      this.dynamicRenderElementId!
    )!;
    renderElement.innerHTML = html.getHTML();
    await this.afterDynamicHTMLRender();
    Router.setActiveLinks(renderElement);
  }

  async render({
    renderTargetId,
  }: {
    renderTargetId: string | null;
  }): Promise<void> {
    let renderDynamicHTMLOnly = false;

    // make sure that the (renderTargetId) was sent
    // and the element with that target id is exists
    if (renderTargetId && document.getElementById(renderTargetId) !== null) {
      this.dynamicRenderElementId = renderTargetId;
      renderDynamicHTMLOnly = true;
    }

    if (this.isPopupView) {
      // contruct the popup container
      await this.constructPopup({});
    }

    try {
      // render static only at view initial load
      if (!renderDynamicHTMLOnly) {
        await this.#renderStaticHTML();
      }
      if (this.dynamicRenderElementId !== null) {
        await this.#renderDynamicHTML();
      }
    } catch (err) {
      setTimeout(console.error, 10, err);
      this.error(err as Error);
    }
  }

  /**
   * use this function to build the popup an append it to the DOM
   * @param beforeMountCallback this callback will be called to update the template content before mount
   */
  async constructPopup({
    beforeMountCallback,
  }: {
    beforeMountCallback?: (popupElement: HTMLDivElement) => void;
  }): Promise<void> {
    const popupSignalController = new AbortController();
    const popupElement = document.createElement("div");
    popupElement.id = this.popupElementId;
    popupElement.className = "popup";

    // update the template content before mount
    if (beforeMountCallback) {
      beforeMountCallback(popupElement);
    }

    // append to the document body
    document.body.appendChild(popupElement);

    /**
     * use should this function to remove the popup from DOM.
     */
    const destructPopup = () => {
      popupElement.remove();
      popupSignalController.abort();
    };

    // remvoe the popup on popstate
    window.addEventListener(
      "popstate",
      () => {
        destructPopup();
      },
      {
        signal: popupSignalController.signal,
      }
    );

    // close the popup on click outside the form
    // or if the clicked element is the #__popupClose__ element.
    popupElement.addEventListener(
      "click",
      (e) => {
        const target = e.target as HTMLElement;
        if (
          target === popupElement ||
          target === document.getElementById("__popupClose__")!
        ) {
          popupSignalController.abort();
          destructPopup();
          Router.navigateBack();
        }
      },
      { signal: popupSignalController.signal }
    );

    // save the popup controls
    this.popupControls = { popupElement, popupSignalController, destructPopup };
  }

  async beforeStaticHTMLRender(_template: HTMLTemplateElement): Promise<void> {}
  async beforeDynamicHTMLRender(
    _template: HTMLTemplateElement
  ): Promise<void> {}

  async afterStaticHTMLRender(): Promise<void> {}
  async afterDynamicHTMLRender(): Promise<void> {}

  async beforeUnmount(): Promise<void> {}

  async cleanup(): Promise<void> {
    this.beforeUnmount();
  }

  /**
   * this function will build the (HTMLTemplateElement) and fill it with the htmlString
   * then return the (HTMLTemplateElement) itself.
   * @param htmlString the html template string
   */
  static async createHTMLTemplate({
    htmlString,
  }: {
    htmlString: string;
  }): Promise<HTMLTemplateElement> {
    const template = document.createElement("template");
    template.innerHTML = htmlString.trim();
    return template;
  }
}
