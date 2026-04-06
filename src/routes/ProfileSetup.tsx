import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Part } from '../types';

const PARTS: { value: Part; label: string }[] = [
  { value: 'vocal', label: '보컬' },
  { value: 'guitar', label: '기타' },
  { value: 'drum', label: '드럼' },
  { value: 'bass', label: '베이스' },
  { value: 'keyboard', label: '키보드' },
  { value: 'other', label: '기타(other)' },
];

export default function ProfileSetup() {
  const { session, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [part, setPart] = useState<Part>('guitar');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user) return;
    if (!displayName.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      let avatarUrl: string | null = null;

      // 사진 업로드
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `${session.user.id}/avatar.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        avatarUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
      }

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          part,
          bio: bio.trim() || null,
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        })
        .eq('id', session.user.id);

      if (updateErr) throw updateErr;

      await refreshProfile();
      navigate('/pending-approval', { replace: true });
    } catch (err) {
      setError('저장에 실패했습니다. 다시 시도해주세요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card glass-card" style={{ maxWidth: 480 }}>
        <div className="login-logo">
          <i className="fa-solid fa-user-pen" />
          <h1>프로필 설정</h1>
        </div>
        <p className="login-desc" style={{ marginBottom: '1.5rem' }}>
          동아리 내에서 사용할 프로필을 설정해주세요.
        </p>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {/* 아바타 */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div className="avatar-upload-area" onClick={() => fileInputRef.current?.click()}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="프로필 미리보기" className="avatar-preview" />
              ) : (
                <div className="avatar-placeholder">
                  <i className="fa-solid fa-camera" />
                  <span>사진 추가</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          <div className="form-group">
            <label>닉네임 *</label>
            <input
              type="text"
              placeholder="동아리에서 쓸 이름"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={20}
              required
            />
          </div>

          <div className="form-group">
            <label>담당 파트</label>
            <select value={part} onChange={(e) => setPart(e.target.value as Part)}>
              {PARTS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>한줄소개</label>
            <input
              type="text"
              placeholder="간단한 자기소개 (선택)"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={60}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="primary-btn" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? '저장 중...' : '프로필 저장'}
          </button>
        </form>
      </div>
    </div>
  );
}
