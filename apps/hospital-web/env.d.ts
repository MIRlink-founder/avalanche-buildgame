declare namespace NodeJS {
  interface ProcessEnv {
    // 서버 전용
    DATABASE_URL: string;
    DIRECT_URL: string;
    AUTH_SECRET: string;
    NICEPAY_MID: string;
    NICEPAY_MERCHANT_KEY: string;
    NICEPAY_API_BASE?: string;
    PAYMENT_PROVIDER?: string;
    SMTP_HOST?: string;
    SMTP_PORT?: string;
    SMTP_USER?: string;
    SMTP_PASS?: string;
    SMTP_FROM?: string;
    CRON_SECRET?: string;

    // 클라이언트 노출 가능 (NEXT_PUBLIC_ 접두사)
    NEXT_PUBLIC_CHAIN_ID: string;
    NEXT_PUBLIC_AVALANCHE_RPC_URL?: string;
    NEXT_PUBLIC_FUJI_RPC_URL?: string;
    NEXT_PUBLIC_APP_URL?: string;
  }
}
