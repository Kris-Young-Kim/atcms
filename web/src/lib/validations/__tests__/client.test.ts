import { clientSchema, clientFilterSchema, clientUpdateSchema } from "../client";

describe("clientSchema", () => {
  describe("필수 필드 검증", () => {
    it("이름이 없으면 실패해야 함", () => {
      const result = clientSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("이름이 2자 미만이면 실패해야 함", () => {
      const result = clientSchema.safeParse({ name: "a" });
      expect(result.success).toBe(false);
    });

    it("이름이 100자를 초과하면 실패해야 함", () => {
      const result = clientSchema.safeParse({ name: "a".repeat(101) });
      expect(result.success).toBe(false);
    });

    it("유효한 이름이면 성공해야 함", () => {
      const result = clientSchema.safeParse({ name: "홍길동" });
      expect(result.success).toBe(true);
    });
  });

  describe("전화번호 검증", () => {
    it("유효한 전화번호 형식 (하이픈 포함)이면 성공해야 함", () => {
      const result = clientSchema.safeParse({
        name: "홍길동",
        contact_phone: "010-1234-5678",
      });
      expect(result.success).toBe(true);
    });

    it("유효한 전화번호 형식 (하이픈 없음)이면 성공해야 함", () => {
      const result = clientSchema.safeParse({
        name: "홍길동",
        contact_phone: "01012345678",
      });
      expect(result.success).toBe(true);
    });

    it("잘못된 전화번호 형식이면 실패해야 함", () => {
      const result = clientSchema.safeParse({
        name: "홍길동",
        contact_phone: "123-456",
      });
      expect(result.success).toBe(false);
    });

    it("전화번호가 선택 필드이므로 없어도 성공해야 함", () => {
      const result = clientSchema.safeParse({ name: "홍길동" });
      expect(result.success).toBe(true);
    });
  });

  describe("이메일 검증", () => {
    it("유효한 이메일이면 성공해야 함", () => {
      const result = clientSchema.safeParse({
        name: "홍길동",
        contact_email: "test@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("잘못된 이메일 형식이면 실패해야 함", () => {
      const result = clientSchema.safeParse({
        name: "홍길동",
        contact_email: "invalid-email",
      });
      expect(result.success).toBe(false);
    });

    it("빈 문자열이면 성공해야 함", () => {
      const result = clientSchema.safeParse({
        name: "홍길동",
        contact_email: "",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("생년월일 검증", () => {
    it("유효한 과거 날짜이면 성공해야 함", () => {
      const result = clientSchema.safeParse({
        name: "홍길동",
        birth_date: "1990-01-01",
      });
      expect(result.success).toBe(true);
    });

    it("미래 날짜이면 실패해야 함", () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const result = clientSchema.safeParse({
        name: "홍길동",
        birth_date: futureDate.toISOString().split("T")[0],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("성별 검증", () => {
    it("male이면 성공해야 함", () => {
      const result = clientSchema.safeParse({ name: "홍길동", gender: "male" });
      expect(result.success).toBe(true);
    });

    it("female이면 성공해야 함", () => {
      const result = clientSchema.safeParse({ name: "홍길동", gender: "female" });
      expect(result.success).toBe(true);
    });

    it("other이면 성공해야 함", () => {
      const result = clientSchema.safeParse({ name: "홍길동", gender: "other" });
      expect(result.success).toBe(true);
    });

    it("잘못된 값이면 실패해야 함", () => {
      const result = clientSchema.safeParse({ name: "홍길동", gender: "unknown" });
      expect(result.success).toBe(false);
    });
  });

  describe("상태 검증", () => {
    it("기본값은 active여야 함", () => {
      const result = clientSchema.safeParse({ name: "홍길동" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("active");
      }
    });

    it("inactive이면 성공해야 함", () => {
      const result = clientSchema.safeParse({ name: "홍길동", status: "inactive" });
      expect(result.success).toBe(true);
    });

    it("discharged이면 성공해야 함", () => {
      const result = clientSchema.safeParse({ name: "홍길동", status: "discharged" });
      expect(result.success).toBe(true);
    });

    it("잘못된 상태 값이면 실패해야 함", () => {
      const result = clientSchema.safeParse({ name: "홍길동", status: "invalid" });
      expect(result.success).toBe(false);
    });
  });

  describe("전체 유효한 데이터 검증", () => {
    it("모든 필드가 유효하면 성공해야 함", () => {
      const validData = {
        name: "홍길동",
        birth_date: "1990-01-01",
        gender: "male",
        disability_type: "지체장애",
        disability_grade: "1급",
        contact_phone: "010-1234-5678",
        contact_email: "hong@example.com",
        address: "서울시 강남구",
        guardian_name: "홍부모",
        guardian_phone: "010-9876-5432",
        referral_source: "병원",
        intake_date: "2025-10-30",
        status: "active",
        notes: "특이사항 없음",
      };

      const result = clientSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

describe("clientFilterSchema", () => {
  it("기본값이 올바르게 설정되어야 함", () => {
    const result = clientFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("all");
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(25);
    }
  });

  it("커스텀 필터 값이면 성공해야 함", () => {
    const result = clientFilterSchema.safeParse({
      search: "홍길동",
      status: "active",
      disability_type: "지체장애",
      page: 2,
      limit: 50,
    });
    expect(result.success).toBe(true);
  });

  it("limit이 100을 초과하면 실패해야 함", () => {
    const result = clientFilterSchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });
});

describe("clientUpdateSchema", () => {
  it("부분 업데이트가 가능해야 함", () => {
    const result = clientUpdateSchema.safeParse({ name: "새이름" });
    expect(result.success).toBe(true);
  });

  it("빈 객체도 성공해야 함", () => {
    const result = clientUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("잘못된 필드 값이면 실패해야 함", () => {
    const result = clientUpdateSchema.safeParse({ status: "invalid" });
    expect(result.success).toBe(false);
  });
});
