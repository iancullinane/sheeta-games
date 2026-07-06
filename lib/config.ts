import * as fs from "fs";
import * as path from "path";
import { load } from "js-yaml";

import { FoundationConfig } from "./foundation";
import { StorageConfig } from "./storage";

// Convention: the key under AppConfig for a given stack's config MUST match
// that stack's name (e.g. `foundation` maps to the `Foundation` stack /
// `FoundationConfig`). When a new stack is added later, its own file exports
// a `<StackName>Config` interface, and one field gets added here to
// `AppConfig` — the loader itself should not need to change.
export interface AppConfig {
  name: string;
  tags: {
    Environment: string;
    Project: string;
  };
  foundation: FoundationConfig;
  storage: StorageConfig;
}

export function loadConfig(configPath?: string): AppConfig {
  const resolvedPath = path.join(__dirname, "..", configPath ?? "config.yaml");
  const raw = fs.readFileSync(resolvedPath, "utf8");
  return load(raw) as AppConfig;
}
