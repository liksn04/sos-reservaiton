import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
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

export default function Profile() {
  const { session, profile, refreshProfile, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [part, setPart] = useState<Part>(profile?.part ?? 'guitar');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  const currentAvatar = avatarPreview ?? profile?.avatar_url ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user) return;
    if (!displayName.trim()) { setError('닉네임을 입력해주세요.'); return; }
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      let avatarUrl: string | undefined;

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
      setAvatarFile(null);
      setAvatarPreview(null);
      setSuccess(true);
    } catch (err) {
      setError('저장에 실패했습니다. 다시 시도해주세요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-container">
      <header className="glass-header">
        <div className="header-content">
          <div className="logo">
            <i className="fa-solid fa-music" />
            빛소리 동아리방 <span>예약</span>
          </div>
          <nav className="header-nav">
            <Link to="/" className="nav-link">
              <i className="fa-regular fa-calendar" /> 캘린더
            </Link>
            <Link to="/my-reservations" className="nav-link">
              <i className="fa-regular fa-calendar-check" /> 나의 예약
            </Link>
          </nav>
          <div className="header-actions">
            <button className="icon-btn" onClick={signOut} title="로그아웃">
              <i className="fa-solid fa-arrow-right-from-bracket" />
            </button>
          </div>
        </div>
      </header>

      <div className="glass-card" style={{ maxWidth: 560, margin: '0 auto', width: '100%' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>프로필 수정</h2>

        <form onSubmit={handleSubmit}>
          {/* 아바타 */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div className="avatar-upload-area" onClick={() => fileInputRef.current?.click()}>
              {currentAvatar ? (
                <img src={currentAvatar} alt="프로필" className="avatar-preview" />
              ) : (
                <div className="avatar-placeholder">
                  <i className="fa-solid fa-camera" />
                  <span>사진 변경</span>
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
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>한줄소개</label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={60}
            />
          </div>

          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">저장되었습니다.</p>}

          <button
            type="submit"
            className="primary-btn"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        </form>
      </div>
    </div>
  );
}
