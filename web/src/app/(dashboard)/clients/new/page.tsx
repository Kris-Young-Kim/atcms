import { ClientForm } from "@/components/clients/ClientForm";

/**
 * 대상자 등록 페이지
 * Sprint 1: CMS-US-01
 *
 * 접근 권한: admin, leader, specialist만 가능
 */

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">새 대상자 등록</h1>
        <p className="mt-2 text-sm text-gray-600">
          대상자의 기본 정보를 입력하세요. 필수 항목은 <span className="text-red-500">*</span>로
          표시됩니다.
        </p>
      </div>

      <ClientForm />
    </div>
  );
}

