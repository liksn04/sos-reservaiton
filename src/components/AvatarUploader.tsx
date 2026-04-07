import type { RefObject } from 'react';

interface AvatarUploaderProps {
  currentAvatar: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** 'dark' = Material Symbols 다크 테마 (ProfileRoute 편집)
   *  'setup' = 구형 CSS 클래스 (ProfileSetup) */
  variant?: 'dark' | 'setup';
}

export default function AvatarUploader({
  currentAvatar,
  fileInputRef,
  onFileChange,
  variant = 'dark',
}: AvatarUploaderProps) {
  if (variant === 'setup') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <div className="avatar-upload-area" onClick={() => fileInputRef.current?.click()}>
          {currentAvatar ? (
            <img src={currentAvatar} alt="프로필 미리보기" className="avatar-preview" />
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
          onChange={onFileChange}
        />
      </div>
    );
  }

  // variant === 'dark'
  return (
    <div className="flex justify-center">
      <div
        className="w-24 h-24 rounded-full overflow-hidden border-2 border-outline-variant/50 cursor-pointer hover:border-primary transition-colors flex items-center justify-center bg-surface-container-highest relative group"
        onClick={() => fileInputRef.current?.click()}
      >
        {currentAvatar ? (
          <>
            <img src={currentAvatar} alt="프로필" className="w-full h-full object-cover" />
            <div className="absolute flex inset-0 bg-black/50 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-white">photo_camera</span>
            </div>
          </>
        ) : (
          <div className="text-center text-on-surface-variant group-hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-3xl">add_a_photo</span>
            <span className="block text-[10px] font-bold tracking-widest mt-1 uppercase">Upload</span>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />
    </div>
  );
}
