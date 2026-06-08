-- 0006_consolidate_gebruder_weiss.sql
-- Like InTime (see 0005), the Gebrüder Weiss courier was typed as a free-text
-- "Nešto drugo / Ostalo" answer for Q9 under several spellings and an
-- abbreviation. Merge them all into the canonical "Gebrüder Weiss".
--
-- Explicit allowlist (not a fuzzy match) because one variant is the bare
-- abbreviation "GW", and because the compound "Gebruder weiss, Baritrans" is
-- deliberately NOT merged — it also names a second courier (Baritrans) and
-- collapsing it would erase that information.

begin;

-- 1) Normalize the per-respondent free-text rows.
update response_options
set option_value = 'Gebrüder Weiss'
where question_key = 'q09_kako_dostavljate_svoje_proizvode'
  and option_value in (
    'Gebruder Weiss',
    'Gebrueder Weiss',
    'Gebruder Weis',
    'Gebruder',
    'GW'
  );

-- 2) Drop any duplicates the merge may have created.
delete from response_options a
using response_options b
where a.ctid < b.ctid
  and a.respondent_id = b.respondent_id
  and a.question_key  = b.question_key
  and a.option_value  = b.option_value;

-- 3) Rebuild the aggregate: remove the merged variant rows, then re-insert a
--    single Gebrüder Weiss counted from the normalized response_options.
delete from question_aggregates
where question_key = 'q09_kako_dostavljate_svoje_proizvode'
  and option_value in (
    'Gebruder Weiss',
    'Gebrueder Weiss',
    'Gebruder Weis',
    'Gebruder',
    'GW',
    'Gebrüder Weiss'
  );

insert into question_aggregates (question_key, option_value, count)
select 'q09_kako_dostavljate_svoje_proizvode',
       'Gebrüder Weiss',
       count(distinct respondent_id)::int
from response_options
where question_key = 'q09_kako_dostavljate_svoje_proizvode'
  and option_value = 'Gebrüder Weiss';

commit;
