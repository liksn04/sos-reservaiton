import { useState } from 'react';
import type { Profile, Part } from '../../types';

const PART_LABELS: Record<Part, string> = {
  vocal: '보컬',
  guitar: '기타',
  drum: '드럼',
  bass: '베이스',
  keyboard: '키보드',
  other: '기타',
};

interface Props {
  members: Profile[];
  selected: string[];
  currentUserId: string;
  onChange: (ids: string[]) => void;
}

export default function InviteePicker({ members, selected, currentUserId, onChange }: Props) {
  const [query, setQuery] = useState('');

  // 자기 자신 제외
  const eligibleMembers = members.filter((m) => m.id !== currentUserId);

  const filtered = eligibleMembers.filter(
    (m) =>
      m.display_name.toLowerCase().includes(query.toLowerCase()) ||
      (m.part && PART_LABELS[m.part].includes(query)),
  );

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="form-group">
      <label>합주 참여 부원 초대</label>
      <input
        type="text"
        placeholder="닉네임 또는 파트로 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="mt-2 max-h-48 overflow-y-auto bg-surface-container-highest border border-outline-variant/20 rounded-xl p-2 flex flex-col gap-1">
        {filtered.length === 0 ? (
          <p className="text-on-surface-variant text-sm p-2 text-center">
            검색 결과가 없습니다.
          </p>
        ) : (
          filtered.map((member) => {
            const checked = selected.includes(member.id);
            return (
              <label 
                key={member.id} 
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${checked ? 'bg-primary/20 border border-primary/30' : 'hover:bg-white/5 border border-transparent'}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(member.id)}
                  className="hidden"
                />
                <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant flex-shrink-0 bg-surface-container-low flex items-center justify-center">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-[1rem] text-on-surface-variant">person</span>
                  )}
                </div>
                <div className="flex-1 flex flex-col">
                  <span className="text-sm font-bold text-on-surface leading-tight text-white">{member.display_name}</span>
                  {member.part && (
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                      {PART_LABELS[member.part]}
                    </span>
                  )}
                </div>
                {checked && (
                  <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                )}
              </label>
            );
          })
        )}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-primary font-bold mt-1 text-right">
          {selected.length}명 선택됨
        </p>
      )}
    </div>
  );
}
