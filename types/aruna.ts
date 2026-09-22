import type { ReactNode } from "react";

export type Tone = "accent" | "positive" | "negative" | "neutral";

export interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "ghost";
  size?: "default" | "sm";
  href?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  icon?: ReactNode;
  className?: string;
}

export interface CardProps {
  children: ReactNode;
  variant?: "default" | "raised" | "danger" | "success";
  padding?: "sm" | "default" | "lg";
  className?: string;
}

export interface BadgeProps {
  label: string;
  tone?: Tone;
}

export interface StatCardProps {
  label: string;
  value: string;
  valueTone?: Tone;
  size?: "default" | "lg";
  className?: string;
}

export interface DetailRowProps {
  label: string;
  value: string;
  valueTone?: Tone;
  divider?: boolean;
}

export interface ProgressBarCaption {
  start: string;
  end: string;
}

export interface ProgressBarProps {
  value: number;
  tone?: Tone;
  thickness?: "thin" | "default";
  caption?: ProgressBarCaption;
}

export interface StepIndicatorProps {
  steps: string[];
  currentIndex: number;
}

export interface NumberedStepProps {
  index: number;
  status?: "default" | "done" | "pending";
  children: ReactNode;
}

export interface AmountInputQuickAction {
  label: string;
  onClick: () => void;
  active?: boolean;
}

export interface AmountInputMeta {
  start: string;
  end: string;
}

export interface AmountInputProps {
  id: string;
  label: string;
  value: string;
  unit: string;
  quickActions?: AmountInputQuickAction[];
  onChange?: (value: string) => void;
  meta?: AmountInputMeta;
}

export interface AcknowledgeCheckboxProps {
  id: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
  children: ReactNode;
}

export interface StateCardAction {
  label: string;
  onClick?: () => void;
  variant?: "primary" | "ghost";
}

export interface StateCardProps {
  title: string;
  tag: string;
  tone?: Tone;
  message: ReactNode;
  actions?: StateCardAction[];
  footnote?: string;
}

export interface TableColumn {
  key: string;
  header: string;
  width?: string;
}

export interface TableProps {
  columns: TableColumn[];
  children: ReactNode;
}

export interface TableRowProps {
  columns: TableColumn[];
  cells: ReactNode[];
  highlighted?: boolean;
}

export interface HeaderNavLink {
  label: string;
  href: string;
  active?: boolean;
}

export interface HeaderSecondaryAction {
  label: string;
  href: string;
}

export interface HeaderProps {
  variant?: "landing" | "app";
  navLinks?: HeaderNavLink[];
  walletAddress?: string;
  secondaryAction?: HeaderSecondaryAction;
}

export interface LineChartThreshold {
  y: number;
  label?: string;
  tone?: Tone;
  dashed?: boolean;
}

export interface LineChartSeries {
  points: string;
  tone?: Tone;
  strokeWidth?: number;
}

export interface LineChartProps {
  viewBoxWidth: number;
  viewBoxHeight: number;
  series: LineChartSeries[];
  thresholds?: LineChartThreshold[];
  ariaLabel: string;
  className?: string;
}

export interface BarHistoryBar {
  label: string;
  height: number;
  tone?: Tone;
}

export interface BarHistoryChartProps {
  bars: BarHistoryBar[];
  ariaLabel: string;
}
