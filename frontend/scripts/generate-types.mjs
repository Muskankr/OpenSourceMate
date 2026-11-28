#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateTypeScriptTypes } from "../utils/openApiCodegen.ts";

const scriptFile = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptFile);

const SCHEMA_PATH = path.resolve(scriptDir, "../../backend/openapi.json");
const OUTPUT_PATH = path.resolve(scriptDir, "../types/generated-api.ts");

const isCheckMode = process.argv.includes("--check");

let rawSchema;
if (fs.existsSync(SCHEMA_PATH)) {
  rawSchema = fs.readFileSync(SCHEMA_PATH, "utf-8");
} else {
  rawSchema = JSON.stringify({
    openapi: "3.1.0",
    info: { title: "OpenSourceMate API", version: "0.1.0" },
    components: {
      schemas: {
        GitHubUserProfile: {
          type: "object",
          required: ["username", "avatar_url"],
          properties: {
            username: { type: "string", description: "GitHub user login handle" },
            name: { type: "string", nullable: true, description: "Display name" },
            bio: { type: "string", nullable: true, description: "Bio text" },
            avatar_url: { type: "string", description: "Avatar URL" },
            public_repositories: { type: "integer", description: "Public repository count" },
            followers: { type: "integer", description: "Followers count" },
          },
        },
        IssueRecommendation: {
          type: "object",
          required: ["id", "title", "url", "repository", "difficulty", "match_score"],
          properties: {
            id: { type: "integer", description: "Issue unique ID" },
            title: { type: "string", description: "Issue title" },
            url: { type: "string", description: "HTML URL on GitHub" },
            repository: { type: "string", description: "Repository full name" },
            difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
            match_score: { type: "number", description: "Confidence score" },
            match_reasons: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
  });
}

const generatedTs = generateTypeScriptTypes(rawSchema);

if (isCheckMode) {
  if (!fs.existsSync(OUTPUT_PATH)) {
    console.error(
      `Error: Generated types file missing at ${OUTPUT_PATH}. Run 'npm run codegen:types'`
    );
    process.exit(1);
  }
  const existingTs = fs.readFileSync(OUTPUT_PATH, "utf-8");
  if (existingTs.trim() !== generatedTs.trim()) {
    console.error(
      `Error: Generated TypeScript types are out of date with OpenAPI schema! Run 'npm run codegen:types'`
    );
    process.exit(1);
  }
  console.log("✓ TypeScript types are up to date with OpenAPI schema.");
  process.exit(0);
} else {
  fs.writeFileSync(OUTPUT_PATH, generatedTs, "utf-8");
  console.log(`✓ Successfully generated TypeScript types at ${OUTPUT_PATH}`);
}
