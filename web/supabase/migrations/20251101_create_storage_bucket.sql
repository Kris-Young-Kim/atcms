-- Create Supabase Storage bucket for file attachments
-- Sprint 1: CMS-US-04, CMS-US-05 (파일 첨부 기능)
-- 
-- 참고: 이 마이그레이션은 SQL로 직접 실행할 수 없습니다.
-- Supabase Dashboard에서 수동으로 버킷을 생성해야 합니다:
-- 1. Supabase Dashboard → Storage → Create bucket
-- 2. 버킷 이름: 'attachments'
-- 3. Public bucket: true (또는 접근 정책 설정)
-- 4. File size limit: 10MB
-- 5. Allowed MIME types: image/*, application/pdf, application/msword, application/vnd.*, text/plain
--
-- 또는 Supabase CLI를 사용하여 버킷을 생성할 수 있습니다:
-- supabase storage create attachments --public

-- 아래 SQL은 참고용이며, 실제로는 Supabase Dashboard에서 버킷을 생성해야 합니다.
-- Storage 버킷은 SQL 마이그레이션으로 직접 생성할 수 없습니다.

-- Storage 버킷 생성 스크립트 (참고용)
-- 실제로는 Supabase Dashboard 또는 CLI를 사용해야 합니다.
/*
-- Storage 버킷은 SQL로 직접 생성할 수 없으므로,
-- Supabase Dashboard에서 수동으로 생성하거나,
-- Supabase Management API를 사용하여 생성해야 합니다.
--
-- 버킷 생성 API 예시:
-- POST https://<project-ref>.supabase.co/storage/v1/bucket
-- Headers: { Authorization: Bearer <service_role_key> }
-- Body: {
--   "name": "attachments",
--   "public": true,
--   "file_size_limit": 10485760,
--   "allowed_mime_types": ["image/*", "application/pdf", "application/msword", "application/vnd.*", "text/plain"]
-- }
*/

-- Storage 정책 설정 (RLS는 사용하지 않지만, Storage 정책은 필요할 수 있음)
-- 참고: 이 프로젝트는 RLS를 사용하지 않으므로, 애플리케이션 레벨에서 접근 제어를 처리합니다.
-- Storage 버킷은 Public으로 설정하거나, 필요한 경우 Storage 정책을 설정할 수 있습니다.

-- Storage 정책 예시 (참고용, 필요시 적용)
/*
-- 업로드 정책: 인증된 사용자만 업로드 가능
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

-- 읽기 정책: 모든 사용자가 읽기 가능 (Public 버킷인 경우)
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'attachments');

-- 삭제 정책: 파일 소유자만 삭제 가능
CREATE POLICY "Allow users to delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
*/

-- 마이그레이션 완료 메시지
DO $$
BEGIN
  RAISE NOTICE 'Storage 버킷 "attachments"는 Supabase Dashboard에서 수동으로 생성해야 합니다.';
  RAISE NOTICE '참고: Storage 버킷은 SQL 마이그레이션으로 직접 생성할 수 없습니다.';
END $$;

