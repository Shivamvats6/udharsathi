import dotenv from "dotenv";
dotenv.config();

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  PORT: Number(process.env.PORT || 4000),
  NODE_ENV: optional("NODE_ENV", "development"),
  JWT_SECRET: optional("JWT_SECRET", "dev-secret-change-me"),
  CORS_ORIGIN: optional("CORS_ORIGIN", "http://localhost:5173"),

  STORAGE_PROVIDER: optional("STORAGE_PROVIDER", "local") as "local" | "google",

  GOOGLE_SPREADSHEET_ID: optional("GOOGLE_SPREADSHEET_ID"),
  GOOGLE_SERVICE_ACCOUNT_JSON: optional("GOOGLE_SERVICE_ACCOUNT_JSON"),
  GOOGLE_SERVICE_ACCOUNT_KEY_FILE: optional("GOOGLE_SERVICE_ACCOUNT_KEY_FILE"),
  DRIVE_APP_FOLDER_NAME: optional("DRIVE_APP_FOLDER_NAME", "FinancerApp"),

  GOOGLE_OAUTH_CLIENT_ID: optional("GOOGLE_OAUTH_CLIENT_ID"),
  GOOGLE_OAUTH_CLIENT_SECRET: optional("GOOGLE_OAUTH_CLIENT_SECRET"),
  GOOGLE_OAUTH_REDIRECT_URI: optional("GOOGLE_OAUTH_REDIRECT_URI"),

  DEMO_LOGIN_EMAIL: optional("DEMO_LOGIN_EMAIL", "shivam@finance.com"),
  DEMO_LOGIN_PASSWORD: optional("DEMO_LOGIN_PASSWORD", "finwise123"),
};
