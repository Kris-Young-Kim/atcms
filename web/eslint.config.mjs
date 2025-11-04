import { defineConfig, globalIgnores } from "eslint/config";
import { FlatCompat } from "@eslint/eslintrc";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = defineConfig([
  ...compat.extends("next/core-web-vitals"),
  ...compat.extends("next/typescript"),
  {
    rules: {
      "max-len": [
        "error",
        {
          code: 100,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
        },
      ],
      // TypeScript any 타입 금지
      // eslint-config-next가 이미 @typescript-eslint 플러그인을 포함하고 있음
      "@typescript-eslint/no-explicit-any": "error",
      // 미사용 변수 경고 (매개변수는 제외)
      // eslint-config-next의 기본 규칙을 오버라이드
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      // 복잡도 검사 규칙
      complexity: ["warn", { max: 25 }], // 순환 복잡도 최대 25 (경고)
      "max-lines-per-function": ["warn", { max: 200 }], // 함수당 최대 라인 수 경고
      "max-depth": ["warn", { max: 6 }], // 최대 중첩 깊이 경고
      "max-params": ["warn", { max: 8 }], // 최대 매개변수 수 경고
      // 코드 냄새 감지 규칙
      "no-console": ["warn", { allow: ["warn", "error"] }], // console.log 금지 (console.warn, console.error는 허용)
      "no-debugger": "error", // debugger 금지
      "no-alert": "warn", // alert/confirm/prompt 사용 시 경고만 표시
      "no-eval": "error", // eval 금지
      "no-implied-eval": "error", // 암시적 eval 금지
      "no-new-func": "error", // new Function 금지
    },
  },
  {
    files: ["**/__tests__/**", "**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  eslintPluginPrettierRecommended,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "**/*.example.tsx",
    "**/*.example.ts",
    "**/*.example.js",
    "**/*.example.jsx",
  ]),
]);

export default eslintConfig;
