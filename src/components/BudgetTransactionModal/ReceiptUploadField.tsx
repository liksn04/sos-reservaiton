import type { ChangeEvent, RefObject } from 'react';

interface ReceiptUploadFieldProps {
  inputRef: RefObject<HTMLInputElement | null>;
  previewUrl: string | null;
  existingUrl: string | null;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

export function ReceiptUploadField({
  inputRef,
  previewUrl,
  existingUrl,
  onFileChange,
  onClear,
}: ReceiptUploadFieldProps) {
  const imageUrl = previewUrl ?? existingUrl;

  return (
    <div className="form-group">
      <label className="text-[10px] font-black uppercase tracking-widest text-muted">
        영수증 이미지 (선택)
      </label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />
      {imageUrl ? (
        <div className="relative group w-full aspect-video rounded-2xl overflow-hidden border border-card-border">
          <img
            src={imageUrl}
            alt="영수증 미리보기"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-4 py-2 bg-white/20 backdrop-blur rounded-xl text-white text-xs font-bold"
            >
              변경
            </button>
            <button
              type="button"
              onClick={onClear}
              className="px-4 py-2 bg-error/30 backdrop-blur rounded-xl text-white text-xs font-bold"
            >
              삭제
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-24 rounded-2xl border-2 border-dashed border-card-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 group"
        >
          <span className="material-symbols-outlined text-[28px] text-muted group-hover:text-primary transition-colors">
            add_photo_alternate
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted group-hover:text-primary transition-colors">
            영수증 첨부
          </span>
        </button>
      )}
    </div>
  );
}
