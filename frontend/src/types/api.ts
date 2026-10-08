/**
 * API payload types matching FastAPI schemas.
 */

export interface CreateGroupPayload {
  name: string;
  description?: string;
}

export interface JoinGroupPayload {
  invite_code: string;
}

export interface CreateExpensePayload {
  amount: string; // Decimal string to avoid floating point issues
  description: string;
  category?: string;
  paid_by: string;
  split_between: string[];
  deadline: string; // ISO 8601 UTC string
}

export interface SubmitPaymentPayload {
  note?: string;
}

export interface PaymentActionPayload {
  note?: string;
}

export interface UpdateUserPayload {
  name?: string;
  phone?: string;
  upi_id?: string;
  upi_qr_url?: string;
  profile_image?: string;
}

export interface DeviceTokenPayload {
  token: string;
  device_type?: "android" | "ios" | "web";
}
