"use client";

import { useState, useRef } from "react";
import { useToast } from "@/components/ui/Toast";

/**
 * 파일 업로드 컴포넌트
 * Sprint 1: CMS-US-04, CMS-US-05 (파일 첨부 기능)
 */

interface FileUploadProps {
  onUploadComplete?: (url: string, fileName: string) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  maxSize?: number; // bytes
  multiple?: boolean;
  label?: string;
  disabled?: boolean;
}

export function FileUpload({
  onUploadComplete,
  onUploadError,
  accept = ".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.txt",
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = false,
  label = "파일 선택",
  disabled = false,
}: FileUploadProps) {
  const { error: showError } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; fileName: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesToUpload = Array.from(files);

    // 파일 크기 검증
    for (const file of filesToUpload) {
      if (file.size > maxSize) {
        const errorMessage = `파일 크기는 최대 ${maxSize / 1024 / 1024}MB까지 가능합니다: ${file.name}`;
        showError(errorMessage);
        onUploadError?.(errorMessage);
        return;
      }
    }

    setUploading(true);

    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/storage/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "파일 업로드에 실패했습니다.");
        }

        const data = await response.json();
        return { url: data.url, fileName: data.fileName };
      });

      const results = await Promise.all(uploadPromises);
      setUploadedFiles((prev) => [...prev, ...results]);

      // 콜백 호출
      results.forEach((result) => {
        onUploadComplete?.(result.url, result.fileName);
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "파일 업로드 중 오류가 발생했습니다.";
      showError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="mt-1 flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileChange}
            disabled={disabled || uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {uploading && <span className="text-sm text-gray-600">업로드 중...</span>}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          허용된 형식: PDF, 이미지, 문서 파일 (최대 {maxSize / 1024 / 1024}MB)
        </p>
      </div>

      {/* 업로드된 파일 목록 */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">업로드된 파일:</p>
          <ul className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
              >
                <span className="text-sm text-gray-700">{file.fileName}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="text-sm text-red-600 hover:text-red-700"
                  disabled={disabled || uploading}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * 파일 업로드 훅
 * 파일 업로드 상태를 관리하는 커스텀 훅
 */
export function useFileUpload() {
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleUploadComplete = (url: string) => {
    setUploadedUrls((prev) => [...prev, url]);
  };

  const removeUrl = (url: string) => {
    setUploadedUrls((prev) => prev.filter((u) => u !== url));
  };

  const clearUrls = () => {
    setUploadedUrls([]);
  };

  return {
    uploadedUrls,
    uploading,
    setUploading,
    handleUploadComplete,
    removeUrl,
    clearUrls,
  };
}
