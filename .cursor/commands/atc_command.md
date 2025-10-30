다음은 자주 사용할 명령어입니다:

1. 개발 환경 시작:
   npm run dev

   # 또는

   yarn dev

2. 빌드:
   npm run build

   # 또는

   yarn build

3. 테스트 실행:
   npm run test

   # 또는

   yarn test

4. 테스트 커버리지:
   npm run test:coverage

   # 또는

   yarn test:coverage

5. 린팅:
   npm run lint

   # 또는

   yarn lint

6. 형식 검사/정렬:
   npm run format

   # 또는

   yarn format

7. 타입 체크 (TypeScript):
   npm run type-check

   # 또는

   yarn type-check

8. 환경 설정:
   npm install
   cp .env.example .env

   # .env 파일 설정 필요

9. 데이터베이스 마이그레이션 (해당 사항 있을 시):
   npm run migrate
   npm run migrate:rollback

10. 프로덕션 배포:
    npm run build && npm run deploy

11. 로그 확인:
    npm run logs

12. 캐시 초기화:
    npm run clean
    rm -rf node_modules && npm install
