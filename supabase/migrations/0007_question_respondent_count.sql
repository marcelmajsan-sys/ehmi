-- 0007_question_respondent_count.sql — SIGURNO za git
-- Dodaje po-pitanju bazu ispitanika u question_aggregates radi ispravnih
-- postotaka kod multi-select pitanja.
--
-- Problem: graf je postotak računao kao count / SUM(svih count-ova pitanja).
-- Za multi-select pitanja (npr. Q20 "kanali komunikacije") jedan ispitanik
-- bira više opcija, pa je SUM puno veći od broja ispitanika → "Telefonski
-- pozivi: 127 odgovora" je prikazivalo 19% (127/~668 odabira) umjesto
-- 73% (127/173 ispitanika).
--
-- Rješenje: respondent_count = broj ISPITANIKA koji su odgovorili na pitanje.
--   - multi  → count(distinct respondent_id) iz response_options
--   - single → SUM(count) (svaki ispitanik = 1 red), pa su single postoci
--              ostali identični; dijeljenje s respondent_count daje isti rezultat.
-- Stupac je denormaliziran (ista vrijednost na svakom redu pitanja) jer
-- question_aggregates je plitka tablica koju frontend grupira po question_key.

alter table question_aggregates
  add column if not exists respondent_count int;

with base as (
  select q.key,
         case
           when q.type = 'multi' then (
             select count(distinct ro.respondent_id)
             from response_options ro
             where ro.question_key = q.key
           )
           else (
             select coalesce(sum(qa.count), 0)
             from question_aggregates qa
             where qa.question_key = q.key
           )
         end as cnt
  from questions q
)
update question_aggregates qa
set respondent_count = base.cnt
from base
where base.key = qa.question_key;
