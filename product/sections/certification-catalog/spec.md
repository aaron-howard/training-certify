# Certification Catalog Specification

## Overview
The Certification Catalog is a comprehensive directory of vendor certifications (AWS, Azure, Google Cloud, (ISC)², CompTIA, ITIL, etc.) that enables employees, managers, and administrators to discover, research, and track certifications. Users can browse and search the catalog, view detailed certification information, add certifications to their profile, mark certifications as goals, and see which team members hold specific certifications.

## User Flows
- Browse all certifications in a searchable/filterable grid or list view
- Filter certifications by vendor, category, or difficulty level
- Search for certifications by name or keyword
- Click a certification to view its full detail page with description, requirements, exam info, and renewal requirements
- Add a certification to their profile for tracking
- Mark a certification as interested/goal for future pursuit
- View which team members currently hold a specific certification

## UI Requirements
- **Browse page** displays certifications with: name, vendor logo, category/type tags, difficulty level indicator, and validity period
- **Filtering controls** for vendor, category, difficulty, plus free-text search
- **Certification cards/rows** with quick actions: "View Details," "Add to Profile," "Mark as Goal," "View Holders"
- **Detail page** shows: full description & overview, prerequisites & requirements, exam information (format, duration, cost, passing score), and renewal/recertification requirements
- **Responsive grid/list layout** that works on mobile, tablet, and desktop
- **Light and dark mode support**

## Out of Scope
- Adding or editing catalog entries (admin catalog management is separate)

## Configuration
- shell: true
