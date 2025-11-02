# IDE 설정 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-01-27  
**버전**: 1.0

---

## 📋 개요

이 문서는 AT-CMP 프로젝트의 IDE 설정 및 문제 해결 가이드를 설명합니다.

---

## 🔧 IDE 설정

### VS Code 설정

프로젝트 루트에 `.vscode/settings.json` 파일이 자동으로 생성됩니다:
- TypeScript SDK 경로 설정
- ESLint 자동 수정 활성화
- Prettier 포맷팅 설정
- 파일 제외 설정

### 권장 확장 프로그램

`.vscode/extensions.json`에 다음 확장 프로그램이 권장됩니다:
- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)
- Playwright (`ms-playwright.playwright`)
- Jest (`orta.vscode-jest`)
- TypeScript (`ms-vscode.vscode-typescript-next`)

---

## 🐛 타입 오류 해결 방법

### 1. 모듈을 찾을 수 없다는 오류

**증상**: `'@clerk/nextjs' 모듈 또는 해당 형식 선언을 찾을 수 없습니다`

**해결 방법**:
1. 의존성 설치 확인:
```bash
cd web
pnpm install
```

2. TypeScript 서버 재시작:
   - VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

3. IDE 재시작

### 2. JSX 타입 오류

**증상**: `'JSX.IntrinsicElements' 인터페이스가 없으므로 JSX 요소는 암시적으로 'any' 형식입니다`

**해결 방법**:
1. `tsconfig.json`에 `types` 필드 확인:
```json
{
  "compilerOptions": {
    "types": ["node", "jest", "@testing-library/jest-dom"]
  }
}
```

2. Next.js 타입 생성:
```bash
cd web
pnpm dev
```
이 명령을 실행하면 `.next/dev/types/routes.d.ts` 파일이 생성됩니다.

3. TypeScript 서버 재시작

### 3. `process` 타입 오류

**증상**: `'process' 이름을 찾을 수 없습니다`

**해결 방법**:
1. `@types/node` 설치 확인:
```bash
cd web
pnpm install --save-dev @types/node
```

2. `tsconfig.json`에 `types` 필드에 `"node"` 포함 확인

---

## 🔄 TypeScript 서버 재시작

### VS Code
1. `Ctrl+Shift+P` (또는 `Cmd+Shift+P` on Mac)
2. "TypeScript: Restart TS Server" 입력
3. Enter

### 일반적인 방법
- IDE 재시작
- `node_modules` 삭제 후 재설치:
```bash
cd web
rm -rf node_modules
pnpm install
```

---

## 📝 tsconfig.json 설정 확인

프로젝트의 `web/tsconfig.json`이 다음 설정을 포함하는지 확인:

```json
{
  "compilerOptions": {
    "types": ["node", "jest", "@testing-library/jest-dom"],
    "skipLibCheck": true,
    "moduleResolution": "bundler"
  }
}
```

---

## ✅ 체크리스트

### 초기 설정
- [ ] `.vscode/settings.json` 파일 확인
- [ ] `.vscode/extensions.json` 파일 확인
- [ ] 권장 확장 프로그램 설치
- [ ] `web/tsconfig.json` 설정 확인
- [ ] 의존성 설치 (`pnpm install`)

### 타입 오류 해결
- [ ] TypeScript 서버 재시작
- [ ] Next.js 개발 서버 실행 (`pnpm dev`)하여 타입 생성
- [ ] IDE 재시작
- [ ] `@types/node` 설치 확인

---

## 🚨 일반적인 문제

### 문제 1: IDE가 타입을 인식하지 못함

**원인**: Next.js 타입 파일이 생성되지 않음

**해결**: Next.js 개발 서버를 한 번 실행:
```bash
cd web
pnpm dev
```
서버를 시작하면 `.next/dev/types/routes.d.ts` 파일이 생성됩니다.

### 문제 2: 경로 별칭(`@/*`)이 작동하지 않음

**원인**: `tsconfig.json`의 `paths` 설정이 IDE에 반영되지 않음

**해결**: 
1. TypeScript 서버 재시작
2. VS Code 설정에서 `typescript.preferences.importModuleSpecifier` 확인

### 문제 3: ESLint 오류가 표시되지 않음

**원인**: ESLint 확장 프로그램이 설치되지 않았거나 설정이 잘못됨

**해결**:
1. ESLint 확장 프로그램 설치
2. VS Code 설정에서 `eslint.validate` 확인
3. ESLint 서버 재시작

---

## 📚 참고 자료

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Next.js TypeScript Documentation](https://nextjs.org/docs/app/building-your-application/configuring/typescript)
- [VS Code TypeScript Documentation](https://code.visualstudio.com/docs/languages/typescript)

---

**마지막 업데이트**: 2025-01-27  
**다음 검토일**: 2025-02-03

