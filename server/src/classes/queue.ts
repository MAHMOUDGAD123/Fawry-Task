export class Queue<T> {
  #queue: { [k: string]: T };
  #rear: number;
  #front: number;

  constructor() {
    this.#queue = {};
    this.#front = 0;
    this.#rear = 0;
  }

  get size() {
    return this.#rear - this.#front;
  }

  get isEmpty() {
    return this.#rear - this.#front === 0;
  }

  public get peek() {
    return this.#queue[this.#front];
  }

  public print() {
    console.log(this.#queue, `-> size: ${this.size}`);
  }

  public enQueue(newValue: T) {
    this.#queue[this.#rear++] = newValue;
  }

  public deQueue() {
    const value = this.#queue[this.#front];
    delete this.#queue[this.#front];
    ++this.#front;
    return value;
  }
}