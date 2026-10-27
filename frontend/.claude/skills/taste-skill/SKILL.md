---
name: taste-skill
description: Anti-slop frontend and interface design skill. Enforces art direction, intentional typography, sharp visual hierarchy, consistent spacing rhythm, and high-craft UI execution while strictly banning generic AI templates, muddy contrast, and sloppy layouts.
---

# Taste Skill (Anti-Slop Design System)

## 0. Brief Inference & Aesthetic Read
Before touching any UI code:
1. **Identify the Product Domain**: Fintech / expense tracker / team coordination requires high-precision typography, instant readability of monetary figures, crisp contrast, and tactile, confident actions.
2. **Declare the Design Read**:
   - Aesthetic: Precision dark-monochrome / Linear-grade fintech.
   - Tone: Confident, utilitarian, clean, reliable.
   - Three Dials:
     - `DESIGN_VARIANCE`: 7 (structured, purposeful asymmetry)
     - `MOTION_INTENSITY`: 5 (crisp, subtle micro-interactions)
     - `VISUAL_DENSITY`: 7 (information-rich, high-density financial data)

## 1. Anti-Slop House Rules
- **No Em-dashes in Copy**: Avoid `—` or `--` in titles, subtitles, and badges. Use clean sentence structures, bullet points, or simple hyphens.
- **No Muddy Contrast**: Every piece of text must meet WCAG AA contrast against its direct background container. Never use low-contrast gray on dark surfaces.
- **No Repetitive 3-Column Card Clones**: Vary layouts dynamically based on data significance.
- **No AI-Purple Gradient Slop**: Use pure, intentional palettes (zinc/slate neutrals, high-contrast crisp whites, and purposeful status accents).
- **Numbers are First-Class Citizens**: Currency, quantities, and dates must use tabular / monospace or bold numeric font weights with clear unit symbols (e.g. ₹).
- **Crisp Borders and Elevation**: 1px subtle borders (`#27272A` or `rgba(255,255,255,0.08)`) with deliberate surface hierarchy (background -> surface -> elevated surface).

## 2. Component Guidelines
- **Header & Navigation**: Clean top app bars with strong titles, contextual subtitle crumbs, and right-aligned primary actions.
- **Badges & Statuses**: Distinct background tint with matching high-contrast text (`#10B981` success, `#F59E0B` warning, `#EF4444` danger, `#FAFAFA` neutral).
- **Cards & Rows**: Consistent border radius (8px / 12px / 16px), structured padding, and intuitive interactive tap states (`activeOpacity={0.7}`).
- **Empty & Loading States**: Informative, action-oriented, with clean line icons and single primary CTAs.

