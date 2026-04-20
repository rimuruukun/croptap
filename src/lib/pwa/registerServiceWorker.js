import { registerSW } from "virtual:pwa-register";

export function registerCropTapServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return () => {};
  }

  const updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateServiceWorker(true);
    },
  });

  return updateServiceWorker;
}
