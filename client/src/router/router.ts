import PATH from "@/utils/path";

export default class Router {
  private static __instance: Router | null = null;
  private static _current: Router.DummyRoute | null = null;
  private static _currentPath: Router.Path = "/";
  private static _currentView: View.AbstractViewType | null = null;
  private static _urlSearchParams: URLSearchParams | null = null;
  private static __notFoundView: View.ViewConstructor | null = null;
  private static _dummyCache: Map<string, Router.CacheInfo> | null = null;
  private static _dummyCacheMaxAge: number = 0;
  private static _dummyCacheEnebled: boolean = !1;
  private static _immortalDummyCache: boolean = !1;
  private static _routeMap: Map<string, Router.DummyRoute> | null = null;

  constructor(routes: Router.Routes, config?: Router.Config) {
    if (Router.__instance) return Router.__instance; // force singleton

    // config
    // --------------------------------------------------
    const { cache, cacheMaxAge, immortalCache } = {
      cache: config?.cache ?? !0,
      cacheMaxAge: config?.cacheMaxAge ?? 600000,
      immortalCache: config?.immortalCache ?? false,
    } as Router.Config;

    if (cache) {
      Router._dummyCache = new Map();
      Router._dummyCacheEnebled = true;
      Router._dummyCacheMaxAge = cacheMaxAge!;
      Router._immortalDummyCache = immortalCache!;
    }
    // --------------------------------------------------

    // on page load initialization
    const { data, notFound } = routes;
    Router.__notFoundView = notFound;
    this.buildRouteMap(data);
    const fixedPath = PATH.fixPath(location.pathname);
    const matchedDummyRoute = Router.matchPath(fixedPath);
    Router.setSearchParams(location.search);
    Router.historyReplace(fixedPath, null); // to set the initial history state to avoid (null)
    Router.updateCurrent({
      path: fixedPath,
      renderTargetId: null,
      dummyRoute: matchedDummyRoute,
    });
    Router.clearDummyCacheInterval();
    Router.__instance = this; // set the singleton instance
    if (import.meta.env.DEV) {
      Router.logger();
    }
  }

  // PRIVATES
  // ===========================================================================================
  private static get routeMap() {
    return this._routeMap!;
  }

  private static matchPath = (fixedPath: string) => {
    const dummyPath = PATH.pathToDummyPath(fixedPath);
    const dummyRoute = Router.routeMap.get(dummyPath);
    return dummyRoute;
  };

  private static dummyNotFoundRoute = (path: string) => {
    return {
      path: "",
      dummyPath: "",
      params: null,
      view: Router.__notFoundView!,
      static: PATH.getStaticRoutes(path),
    } satisfies Router.DummyRoute;
  };

  private static setSearchParams = (searchParams: URLSearchParams | string) => {
    Router._urlSearchParams = new URLSearchParams(searchParams);
  };

  private static updateCurrent = ({
    path,
    renderTargetId,
    dummyRoute,
    viewTransition,
  }: {
    path: string;
    renderTargetId: string | null;
    dummyRoute?: Router.DummyRoute;
    viewTransition?: ViewTransition;
  }) => {
    Router._current = dummyRoute ?? this.dummyNotFoundRoute(path);
    Router._currentPath = path as Router.Path;
    Router.preRender();

    // skip view transition if the last route is popup
    if (viewTransition && Router._currentView?.isPopupView) {
      viewTransition.skipTransition();
    }

    // skip view transition if the new route is popup too
    Router._currentView = new Router.current.view();

    if (viewTransition && Router._currentView.isPopupView) {
      viewTransition.skipTransition();
    }
    Router._currentView.render({ renderTargetId });
  };

  private buildRouteMap = (routes: Router.Route[]) => {
    // this map will remove redundant routes too
    Router._routeMap = new Map(
      routes.map((route) => {
        const path = PATH.fixPath(route.path);
        const dummyPath = PATH.pathToDummyPath(path);
        const params = PATH.getParams(path);

        return [
          dummyPath,
          {
            path,
            dummyPath,
            view: route.view,
            params: params,
            static: PATH.getStaticRoutes(dummyPath),
          },
        ];
      })
    );
  };

  private static historyReplace = (
    path: string,
    renderTargetId: string | null
  ) => {
    history.replaceState(
      { path, renderTargetId },
      "",
      Router.getPathQuery(path)
    );
  };
  private static historyPush = (
    path: string,
    renderTargetId: string | null
  ) => {
    history.pushState({ path, renderTargetId }, "", Router.getPathQuery(path));
  };

  private static updateHistory = (
    path: string,
    replace: boolean = !1,
    renderTargetId: string | null
  ) => {
    if (replace) {
      this.historyReplace(path, renderTargetId);
    } else {
      this.historyPush(path, renderTargetId);
    }
  };

  private static matchLinkActiveStaticRoutes = (linkPath: string) => {
    const linkStaticRoutes = PATH.getStaticRoutes(linkPath);
    const currentStaticRoutes = Router.current.static;

    if (!linkStaticRoutes || !currentStaticRoutes) {
      if (Router.current.path === "/" && linkPath === "/") return true;
      return false;
    }

    let A = currentStaticRoutes,
      B = linkStaticRoutes;

    if (A.length - B.length > 0) [A, B] = [B, A]; // swap

    for (let i = 0, len = A.length; i < len; ++i)
      if (A[i] !== B[i]) return false;
    return true;
  };

  private static getMatchedParams = (): { [k: string]: string } | null => {
    const routeParams = Router.current.params;
    const pathParams = PATH.getParams(Router.currentPath);

    if (routeParams && pathParams) {
      const params = Object.create(null);
      for (let i = 0; i < routeParams.length; ++i) {
        params[routeParams[i]] = pathParams[i];
      }
      return params;
    }
    return null;
  };

  private static getLinkHref(linkEle: Types.AbstractLinkType): string {
    return (
      location.origin + (linkEle.relative ? this.currentPath : "") + linkEle.to
    );
  }

  private static logger = async (moreData?: any) => {
    setTimeout(() => {
      console.clear();
      console.log("\x1b[32m\x1b[1m>> Dummy Router Info:", {
        current: Router.current,
        currentPath: Router.currentPath,
        currentView: Router._currentView,
        dummyCache: Router._dummyCache,
        historyState: Router.historyState,
        routeMap: this.routeMap,
        urlSearchParams: Object.fromEntries(Router._urlSearchParams!.entries()),
        pathQuery: Router.getPathQuery(),
        moreData,
      });
    }, 0);
  };
  // ===========================================================================================

  // PUBLICS
  // ===========================================================================================

  // --------------------------------------------------
  /**
   * use this function to navigate back relative to the current route
   * @param steps the number of back steps
   * @info steps >= 1
   * @default 1
   */
  public static navigateBack = async (steps: number = 1) => {
    if (steps <= 0) return;
    const pathSegments = PATH.PathToSegments(this.currentPath);
    if (pathSegments.length === 0) return;

    const cutIndex = pathSegments.length - steps;
    let path;

    if (cutIndex <= 0) {
      path = "";
    }

    path = PATH.segmentsToPath(pathSegments.slice(0, cutIndex)) as Router.Path;
    this.navigateTo({ path, renderTargetId: null });
  };

  public static navigateTo = async ({
    path,
    query,
    relative,
    renderTargetId,
    replace,
  }: {
    path: Router.Path;
    renderTargetId: string | null;
    query?: string;
    relative?: boolean;
    replace?: boolean;
  }) => {
    const fullPath = relative ? this.currentPath : PATH.fixPath(path);
    const pathQuery = query ? fullPath + query : fullPath;

    if (pathQuery !== Router.getPathQuery()) {
      const url = new URL(location.origin + pathQuery);
      const pathname = url.pathname;
      const matchedDummyRoute = Router.matchPath(pathname);
      Router.setSearchParams(url.searchParams);
      Router.updateHistory(pathname, replace, renderTargetId);

      if (!document.startViewTransition || Router.isTheSamePath(fullPath)) {
        Router.updateCurrent({
          path: pathname,
          renderTargetId,
          dummyRoute: matchedDummyRoute,
        });
      } else {
        document.startViewTransition(() => {
          Router.updateCurrent({
            path: pathname,
            renderTargetId,
            dummyRoute: matchedDummyRoute,
          });
        });
      }

      if (import.meta.env.DEV) {
        Router.logger(url.search);
      }
    }
  };

  /** This function will just rerender the route */
  public static softReload = async () => {
    Router.updateCurrent({
      path: this.currentPath,
      renderTargetId: null,
      dummyRoute: this._current!,
    });
  };

  public linkClickNavigation = async (e: MouseEvent) => {
    const linkEle = (e.target as HTMLElement).closest(
      `a[data-link]`
    ) as Types.AbstractLinkType;

    if (linkEle) {
      e.preventDefault();
      const isRelative = linkEle.relative;
      const path = PATH.fixPath(linkEle.to);
      const pathQuery = isRelative ? Router.currentPath + path : path;

      if (pathQuery !== Router.getPathQuery()) {
        const url = new URL(location.origin + pathQuery);
        const matchedDummyRoute = Router.matchPath(url.pathname);
        const renderTargetId = linkEle.renderTarget;
        Router.setSearchParams(url.searchParams);
        Router.updateHistory(url.pathname, linkEle.replace, renderTargetId);

        if (!document.startViewTransition || Router.isTheSamePath(Router.currentPath)) {
          Router.updateCurrent({
            path: url.pathname,
            renderTargetId,
            dummyRoute: matchedDummyRoute,
          });
        } else {
          const viewTransition = document.startViewTransition(() => {
            Router.updateCurrent({
              path: url.pathname,
              renderTargetId,
              dummyRoute: matchedDummyRoute,
              viewTransition,
            });
          });
        }

        if (import.meta.env.DEV) {
          Router.logger();
        }
      }
    }
  };

  public popStateNavigation = async () => {
    const { path, renderTargetId } = Router.historyState;
    const matchedDummyRoute = Router.matchPath(path);
    Router.setSearchParams(location.search);

    if (!document.startViewTransition || Router.isTheSamePath(Router.currentPath)) {
      Router.updateCurrent({
        path,
        renderTargetId,
        dummyRoute: matchedDummyRoute,
      });
    } else {
      const viewTransition = document.startViewTransition(() => {
        Router.updateCurrent({
          path,
          renderTargetId,
          dummyRoute: matchedDummyRoute,
          viewTransition,
        });
      });
    }

    if (import.meta.env.DEV) {
      Router.logger();
    }
  };
  // --------------------------------------------------

  public static getPathQuery(path?: string) {
    const pathname = path ?? location.pathname;
    return Router._urlSearchParams?.size
      ? `${pathname}?${Router._urlSearchParams.toString()}`
      : pathname;
  }

  public static isTheSamePathQuery(pathQuery: string) {
    const locPathQuery = location.pathname + location.search;
    return pathQuery === locPathQuery;
  }

  public static isTheSamePath(path: string) {
    return path === location.pathname;
  }

  public static get historyState() {
    return history.state as Router.HistoryState;
  }

  public static get current() {
    return Router._current!;
  }
  public static get currentPath() {
    return Router._currentPath!;
  }

  /**
   * @param element the element that this function will use to search for links to activate inside it.
   * @info will use (document) by default for searching.
   */
  public static setActiveLinks = async (element?: HTMLElement) => {
    (element ?? document).querySelectorAll("a[data-nav]").forEach((ele) => {
      const link = ele as Types.AbstractLinkType;
      const linkPath = new URL(Router.getLinkHref(link)).pathname;
      const isTheSameRoute = linkPath === Router.currentPath;
      const isActive = link.strictActive
        ? isTheSameRoute
        : this.matchLinkActiveStaticRoutes(linkPath);

      if (isActive) {
        link.classList.add("active");
        isTheSameRoute
          ? link.classList.add("exact")
          : link.classList.remove("exact");
      } else {
        link.classList.remove("active", "exact");
      }
    });
  };

  public static dummyFetch = async (
    url: string | URL | Request,
    dummyOptions: Router.DummyFetchOptions,
    fetchOptions?: RequestInit
  ): Promise<unknown> => {
    // just fetch the data if router cache is disabled
    if (!Router._dummyCacheEnebled) {
      return await fetch(url).then((res) => res.json());
    }

    const { cachable, cacheTarget, cacheTimeout } = {
      cachable: dummyOptions?.cachable ?? true,
      cacheTarget: dummyOptions?.cacheTarget ?? Router.currentPath,
      cacheTimeout: dummyOptions?.cacheTimeout ?? 180000,
    } as Router.DummyFetchOptions;

    if (cachable) {
      // get the cached data
      const cacheInfo = this._dummyCache!.get(cacheTarget!);
      if (cacheInfo) {
        const cachedValue = cacheInfo.data;
        const isAlive = Date.now() < cacheInfo.timeout;
        if (cachedValue && isAlive) return cachedValue;
      }
    }

    // fake loading
    // await waitFor(((Math.random() * 5 + 1) >>> 0) * 1000);

    const data = await fetch(url, fetchOptions).then((res) => res.json());

    if (cachable) {
      // save data in dummyCache
      Router._dummyCache!.set(cacheTarget!, {
        data,
        timeout: Date.now() + cacheTimeout!,
      });
    }
    return data;
  };

  public static clearDummyCacheInterval = async () => {
    // this function will set the clear cache interval
    // only if the router cache is enabled
    if (!Router._dummyCacheEnebled || Router._immortalDummyCache) return;
    setInterval(() => {
      Router._dummyCache!.clear();
      // setTimeout(console.log, 50, "DummyCache killed 💀");
    }, Router._dummyCacheMaxAge);
  };

  /** this function called by the updateCurrent funciton before the render */
  public static preRender = async () => {
    Router._currentView?.cleanup();
    Router.setActiveLinks();
  };

  /** this function called by the DummyView after the render is done. */
  public static postRender = async () => {};

  public static useParams = () => {
    return Router.getMatchedParams();
  };

  public static useSearchParams = () => {
    return Router._urlSearchParams!;
  };
  // ===========================================================================================
}
