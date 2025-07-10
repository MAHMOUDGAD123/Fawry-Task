/**
 * wait for a random time between (0 -> ms)
 * @param ms duration in milliseconds
 */
export const waitFor = (ms: number) => {
  return new Promise((res) => setTimeout(res, (Math.random() * ms) >>> 0));
};

/**
 * this function will extract the form data from the form element
 * and return an object contains this data.
 * @param formEle the form element
 * @returns
 */
export const getFormData = (formEle: HTMLFormElement) => {
  return Object.fromEntries(new FormData(formEle));
};
