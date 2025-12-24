# Milestone 4: Team & Workforce Management

## Objective

Implement the Team & Workforce Management section, providing managers and executives with team competency visibility, gap analysis, and workforce planning tools.

## Overview

This section provides:
- Competency dashboard with coverage metrics and gap visualization
- Team detail views with member certification status
- Certification requirement setting for roles/teams
- Workforce planning with projected gaps and recommendations

## Tasks

### 1. Review Section Specification

Read `sections/team-and-workforce-management/spec.md` and `sections/team-and-workforce-management/README.md` to understand requirements.

### 2. Review Sample Data and Types

- Check `sections/team-and-workforce-management/sample-data.json` for example data
- Review `sections/team-and-workforce-management/types.ts` for interfaces

### 3. Implement Components

Copy the components from `sections/team-and-workforce-management/components/`:

- `CompetencyDashboard.tsx` — Main dashboard with metrics and visualizations
- `CoverageMetrics.tsx` — Key metrics cards (coverage %, expiring certs, gaps)
- `TeamComparisonChart.tsx` — Bar/column chart comparing teams
- `GapAnalysisHeatmap.tsx` — Heatmap showing teams vs. certifications

Place in `src/components/team-workforce/` or similar.

### 4. Update Import Paths

Update imports to reference your global data model:

```typescript
// Change imports from product/ to your types location
import type { Team, Certification } from '@/types'
```

### 5. Wire Up to Routing

Add the component to your routes:

```typescript
import { CompetencyDashboard } from './components/team-workforce/CompetencyDashboard'

<Route
  path="/team-workforce"
  element={
    <CompetencyDashboard
      teams={mockTeams}
      certifications={mockCertifications}
      coverageData={mockCoverageData}
      onDrillDown={(teamId) => console.log('Drill down:', teamId)}
    />
  }
/>
```

### 6. Implement State Management

Wire up actual state and data fetching:

```typescript
function TeamWorkforcePage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [coverageData, setCoverageData] = useState<CoverageData>({})

  useEffect(() => {
    // Fetch team data from API
    // Calculate coverage metrics
  }, [])

  return (
    <CompetencyDashboard
      teams={teams}
      certifications={certifications}
      coverageData={coverageData}
    />
  )
}
```

### 7. Implement Drill-Down Navigation

When users click a team in the dashboard, show detailed team view:

```typescript
const [selectedTeam, setSelectedTeam] = useState<string | null>(null)

if (selectedTeam) {
  return (
    <TeamDetailView
      team={teams.find(t => t.id === selectedTeam)}
      onBack={() => setSelectedTeam(null)}
    />
  )
}
```

### 8. Run Tests

Review `sections/team-and-workforce-management/tests.md`. Manually test:

- View competency dashboard with all metrics
- Compare teams in the chart
- View gap analysis heatmap
- Drill down into team details
- View member certification status
- Identify missing certifications (gaps)

## Deliverables

- ✅ Competency dashboard implemented
- ✅ Coverage metrics displaying correctly
- ✅ Team comparison chart working
- ✅ Gap analysis heatmap showing gaps
- ✅ Drill-down to team details functional

## Acceptance Criteria

- [ ] Dashboard shows coverage %, expiring certifications, and gap count
- [ ] Coverage metrics use color coding (green/yellow/red)
- [ ] Team comparison chart displays all teams
- [ ] Heatmap shows which teams are missing which certifications
- [ ] Clicking a team drills down to detail view
- [ ] Team detail shows member list with certification status
- [ ] Gaps are clearly highlighted

## Next Steps

Proceed to Milestone 5: Compliance & Audit.
