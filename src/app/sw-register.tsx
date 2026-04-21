"use client";

import { useRegisterServiceWorker } from "@/hooks/use-register-sw";

export function ServiceWorkerRegister() {
  useRegisterServiceWorker();
  return null;
}