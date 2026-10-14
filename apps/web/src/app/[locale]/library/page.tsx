import { redirect } from "@/i18n/navigation";

/** The library became Bookmarks (saved verses, highlights, history) and My Journal (notes). */
export default async function LibraryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: "/bookmarks", locale });
}
