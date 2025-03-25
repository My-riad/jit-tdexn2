/**
 * Mobile-Optimized Layout System for Driver App
 * 
 * Defines reusable layout configurations tailored specifically for mobile screens
 * in the driver application. These layouts ensure consistent spacing, alignment,
 * and responsive behavior throughout the driver app interface.
 */

import { theme } from './theme';
import { getResponsiveValue, getOrientationResponsiveValue } from '../utils/responsive';

/**
 * Base screen layout patterns for different screen types in the driver app
 */
const screen = {
  // Base screen layout with full height
  base: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: theme.colors.ui.background,
    height: '100%',
  },
  // Safe area layout accounting for header and bottom navigation
  safeArea: {
    flex: 1,
    paddingTop: theme.sizes.headerHeight,
    paddingBottom: theme.sizes.bottomNavHeight,
  },
  // Scrollable screen layout with horizontal padding
  scrollable: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: theme.colors.ui.background,
    paddingHorizontal: theme.spacing.md,
  },
  // Layout with header padding
  withHeader: {
    paddingTop: theme.sizes.headerHeight,
  },
  // Layout with bottom navigation padding
  withBottomNav: {
    paddingBottom: theme.sizes.bottomNavHeight,
  },
};

/**
 * Content area layout patterns for consistent content spacing and padding
 */
const content = {
  // Base content padding
  base: {
    padding: theme.spacing.md,
  },
  // Larger padding for more spacious content
  padded: {
    padding: theme.spacing.lg,
  },
  // Section layout with bottom margin
  section: {
    marginBottom: theme.spacing.lg,
  },
  // Scrollable content with padding
  scrollable: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
};

/**
 * Card layout patterns for consistent card styling throughout the app
 */
const card = {
  // Base card with shadow
  base: {
    backgroundColor: theme.colors.ui.card,
    borderRadius: theme.borders.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.ui.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  // Interactive card with touch feedback
  interactive: {
    backgroundColor: theme.colors.ui.card,
    borderRadius: theme.borders.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.ui.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    activeOpacity: 0.7,
  },
  // Flat card with border and no shadow
  flat: {
    backgroundColor: theme.colors.ui.card,
    borderRadius: theme.borders.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  // Compact card with smaller padding and shadow
  compact: {
    backgroundColor: theme.colors.ui.card,
    borderRadius: theme.borders.radius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    shadowColor: theme.colors.ui.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
};

/**
 * List layout patterns for consistent list styling and spacing
 */
const list = {
  // Base list layout
  base: {
    flex: 1,
  },
  // List item with bottom border
  item: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.ui.divider,
  },
  // Separator line between list items
  separator: {
    height: 1,
    backgroundColor: theme.colors.ui.divider,
    marginVertical: theme.spacing.xs,
  },
  // Section header in a list
  sectionHeader: {
    backgroundColor: theme.colors.ui.background,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.ui.divider,
  },
};

/**
 * Form layout patterns for consistent form styling and spacing
 */
const form = {
  // Form group containing related fields
  group: {
    marginBottom: theme.spacing.lg,
  },
  // Individual form field
  field: {
    marginBottom: theme.spacing.md,
  },
  // Form field label
  label: {
    marginBottom: theme.spacing.xs,
  },
  // Form input element
  input: {
    height: theme.sizes.inputHeight,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    borderRadius: theme.borders.radius.md,
    paddingHorizontal: theme.spacing.md,
  },
  // Error message display
  error: {
    marginTop: theme.spacing.xs,
    color: theme.colors.semantic.error,
  },
  // Form action buttons container
  actions: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
};

/**
 * Centered layout patterns for aligning content in the center of containers
 */
const centered = {
  // Basic centered layout
  base: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Centered content with padding
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  // Absolute positioned centered layout (overlay)
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
};

/**
 * Row layout patterns for horizontal arrangement of elements
 */
const row = {
  // Basic row layout
  base: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Row with space between items
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Centered row
  centered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Row with wrapped content
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  // Row with equal spacing between items
  gapped: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
};

/**
 * Column layout patterns for vertical arrangement of elements
 */
const column = {
  // Basic column layout
  base: {
    flexDirection: 'column',
  },
  // Centered column
  centered: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  // Column with space between items
  spaceBetween: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  // Column with equal spacing between items
  gapped: {
    flexDirection: 'column',
    gap: theme.spacing.md,
  },
};

/**
 * Main layouts object that exports all layout patterns for the driver mobile application
 */
const layouts = {
  screen,
  content,
  card,
  list,
  form,
  centered,
  row,
  column,
};

export default layouts;
export { screen, content, card, list, form, centered, row, column, layouts };