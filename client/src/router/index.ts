import ROUTES from "./routes";
import Router from "./router";

document.addEventListener("DOMContentLoaded", () => {
  const router = new Router(ROUTES, {
    cache: true,
    immortalCache: true,
  });
  window.onpopstate = router.popStateNavigation;
  document.onclick = router.linkClickNavigation;
});
