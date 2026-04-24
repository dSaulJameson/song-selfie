function normalizeEnvValue(value: string) {
  const trimmed = value.trim();
  const connectionStringMatch = trimmed.match(/postgres(?:ql)?:\/\/[^'"\s]+/i);

  if (connectionStringMatch) {
    return connectionStringMatch[0];
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function getFirstEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim().length > 0) {
      return normalizeEnvValue(value);
    }
  }

  return null;
}

function requireEnv(name: string, ...aliases: string[]) {
  const value = getFirstEnv(name, ...aliases);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getBaseUrl() {
  const rawValue =
    getFirstEnv("NEXT_PUBLIC_APP_URL", "APP_URL", "VERCEL_PROJECT_PRODUCTION_URL") ??
    "http://localhost:3000";

  const withScheme = /^https?:\/\//.test(rawValue)
    ? rawValue
    : `https://${rawValue}`;

  return withScheme.replace(/\/$/, "");
}

export function getDatabaseUrl() {
  return requireEnv("DATABASE_URL");
}

export function getFineTuneConfig() {
  return {
    apiKey: requireEnv("FINETUNE_API_KEY", "FINETUNING_API_KEY"),
    baseUrl: getFirstEnv("FINETUNE_BASE_URL") ?? "https://pub.finetuning.ai",
  };
}

export function getStripeConfig() {
  return {
    secretKey: requireEnv("STRIPE_SECRET_KEY"),
    webhookSecret: requireEnv("STRIPE_WEBHOOK_SECRET"),
    publishableKey: requireEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
  };
}

export function getS3Config() {
  return {
    bucket: getFirstEnv("S3_BUCKET", "S3_BUCKET_NAME", "AWS_S3_BUCKET"),
    region: getFirstEnv("AWS_REGION", "S3_REGION", "SES_REGION"),
    accessKeyId: getFirstEnv(
      "AWS_ACCESS_KEY_ID",
      "S3_ACCESS_KEY",
      "SES_ACCESS_KEY",
    ),
    secretAccessKey: getFirstEnv(
      "AWS_SECRET_ACCESS_KEY",
      "S3_SECRET_KEY",
      "SES_SECRET_KEY",
    ),
    publicBaseUrl: getFirstEnv("S3_PUBLIC_BASE_URL"),
  };
}

export function getSesConfig() {
  return {
    region: requireEnv("SES_REGION", "AWS_REGION"),
    accessKeyId: requireEnv("SES_ACCESS_KEY", "AWS_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("SES_SECRET_KEY", "AWS_SECRET_ACCESS_KEY"),
    fromEmail: getFirstEnv("SES_FROM_EMAIL", "EMAIL_FROM", "FROM_EMAIL"),
  };
}

export function getAdminEmails() {
  return (getFirstEnv("ADMIN_EMAILS") ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
