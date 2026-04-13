# Planning Guide

A Root Cause Analysis system that replaces Excel chaos with structured incident tracking, intelligent clustering, and zero-friction data entry - making root cause documentation actually happen.

**Experience Qualities**:
1. **Frictionless** - Logging incidents should feel like jotting a quick note, not filling out a bureaucratic form
2. **Intelligent** - The system learns from usage patterns, suggesting causes and detecting duplicates automatically
3. **Revealing** - Transforms scattered incidents into clear patterns showing what's actually breaking

**Complexity Level**: Light Application (multiple features with basic state)
This is a focused incident logging and analysis tool with quick data entry, autocomplete, filtering, and visualization - more than a micro tool but deliberately avoiding full ITSM complexity.

## Essential Features

**Quick Incident Entry**
- Functionality: Command-palette style input with smart autocomplete for problems, root causes, topics, and fixes
- Purpose: Make logging so fast that engineers actually use it instead of Excel
- Trigger: Click "Add Incident" button or keyboard shortcut
- Progression: Click add → type problem → autocomplete suggests → select/create → type root cause → autocomplete → select topic tags → press Enter → saved
- Success criteria: Can log a complete incident in under 10 seconds with keyboard only

**Smart Autocomplete**
- Functionality: Real-time suggestions ranked by frequency, showing incident counts, supporting multi-select for tags and causes
- Purpose: Prevent duplicate entries and guide users toward existing categories
- Trigger: User types in any input field
- Progression: User types → system filters matches → displays ranked results with counts → user selects or creates new
- Success criteria: Suggests correct root cause within first 3 characters for common issues

**Dashboard Overview**
- Functionality: Visual cards showing top root causes by frequency, recent incidents, problems by topic with trend charts
- Purpose: Surface the 20% of causes creating 80% of problems
- Trigger: Default view on app load
- Progression: View dashboard → scan top causes → identify patterns → drill into specific cause or topic
- Success criteria: Top 5 root causes immediately visible without scrolling

**Incident Table with Filtering**
- Functionality: Sortable, filterable table of all incidents with date range, topic, status, and impact filters
- Purpose: Find specific incidents and analyze subsets of data
- Trigger: Navigate to Problems tab or click dashboard chart
- Progression: View table → apply filters → sort by column → click row → view/edit details
- Success criteria: Filter from 200+ incidents to specific subset in 2 clicks

**Root Cause Clustering**
- Functionality: Aggregated view showing which causes appear most frequently across topics
- Purpose: Identify systemic issues that span multiple areas
- Trigger: Navigate to Root Causes tab
- Progression: View causes → see incident counts → click cause → see all related problems
- Success criteria: Clear visual hierarchy showing most impactful causes first

## Edge Case Handling

- **Empty State**: First-time users see example incidents and clear "Add your first incident" prompt
- **No Results in Autocomplete**: Show "Create new [category]: [typed text]" option immediately
- **Duplicate Detection**: When user types existing cause verbatim, highlight it with count: "Existing (11 incidents)"
- **Multiple Root Causes**: Support multi-select tagging so one problem can map to multiple causes
- **Topic Overlap**: Allow incidents to belong to multiple topics via tag system
- **Long Text**: Truncate descriptions in table with hover tooltips

## Design Direction

The design should feel like a professional operations dashboard - clean, data-dense but scannable, with a technical yet approachable aesthetic. Think incident war room meets modern analytics tool: serious about the work but not drowning in enterprise bloat.

## Color Selection

A technical-professional palette with strong contrast and clear semantic colors for status indicators.

- **Primary Color**: Deep blue `oklch(0.45 0.15 250)` - Conveys reliability and technical precision, used for primary actions and key data points
- **Secondary Colors**: 
  - Slate `oklch(0.35 0.02 250)` for backgrounds and secondary elements
  - Charcoal `oklch(0.25 0.01 250)` for navigation and containers
- **Accent Color**: Electric cyan `oklch(0.75 0.15 195)` - High visibility for interactive elements and quick add features
- **Semantic Colors**:
  - Critical/High: `oklch(0.60 0.20 25)` - Warm red
  - Warning/Medium: `oklch(0.70 0.15 65)` - Amber
  - Success/Low: `oklch(0.65 0.15 145)` - Green
  - Open status: `oklch(0.70 0.12 35)` - Orange
- **Foreground/Background Pairings**:
  - Primary (Deep Blue): White text `oklch(0.98 0 0)` - Ratio 7.2:1 ✓
  - Background (Slate): Light text `oklch(0.90 0.02 250)` - Ratio 8.5:1 ✓
  - Accent (Cyan): Dark text `oklch(0.20 0.02 250)` - Ratio 10.1:1 ✓
  - Critical (Red): White text `oklch(0.98 0 0)` - Ratio 5.1:1 ✓

## Font Selection

Choose typefaces that balance technical precision with readability - monospaced elements for data, clean sans-serif for UI.

- **Typographic Hierarchy**:
  - App Title/Headers: Space Grotesk Bold / 24px / tight tracking (-0.02em)
  - Section Headers: Space Grotesk Semibold / 18px / normal tracking
  - Body Text: Inter Regular / 14px / relaxed line-height (1.6)
  - Data/Metrics: JetBrains Mono Medium / 14px / tabular numbers
  - Small Labels: Inter Medium / 12px / uppercase / wide tracking (0.05em)

## Animations

Animations should feel responsive and immediate - no lag, no flourish. Use micro-interactions for feedback (autocomplete sliding in, filters applying with subtle fade) and smooth transitions when navigating between views. Quick add dialog should snap open instantly with subtle scale-up (150ms). Chart updates should animate data changes over 300ms for comprehension.

## Component Selection

- **Components**:
  - Quick Add: Command (cmdk) for the palette-style entry interface
  - Autocomplete: Combobox with Badge for multi-select tags
  - Dashboard Cards: Card with gradient backgrounds for visual hierarchy
  - Metrics Display: Card with bold typography for large numbers
  - Incident Table: Table with sortable columns, Checkbox for row selection
  - Filters: Select dropdowns, Calendar for date ranges, Badge for active filters
  - Charts: Use recharts for bar chart (problems by topic) and line chart (trends)
  - Status Pills: Badge with variant colors (destructive/warning/success)
  - Icons: Phosphor icons - Plus, Funnel, TrendUp, Warning, CheckCircle, Calendar
  
- **Customizations**:
  - Command palette: Dark overlay with frosted backdrop-blur
  - Autocomplete items: Show frequency count in muted text on right
  - Table rows: Hover state with subtle background shift, clickable for details
  - Metric cards: Large numbers (32px) with subtle gradient backgrounds
  
- **States**:
  - Buttons: Default solid, hover with brightness increase, active with scale (0.98)
  - Inputs: Focus with accent border and subtle glow
  - Autocomplete: Keyboard navigation with highlighted item
  - Table: Selected rows with primary background tint
  
- **Icon Selection**:
  - Plus (add incident)
  - Funnel (filters)
  - TrendUp/TrendDown (metrics)
  - Warning (root causes)
  - CheckCircle (resolved)
  - Clock (recent/time)
  - ChartBar (analytics)
  - Tag (topics)
  
- **Spacing**: 
  - Tight density for data tables (py-2)
  - Comfortable spacing for forms (gap-4)
  - Generous padding in cards (p-6)
  - Consistent 24px gaps between dashboard sections
  
- **Mobile**: 
  - Stack dashboard cards vertically
  - Hide table columns progressively (fix/status first to go)
  - Quick add becomes full-screen overlay
  - Filters collapse into drawer
  - Charts adapt to portrait orientation with adjusted aspect ratios
