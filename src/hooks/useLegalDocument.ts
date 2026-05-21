import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';
import type { LegalDocument, LegalDocumentSlug } from '../types';

export async function fetchLegalDocument(slug: LegalDocumentSlug): Promise<LegalDocument | null> {
  const { data, error } = await supabase
    .from('legal_documents')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as LegalDocument | null;
}

export async function fetchAllLegalDocuments(): Promise<LegalDocument[]> {
  const { data, error } = await supabase
    .from('legal_documents')
    .select('*')
    .order('slug', { ascending: true });

  if (error) throw error;
  return (data ?? []) as LegalDocument[];
}

export function useLegalDocument(slug: LegalDocumentSlug) {
  return useQuery<LegalDocument | null>({
    queryKey: queryKeys.legalDocuments.bySlug(slug),
    queryFn: () => fetchLegalDocument(slug),
    staleTime: 5 * 60_000,
  });
}

export function useLegalDocuments() {
  return useQuery<LegalDocument[]>({
    queryKey: queryKeys.legalDocuments.all,
    queryFn: fetchAllLegalDocuments,
    staleTime: 5 * 60_000,
  });
}
