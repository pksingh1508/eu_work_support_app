type HapticsModule = typeof import("expo-haptics");

let hapticsModule: HapticsModule | null | undefined;

/**
 * Resolved lazily and guarded, so a build that predates the expo-haptics native
 * module (e.g. an older dev client) simply skips feedback instead of crashing.
 */
function getHaptics() {
  if (hapticsModule === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      hapticsModule = require("expo-haptics") as HapticsModule;
    } catch {
      hapticsModule = null;
    }
  }

  return hapticsModule;
}

function run(task: (module: HapticsModule) => Promise<void>) {
  const module = getHaptics();

  if (!module) {
    return;
  }

  try {
    task(module).catch(() => {
      // Devices without a vibrator simply ignore haptics.
    });
  } catch {
    // Native module present but unavailable on this device.
  }
}

/** Fire-and-forget haptics so call-sites never have to await or catch. */
export const haptics = {
  selection: () => run((h) => h.selectionAsync()),
  light: () => run((h) => h.impactAsync(h.ImpactFeedbackStyle.Light)),
  medium: () => run((h) => h.impactAsync(h.ImpactFeedbackStyle.Medium)),
  success: () => run((h) => h.notificationAsync(h.NotificationFeedbackType.Success)),
  warning: () => run((h) => h.notificationAsync(h.NotificationFeedbackType.Warning)),
  error: () => run((h) => h.notificationAsync(h.NotificationFeedbackType.Error)),
};
