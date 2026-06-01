-- Re-schedule the two public cron jobs with the project anon key in the apikey header,
-- so the hardened /api/public/hooks/* endpoints accept them.
SELECT cron.unschedule('swaplix-expire-swaps');
SELECT cron.unschedule('monitor-deposits-every-minute');

SELECT cron.schedule(
  'swaplix-expire-swaps',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--ff5f8297-c2b1-4617-989f-fd787c3c3ef4.lovable.app/api/public/hooks/expire-swaps',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoZ3JtcmxwbnF6aWh4Y2J0Y3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1ODMwMDEsImV4cCI6MjA5NTE1OTAwMX0.4Cp-pe7PcXfNMlNE6ZPs-YKRt45w3J61Y_8AYvTaiT8"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'monitor-deposits-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--ff5f8297-c2b1-4617-989f-fd787c3c3ef4.lovable.app/api/public/hooks/monitor-deposits',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoZ3JtcmxwbnF6aWh4Y2J0Y3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1ODMwMDEsImV4cCI6MjA5NTE1OTAwMX0.4Cp-pe7PcXfNMlNE6ZPs-YKRt45w3J61Y_8AYvTaiT8"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);