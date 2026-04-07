export type ProfileStatus = 'pending' | 'approved' | 'rejected' | 'banned';
export type Part = 'vocal' | 'guitar' | 'drum' | 'bass' | 'keyboard' | 'other';
export type Purpose = '합주' | '강습' | '정기회의';

export interface Profile {
  id: string;
  kakao_id: string | null;
  display_name: string;
  avatar_url: string | null;
  part: Part | null;
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
