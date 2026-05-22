import { supabase } from '../lib/supabase';
import type { AdminActionLog, Profile } from '../types';

export interface AdminCounts {
  banned: number;
}

interface AdminActor {
  id: string;
  displayName: string | null;
}

interface AdminActionPayload {
  targetId: string;
  targetName: string;
  action: AdminActionLog['action'];
  reason?: string | null;
}

export async function getAdminCounts(): Promise<AdminCounts> {
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'banned');

  if (error) throw error;
  return { banned: count ?? 0 };
}

export async function getTotalUserCount(): Promise<number> {
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true });

  if (error) throw error;
  return count ?? 0;
}

export async function listApprovedMembers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function listBannedMembers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'banned')
    .order('banned_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function listAdminActionLogs(): Promise<AdminActionLog[]> {
  const { data, error } = await supabase
    .from('admin_action_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data ?? []) as AdminActionLog[];
}

export async function banUser(
  userId: string,
  userName: string,
  reason?: string,
): Promise<void> {
  const actor = await getCurrentAdminActor();

  const { error } = await supabase
    .from('profiles')
    .update({
      status: 'banned',
      banned_at: new Date().toISOString(),
      banned_reason: reason ?? null,
      banned_by: actor.id,
    })
    .eq('id', userId);

  if (error) throw error;

  await insertAdminActionLog(actor, {
    targetId: userId,
    targetName: userName,
    action: 'ban',
    reason: reason ?? null,
  });
}

export async function unbanUser(userId: string, userName: string): Promise<void> {
  const actor = await getCurrentAdminActor();

  const { error } = await supabase
    .from('profiles')
    .update({
      status: 'approved',
      banned_at: null,
      banned_reason: null,
      banned_by: null,
    })
    .eq('id', userId);

  if (error) throw error;

  await insertAdminActionLog(actor, {
    targetId: userId,
    targetName: userName,
    action: 'unban',
  });
}

export async function setAdminRole(
  userId: string,
  userName: string,
  isAdmin: boolean,
): Promise<void> {
  const actor = await getCurrentAdminActor();

  const { error } = await supabase
    .from('profiles')
    .update({ is_admin: isAdmin })
    .eq('id', userId);

  if (error) throw error;

  await insertAdminActionLog(actor, {
    targetId: userId,
    targetName: userName,
    action: isAdmin ? 'promote' : 'demote',
  });
}

export async function deleteAdminUser(userId: string, userName: string): Promise<unknown> {
  const { data, error } = await supabase.functions.invoke('admin-delete-user', {
    body: { targetUserId: userId, targetName: userName },
  });

  if (error) throw error;
  return data;
}

async function getCurrentAdminActor(): Promise<AdminActor> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const user = userData.user;
  if (!user) throw new Error('인증 정보가 없습니다.');

  const { data: adminProfile, error: profileError } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  return {
    id: user.id,
    displayName: adminProfile?.display_name ?? null,
  };
}

async function insertAdminActionLog(
  actor: AdminActor,
  payload: AdminActionPayload,
): Promise<void> {
  const { error } = await supabase
    .from('admin_action_log')
    .insert({
      admin_id: actor.id,
      admin_name: actor.displayName,
      target_id: payload.targetId,
      target_name: payload.targetName,
      action: payload.action,
      reason: payload.reason ?? null,
    });

  if (error) throw error;
}
