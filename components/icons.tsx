"use client"

// Every icon the app uses, drawn from the Hugeicons free stroke set.
//
// Each export is named after the lucide icon it replaced, so call sites keep
// reading <Plus className="size-4" /> and only the import path changed.
// Size and colour come from the className, exactly as before.

import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  Activity01Icon,
  Alert02Icon,
  ArrowDataTransferVerticalIcon,
  ArrowDown01Icon,
  ArrowDownLeft01Icon,
  ArrowRight01Icon,
  ArrowTurnBackwardIcon,
  ArrowUp01Icon,
  ArrowUpRight01Icon,
  Attachment01Icon,
  BookOpen01Icon,
  Bug01Icon,
  CalculatorIcon,
  Calendar01Icon,
  Calendar03Icon,
  Cancel01Icon,
  CheckListIcon,
  CheckmarkBadge01Icon,
  CheckmarkCircle02Icon,
  CircleIcon,
  Clock01Icon,
  ComputerIcon,
  Copy01Icon,
  DashboardSquare01Icon,
  DatabaseIcon,
  Delete02Icon,
  Download01Icon,
  Edit02Icon,
  FavouriteIcon,
  File01Icon,
  FileDownloadIcon,
  FilterRemoveIcon,
  Globe02Icon,
  Home01Icon,
  Idea01Icon,
  ImageAdd01Icon,
  InboxIcon,
  Infinity01Icon,
  InformationCircleIcon,
  Key01Icon,
  Layers01Icon,
  LifebuoyIcon,
  Link01Icon,
  Loading03Icon,
  Logout01Icon,
  Mail01Icon,
  Megaphone01Icon,
  Message01Icon,
  Moon02Icon,
  MoreVerticalIcon,
  Notification01Icon,
  NotificationOff01Icon,
  PaintBoardIcon,
  PencilEdit01Icon,
  PlusSignIcon,
  RecordIcon,
  RefreshIcon,
  Search01Icon,
  SecurityCheckIcon,
  SecurityWarningIcon,
  SentIcon,
  Settings02Icon,
  SidebarLeftIcon,
  SparklesIcon,
  Store01Icon,
  Sun03Icon,
  Target01Icon,
  Tick02Icon,
  Tick04Icon,
  TradeDownIcon,
  TradeUpIcon,
  UnfoldMoreIcon,
  Upload01Icon,
  ViewIcon,
  ViewOffIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons"

export type AppIcon = (props: {
  className?: string
  "aria-hidden"?: boolean
}) => React.ReactElement

/** Wraps a Hugeicons glyph so it behaves like the icon components it replaces. */
function icon(glyph: IconSvgElement): AppIcon {
  function Icon({ className, ...rest }: { className?: string }) {
    return (
      <HugeiconsIcon
        icon={glyph}
        strokeWidth={1.6}
        className={className}
        {...rest}
      />
    )
  }
  return Icon
}

export const Activity = icon(Activity01Icon)
export const ArrowDown = icon(ArrowDown01Icon)
export const ArrowDownLeft = icon(ArrowDownLeft01Icon)
export const ArrowRight = icon(ArrowRight01Icon)
export const ArrowUp = icon(ArrowUp01Icon)
export const ArrowUpDown = icon(ArrowDataTransferVerticalIcon)
export const ArrowUpRight = icon(ArrowUpRight01Icon)
export const BadgeCheck = icon(CheckmarkBadge01Icon)
export const Bell = icon(Notification01Icon)
export const BellOff = icon(NotificationOff01Icon)
export const BookOpen = icon(BookOpen01Icon)
export const Bug = icon(Bug01Icon)
export const Calculator = icon(CalculatorIcon)
export const CalendarClock = icon(Calendar01Icon)
export const CalendarRange = icon(Calendar03Icon)
export const Check = icon(Tick02Icon)
export const CheckCheck = icon(Tick04Icon)
export const CheckCircle2 = icon(CheckmarkCircle02Icon)
export const ChevronDown = icon(ArrowDown01Icon)
export const ChevronsUpDown = icon(UnfoldMoreIcon)
export const Circle = icon(CircleIcon)
export const CircleDot = icon(RecordIcon)
export const Clock = icon(Clock01Icon)
export const Copy = icon(Copy01Icon)
export const Database = icon(DatabaseIcon)
export const Download = icon(Download01Icon)
export const Eye = icon(ViewIcon)
export const EyeOff = icon(ViewOffIcon)
export const FileDown = icon(FileDownloadIcon)
export const FileText = icon(File01Icon)
export const FilterX = icon(FilterRemoveIcon)
export const Globe = icon(Globe02Icon)
export const Heart = icon(FavouriteIcon)
export const Home = icon(Home01Icon)
export const ImagePlus = icon(ImageAdd01Icon)
export const Inbox = icon(InboxIcon)
export const Infinity = icon(Infinity01Icon)
export const Info = icon(InformationCircleIcon)
export const KeyRound = icon(Key01Icon)
export const Layers = icon(Layers01Icon)
export const LayoutDashboard = icon(DashboardSquare01Icon)
export const LifeBuoy = icon(LifebuoyIcon)
export const Lightbulb = icon(Idea01Icon)
export const Link2 = icon(Link01Icon)
export const ListChecks = icon(CheckListIcon)
export const LogOut = icon(Logout01Icon)
export const Mail = icon(Mail01Icon)
export const Megaphone = icon(Megaphone01Icon)
export const MessageSquare = icon(Message01Icon)
export const Monitor = icon(ComputerIcon)
export const Moon = icon(Moon02Icon)
export const MoreVertical = icon(MoreVerticalIcon)
export const Palette = icon(PaintBoardIcon)
export const PanelLeft = icon(SidebarLeftIcon)
export const Paperclip = icon(Attachment01Icon)
export const Pencil = icon(PencilEdit01Icon)
export const PencilLine = icon(Edit02Icon)
export const Plus = icon(PlusSignIcon)
export const RefreshCw = icon(RefreshIcon)
export const Search = icon(Search01Icon)
export const Send = icon(SentIcon)
export const Settings2 = icon(Settings02Icon)
export const ShieldAlert = icon(SecurityWarningIcon)
export const ShieldCheck = icon(SecurityCheckIcon)
export const Sparkles = icon(SparklesIcon)
export const Store = icon(Store01Icon)
export const Sun = icon(Sun03Icon)
export const Target = icon(Target01Icon)
export const Trash2 = icon(Delete02Icon)
export const TrendingDown = icon(TradeDownIcon)
export const TrendingUp = icon(TradeUpIcon)
export const TriangleAlert = icon(Alert02Icon)
export const Undo2 = icon(ArrowTurnBackwardIcon)
export const Upload = icon(Upload01Icon)
export const Wallet = icon(Wallet01Icon)
export const X = icon(Cancel01Icon)
export const Loader = icon(Loading03Icon)
export const Loader2 = icon(Loading03Icon)
