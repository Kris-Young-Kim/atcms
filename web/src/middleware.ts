import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 공개 접근 가능한 경로 정의
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware((auth, request) => {
  // 공개 경로가 아니면 인증 필요
  if (!isPublicRoute(request)) {
    auth.protect();
  }
});

export const config = {
  matcher: [
    // Next.js 내부 경로와 정적 파일 제외
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // API 라우트는 항상 실행
    "/(api|trpc)(.*)",
  ],
};

