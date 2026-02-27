-- ============================================================
-- Seed: Definitive Keep List (PostgreSQL)
-- Safe to run multiple times (no duplicates).
-- Schema: table "vendors", columns "id", "name", "logo", "created_at"
-- (no IsActive column).
-- Consolidation rationale: vendor-keep-list-analysis.md
-- ============================================================

BEGIN;

-- 0) Dedupe vendors by lower(name) so the unique index can be created.
--    Keeps one row per case-insensitive name; certifications are pointed at that row; others deleted.
CREATE TEMP TABLE _vendor_lname AS
SELECT id, lower(name) AS lname,
       row_number() OVER (PARTITION BY lower(name) ORDER BY id) AS rn
FROM vendors;

UPDATE certifications c
SET vendor_id = k.keep_id
FROM (
  SELECT id AS keep_id, lname FROM _vendor_lname WHERE rn = 1
) k
JOIN _vendor_lname d ON d.lname = k.lname AND d.rn > 1
WHERE c.vendor_id = d.id;

DELETE FROM vendors
WHERE id IN (SELECT id FROM _vendor_lname WHERE rn > 1);

-- 1) Enforce no-duplicate rule at the DB level (case-insensitive).
--    Prevents "AWS" vs "aws" duplicates. Safe on reruns.
CREATE UNIQUE INDEX IF NOT EXISTS vendors_name_ci_uniq
ON vendors (lower(name));

-- 2) Seed data (Definitive Keep List).
--    id = deterministic slug from name so reruns don't create duplicates.
WITH seed(name) AS (
  VALUES
    -- Certification Authorities / Bodies
    ('CompTIA'),
    ('ISC2'),
    ('ISACA'),
    ('GIAC / SANS'),
    ('EC-Council'),
    ('Linux Foundation'),
    ('Linux Professional Institute (LPI)'),
    ('Scrum.org'),
    ('Project Management Institute (PMI)'),
    ('The Open Group'),
    ('Axelos / PeopleCert'),
    ('HDI'),
    ('Service Desk Institute'),

    -- Cloud / Platform Providers
    ('Amazon Web Services (AWS)'),
    ('Microsoft (Azure, M365)'),
    ('Google Cloud'),
    ('Oracle'),
    ('IBM'),
    ('Alibaba Cloud'),
    ('Tencent Cloud'),

    -- Security / Identity
    ('Cisco'),
    ('Fortinet'),
    ('Palo Alto Networks'),
    ('Check Point'),
    ('CrowdStrike'),
    ('Splunk (Cisco)'),
    ('Qualys'),
    ('Rapid7'),
    ('Tenable'),
    ('Trend Micro'),
    ('Zscaler'),
    ('CyberArk'),
    ('SailPoint'),
    ('Okta'),
    ('Ping Identity'),
    ('Imperva'),
    ('F5 Networks'),
    ('Sophos'),
    ('WatchGuard'),

    -- Infrastructure / Networking
    ('VMware (Broadcom)'),
    ('Red Hat (IBM)'),
    ('Nutanix'),
    ('Juniper Networks'),
    ('HPE'),
    ('Dell Technologies'),
    ('Arista Networks'),

    -- Data / Analytics / AI
    ('Databricks'),
    ('Snowflake'),
    ('Cloudera'),
    ('Tableau (Salesforce)'),
    ('SAS'),
    ('Dataiku'),
    ('Alteryx'),
    ('Informatica'),
    ('Neo4j'),
    ('Elastic'),
    ('Qlik'),

    -- DevOps / Automation
    ('HashiCorp'),
    ('Docker'),
    ('GitHub (Microsoft)'),
    ('GitLab'),
    ('SUSE'),
    ('Chef'),
    ('Puppet'),
    ('CloudBees'),
    ('Automation Anywhere'),
    ('UiPath'),
    ('Blue Prism'),

    -- Enterprise SaaS with formal certifications
    ('Salesforce'),
    ('ServiceNow'),
    ('SAP'),
    ('Workday'),
    ('Atlassian'),
    ('Adobe'),
    ('HubSpot'),
    ('Zendesk'),
    ('DocuSign'),

    -- Observability
    ('Datadog'),
    ('Dynatrace'),
    ('New Relic'),
    ('Grafana Labs')
),
slugged AS (
  SELECT
    trim(both '-' from regexp_replace(regexp_replace(lower(name), '[^a-z0-9]+', '-', 'gi'), '-+', '-', 'g')) AS id,
    name
  FROM seed
  WHERE trim(name) <> ''
)
-- 3) Insert only missing vendors (idempotent).
INSERT INTO vendors (id, name, logo, created_at)
SELECT s.id, s.name, NULL, now()
FROM slugged s
WHERE NOT EXISTS (
  SELECT 1
  FROM vendors v
  WHERE lower(v.name) = lower(s.name)
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name;

COMMIT;

-- ============================================================
-- Sanity check (optional):
--   SELECT id, name FROM vendors ORDER BY lower(name);
-- ============================================================
