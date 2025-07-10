export default class PATH {
  constructor() {
    throw new Error("Unable to create an instance from the (PATH) class");
  }

  static PathToSegments = (path: string) => {
    return path.split("/").filter((seg) => seg);
  };

  static segmentsToPath = (segments: string[]) => {
    return "/" + segments.join("/");
  };

  /**
   * - get the dynamic params array from the path
   * - for example:  /users/[id]/[postID]
   * - result:  [ 'id', 'postID' ]
   */
  static getParams = (path: string) => {
    return path.match(/(?<=\[)(?:\w+)(?=\])/g);
  };

  /** /users/[id] => /users/[x] */
  /**
   * - converts normal-path to a dummy-path
   * - for example:  /users/[id]/[postID]
   * - result:  /users/[x]/[x]
   */
  static pathToDummyPath = (path: string) => {
    return path.replace(/(?<=\[)\w+(?=\])/g, "x");
  };

  /**
   * - use it to extract the static routes from the path
   * - for example:  /abc/[id]/def/[postID]/xyz
   * - result:  [ 'abc', 'def', 'xyz' ]
   */
  static getStaticRoutes = (path: string) => {
    return path.match(/(?<!\[)\w+(?!\])/g);
  };

  /**
   * - [1] add forward slash at the begin
   * - [2] remove forward slashs at the end
   * - [3] replace any redundant forward slashes or empty string with "/"
   */
  static fixPath = (path: string) => {
    return ("/" + path).replace(/\/+$/g, "").replace(/\/+|^$/g, "/");
  };

  /**
   * - converts dynamic route to regex obejct
   * - for example: /user/[id]
   * - result: /^\/user\/(.+)$/
   */
  static pathToRegex = (path: string) => {
    const dynamicRegex: RegExp =
      /(?<=\/)\[\w+\]|(?<=\/)\[\w+\](?=\/)|\[\w+\](?=\/)|^\[\w+\]$/g;
    return new RegExp(`^${path.replace(dynamicRegex, "(.+)")}$`);
  };
}
