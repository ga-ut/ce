#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const packageJsonPath = resolve(process.argv[2] ?? "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const packageName = packageJson.name;

if (!packageName) {
  throw new Error(`Package name is missing in ${packageJsonPath}`);
}

const requestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
const requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;

if (!requestUrl || !requestToken) {
  throw new Error(
    "GitHub Actions OIDC environment is unavailable. Check id-token: write permission.",
  );
}

const idTokenResponse = await fetch(
  `${requestUrl}&audience=${encodeURIComponent("npm:registry.npmjs.org")}`,
  {
    headers: {
      authorization: `Bearer ${requestToken}`,
    },
  },
);

if (!idTokenResponse.ok) {
  const body = await idTokenResponse.text();
  throw new Error(
    `Failed to request GitHub OIDC token: ${idTokenResponse.status} ${idTokenResponse.statusText} ${body}`,
  );
}

const { value: idToken } = await idTokenResponse.json();

if (!idToken) {
  throw new Error("GitHub OIDC token response did not include a value.");
}

const exchangeResponse = await fetch(
  `https://registry.npmjs.org/-/npm/v1/oidc/token/exchange/package/${encodeURIComponent(packageName)}`,
  {
    method: "POST",
    headers: {
      authorization: `Bearer ${idToken}`,
    },
  },
);

if (!exchangeResponse.ok) {
  const body = await exchangeResponse.text();
  throw new Error(
    `Failed to exchange OIDC token for npm token: ${exchangeResponse.status} ${exchangeResponse.statusText} ${body}`,
  );
}

const { token } = await exchangeResponse.json();

if (!token) {
  throw new Error("npm OIDC exchange response did not include a token.");
}

process.stdout.write(token);
