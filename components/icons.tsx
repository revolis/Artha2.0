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
export function makeIcon(glyph: IconSvgElement): AppIcon {
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

export const Activity = makeIcon(Activity01Icon)
export const ArrowDown = makeIcon(ArrowDown01Icon)
export const ArrowDownLeft = makeIcon(ArrowDownLeft01Icon)
export const ArrowRight = makeIcon(ArrowRight01Icon)
export const ArrowUp = makeIcon(ArrowUp01Icon)
export const ArrowUpDown = makeIcon(ArrowDataTransferVerticalIcon)
export const ArrowUpRight = makeIcon(ArrowUpRight01Icon)
export const BadgeCheck = makeIcon(CheckmarkBadge01Icon)
export const Bell = makeIcon(Notification01Icon)
export const BellOff = makeIcon(NotificationOff01Icon)
export const BookOpen = makeIcon(BookOpen01Icon)
export const Bug = makeIcon(Bug01Icon)
export const Calculator = makeIcon(CalculatorIcon)
export const CalendarClock = makeIcon(Calendar01Icon)
export const CalendarRange = makeIcon(Calendar03Icon)
export const Check = makeIcon(Tick02Icon)
export const CheckCheck = makeIcon(Tick04Icon)
export const CheckCircle2 = makeIcon(CheckmarkCircle02Icon)
export const ChevronDown = makeIcon(ArrowDown01Icon)
export const ChevronsUpDown = makeIcon(UnfoldMoreIcon)
export const Circle = makeIcon(CircleIcon)
export const CircleDot = makeIcon(RecordIcon)
export const Clock = makeIcon(Clock01Icon)
export const Copy = makeIcon(Copy01Icon)
export const Database = makeIcon(DatabaseIcon)
export const Download = makeIcon(Download01Icon)
export const Eye = makeIcon(ViewIcon)
export const EyeOff = makeIcon(ViewOffIcon)
export const FileDown = makeIcon(FileDownloadIcon)
export const FileText = makeIcon(File01Icon)
export const FilterX = makeIcon(FilterRemoveIcon)
export const Globe = makeIcon(Globe02Icon)
export const Heart = makeIcon(FavouriteIcon)
export const Home = makeIcon(Home01Icon)
export const ImagePlus = makeIcon(ImageAdd01Icon)
export const Inbox = makeIcon(InboxIcon)
export const Infinity = makeIcon(Infinity01Icon)
export const Info = makeIcon(InformationCircleIcon)
export const KeyRound = makeIcon(Key01Icon)
export const Layers = makeIcon(Layers01Icon)
export const LayoutDashboard = makeIcon(DashboardSquare01Icon)
export const LifeBuoy = makeIcon(LifebuoyIcon)
export const Lightbulb = makeIcon(Idea01Icon)
export const Link2 = makeIcon(Link01Icon)
export const ListChecks = makeIcon(CheckListIcon)
export const LogOut = makeIcon(Logout01Icon)
export const Mail = makeIcon(Mail01Icon)
export const Megaphone = makeIcon(Megaphone01Icon)
export const MessageSquare = makeIcon(Message01Icon)
export const Monitor = makeIcon(ComputerIcon)
export const Moon = makeIcon(Moon02Icon)
export const MoreVertical = makeIcon(MoreVerticalIcon)
export const Palette = makeIcon(PaintBoardIcon)
export const PanelLeft = makeIcon(SidebarLeftIcon)
export const Paperclip = makeIcon(Attachment01Icon)
export const Pencil = makeIcon(PencilEdit01Icon)
export const PencilLine = makeIcon(Edit02Icon)
export const Plus = makeIcon(PlusSignIcon)
export const RefreshCw = makeIcon(RefreshIcon)
export const Search = makeIcon(Search01Icon)
export const Send = makeIcon(SentIcon)
export const Settings2 = makeIcon(Settings02Icon)
export const ShieldAlert = makeIcon(SecurityWarningIcon)
export const ShieldCheck = makeIcon(SecurityCheckIcon)
export const Sparkles = makeIcon(SparklesIcon)
export const Store = makeIcon(Store01Icon)
export const Sun = makeIcon(Sun03Icon)
export const Target = makeIcon(Target01Icon)
export const Trash2 = makeIcon(Delete02Icon)
export const TrendingDown = makeIcon(TradeDownIcon)
export const TrendingUp = makeIcon(TradeUpIcon)
export const TriangleAlert = makeIcon(Alert02Icon)
export const Undo2 = makeIcon(ArrowTurnBackwardIcon)
export const Upload = makeIcon(Upload01Icon)
export const Wallet = makeIcon(Wallet01Icon)
export const X = makeIcon(Cancel01Icon)
export const Loader = makeIcon(Loading03Icon)
export const Loader2 = makeIcon(Loading03Icon)
