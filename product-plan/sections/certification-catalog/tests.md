# Certification Catalog - Test Specifications

This document outlines test scenarios for the Certification Catalog section. Tests should verify both functionality and user experience across all supported devices and modes.

## Test Environment Setup

- **Browsers**: Chrome, Firefox, Safari, Edge
- **Devices**: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)
- **Modes**: Light mode and Dark mode
- **Sample Data**: Use `sample-data.json` for test data

## Browse Page Tests

### BRW-001: Display All Certifications

**Objective**: Verify that all certifications are displayed in the browse view

**Steps**:

1. Navigate to `/catalog`
2. Observe the certification grid

**Expected**:

- All certifications from sample data are displayed
- Each card shows: name, vendor logo, category tag, difficulty indicator, validity period
- Cards are arranged in a responsive grid (4 columns on desktop, 2 on tablet, 1 on mobile)
- No loading errors or missing images

### BRW-002: Search Functionality

**Objective**: Verify search filters certifications by name or keyword

**Steps**:

1. Navigate to `/catalog`
2. Enter "AWS" in the search bar
3. Observe filtered results
4. Clear search and enter "architect"
5. Observe filtered results

**Expected**:

- Step 3: Only AWS certifications are displayed
- Step 5: Certifications with "architect" in the name are displayed
- Search is case-insensitive
- Results update immediately as user types
- "No results" message appears if no matches

### BRW-003: Filter by Vendor

**Objective**: Verify vendor filter works correctly

**Steps**:

1. Navigate to `/catalog`
2. Open vendor filter
3. Select "Microsoft"
4. Observe results
5. Select additional vendor "Google Cloud"
6. Observe results

**Expected**:

- Step 4: Only Microsoft certifications displayed
- Step 6: Both Microsoft and Google Cloud certifications displayed
- Filter count badge shows number of active filters
- "Clear filters" option is visible

### BRW-004: Filter by Category

**Objective**: Verify category filter works correctly

**Steps**:

1. Navigate to `/catalog`
2. Select "Security" category filter
3. Observe results
4. Select "Cloud" category
5. Observe results

**Expected**:

- Step 3: Only security certifications displayed
- Step 5: Both security and cloud certifications displayed
- Category tags on cards match selected filters

### BRW-005: Filter by Difficulty

**Objective**: Verify difficulty filter works correctly

**Steps**:

1. Navigate to `/catalog`
2. Select "Beginner" difficulty
3. Observe results
4. Change to "Advanced"
5. Observe results

**Expected**:

- Step 3: Only beginner certifications displayed
- Step 5: Only advanced certifications displayed
- Difficulty indicators on cards match filter

### BRW-006: Combined Filters

**Objective**: Verify multiple filters work together

**Steps**:

1. Navigate to `/catalog`
2. Search for "cloud"
3. Filter by vendor "AWS"
4. Filter by difficulty "Advanced"
5. Observe results

**Expected**:

- Only certifications matching ALL criteria are displayed
- Filter count shows total active filters
- Clearing any filter updates results immediately

### BRW-007: Empty State

**Objective**: Verify empty state appears when no results

**Steps**:

1. Navigate to `/catalog`
2. Search for "nonexistent certification xyz"
3. Observe empty state

**Expected**:

- Empty state message appears
- Message suggests: "No certifications found. Try adjusting your search or filters."
- Clear filters/search button is prominently displayed
- Layout remains intact (no broken UI)

### BRW-008: Responsive Layout

**Objective**: Verify browse page adapts to different screen sizes

**Steps**:

1. Navigate to `/catalog` on desktop
2. Resize to tablet width
3. Resize to mobile width

**Expected**:

- Desktop: 4-column grid
- Tablet: 2-column grid
- Mobile: 1-column grid (stacked cards)
- Search and filter controls remain accessible
- No horizontal scrolling

### BRW-009: Quick Actions

**Objective**: Verify quick action buttons work on certification cards

**Steps**:

1. Navigate to `/catalog`
2. Click "View Details" on a certification card
3. Go back, click "Add to Profile" on a card
4. Go back, click "Mark as Goal" on a card
5. Go back, click "View Holders" on a card

**Expected**:

- Step 2: Navigates to detail page
- Step 3: Confirmation message or navigates to Certification Management
- Step 4: Confirmation message that goal was saved
- Step 5: Shows list of team members who hold this certification

## Detail Page Tests

### DET-001: Display Certification Details

**Objective**: Verify detail page shows complete certification information

**Steps**:

1. Navigate to `/catalog`
2. Click on "AWS Certified Solutions Architect - Associate"
3. Observe detail page

**Expected**:

- Certification name and vendor displayed
- Category and difficulty tags shown
- Full description visible
- Prerequisites section (required and recommended)
- Exam information (format, duration, questions, passing score, cost)
- Renewal requirements displayed
- Intended audience list shown
- Holder count displayed

### DET-002: Back Navigation

**Objective**: Verify back button returns to browse page

**Steps**:

1. Navigate to certification detail page
2. Click "Back to Catalog" button

**Expected**:

- Returns to browse page
- Previous search/filter state is preserved (if applicable)

### DET-003: Add to Profile Action

**Objective**: Verify add to profile button works

**Steps**:

1. Navigate to certification detail page
2. Click "Add to Profile" button
3. Observe result

**Expected**:

- Success confirmation message appears
- OR navigates to Certification Management with add form pre-filled
- Button state changes to indicate already added (if returning to page)

### DET-004: Mark as Goal Action

**Objective**: Verify mark as goal button works

**Steps**:

1. Navigate to certification detail page
2. Click "Mark as Goal" button
3. Observe result

**Expected**:

- Confirmation message appears
- Goal is saved
- Button state changes to show "Goal Set" or similar

### DET-005: View Holders Action

**Objective**: Verify view holders shows team members

**Steps**:

1. Navigate to certification detail page
2. Click "View Holders" button (shows X holders)
3. Observe result

**Expected**:

- Modal or new view shows list of team members
- Each member shows name, role, team
- If no holders, message says "No team members hold this certification yet"

### DET-006: Responsive Detail Page

**Objective**: Verify detail page works on all devices

**Steps**:

1. View detail page on desktop
2. Resize to tablet
3. Resize to mobile

**Expected**:

- Desktop: Sidebar layout with exam info on right
- Tablet: Sidebar collapses below main content
- Mobile: Single column, all content stacked
- No text truncation or overflow issues

### DET-007: Direct URL Access

**Objective**: Verify detail page loads via direct URL

**Steps**:

1. Navigate directly to `/catalog/cert-id-123`
2. Observe page load

**Expected**:

- Page loads successfully
- All data is displayed
- Back button still works

### DET-008: Invalid Certification ID

**Objective**: Verify error handling for nonexistent certifications

**Steps**:

1. Navigate to `/catalog/nonexistent-id-999`
2. Observe result

**Expected**:

- Error message: "Certification not found"
- Option to return to catalog
- No broken UI or console errors

## Dark Mode Tests

### DRK-001: Dark Mode Browse Page

**Objective**: Verify browse page renders correctly in dark mode

**Steps**:

1. Enable dark mode
2. Navigate to `/catalog`
3. Inspect visual elements

**Expected**:

- Background is dark (slate-900 or darker)
- Text is light (slate-100 or lighter)
- Cards have dark backgrounds with visible borders
- Hover states work and are visible
- All icons and badges are readable

### DRK-002: Dark Mode Detail Page

**Objective**: Verify detail page renders correctly in dark mode

**Steps**:

1. Enable dark mode
2. Navigate to a certification detail page
3. Inspect visual elements

**Expected**:

- All sections have appropriate dark backgrounds
- Text maintains good contrast
- Sidebar/exam info section is visually distinct
- Buttons and actions are clearly visible

## Accessibility Tests

### ACC-001: Keyboard Navigation

**Objective**: Verify all interactive elements are keyboard accessible

**Steps**:

1. Navigate to `/catalog` using only keyboard
2. Tab through search, filters, and certification cards
3. Press Enter on a card to view details
4. Tab through detail page elements

**Expected**:

- All interactive elements receive focus
- Focus indicators are visible
- Enter/Space activate buttons
- Escape closes filters or modals
- Tab order is logical

### ACC-002: Screen Reader

**Objective**: Verify content is accessible to screen readers

**Steps**:

1. Enable screen reader (NVDA, JAWS, or VoiceOver)
2. Navigate through browse and detail pages
3. Listen to announcements

**Expected**:

- Certification names are announced
- Filter controls are labeled
- Action buttons have clear labels
- Headings provide page structure
- Images have alt text

## Performance Tests

### PERF-001: Load Time

**Objective**: Verify page loads quickly

**Steps**:

1. Clear cache
2. Navigate to `/catalog`
3. Measure load time

**Expected**:

- Initial page load < 2 seconds
- Images load progressively or have placeholders
- No layout shifts during load

### PERF-002: Search Performance

**Objective**: Verify search is responsive

**Steps**:

1. Navigate to `/catalog` with 100+ certifications
2. Type quickly in search bar
3. Observe results update

**Expected**:

- Results update within 300ms of typing
- No lag or frozen UI
- Debouncing prevents excessive re-renders

## Edge Cases

### EDGE-001: No Certifications

**Objective**: Handle empty catalog gracefully

**Steps**:

1. Load page with empty certifications array
2. Observe UI

**Expected**:

- Empty state message appears
- No errors or broken layout
- Helpful message explains catalog is empty

### EDGE-002: Missing Vendor Logo

**Objective**: Handle missing images gracefully

**Steps**:

1. Load certification with invalid logo URL
2. Observe card rendering

**Expected**:

- Placeholder image or vendor initials displayed
- Card layout remains intact
- No broken image icons

### EDGE-003: Very Long Certification Name

**Objective**: Handle long text gracefully

**Steps**:

1. View certification with very long name
2. Observe card and detail page

**Expected**:

- Text wraps or truncates with ellipsis
- Card layout doesn't break
- Full name visible on detail page

## User Flow Tests

### FLOW-001: Discovery to Add

**Objective**: Complete flow from discovery to adding certification

**Steps**:

1. Navigate to catalog
2. Search for "AWS"
3. Filter by "Cloud" category
4. Click on "AWS Certified Solutions Architect"
5. Review details
6. Click "Add to Profile"
7. Complete add form (if shown)

**Expected**:

- Smooth flow with no errors
- User can complete entire process
- Confirmation shown at the end

### FLOW-002: Browse to Goal Setting

**Objective**: Mark certification as goal from browse page

**Steps**:

1. Navigate to catalog
2. Browse certifications
3. Click "Mark as Goal" on a card
4. Observe confirmation
5. Navigate to goals/profile to verify

**Expected**:

- Goal is saved immediately
- Confirmation message appears
- Goal appears in user's profile or goals list

## Acceptance Criteria Summary

All tests should pass with these criteria:

- ✅ All certifications display correctly in browse view
- ✅ Search filters by name and keyword
- ✅ Filters work individually and in combination
- ✅ Empty states show helpful messages
- ✅ Responsive layout works on all devices
- ✅ Detail page shows complete information
- ✅ All actions (add, goal, view holders) work
- ✅ Dark mode renders correctly throughout
- ✅ Keyboard navigation works for all features
- ✅ No console errors or broken images
- ✅ Performance is acceptable (< 2s load, < 300ms search)
