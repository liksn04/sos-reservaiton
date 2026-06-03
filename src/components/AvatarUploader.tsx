import type { RefObject } from 'react';
import MaterialIcon from './MaterialIcon';

interface AvatarUploaderProps {
  currentAvatar: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function AvatarUploader({
  currentAvatar,
  fileInputRef,
  onFileChange,
}: AvatarUploaderProps) {
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
              <MaterialIcon name="photo_camera" className="text-white" />
            </div>
          </>
        ) : (
          <div className="text-center text-on-surface-variant group-hover:text-primary transition-colors">
            <MaterialIcon name="add_a_photo" className="text-3xl" />
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
