import {
  Bookmark,
  BookOpen,
  Feather,
  HandHeart,
  House,
  ListChecks,
  NotebookPen,
  Settings,
  Sunrise,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

/** `key` resolves to `app.nav.<key>` in the message dictionaries. */
export interface NavItem {
  href: string;
  key: string;
  icon: LucideIcon;
}

export const mainNav: NavItem[] = [
  { href: "/", key: "home", icon: House },
  { href: "/bible", key: "bible", icon: BookOpen },
  { href: "/plans", key: "plans", icon: ListChecks },
  { href: "/daily", key: "daily", icon: Sunrise },
  { href: "/prayer", key: "prayer", icon: HandHeart },
  { href: "/devotionals", key: "devotionals", icon: Feather },
  { href: "/community", key: "community", icon: Users },
];

export const personalNav: NavItem[] = [
  { href: "/bookmarks", key: "bookmarks", icon: Bookmark },
  { href: "/journal", key: "journal", icon: NotebookPen },
  { href: "/account", key: "profile", icon: UserRound },
  { href: "/settings", key: "settings", icon: Settings },
];

export const mobileTabs: NavItem[] = [
  { href: "/", key: "home", icon: House },
  { href: "/bible", key: "bible", icon: BookOpen },
  { href: "/plans", key: "plansShort", icon: ListChecks },
  { href: "/prayer", key: "prayer", icon: HandHeart },
  { href: "/account", key: "profile", icon: UserRound },
];

export const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
