-- Migration: Normalize certification_category and certification_difficulty enums
-- This migration replaces polluted enum values with clean, domain-appropriate values.
--
-- Category: vendor-specific values (AppDynamics, Meraki, DevNet, etc.) → genuine domain categories
-- Difficulty: misplaced category values (Cybersecurity, ServiceNow, etc.) → actual skill levels

--> statement-breakpoint

-- Step 1: Create the new enum types with normalized values
CREATE TYPE "certification_category_new" AS ENUM (
  'AI & Machine Learning',
  'Business Applications',
  'Cloud',
  'Collaboration',
  'Data & Analytics',
  'Database',
  'DevOps',
  'Governance & Compliance',
  'Infrastructure',
  'IT Service Management',
  'Networking',
  'Operating Systems',
  'Project Management',
  'Security',
  'Software Development'
);

--> statement-breakpoint

CREATE TYPE "certification_difficulty_new" AS ENUM (
  'Foundational',
  'Associate',
  'Professional',
  'Expert'
);

--> statement-breakpoint

-- Step 2: Alter the certifications table to use the new enum types
-- Map old category values to new normalized values
ALTER TABLE "certifications"
  ALTER COLUMN "category" TYPE "certification_category_new"
  USING CASE "category"::text
    WHEN 'AI' THEN 'AI & Machine Learning'
    WHEN 'AI & Machine Learning' THEN 'AI & Machine Learning'
    WHEN 'AppDynamics' THEN 'DevOps'
    WHEN 'Business Applications' THEN 'Business Applications'
    WHEN 'Channel/Partner' THEN 'Business Applications'
    WHEN 'Cloud' THEN 'Cloud'
    WHEN 'Collaboration' THEN 'Collaboration'
    WHEN 'Cybersecurity' THEN 'Security'
    WHEN 'Data' THEN 'Data & Analytics'
    WHEN 'Data & Analytics' THEN 'Data & Analytics'
    WHEN 'Data Center' THEN 'Infrastructure'
    WHEN 'Database' THEN 'Database'
    WHEN 'Design' THEN 'Software Development'
    WHEN 'Governance & Compliance' THEN 'Governance & Compliance'
    WHEN 'Infrastructure' THEN 'Infrastructure'
    WHEN 'IT Service Management' THEN 'IT Service Management'
    WHEN 'DevNet' THEN 'DevOps'
    WHEN 'DevOps' THEN 'DevOps'
    WHEN 'Dynamics 365' THEN 'Business Applications'
    WHEN 'Enterprise' THEN 'Infrastructure'
    WHEN 'Field Technician' THEN 'Infrastructure'
    WHEN 'IT' THEN 'IT Service Management'
    WHEN 'Meraki' THEN 'Networking'
    WHEN 'Modern Workplace' THEN 'Collaboration'
    WHEN 'Networking' THEN 'Networking'
    WHEN 'Operating Systems' THEN 'Operating Systems'
    WHEN 'Power Platform' THEN 'Business Applications'
    WHEN 'Project Management' THEN 'Project Management'
    WHEN 'Security' THEN 'Security'
    WHEN 'Service Provider' THEN 'Networking'
    WHEN 'Software Development' THEN 'Software Development'
    WHEN 'Support Technician' THEN 'IT Service Management'
    ELSE 'Cloud'
  END::"certification_category_new";

--> statement-breakpoint

-- Map old difficulty values to new normalized levels
ALTER TABLE "certifications"
  ALTER COLUMN "difficulty" TYPE "certification_difficulty_new"
  USING CASE "difficulty"::text
    WHEN 'Advanced' THEN 'Professional'
    WHEN 'Associate' THEN 'Associate'
    WHEN 'Beginner' THEN 'Foundational'
    WHEN 'Foundational' THEN 'Foundational'
    WHEN 'Cybersecurity' THEN 'Professional'
    WHEN 'Expert' THEN 'Expert'
    WHEN 'Financial App' THEN 'Professional'
    WHEN 'Information Technology' THEN 'Associate'
    WHEN 'Intermediate' THEN 'Associate'
    WHEN 'IT Finance' THEN 'Professional'
    WHEN 'Networking' THEN 'Associate'
    WHEN 'Professional' THEN 'Professional'
    WHEN 'Project Management' THEN 'Professional'
    WHEN 'ServiceNow' THEN 'Associate'
    WHEN 'ServiceNow*' THEN 'Associate'
    WHEN 'Software and Quality' THEN 'Associate'
    WHEN 'Virtualization' THEN 'Professional'
    ELSE 'Associate'
  END::"certification_difficulty_new";

--> statement-breakpoint

-- Step 3: Drop the old enum types
DROP TYPE "certification_category";

--> statement-breakpoint

DROP TYPE "certification_difficulty";

--> statement-breakpoint

-- Step 4: Rename the new enum types to the original names
ALTER TYPE "certification_category_new" RENAME TO "certification_category";

--> statement-breakpoint

ALTER TYPE "certification_difficulty_new" RENAME TO "certification_difficulty";
