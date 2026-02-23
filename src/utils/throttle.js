export function throttle(fn, wait = 120, options = {}) {
  if (typeof fn !== 'function') {
    throw new TypeError('Expected a function');
  }

  const { leading = true, trailing = false } = options;
  let lastCallTime = 0;
  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;

  const invoke = (time) => {
    lastCallTime = time;
    const args = lastArgs;
    const context = lastThis;
    lastArgs = null;
    lastThis = null;
    fn.apply(context, args);
  };

  const startTimer = (remaining) => {
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (trailing && lastArgs) {
        invoke(Date.now());
      }
    }, remaining);
  };

  function throttled(...args) {
    const now = Date.now();
    if (!lastCallTime && !leading) {
      lastCallTime = now;
    }

    const remaining = wait - (now - lastCallTime);
    lastArgs = args;
    lastThis = this;

    if (remaining <= 0 || remaining > wait) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      invoke(now);
    } else if (trailing && !timeoutId) {
      startTimer(remaining);
    }
  }

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastCallTime = 0;
    lastArgs = null;
    lastThis = null;
  };

  return throttled;
}
