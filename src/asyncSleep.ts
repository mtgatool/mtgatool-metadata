export default function asyncSleep<T>(ms: number): (x: T) => Promise<T> {
  return function (x: T) {
    return new Promise((resolve) => setTimeout(() => resolve(x), ms));
  };
}
