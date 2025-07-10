import NotFound from "@/router/components/not-found-view";
import Shop from "@/views/shop";
import Account from "@/views/account";
import Cart from "@/views/cart";
import Receipts from "@/views/receipts";

// Add the "/[new_route_name]" to the Router.Path at /types/router.d.ts to activate the auto-complete
const ROUTES: Router.Routes = {
  data: [
    {
      path: "/",
      view: Shop,
      name: "Shop",
    },
    {
      path: "/account",
      view: Account,
      name: "Account",
    },
    {
      path: "/cart",
      view: Cart,
      name: "Cart",
    },
    {
      path: "/receipts",
      view: Receipts,
      name: "Receipts",
    },
  ],
  notFound: NotFound,
};

export default ROUTES;
