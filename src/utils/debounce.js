export function debounce(fn, wait = 180) {
  if (typeof fn !== 'function') {
    throw new TypeError('Expected a function');
  }

  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;

  const invoke = () => {
    if (!lastArgs) return;
    const args = lastArgs;
    const context = lastThis;
    lastArgs = null;
    lastThis = null;
    fn.apply(context, args);
  };

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      invoke();
    }, wait);
  }

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastThis = null;
  };

  debounced.flush = () => {
    if (!timeoutId) return;
    clearTimeout(timeoutId);
    timeoutId = null;
    invoke();
  };

  return debounced;
}
