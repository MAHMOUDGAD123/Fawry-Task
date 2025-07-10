declare namespace View {
  type ImportGlobFunctionType<FilesNames, Path, FileExtention> = Record<
    `${Path}${FilesNames}.${FileExtention}`,
    () => Promise<string>
  >;

  type ViewConstructor = new () => AbstractViewType;

  interface PopupControls {
    popupElement: HTMLElement;
    popupSignalController: AbortController;
    destructPopup: () => void;
  }

  interface AbstractViewType {
    readonly popupElementId: string;
    readonly popupCloseElementId: string;
    popupControls: PopupControls | null;
    readonly #loadingStateRenderDelay: number;
    readonly #staticViewTitle: string;
    readonly params: { [k: string]: string };
    readonly searchParams: URLSearchParams | null;
    readonly myPathQuery: string;
    staticRenderElementId: string;
    dynamicRenderElementId: string | null;
    #canRenderStaticLoadingState: boolean;
    #canRenderDynamicLoadingState: boolean;

    /**
     * if true -> this view will render as popup (renderTargetId="__main__")
     * else -> it will render as normal view (renderTargetId="__popup__")
     */
    isPopupView: boolean;

    /**
     * - this function is used to set the title of the page with the (this.title)
     *   provided in the view.
     * - otherwise, it will use the inherited value of it.
     */
    setTitle(title: string): void;

    /**
     * this funciton will be called by the - loading() - function to get the loader html
     * that's going to be render during the loading state of the view.
     */
    loaderHTML(): string;

    /**
     * this function will render the loader spinner to user until the - getStaticHTML() - method get the html.
     */
    staticLoading(): Promise<void>;

    /**
     * this function will render the loader spinner to user until the - getDynamicHTML() - method get the html.
     */
    dynamicLoading(): Promise<void>;

    /**
     * this funciton will be called by the - error() - function to get the loader html
     * that's going to be render during the error state of the view.
     */
    errorHTML(): string;

    /**
     * this function will render the error template if an error occur during rendering.
     * @param err the error object
     * @info
     * - you should provide an element with className "error-name".
     * - and an element with className "error-message".
     * - because this funciton will search for them to insert the error information into them.
     */
    error(err: Error | string, messageOnly: boolean): Promise<void>;

    /**
     * this function will get the initial static part of the view as string.
     */
    getStaticHTML(): Promise<string>;

    /**
     * - this function will call the - getStaticHTML() - function and get the initial string html.
     * - then create template element (HTMLTemplateElement) and build it using the string.
     * - then call - beforeStaticHTMLRender() - to do some work on the template before return.
     * - at the end it will return the final (HTMLTemplateElement) to render it.
     */
    #getStaticRenderHTMLTemplate(): Promise<HTMLTemplateElement>;

    /**
     * this function will get the static HTML by - getStaticRenderHTMLTemplate() - and render it.
     */
    #renderStaticHTML(): Promise<void>;

    /**
     * this function will return the initial dynamic part of the view as string.
     */
    getDynamicHTML(): Promise<string>;

    /**
     * - this function will call the - getDynamicHTML() - function and get the initial string html.
     * - then create template element (HTMLTemplateElement) and build it using the string.
     * - then call - beforeDynamicHTMLRender() - to do some work on the template before return.
     * - at the end it will return the final (HTMLTemplateElement) to render it.
     */
    #getDynamicRenderHTMLTemplate(): Promise<HTMLTemplateElement>;

    /**
     * this function will get the static HTML by - getDynamicRenderHTMLTemplate() - and render it.
     */
    #renderDynamicHTML(): Promise<void>;

    /**
     * this function controls the rendering process.
     * @param renderTargetId the id of the render element that is going to be the target of the rendering
     * @param popup a boolean value to tell the view if it will be render as a popup or not
     */
    render({
      renderTargetId,
    }: {
      renderTargetId: string | null;
    }): Promise<void>;

    /**
     * this funciton will be called by - getStaticRenderHTMLString() - function and before the render
     * to do some updates on the static template.
     * @param _template the created HTMLTemplateElement by the - getStaticRenderHTMLString() - function
     */
    beforeStaticHTMLRender(_template: HTMLTemplateElement): Promise<void>;

    /**
     * this funciton will be called by - getDynamicRenderHTMLString() - and before the render
     * to do some updates on the dynamic template.
     * @param _template the created HTMLTemplateElement by the - getDynamicRenderHTMLString() - function
     */
    beforeDynamicHTMLRender(_template: HTMLTemplateElement): Promise<void>;

    /**
     * this funciton will be called by the DummyView instance after - renderStaticHTML() - funciton is done.
     */
    afterStaticHTMLRender(): Promise<void>;

    /**
     * this funciton will be called by the DummyView instance after - renderDynamicHTML() - funciton is done.
     */
    afterDynamicHTMLRender(): Promise<void>;

    /**
     * this funciton will be called cleanup() before view unmount
     */
    beforeUnmount(): Promise<void>;

    /**
     * this funciton will be called by Router to do some clean-ups before unmount and before the next render
     */
    cleanup(): Promise<void>;
  }
}
