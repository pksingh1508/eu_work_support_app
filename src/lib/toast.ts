import { toast } from "sonner-native";

type SavedToastType = "country" | "document";

const toastDuration = 2200;

export function showSavedToast(name: string, type: SavedToastType) {
  toast.success(type === "country" ? "Country saved" : "Document saved", {
    description: name,
    duration: toastDuration,
  });
}

export function showUnsavedToast(name: string, type: SavedToastType) {
  toast.info(
    type === "country" ? "Country removed" : "Document removed",
    {
      description: name,
      duration: toastDuration,
    },
  );
}

export function showInfoToast(title: string, description?: string) {
  toast.info(title, {
    description,
    duration: toastDuration,
  });
}
