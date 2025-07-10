type RequireOnly<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>;

type Prettify<T> = {
  [k in keyof T]: T[k];
} & {};