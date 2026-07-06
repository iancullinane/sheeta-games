import { loadConfig } from "../lib/config";

describe("loadConfig", () => {
  test("loads and parses the root config.yaml", () => {
    const config = loadConfig();

    expect(config).toMatchObject({
      name: "adventurebrave",
      tags: {
        Environment: "dev",
        Project: "adventurebrave",
      },
      foundation: {
        network: {
          domains: [{ name: "adventurebrave.com" }],
        },
      },
    });
  });

  test("throws when the config file does not exist", () => {
    expect(() => loadConfig("does-not-exist.yaml")).toThrow();
  });
});
