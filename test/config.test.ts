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

  test("loads the platform block", () => {
    const config = loadConfig();

    expect(config.platform).toMatchObject({
      clusterName: expect.any(String),
      kubernetesVersion: "1.31",
      nodeInstanceType: "t4g.small",
      nodeCount: { min: 1, desired: 2, max: 3 },
    });
  });

  test("throws when the config file does not exist", () => {
    expect(() => loadConfig("does-not-exist.yaml")).toThrow();
  });
});
