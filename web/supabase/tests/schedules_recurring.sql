-- schedules_recurring.sql
-- 반복 일정 관련 제약 조건 및 참조 무결성 테스트

BEGIN;

-- 1. recurrence_rule 없이 is_recurring = TRUE 입력 시 체크 제약이 동작하는지 확인
DO $$
BEGIN
  BEGIN
    INSERT INTO schedules (
      schedule_type,
      title,
      start_time,
      end_time,
      is_recurring
    )
    VALUES (
      'consultation',
      'Invalid recurring schedule',
      NOW(),
      NOW() + INTERVAL '1 hour',
      TRUE
    );

    RAISE EXCEPTION 'check_recurrence_rule_presence should have prevented this insert';
  EXCEPTION
    WHEN check_violation THEN
      -- 기대한 예외: 제약 조건 정상 동작
      RAISE NOTICE '✅ check_recurrence_rule_presence constraint enforced';
  END;
END;
$$;

-- 2. 유효한 반복 템플릿과 하위 인스턴스를 생성하고 정리
WITH template AS (
  INSERT INTO schedules (
    schedule_type,
    title,
    start_time,
    end_time,
    is_recurring,
    recurrence_rule,
    recurrence_end_time
  )
  VALUES (
    'assessment',
    'Recurring assessment template',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '1 day 1 hour',
    TRUE,
    'FREQ=WEEKLY;INTERVAL=1;BYDAY=MO',
    NOW() + INTERVAL '30 days'
  )
  RETURNING id
)
INSERT INTO schedules (
  schedule_type,
  title,
  start_time,
  end_time,
  recurrence_parent_id,
  is_recurring
)
SELECT
  'assessment',
  'Recurring assessment instance',
  NOW() + INTERVAL '8 days',
  NOW() + INTERVAL '8 days 1 hour',
  template.id,
  FALSE
FROM template;

-- 생성된 테스트 데이터 정리
DELETE FROM schedules
WHERE title IN ('Recurring assessment instance', 'Recurring assessment template');

COMMIT;

