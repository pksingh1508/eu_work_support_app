import { createElement } from "react";
import { toast } from "sonner-native";

import { PremiumToast, type PremiumToastVariant } from "@/components/ui/premium-toast";
import { haptics } from "@/lib/haptics";

type SavedToastType = "country" | "document";

const TOAST_DURATION = 2600;

function show(variant: PremiumToastVariant, title: string, description?: string, id?: string) {
  if (variant === "error") {
    haptics.error();
  } else if (variant === "warning") {
    haptics.warning();
  } else if (variant === "saved" || variant === "success") {
    haptics.success();
  }

  return toast.custom(createElement(PremiumToast, { variant, title, description }), {
    duration: TOAST_DURATION,
    // Re-using an id replaces the visible toast instead of piling up copies.
    id,
  });
}

export function showSavedToast(name: string, type: SavedToastType) {
  show("saved", type === "country" ? "Country saved" : "Guide saved", name, "saved-state");
}

export function showUnsavedToast(name: string, type: SavedToastType) {
  show("removed", type === "country" ? "Removed from saved" : "Guide removed", name, "saved-state");
}

export function showSuccessToast(title: string, description?: string) {
  show("success", title, description);
}

export function showInfoToast(title: string, description?: string) {
  show("info", title, description);
}

export function showWarningToast(title: string, description?: string) {
  show("warning", title, description);
}

export function showErrorToast(title: string, description?: string) {
  show("error", title, description);
}
