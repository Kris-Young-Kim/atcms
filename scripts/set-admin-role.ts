/**
 * 사용자 역할 설정 스크립트
 * 
 * 사용법:
 *   pnpm tsx scripts/set-admin-role.ts <email> <role>
 * 
 * 예시:
 *   pnpm tsx scripts/set-admin-role.ts youngkiss3181@gmail.com admin
 */

import { clerkClient } from "@clerk/nextjs/server";

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  console.error("❌ CLERK_SECRET_KEY 환경 변수가 설정되지 않았습니다.");
  console.error("   .env.local 파일에 CLERK_SECRET_KEY를 추가하세요.");
  process.exit(1);
}

const [email, role] = process.argv.slice(2);

if (!email || !role) {
  console.error("❌ 사용법: pnpm tsx scripts/set-admin-role.ts <email> <role>");
  console.error("   예시: pnpm tsx scripts/set-admin-role.ts youngkiss3181@gmail.com admin");
  process.exit(1);
}

const validRoles = ["admin", "leader", "specialist", "socialWorker", "technician"];

if (!validRoles.includes(role)) {
  console.error(`❌ 잘못된 역할입니다. 다음 중 하나여야 합니다: ${validRoles.join(", ")}`);
  process.exit(1);
}

async function setUserRole() {
  try {
    console.log(`🔍 사용자 검색 중: ${email}...`);

    // 이메일로 사용자 찾기
    const users = await clerkClient.users.getUserList({
      emailAddress: [email],
    });

    if (users.data.length === 0) {
      console.error(`❌ 사용자를 찾을 수 없습니다: ${email}`);
      console.error("   먼저 Clerk에서 해당 이메일로 회원가입을 완료해야 합니다.");
      process.exit(1);
    }

    const user = users.data[0];
    console.log(`✅ 사용자 찾음: ${user.id} (${user.emailAddresses[0]?.emailAddress})`);

    // 역할 업데이트
    console.log(`🔄 역할 업데이트 중: ${role}...`);

    await clerkClient.users.updateUserMetadata(user.id, {
      publicMetadata: {
        role,
      },
    });

    console.log(`✅ 성공! 사용자 ${email}의 역할이 "${role}"로 설정되었습니다.`);
    console.log(`   사용자 ID: ${user.id}`);
    console.log(`   역할: ${role}`);
  } catch (error) {
    console.error("❌ 오류 발생:", error);
    process.exit(1);
  }
}

setUserRole();

