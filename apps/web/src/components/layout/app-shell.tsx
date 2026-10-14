import { getCurrentUser, hasRole } from "@/lib/session";
import { MobileBar, BottomTabs } from "./mobile-bar";
import { Sidebar } from "./sidebar";
import { SiteFooter } from "./site-footer";

/** Sidebar on desktop; top bar, drawer and bottom tabs on smaller screens. */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const staff = hasRole(user, ["EDITOR", "MODERATOR"]);
  const summary = user ? { name: user.name, email: user.email } : null;
  return (
    <>
      <Sidebar user={summary} staff={staff} />
      <MobileBar user={summary} staff={staff} />
      <div className="shell-main flex min-h-dvh flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] lg:ps-64 lg:pb-0">
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </div>
      <BottomTabs />
    </>
  );
}
