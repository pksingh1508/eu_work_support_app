const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const PODS = [
  "GoogleUtilities",
  "RecaptchaInterop",
];

module.exports = function withGooglePodModularHeaders(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, "Podfile");

      if (!fs.existsSync(podfilePath)) {
        return config;
      }

      let contents = fs.readFileSync(podfilePath, "utf8");
      const missingPods = PODS.filter(
        (pod) => !contents.includes(`pod '${pod}', :modular_headers => true`),
      );

      if (missingPods.length === 0) {
        return config;
      }

      const podLines = missingPods
        .map((pod) => `  pod '${pod}', :modular_headers => true`)
        .join("\n");
      const insertion = [
        "",
        "  # GoogleSignIn 9 pulls AppCheckCore into a static Swift pod.",
        podLines,
        "",
      ].join("\n");

      contents = contents.replace(/(\n\s*use_expo_modules!\n)/, `$1${insertion}`);
      fs.writeFileSync(podfilePath, contents);

      return config;
    },
  ]);
};
