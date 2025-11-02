import { createSupabaseServerClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * 파일 업로드 API Route
 * POST /api/storage/upload
 * 
 * Supabase Storage에 파일을 업로드하고 URL을 반환합니다.
 * Sprint 1: CMS-US-04, CMS-US-05 (파일 첨부 기능)
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "text/plain",
];

/**
 * 파일 타입에 따른 버킷 경로 결정
 */
function getBucketPath(fileType: string): string {
  if (fileType === "application/pdf") {
    return "pdfs";
  }
  if (fileType.startsWith("image/")) {
    return "images";
  }
  return "documents";
}

/**
 * 파일명 생성 (중복 방지)
 */
function generateFileName(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const extension = originalName.split(".").pop();
  const baseName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9가-힣]/g, "_");
  return `${userId}/${timestamp}_${random}_${baseName}.${extension}`;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "파일이 제공되지 않았습니다." }, { status: 400 });
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `파일 크기는 최대 ${MAX_FILE_SIZE / 1024 / 1024}MB까지 가능합니다.` },
        { status: 400 },
      );
    }

    // 파일 타입 검증
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `지원하지 않는 파일 형식입니다. 허용된 형식: ${ALLOWED_FILE_TYPES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Supabase Storage 클라이언트 생성
    const supabase = createSupabaseServerClient();

    // 버킷 경로 결정
    const bucketPath = getBucketPath(file.type);
    const fileName = generateFileName(file.name, userId);
    const filePath = `${bucketPath}/${fileName}`;

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage.from("attachments").upload(filePath, buffer, {
      contentType: file.type,
      upsert: false, // 기존 파일 덮어쓰기 방지
    });

    if (error) {
      console.error("파일 업로드 실패:", error);
      return NextResponse.json(
        { error: "파일 업로드에 실패했습니다.", details: error.message },
        { status: 500 },
      );
    }

    // 공개 URL 생성
    const {
      data: { publicUrl },
    } = supabase.storage.from("attachments").getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
  } catch (error) {
    console.error("파일 업로드 예외:", error);
    return NextResponse.json(
      {
        error: "파일 업로드 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * 파일 삭제 API Route
 * DELETE /api/storage/upload
 * 
 * Supabase Storage에서 파일을 삭제합니다.
 */
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json({ error: "파일 경로가 제공되지 않았습니다." }, { status: 400 });
    }

    // 파일 경로가 현재 사용자의 파일인지 확인
    if (!filePath.startsWith(`${userId}/`)) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const supabase = createSupabaseServerClient();
    const { error } = await supabase.storage.from("attachments").remove([filePath]);

    if (error) {
      console.error("파일 삭제 실패:", error);
      return NextResponse.json(
        { error: "파일 삭제에 실패했습니다.", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, message: "파일이 삭제되었습니다." });
  } catch (error) {
    console.error("파일 삭제 예외:", error);
    return NextResponse.json(
      {
        error: "파일 삭제 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

