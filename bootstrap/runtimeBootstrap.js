import dotenv from "dotenv";

import {
  loadSecurityConfig,
} from "../security/securityConfig.js";

/**
 * Loads and validates runtime configuration for the CellCount backend.
 *
 * This is the single composition boundary for environment-backed values.
 * It intentionally returns a frozen snapshot so downstream modules cannot
 * mutate process configuration during request handling.
 */
export function bootstrapRuntime({
  env = process.env,
  logger = console,
  loadEnv = () => dotenv.config(),
  securityConfigLoader = loadSecurityConfig,
} = {}) {
  loadEnv();

  const securityConfig =
    securityConfigLoader(env);

  const openAIApiKey =
    env.OPENAI_API_KEY;

  const openAIModel =
    env.OPENAI_MODEL ||
    "gpt-4.1";

  const port =
    env.PORT ||
    3000;

  logger.log(
    "🔑 OpenAI API:",
    openAIApiKey
      ? "CONFIGURADA"
      : "NÃO CONFIGURADA",
  );

  logger.log(
    "🧠 Modelo:",
    openAIModel,
  );

  return Object.freeze({
    openAIApiKey,
    openAIModel,
    port,
    securityConfig,
  });
}
