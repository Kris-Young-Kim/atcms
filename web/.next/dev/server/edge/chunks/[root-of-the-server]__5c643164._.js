(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__5c643164._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/ [middleware-edge] (unsupported edge import 'crypto', ecmascript)", ((__turbopack_context__, module, exports) => {

__turbopack_context__.n(__import_unsupported(`crypto`));
}),
"[project]/web/src/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$nextjs$40$5$2e$4$2e$1_next$40$16_595a90fac1536fe191038e5190c49c26$2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$clerkMiddleware$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@clerk+nextjs@5.4.1_next@16_595a90fac1536fe191038e5190c49c26/node_modules/@clerk/nextjs/dist/esm/server/clerkMiddleware.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$nextjs$40$5$2e$4$2e$1_next$40$16_595a90fac1536fe191038e5190c49c26$2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$routeMatcher$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@clerk+nextjs@5.4.1_next@16_595a90fac1536fe191038e5190c49c26/node_modules/@clerk/nextjs/dist/esm/server/routeMatcher.js [middleware-edge] (ecmascript)");
;
// 공개 접근 가능한 경로 정의
const isPublicRoute = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$nextjs$40$5$2e$4$2e$1_next$40$16_595a90fac1536fe191038e5190c49c26$2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$routeMatcher$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["createRouteMatcher"])([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhooks(.*)"
]);
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$nextjs$40$5$2e$4$2e$1_next$40$16_595a90fac1536fe191038e5190c49c26$2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$clerkMiddleware$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["clerkMiddleware"])((auth, request)=>{
    // 공개 경로가 아니면 인증 필요
    if (!isPublicRoute(request)) {
        auth.protect();
    }
});
const config = {
    matcher: [
        // Next.js 내부 경로와 정적 파일 제외
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // API 라우트는 항상 실행
        "/(api|trpc)(.*)"
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__5c643164._.js.map