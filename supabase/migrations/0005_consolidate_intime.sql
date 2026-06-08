-- 0005_consolidate_intime.sql
-- Q9 ("Kako dostavljate svoje proizvode?") collected the InTime courier as a
-- free-text "Nešto drugo / Ostalo" answer, so it landed in the data under many
-- spellings: INTIME, InTime, IN Time, In Time (samo za velike pakete), inTime,
-- "inTime + direktna dostava koju nude dobavljači". This fragmented the count
-- and made Explore unable to find it. Merge every variant into one canonical
-- "INTIME", in both the per-respondent rows and the pre-counted aggregates.
--
-- Match rule: strip everything but letters, lowercase, and check the value
-- starts with "intime" (catches spaced/suffixed variants, ignores the canonical
-- one). Scoped to Q9 only.

begin;

-- 1) Normalize the per-respondent free-text rows.
update response_options
set option_value = 'INTIME'
where question_key = 'q09_kako_dostavljate_svoje_proizvode'
  and option_value <> 'INTIME'
  and regexp_replace(lower(option_value), '[^a-z]', '', 'g') like 'intime%';

-- 2) Drop any duplicates the merge may have created
--    (respondent who held two different InTime spellings).
delete from response_options a
using response_options b
where a.ctid < b.ctid
  and a.respondent_id = b.respondent_id
  and a.question_key  = b.question_key
  and a.option_value  = b.option_value;

-- 3) Rebuild the aggregate: remove all InTime variant rows, then re-insert a
--    single INTIME counted straight from the normalized response_options.
delete from question_aggregates
where question_key = 'q09_kako_dostavljate_svoje_proizvode'
  and regexp_replace(lower(option_value), '[^a-z]', '', 'g') like 'intime%';

insert into question_aggregates (question_key, option_value, count)
select 'q09_kako_dostavljate_svoje_proizvode',
       'INTIME',
       count(distinct respondent_id)::int
from response_options
where question_key = 'q09_kako_dostavljate_svoje_proizvode'
  and option_value = 'INTIME';

commit;
