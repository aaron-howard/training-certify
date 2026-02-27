# Vendor Keep List – Consolidation Analysis

## Goal

One canonical vendor per certification program; names should make scope clear so we don’t add duplicates (e.g. "Azure" vs "Microsoft", "AWS" vs "Amazon").

---

## Already in good shape (use as pattern)

| Vendor name                   | Why it works                                                                                 |
| ----------------------------- | -------------------------------------------------------------------------------------------- |
| **Amazon Web Services (AWS)** | One entry; "AWS" is in the name so no separate "AWS" or "Amazon" needed.                     |
| **Microsoft**                 | One entry; can cover Azure, M365, and related programs if we make that explicit (see below). |
| **Google Cloud**              | One entry; no need for separate "GCP" or "Google Workspace".                                 |
| **GIAC / SANS**               | Single combined name.                                                                        |
| **Axelos / PeopleCert**       | Single combined name.                                                                        |

---

## Recommended renames (consolidation by naming)

Keep **one row per certification program** (so existing cert data and keys stay valid), but rename so the **parent company or product scope** is clear. That reduces the chance of adding "Azure", "AWS", "Splunk", etc. as a second vendor later.

| Current   | Recommended                 | Reason                                                                               |
| --------- | --------------------------- | ------------------------------------------------------------------------------------ |
| Microsoft | **Microsoft (Azure, M365)** | Makes it explicit that Azure/M365 certs live here; avoids a separate "Azure" vendor. |
| Red Hat   | **Red Hat (IBM)**           | Red Hat is under IBM; certs are still Red Hat–branded.                               |
| Splunk    | **Splunk (Cisco)**          | Splunk is under Cisco; certs still Splunk-branded.                                   |
| Tableau   | **Tableau (Salesforce)**    | Tableau is under Salesforce; certs still Tableau-branded.                            |
| GitHub    | **GitHub (Microsoft)**      | GitHub is under Microsoft; certs still GitHub-branded.                               |
| VMware    | **VMware (Broadcom)**       | VMware is under Broadcom; certs still VMware-branded.                                |

---

## No change recommended

- **Certification bodies** (CompTIA, ISC2, ISACA, etc.) – Distinct; no consolidation.
- **Cloud** – Oracle, IBM, Alibaba, Tencent: keep as-is.
- **Security / identity** – All distinct vendors.
- **Infrastructure** – HPE, Dell, Nutanix, Juniper, Arista: keep as-is.
- **Data / analytics** – Databricks, Snowflake, Cloudera, SAS, Dataiku, Alteryx, Informatica, Neo4j, Elastic, Qlik: all distinct.
- **DevOps** – HashiCorp, Docker, GitLab, SUSE, Chef, Puppet, CloudBees, Automation Anywhere, UiPath, Blue Prism: keep as-is.
- **Enterprise SaaS** – ServiceNow, SAP, Workday, Atlassian, Adobe, HubSpot, Zendesk, DocuSign: keep as-is.
- **Observability** – Datadog, Dynatrace, New Relic, Grafana Labs: keep as-is.

---

## What we are _not_ doing

- **Merging two rows into one** (e.g. deleting "Tableau" and moving its certs to "Salesforce") – would require data migration and break existing `vendor_id` references. Renaming keeps one row per program and only changes the display name.
- **Removing vendors** – this list is the “keep” list; consolidation here is naming only.

---

## Summary

Apply the 6 renames in the table above so that:

1. **Azure** and **AWS** stay clearly under Microsoft and Amazon (no extra vendors).
2. **Acquired brands** (Splunk, Tableau, GitHub, Red Hat, VMware) stay as one row each but show parent in the name.

Result: same number of rows, clearer names, fewer future duplicates.
