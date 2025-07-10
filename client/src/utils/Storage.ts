/**
 * sotre only string values
 */

type Store = "localStorage" | "sessionStorage";

export class _Storage {
  public static save(key: string, data: any, store: Store) {
    window[store].setItem(key, JSON.stringify(data));
  }

  public static read(key: string, store: Store): unknown | null {
    const storedValue = window[store].getItem(key);
    if (storedValue) {
      return JSON.parse(storedValue);
    }
    return null;
  }

  public static push(key: string, newValue: any, store: Store) {
    const oldData = _Storage.read(key, store) as any[];
    if (oldData) {
      oldData.push(newValue);
      _Storage.save(key, oldData, store);
    } else {
      _Storage.save(key, [newValue], store);
    }
  }

  public static delete(key: string, store: Store) {
    window[store].removeItem(key);
  }
}
