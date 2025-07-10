declare namespace Types {
  type AbstractLinkType = HTMLAnchorElement & {
    /**
     * the (path) or the (pathQuery) that the router will use to navigate to
     */
    to: string;
    /**
     * tells the router to replace the current route with this one
     */
    replace: boolean;
    /**
     * the render target element id attribute
     */
    renderTarget: string | null;
    /**
     * to tell the router that this link anchor tag <a> is (strict active)
     * this means that this (nav-link) element will take the (.active.exact) className only if
     * the cutrrent (static parts) of the pathname is the same as the link's static parts.
     */
    strictActive: boolean;
    /**
     * to tell the router that this route is relative
     * this means that the
     * @info full-pathname = current-pathname + link-pathname
     * @example
     * - to="/posts"
     * - current="/users/[ahmed]"
     * - full-pathname = "/users/[ahmed]/posts"
     */
    relative: boolean;
    /**
     * this is the dataset of the link element it self
     * it have some meta data:
     * - link -> help the router to find it's links
     * - nav -> to tell the browser that the link is a nav link
     */
    dataset: DOMStringMap & {
      link: string;
      nav: "";
    };
  };
}
