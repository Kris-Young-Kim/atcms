-- View: client_activity_overview
-- 목적: 대상자별 활동 요약(상담/평가/대여/맞춤제작) 및 최신 활동 시점을 한 번에 조회하기 위한 뷰

create or replace view client_activity_overview as
select
  c.id,
  c.name,
  c.birth_date,
  c.gender,
  c.disability_type,
  c.disability_grade,
  c.contact_phone,
  c.contact_email,
  c.address,
  c.guardian_name,
  c.guardian_phone,
  c.referral_source,
  c.intake_date,
  c.status,
  c.notes,
  c.created_at,
  c.updated_at,
  c.created_by_user_id,
  c.updated_by_user_id,
  coalesce(
    (
      select count(*)::int
      from service_records sr
      where sr.client_id = c.id
        and sr.record_type = 'consultation'
    ),
    0
  ) as consultation_count,
  coalesce(
    (
      select count(*)::int
      from service_records sr
      where sr.client_id = c.id
        and sr.record_type = 'assessment'
    ),
    0
  ) as assessment_count,
  coalesce(
    (
      select count(*)::int
      from rentals r
      where r.client_id = c.id
        and r.status = 'active'
    ),
    0
  ) as active_rental_count,
  coalesce(
    (
      select count(*)::int
      from customization_requests cr
      where cr.client_id = c.id
        and cr.status not in ('completed', 'cancelled')
    ),
    0
  ) as active_customization_count,
  coalesce(
    (
      select max(activity_date)
      from (
        select sr.record_date::timestamp as activity_date
        from service_records sr
        where sr.client_id = c.id

        union all

        select r.rental_date::timestamp as activity_date
        from rentals r
        where r.client_id = c.id

        union all

        select coalesce(cr.updated_at, cr.requested_date::timestamp) as activity_date
        from customization_requests cr
        where cr.client_id = c.id

        union all

        select s.start_time as activity_date
        from schedules s
        where s.client_id = c.id
      ) activity_union
    ),
    null
  ) as last_activity_at,
  coalesce(
    (
      select count(*)::int
      from (
        select sr.id
        from service_records sr
        where sr.client_id = c.id

        union all

        select r.id
        from rentals r
        where r.client_id = c.id

        union all

        select cr.id
        from customization_requests cr
        where cr.client_id = c.id

        union all

        select s.id
        from schedules s
        where s.client_id = c.id
      ) activity_counts
    ),
    0
  ) as total_activity_count
from clients c;

comment on view client_activity_overview is '대상자 기본 정보와 활동 요약(상담, 평가, 대여, 맞춤제작) 및 최신 활동 시점을 제공하는 뷰';

