export type ProfileStatus = 'pending' | 'approved' | 'rejected' | 'banned';
export type Part = 'vocal' | 'guitar' | 'drum' | 'bass' | 'keyboard';
export type Purpose = '합주' | '강습' | '정기회의';

export interface Profile {
  id: string;
  kakao_id: string | null;
  display_name: string;
  avatar_url: string | null;
  part: Part[];
  bio: string | null;
  status: ProfileStatus;
  is_admin: boolean;
  banned_at: string | null;
  banned_reason: string | null;
  banned_by: string | null;
  created_at: string;
}

export interface AdminActionLog {
  id: string;
  admin_id: string | null;
  admin_name: string | null;
  target_id: string | null;
  target_name: string | null;
  action: 'approve' | 'reject' | 'ban' | 'unban' | 'promote' | 'demote' | 'delete';
  reason: string | null;
  created_at: string;
}

export interface Reservation {
  id: string;
  host_id: string;
  date: string;         // YYYY-MM-DD
  start_time: string;   // HH:MM (Supabase returns HH:MM:SS — normalized in utils/time.ts)
  end_time: string;     // HH:MM
  is_next_day: boolean;
  team_name: string;
  people_count: number;
  purpose: Purpose;
  created_at: string;
}

export interface ReservationWithDetails extends Reservation {
  host: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null;
  reservation_invitees: {
    user_id: string;
    profile: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null;
  }[];
}

export interface MyReservation extends ReservationWithDetails {
  role: 'host' | 'invitee';
}

export interface ReservationPolicySeason {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  note: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReservationPolicySeasonInput {
  name: string;
  start_date: string;
  end_date: string;
  note?: string | null;
  is_active: boolean;
}

// ── Events Hub ────────────────────────────────────────────
export interface EventCategory {
  id: string;
  name: string;
  color: string;       // hex
  icon: string;        // material symbols
  sort_order: number;
  created_at: string;
}

export interface ClubEvent {
  id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string;            // YYYY-MM-DD
  start_time: string | null;     // HH:MM(:SS)
  end_date: string | null;
  end_time: string | null;
  cover_image_url: string | null;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClubEventWithDetails extends ClubEvent {
  category: EventCategory | null;
  creator: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null;
  participants?: EventParticipant[];
}

export interface ClubEventInput {
  category_id: string | null;
  title: string;
  description?: string | null;
  location?: string | null;
  start_date: string;
  start_time?: string | null;
  end_date?: string | null;
  end_time?: string | null;
  cover_image_url?: string | null;
  is_public?: boolean;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  attended: boolean;
  joined_at: string;
  profile?: Pick<Profile, 'id' | 'display_name' | 'avatar_url' | 'part'> | null;
}

// ── Budget Hub ────────────────────────────────────────────
export interface BudgetCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
}

export interface BudgetTransaction {
  id: string;
  category_id: string | null;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  transaction_date: string;  // YYYY-MM-DD
  bank_account: string | null;
  receipt_url: string | null;
  fiscal_year: number;
  fiscal_half: 1 | 2;
  created_by: string | null;
  created_at: string;
  category?: BudgetCategory | null;
  creator?: Pick<Profile, 'id' | 'display_name'> | null;
}

export interface MembershipFeePolicy {
  id: string;
  fiscal_year: number;
  fiscal_half: 1 | 2;
  amount: number;
  due_date: string | null;
  note: string | null;
  created_at: string;
}

export interface MembershipFeeRecord {
  id: string;
  policy_id: string;
  user_id: string;
  paid_at: string | null;
  amount_paid: number | null;
  is_paid: boolean;
  note: string | null;
  profile?: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null;
}

export interface BudgetTransactionInput {
  category_id: string | null;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  transaction_date: string;
  bank_account?: string | null;
  receipt_url?: string | null;
  fiscal_year: number;
  fiscal_half: 1 | 2;
}
