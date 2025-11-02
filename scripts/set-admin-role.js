/**
 * 사용자 역할 설정 스크립트 (Node.js)
 * 
 * 사용법:
 *   node scripts/set-admin-role.js <email> <role>
 * 
 * 예시:
 *   node scripts/set-admin-role.js youngkiss3181@gmail.com admin
 */

const fs = require("fs");
const path = require("path");

// .env.local 파일 읽기
function loadEnvFile() {
  const envPath = path.join(__dirname, "..", "web", ".env.local");
  
  if (!fs.existsSync(envPath)) {
    console.warn(`⚠️  ${envPath} 파일이 없습니다. 환경 변수를 직접 확인하세요.`);
    return;
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  const envLines = envContent.split("\n");

  for (const line of envLines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const [key, ...valueParts] = trimmedLine.split("=");
    if (key && valueParts.length > 0) {
      const value = valueParts.join("=").trim();
      // 따옴표 제거
      const cleanValue = value.replace(/^["']|["']$/g, "");
      process.env[key.trim()] = cleanValue;
    }
  }
}

loadEnvFile();

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  console.error("❌ CLERK_SECRET_KEY 환경 변수가 설정되지 않았습니다.");
  console.error("   web/.env.local 파일에 CLERK_SECRET_KEY를 추가하세요.");
  process.exit(1);
}

const [email, role] = process.argv.slice(2);

if (!email || !role) {
  console.error("❌ 사용법: node scripts/set-admin-role.js <email> <role>");
  console.error("   예시: node scripts/set-admin-role.js youngkiss3181@gmail.com admin");
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

    // Clerk REST API를 사용하여 사용자 찾기
    const searchResponse = await fetch(
      `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      throw new Error(`Clerk API 오류: ${searchResponse.status} - ${errorText}`);
    }

    const users = await searchResponse.json();

    if (users.length === 0) {
      console.error(`❌ 사용자를 찾을 수 없습니다: ${email}`);
      console.error("   먼저 Clerk에서 해당 이메일로 회원가입을 완료해야 합니다.");
      process.exit(1);
    }

    const user = users[0];
    console.log(`✅ 사용자 찾음: ${user.id} (${user.email_addresses[0]?.email_address})`);

    // 역할 업데이트
    console.log(`🔄 역할 업데이트 중: ${role}...`);

    const updateResponse = await fetch(`https://api.clerk.com/v1/users/${user.id}/metadata`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        public_metadata: {
          role,
        },
      }),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Clerk API 오류: ${updateResponse.status} - ${errorText}`);
    }

    const updatedUser = await updateResponse.json();

    console.log(`✅ 성공! 사용자 ${email}의 역할이 "${role}"로 설정되었습니다.`);
    console.log(`   사용자 ID: ${user.id}`);
    console.log(`   역할: ${updatedUser.public_metadata?.role || role}`);
  } catch (error) {
    console.error("❌ 오류 발생:", error.message);
    process.exit(1);
  }
}

setUserRole();

