import { defineConfig } from "vitest/config";

// The endpoint tests start PHP in Docker in a beforeAll hook; the first run on a machine also downloads the image.
export default defineConfig({ test: { include: ["tests/unit/**/*.test.ts"], testTimeout: 60_000, hookTimeout: 180_000 } });
