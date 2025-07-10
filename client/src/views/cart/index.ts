import "./cart.css";
import template from "./cart.html?raw";
import DummyView from "@/router/components/view";
import Router from "@/router/router";

export default class extends DummyView {
  dynamicRenderElementId: string = "cart_rt";
  readonly searchParams = Router.useSearchParams();

  constructor() {
    super("Cart");
  }

  async getStaticHTML() {
    return template;
  }

  async getDynamicHTML() {
    const serverResponse = (await Router.dummyFetch(
      "http://localhost:3000/api/cart",
      {
        cachable: false,
      },
      {
        method: "GET",
        credentials: "include",
      }
    )) as Server.CartResponse;


    if (!serverResponse.success) {
      this.showPopupMsg({ type: "error", msg: serverResponse.msg });
      return "";
    }

    if (serverResponse.data.items.length <= 0) {
      return `
        <div class='empty'>
          <span>Cart is empty</span>
          <i class="fa-solid fa-cart-shopping"></i>
        </div>`;
    }

    const cartItems = serverResponse.data.items;
    const { currency, total } = serverResponse.data;

    // DOM it 🐂💩
    const wrapper = document.createElement("div");
    const totalEle = document.createElement("div");
    const itemsEle = document.createElement("div");
    const controlsEle = document.createElement("div");

    // controls
    controlsEle.className = "controls";
    controlsEle.innerHTML = `
      <button class="button special" data-action="checkout-cart">Checkout</button>
      <button class="button" data-action="clear-cart">Clear</button>
    `;

    // total count
    totalEle.id = "_total_";
    totalEle.title = "Total items";
    totalEle.textContent = `${total}`;

    itemsEle.className = "items";

    itemsEle.innerHTML = cartItems.map(({ product, quantity }, i) => `
      <div style="--i:${i}" class="item-card">
        <img src="${product.category}.webp" />
        <div class="details">
          <h3 class="name">${product.name}</h4>
          <p class="description line-clamp-1" title="${product.description}">${product.description}</h5>
          <h4 class="price">${product.price ? `${product.price} ${currency}` : "Free"}</h4>

          <form class="action-form">
            <input name="amount" type="hidden" value="${quantity}"/>
            <input name="productId" type="hidden" value="${product.id}" />
            <span class="quantity">${quantity}</span>
            <button class="remove-from-cart-btn" data-action="remove-from-cart">
              <i class="fa-solid fa-trash"></i>
            </button>
          </form>
        </div>
      </div>`).join("");

    wrapper.append(controlsEle, totalEle, itemsEle);

    return wrapper.innerHTML;
  }

  async beforeStaticHTMLRender(_template: HTMLTemplateElement): Promise<void> {
    await this.checkServerLoginSession();
    await this.updateCartIconCounter();
  }

  async beforeDynamicHTMLRender(_template: HTMLTemplateElement): Promise<void> {}

  async afterStaticHTMLRender(): Promise<void> {}

  async afterDynamicHTMLRender(): Promise<void> {
    const shop_rt = document.getElementById("cart_rt") as HTMLDivElement;

    // actions based on the (data-action) attribute on the target elements
    type ActionName = "remove-from-cart" | "checkout-cart" | "clear-cart";
    type Action = (event: PointerEvent) => Promise<void>;
    const actionMap: Record<ActionName, Action> = {
      "remove-from-cart": this.removeFromCart,
      "checkout-cart": this.checkoutCart,
      "clear-cart": this.clearCart,
    };

    shop_rt.onclick = async (e) => {
      const eventTarget = e.target as HTMLButtonElement & { dataset: { action: ActionName } };

      // get the action if exists
      const action = actionMap[eventTarget.dataset.action];
      
      // take action if the right element clicked
      // bind with (this) to avoid any binding problems 🐂💩
      if (action) await action.bind(this)(e);
    }
  }

  async removeFromCart (event: PointerEvent): Promise<void> {
    event.preventDefault();
    const ButtonEle = event.target as HTMLButtonElement;
    const formEle = ButtonEle.parentElement as HTMLFormElement;
    const { productId, amount } = Object.fromEntries(new FormData(formEle).entries()) as unknown as { productId: string, amount: number };
    const parsedAmount = Number.isNaN(+amount) ? 0 : +amount;

    const serverResponse = (await Router.dummyFetch(
      "http://localhost:3000/api/remove-from-cart",
      {
        cachable: false,
      },
      {
        method: "POST",
        body: JSON.stringify({ productId: productId, amount: parsedAmount }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        }
      }
    )) as Server.CartResponse;

    if (serverResponse.success) {
      if (serverResponse.data.total <= 0) {
        // reload to show the empty message
        await Router.softReload();
      }
      // set the value of cart items in the header
      this.setCartIconCounter(serverResponse.data.total);
      // reduce the total count
      document.getElementById("_total_")!.textContent = `${serverResponse.data.total}`;
      // remove the card
      const ItemCard = formEle.parentElement!.parentElement!;
      ItemCard.remove();
    } else {
      // await Router.softReload();
      this.showPopupMsg({ type: "error", msg: serverResponse.msg });
    }
  }

  async clearCart (event: PointerEvent): Promise<void> {
    event.preventDefault();
    // const ButtonEle = event.target as HTMLButtonElement;

    const serverResponse = (await Router.dummyFetch(
      "http://localhost:3000/api/cart-clear",
      {
        cachable: false,
      },
      {
        method: "POST",
        credentials: "include",
      }
    )) as Server.CartResponse;

    if (serverResponse.success) {
      // set the value of cart items in the header
      this.setCartIconCounter(serverResponse.data.total);
    } else {
      this.showPopupMsg({ type: "error", msg: serverResponse.msg });
    }
    // reload to show the empty message
    await Router.softReload();
  }

  async checkoutCart (event: PointerEvent): Promise<void> {
    event.preventDefault();
    // const ButtonEle = event.target as HTMLButtonElement;

    const serverResponse = (await Router.dummyFetch(
      "http://localhost:3000/api/checkout",
      {
        cachable: false,
      },
      {
        method: "POST",
        credentials: "include",
      }
    )) as Server.CheckoutResponse;

    if (serverResponse.success) {
      // set the value of cart items in the header
      this.setCartIconCounter(0);
      this.showPopupMsg({type: "info", msg: "Checkout done successfully - Go to /receipts to see the details."});
    } else {
      this.showPopupMsg({ type: "error", msg: serverResponse.msg });
    }
    // reload to show the empty message
    await Router.softReload();
  }
}
