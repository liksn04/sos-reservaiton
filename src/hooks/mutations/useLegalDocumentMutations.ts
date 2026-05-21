import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryKeys';
import type { LegalDocumentInput, LegalDocumentSlug } from '../../types';

interface UpdateLegalDocumentPayload extends LegalDocumentInput {
  slug: LegalDocumentSlug;
}

async function getAuthenticatedUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('인증 정보가 없습니다.');
  return user.id;
}

function sanitize(payload: LegalDocumentInput): LegalDocumentInput {
  return {
    title: payload.title.trim(),
    intro: payload.intro.trim(),
    body: payload.body,
    effective_date: payload.effective_date,
  };
}

export function useUpdateLegalDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, ...payload }: UpdateLegalDocumentPayload) => {
      const userId = await getAuthenticatedUserId();
      const sanitized = sanitize(payload);

      const { data, error } = await supabase
        .from('legal_documents')
        .upsert(
          {
            slug,
            ...sanitized,
            updated_by: userId,
          },
          { onConflict: 'slug' },
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.legalDocuments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.legalDocuments.bySlug(variables.slug) });
    },
  });
}
