// Utility
export { cn } from "./lib/cn";

// Design Tokens
export {
  colors,
  typography,
  spacing,
  elevation,
  animation,
  layout,
  tailwindTokenPlugin,
} from './lib/tokens';
export type {
  Colors,
  ProductKey,
  SemanticKey,
  Typography,
  Spacing,
  SpaceKey,
  Elevation,
  ZIndexLayer,
  Animation,
  DurationKey,
  EasingKey,
  PresetKey,
  Layout,
  BreakpointKey,
} from './lib/tokens';

// Product Config
export {
  products,
  getProductBySlug,
  getProductsByEntitlements,
} from './lib/products';
export type { Product, ProductNavItem } from './lib/products';

// Components
export { Button } from "./components/button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./components/button";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./components/card";
export type { CardProps } from "./components/card";

export { Badge } from "./components/badge";
export type { BadgeProps, BadgeVariant } from "./components/badge";

export { Input } from "./components/input";
export type { InputProps } from "./components/input";

export { Modal } from "./components/modal";
export type { ModalProps } from "./components/modal";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
} from "./components/table";

export { StatCard } from "./components/stat-card";
export type { StatCardProps, StatCardTrend } from "./components/stat-card";

export { Avatar } from "./components/avatar";
export type { AvatarProps, AvatarSize } from "./components/avatar";

export { Spinner } from "./components/spinner";
export type { SpinnerProps, SpinnerSize } from "./components/spinner";

export { EmptyState } from "./components/empty-state";
export type { EmptyStateProps, EmptyStateAction } from "./components/empty-state";

export { DataTable } from "./components/data-table";
export type { DataTableProps, DataTableColumn } from "./components/data-table";

export { PageHeader } from "./components/page-header";
export type { PageHeaderProps, BreadcrumbItem } from "./components/page-header";

export { Tabs, TabList, Tab, TabPanels, TabPanel } from "./components/tabs";
export type { TabsProps, TabListProps, TabProps, TabPanelsProps, TabPanelProps } from "./components/tabs";

export {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownDivider,
} from "./components/dropdown-menu";
export type {
  DropdownMenuProps,
  DropdownTriggerProps,
  DropdownContentProps,
  DropdownItemProps,
} from "./components/dropdown-menu";

export { FormField, FormLabel, FormMessage, FormDescription } from "./components/form";
export type {
  FormFieldProps,
  FormLabelProps,
  FormMessageProps,
  FormDescriptionProps,
} from "./components/form";

export { Tooltip } from "./components/tooltip";
export type { TooltipProps, TooltipPosition } from "./components/tooltip";

export { ProgressBar } from "./components/progress-bar";
export type { ProgressBarProps, ProgressBarSize, ProgressBarColor } from "./components/progress-bar";

export { CopyButton } from "./components/copy-button";
export type { CopyButtonProps, CopyButtonSize } from "./components/copy-button";

export { Toggle } from "./components/toggle";
export type { ToggleProps, ToggleSize } from "./components/toggle";

export { Skeleton } from "./components/skeleton";
export type { SkeletonProps, SkeletonVariant } from "./components/skeleton";

export { Alert } from "./components/alert";
export type { AlertProps, AlertVariant } from "./components/alert";

export { ConfirmDialog } from "./components/confirm-dialog";
export type { ConfirmDialogProps, ConfirmDialogVariant } from "./components/confirm-dialog";

export { SearchInput } from "./components/search-input";
export type { SearchInputProps } from "./components/search-input";

export { StatusBadge } from "./components/status-badge";
export type { StatusBadgeProps } from "./components/status-badge";

export { Combobox } from "./components/combobox";
export type { ComboboxProps, ComboboxOption } from "./components/combobox";

export { DatePicker } from "./components/date-picker";
export type { DatePickerProps } from "./components/date-picker";

export { Textarea } from "./components/textarea";
export type { TextareaProps } from "./components/textarea";

export { Select } from "./components/select";
export type { SelectProps, SelectOption } from "./components/select";

export { SlidePanel } from "./components/slide-panel";
export type { SlidePanelProps } from "./components/slide-panel";

export { Drawer } from "./components/drawer";
export type { DrawerProps } from "./components/drawer";

export { KanbanBoard } from "./components/kanban-board";
export type { KanbanBoardProps, KanbanColumn, KanbanItem } from "./components/kanban-board";

export { MetricTile } from "./components/metric-tile";
export type { MetricTileProps } from "./components/metric-tile";

export { Chart } from "./components/chart";
export type { ChartProps } from "./components/chart";

export { InlineEdit } from "./components/inline-edit";
export type { InlineEditProps } from "./components/inline-edit";

export { AiActionCard } from "./components/ai-action-card";
export type { AiActionCardProps } from "./components/ai-action-card";

export { FeatureLock } from "./components/feature-lock";
export type { FeatureLockProps } from "./components/feature-lock";

export { UpgradePrompt } from "./components/upgrade-prompt";
export type { UpgradePromptProps } from "./components/upgrade-prompt";

export { FilterBar } from "./components/filter-bar";
export type { FilterBarProps, FilterConfig, FilterValues, SavedPreset } from "./components/filter-bar";

export { LineChart, BarChart, PieChart, AreaChart } from "./components/chart";
export type {
  LineChartProps,
  BarChartProps,
  PieChartProps,
  AreaChartProps,
  ChartDataPoint,
  SeriesConfig,
} from "./components/chart";
