"use client";

import { useRef } from "react";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

const buttonClassName =
  "rounded-xl border px-3 py-1.5 text-sm font-medium hover:bg-slate-50";

/**
 * Offers to install the app: the browser's dialog where available, and
 * step-by-step instructions on iOS. Hidden once the app is installed.
 */
export function InstallButton() {
  const { mode, promptInstall } = useInstallPrompt();
  const dialogRef = useRef<HTMLDialogElement>(null);

  if (mode === "prompt") {
    return (
      <button onClick={() => promptInstall()} className={buttonClassName}>
        Install app
      </button>
    );
  }

  if (mode !== "ios") return null;

  return (
    <>
      <button
        onClick={() => dialogRef.current?.showModal()}
        className={buttonClassName}
      >
        Install app
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="install-dialog-title"
        className="m-auto max-w-sm rounded-2xl p-6 shadow-xl backdrop:bg-slate-900/40"
        // Clicking the backdrop (outside the content) closes the dialog.
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current.close();
        }}
      >
        <h2 id="install-dialog-title" className="text-lg font-semibold">
          Install Meeting Rooms
        </h2>

        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li>
            Tap the <strong>Share</strong> button in the browser toolbar.
          </li>
          <li>
            Choose <strong>Add to Home Screen</strong>.
          </li>
          <li>
            Tap <strong>Add</strong>. The app opens from your home screen like
            any other app and works offline.
          </li>
        </ol>

        <form method="dialog" className="mt-6 flex justify-end">
          <button className={buttonClassName}>Close</button>
        </form>
      </dialog>
    </>
  );
}
