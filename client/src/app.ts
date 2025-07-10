import "@/styles/_index.css";
import "@/styles/fa/css/all.min.css";
import "@/router/link";
import "@/router";
import "./layout.css";
import layout from "./layout.html?raw";
import { _Storage } from "./utils/Storage";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = layout;

window.addEventListener("DOMContentLoaded", async () => {
  // window scrolling
  // ============================================================
  const header = document.querySelector("header")!;
  const btt = document.getElementById("backToTop")!;

  const OnWindowScroll = async () => {
    // header behavior
    if (window.scrollY >>> 0 === 0) {
      header.classList.remove("scroll-down");
    } else {
      header.classList.add("scroll-down");
    }

    if (window.scrollY > 300) {
      btt.classList.add("show-up");
    } else {
      btt.classList.remove("show-up");
    }
  };
  OnWindowScroll();
  window.addEventListener("scroll", OnWindowScroll);

  btt.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // sideNav toggle
  // ============================================================
  document.getElementById("sideNav")!.onclick = (e) => {
    const target = e.target as HTMLElement;
    if (target === e.currentTarget || target.matches("[data-link]")) {
      const sideNavToggle = document.getElementById(
        "sideNavToggle"
      )! as HTMLInputElement;
      const checked = sideNavToggle.checked;
      sideNavToggle.checked = !checked;
    }
  };
});
