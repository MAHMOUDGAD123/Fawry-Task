import "./receipts.css";
import template from "./receipts.html?raw";
import DummyView from "@/router/components/view";
import Router from "@/router/router";

export default class extends DummyView {
  dynamicRenderElementId: string = "receipts_rt";
  readonly searchParams = Router.useSearchParams();

  constructor() {
    super("Receipts");
  }

  async getStaticHTML() {
    return template;
  }

  async getDynamicHTML() {
    if (!this.globalState.isLoggedIn) return "";
    
    const serverResponse = (await Router.dummyFetch(
      "http://localhost:3000/api/receipts",
      {
        cachable: false,
      },
      {
        method: "GET",
        credentials: "include",
      }
    )) as Server.ReceiptsResponse;

    if (!serverResponse.success) {
      this.showPopupMsg({ type: "error", msg: serverResponse.msg });
      return "";
    }

    if (serverResponse.data.receipts.length <= 0) {
      return `
        <div class='empty'>
          <span>Receipts is empty</span>
          <i class="fa-solid fa-receipt"></i>
        </div>`;
    }

    const { receipts, weightUnit, currency } = serverResponse.data;

    return receipts.map((receipt) => {
      return `
      <div class="receipt-card">
        <div class="receipt-content">
          <div class="receipt-header">
            <h1 class="receipt-title">RECEIPT</h1>
            <div class="receipt-datetime">
              <div class="receipt-date">${receipt.dateTime.date}</div>
              <div class="receipt-time">${receipt.dateTime.time}</div>
            </div>
          </div>

          <div class="divider"></div>

          <div class="section">
            <div class="section-label">Order Items</div>
            <div class="item-grid">
            ${
              receipt.receiptItems.map((item) => {
                return `
                  <div class="item">
                    <span class="item-name">${item.name}</span>
                    <span class="item-value">${item.quantity} × ${item.price} ${currency}</span>
                  </div>
                `
              }).join("")
            }
            </div>
          </div>

          <div class="section">
            <div class="section-label">Shipment Details</div>
            <div class="item-grid">
              ${
              receipt.shipmentData?.shippableItems.map(([name, { count, totalWeight }]) => {
                return `
                  <div class="item">
                    <span class="item-name">${name}</span>
                    <span class="item-value">${count} × ${totalWeight / 1000} ${weightUnit}</span>
                  </div>
                `
              }).join("")
            }
            </div>
            <div class="weight-badge">Total Weight: ${receipt.shipmentData?.totalWeightInKg} ${weightUnit}</div>
          </div>

          <div class="summary-box">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>${receipt.orderSubtotal} ${currency}</span>
            </div>
            <div class="summary-row">
              <span>Shipping</span>
              <span>${receipt.shippingFees} ${currency}</span>
            </div>
            <div class="summary-row total">
              <span>Total Paid</span>
              <span>${receipt.paidAmount} ${currency}</span>
            </div>
          </div>

          <div class="balance-card">
            <div class="balance-label">New Account Balance</div>
            <div class="balance-amount">${receipt.customerNewBalance} ${currency}</div>
          </div>
        </div>
      </div>
      `
    }).join("");
  }

  async beforeStaticHTMLRender(_template: HTMLTemplateElement): Promise<void> {
    await this.checkServerLoginSession();
    await this.updateCartIconCounter();
  }

  async afterStaticHTMLRender(): Promise<void> {}
}
