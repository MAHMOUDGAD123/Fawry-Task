import "./shop.css";
import template from "./shop.html?raw";
import DummyView from "@/router/components/view";
import Router from "@/router/router";

type Categories = "food" | "electronics" | "digital";
type FilterId = `_${Categories}_`;

// <filterId, pathQuery>
const filterMap = new Map<
  FilterId,
  { category: Categories; name: Capitalize<Categories> }
>([
  [
    "_food_",
    {
      category: "food",
      name: "Food",
    },
  ],
  [
    "_electronics_",
    {
      category: "electronics",
      name: "Electronics",
    },
  ],
  [
    "_digital_",
    {
      category: "digital",
      name: "Digital",
    },
  ],
]);

export default class extends DummyView {
  dynamicRenderElementId: string = "shop_rt";
  readonly categoryFilter = "category";
  readonly searchParams = Router.useSearchParams();

  constructor() {
    super("Shop");
  }

  async getStaticHTML() {
    return template;
  }

  async getDynamicHTML() {
    const category = this.searchParams.get(this.categoryFilter);
    let serverResponse = (await Router.dummyFetch(
      "http://localhost:3000/api/products",
      {
        cachable: false,
      },
      {
        method: "GET",
        credentials: "include",
      }
    )) as Server.ProductsResponse;

    if (!serverResponse.success) {
      this.showPopupMsg({ type: "error", msg: serverResponse.msg });
      return "";
    }

    if (serverResponse.data.products.length <= 0) {
      return `
        <div class='empty'>
          <span>Shop is closed</span>
          <i class="fa-solid fa-shop-lock"></i>
        </div>`;
    }

    let productsList = serverResponse.data.products;
    const { currency, weightUnit } = serverResponse.data;

    if (category && filterMap.has(`_${category}_` as FilterId)) {
      productsList = productsList.filter(
        (product) => product.category === category
      );
    }

    return productsList.map((product, i) => `
        <div style="--i:${i}" class="product-card">
          <img src="${product.category}.webp" />
          <div class="details">
            <h3 class="name">${product.name}</h4>
            <p class="description line-clamp-1" title="${product.description}">${product.description}</h5>
            <h4 class="price">${product.price ? `${product.price} ${currency}` : "Free"}</h4>

            <form class="action-form">
              <input name="amount" class="amount" type="number" value="1" min="1" max="${product.quantity}" />
              <input name="productId" type="hidden" value="${product.id}" />
              <button class="add-to-cart-btn">
                <i class="fa-solid fa-cart-plus"></i>
              </button>
            </form>

            <hr />

            <div class="info">
              <span class="category">${product.category}</span>
              ${product.shippable? `<span>${product.weight! / 1000} ${weightUnit}</span>`: ""}
              ${product.expirationDate ? `<span class="category">${new Date(product.expirationDate).toLocaleDateString()}</span>`: ""}
              <span class="category">${product.quantity} left</span>
            </div>
          </div>
        </div>
      `).join("");
  }

  async beforeStaticHTMLRender(template: HTMLTemplateElement): Promise<void> {
    await this.checkServerLoginSession();
    await this.updateCartIconCounter();

    const filterElement = template.content.getElementById("shopFilter")!;

    // add the filters to the DOM
    filterElement.innerHTML = [...filterMap.entries()]
      .map(
        ([id, { name }]) => `
        <input
          type="checkbox"
          name="filter"
          id="${id}"
          data-title="${name}"
          title="${name}"
        />`
      )
      .join("");
  }

  async afterStaticHTMLRender(): Promise<void> {
    this.setActiveFilter();

    // filter click event to update the DOM on any filter click
    const filterElement = document.getElementById("shopFilter")!;
    filterElement.onclick = (e) => {
      const target = e.target as HTMLInputElement;
      const caregoryData = filterMap.get(target.id as FilterId)!;

      if (caregoryData) {
        const { name, category } = caregoryData;
        const isChecked = target.checked;

        filterElement.childNodes.forEach((node) => {
          (node as HTMLInputElement).checked = false;
        });

        Router.navigateTo({
          path: "/",
          query: isChecked ? `?category=${category}` : "",
          renderTargetId: this.dynamicRenderElementId,
          relative: true,
        });
        target.checked = isChecked;

        // set the title
        document.getElementById("_title")!.textContent = isChecked
          ? name
          : "Products";
      }
    };
  }

  async afterDynamicHTMLRender(): Promise<void> {
    this.setActiveFilter();

    const shop_rt = document.getElementById("shop_rt") as HTMLDivElement;

    shop_rt.onclick = async (e) => {
      const buttonEle = e.target as HTMLButtonElement;
      
      if (buttonEle.matches(".add-to-cart-btn")) {
        e.preventDefault();
        const formEle = buttonEle.parentElement as HTMLFormElement;
        const { productId, amount } = Object.fromEntries(new FormData(formEle).entries()) as unknown as { productId: string, amount: number };
        const parsedAmount = Number.isNaN(+amount) ? 0 : +amount;

        const serverResponse = (await Router.dummyFetch(
          "http://localhost:3000/api/add-to-cart",
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

        // set the value of cart items in the header
        this.setCartIconCounter(serverResponse.data?.total);

        if (!serverResponse.success) {
          // await Router.softReload();
          this.showPopupMsg({ type: "error", msg: serverResponse.msg });
        }
      }
    }
  }

  // privates
  private async setActiveFilter(): Promise<void> {
    // set the active filter button after render
    for (const [id, { name, category }] of filterMap) {
      const ele = document.getElementById(id) as HTMLInputElement;

      if (this.searchParams.get("category") === category) {
        ele.checked = true;
        document.getElementById("_title")!.textContent = name;
      } else {
        ele.checked = false;
      }
    }
  }
}
