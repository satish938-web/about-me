type Listener = (value: number) => void;

export const scrollProgress = { current: 0 };
export const studioCue = { open: false };

export function openStudio() {
  studioCue.open = true;
}

const listeners = new Set<Listener>();

export function publishScroll(value: number) {
  scrollProgress.current = value;
  for (const listener of listeners) {
    listener(value);
  }
}

export function subscribeScroll(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readScrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (max <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, window.scrollY / max));
}
