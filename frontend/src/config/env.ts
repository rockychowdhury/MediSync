/**
 * Environment variable validation.
 * Import this in layout.tsx or middleware to catch missing env vars early.
 */

function getEnvVar(key: string, fallback?: string): string {
    const value = process.env[key] ?? fallback;
    if (!value) {
        throw new Error(`Missing environment variable: ${key}`);
    }
    return value;
}

export const env = {
    NEXT_PUBLIC_API_URL: getEnvVar(
        "NEXT_PUBLIC_API_URL",
        "http://localhost:8000/api/v1"
    ),
    NEXT_PUBLIC_APP_NAME: getEnvVar("NEXT_PUBLIC_APP_NAME", "MediSync"),
    NEXT_PUBLIC_APP_URL: getEnvVar(
        "NEXT_PUBLIC_APP_URL",
        "http://localhost:3000"
    ),
};
