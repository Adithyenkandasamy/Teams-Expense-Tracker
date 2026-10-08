/**
 * Domain types mirroring the FastAPI backend models and schemas.
 */

export type GroupRole = "OWNER" | "LEADER" | "MEMBER";

export type ExpenseStatus = "ACTIVE" | "READY_TO_CLOSE" | "CLOSED";

export type PaymentStatus = "PENDING" | "PAYMENT_SUBMITTED" | "PAID" | "REJECTED";

export interface User {
  id: string;
  firebase_uid: string;
  name: string;
  email: string;
  phone?: string | null;
  upi_id?: string | null;
  upi_qr_url?: string | null;
  profile_image?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
  user?: User | null;
}

export interface Group {
  id: string;
  name: string;
  description?: string | null;
  invite_code: string;
  created_by: string;
  leader_id?: string | null;
  member_count?: number;
  created_at: string;
  updated_at: string;
  members?: GroupMember[];
}

export interface PaymentProof {
  id: string;
  expense_split_id: string;
  uploaded_by: string;
  image_url: string;
  created_at: string;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount: string | number;
  status: PaymentStatus;
  payment_submitted_at?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
  user?: User | null;
  payment_proofs?: PaymentProof[];
}

export interface Expense {
  id: string;
  group_id: string;
  created_by: string;
  paid_by: string;
  amount: string | number;
  description: string;
  category?: string | null;
  initial_deadline: string;
  current_deadline: string;
  next_reminder_at?: string | null;
  status: ExpenseStatus;
  receipt_url?: string | null;
  closed_at?: string | null;
  created_at: string;
  updated_at: string;
  splits: ExpenseSplit[];
  creator?: User | null;
  payer?: User | null;
}

export interface BalanceEntry {
  user_id: string;
  user_name: string;
  amount: string | number;
}

export interface GroupBalanceResponse {
  group_id: string;
  group_name: string;
  total_owed_to_you: string | number;
  total_you_owe: string | number;
  net_balance: string | number;
  balances: BalanceEntry[];
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  timestamp: string;
  read: boolean;
  data?: Record<string, any>;
}
