declare namespace Router {
  type Path = "/" | "/account" | "/cart" | "/receipts";

  type Route = {
    path: Path;
    view: View.ViewConstructor;
    name: string;
  };

  type Routes = {
    data: Route[];
    notFound: View.ViewConstructor;
  };

  type DummyRoute = {
    path: string;
    dummyPath: string;
    view: View.ViewConstructor;
    params: RegExpMatchArray | null;
    static: RegExpMatchArray | null;
  };

  type ValidatedRoute = {
    route: Route;
    isMatch: boolean;
  };

  type HistoryParams = {
    [k: string]: string;
  };

  type HistoryState = {
    path: string;
    renderTargetId: string | null;
  };

  type Config = {
    /**
     * - enable dummy fetch caching or not
     * - if falsy router won't use fetch caching
     * - enabled by default
     * @default true
     */
    cache?: boolean;

    /**
     * - this value is for the clear cache store (setInterval)
     * - the router use it as a (timeout) for the (setInterval)
     * @default 600000 ms (10 minutes)
     */
    cacheMaxAge?: number;

    /**
     * - if true the clear cache (setInterval) won't be set
     * - the cache isn't immortal by default
     * @default false
     */
    immortalCache?: boolean;
  };

  type DummyFetchOptions = {
    /**
     * - used to cache this route or not
     * - if this option is falsy all options will be ignored too
     * @default true
     */
    cachable?: boolean;
    /**
     * - this is the cache 'key' that the router will use to hash the data in cache store
     * - if cacheTarget is provided the router will use it to get and store the data - else the router will just use the currnet pathname
     * @default Router.currentPath
     */
    cacheTarget?: string;
    /**
     * - the cache timeout im ms
     * - default is 3 minutes
     * @default 180000 ms
     */
    cacheTimeout?: number;
  };

  type CacheInfo = { data: any; timeout: number };
}
