import "./account.css";
import template from "./account.html?raw";
import loginForm from "./loginForm.html?raw";
import DummyView from "@/router/components/view";
import Router from "@/router/router";

export default class extends DummyView {
  dynamicRenderElementId: string = "account_rt";
  readonly searchParams = Router.useSearchParams();

  constructor() {
    super("Account");
  }

  async getStaticHTML() {
    return template;
  }

  async getDynamicHTML() {
    if (!this.globalState.isLoggedIn) {
      return loginForm;
    }

    const profileData = this.globalState.profileData!;

    return `
      <div class="profile-card">
        <i class="fa-solid fa-circle-user"></i>
        <h2 class="id"><span>#</span>${profileData.id}</h2>
        <h3 class="name">${profileData.name}</h2>
        <h3 class="balance">${profileData.balance}<span> ${profileData.currency}</span></h2>
        <button id="logoutBtn" class="button">Logout</button>
      </div>
    `;
  }

  async beforeStaticHTMLRender(_template: HTMLTemplateElement): Promise<void> {
    await this.checkServerLoginSession();
    await this.updateCartIconCounter();
  }

  async afterStaticHTMLRender(): Promise<void> {}

  async beforeDynamicHTMLRender(
    _template: HTMLTemplateElement
  ): Promise<void> {}

  async afterDynamicHTMLRender(): Promise<void> {
    if (this.globalState.isLoggedIn) {
      const logoutBtn = document.getElementById(
        "logoutBtn"
      ) as HTMLButtonElement;
      logoutBtn.onclick = async () => {
        (await Router.dummyFetch(
          "http://localhost:3000/api/logout",
          {
            cachable: false,
          },
          {
            method: "POST",
            credentials: "include",
          }
        )) as Server.ServerResponseSchema;

        await Router.softReload();        
        this.setCartIconCounter(0);
      };
    } else {
      const loginForm = document.getElementById("loginForm") as HTMLFormElement;

      loginForm.onsubmit = async (e) => {
        e.preventDefault();

        const formData = Object.fromEntries(
          new FormData(loginForm).entries()
        ) as { id: string; password: string };

        const serverResponse = (await Router.dummyFetch(
          "http://localhost:3000/api/login",
          {
            cachable: false,
          },
          {
            method: "POST",
            body: JSON.stringify(formData),
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        )) as Server.ProfileResponse;

        if (serverResponse.success) {
          const profileData = serverResponse.data;

          this.globalState = {
            isLoggedIn: true,
            profileData,
          };

          await Router.softReload();
        } else {
          this.showPopupMsg({ type: "error", msg: serverResponse.msg });
        }
      };
    }
  }
}
