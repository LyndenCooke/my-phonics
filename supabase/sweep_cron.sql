-- Reliable sweep scheduler (2026-08-26). The GitHub Actions cron in
-- .github/workflows/sweep.yml asks for */10 but GitHub throttles free-tier
-- schedules to an unpredictable 40-120+ min (measured 2026-08-26: eight runs
-- in nine hours, an 80-min gap while a paid book sat stranded). pg_cron
-- fires on time, from our own database, every 5 minutes. Idempotent —
-- cron.schedule upserts by job name. The GitHub workflow stays as a backstop.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'forge-sweep',
  '*/5 * * * *',
  $$ select net.http_get(
       url := 'https://www.myphonicsbooks.co.uk/api/forge/sweep',
       timeout_milliseconds := 60000
     ); $$
);

-- Show what's scheduled so the run is self-verifying.
select jobname, schedule, active from cron.job;
