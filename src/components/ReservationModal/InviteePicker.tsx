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
    <div className="invitee-picker">
      <label>합주 참여 부원 초대</label>
      <input
        type="text"
        className="invitee-search"
        placeholder="닉네임 또는 파트로 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="invitee-list">
        {filtered.length === 0 ? (
          <p className="text-muted" style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
            검색 결과가 없습니다.
          </p>
        ) : (
          filtered.map((member) => {
            const checked = selected.includes(member.id);
            return (
              <label key={member.id} className={`invitee-item${checked ? ' checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(member.id)}
                />
                <div className="invitee-avatar">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.display_name} />
                  ) : (
                    <i className="fa-solid fa-user" />
                  )}
                </div>
                <div className="invitee-info">
                  <span className="invitee-name">{member.display_name}</span>
                  {member.part && (
                    <span className="invitee-part text-muted">
                      {PART_LABELS[member.part]}
                    </span>
                  )}
                </div>
                <i className={`fa-solid fa-circle-check invitee-check${checked ? ' visible' : ''}`} />
              </label>
            );
          })
        )}
      </div>
      {selected.length > 0 && (
        <p className="invitee-count">
          {selected.length}명 선택됨
        </p>
      )}
    </div>
  );
}
