import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@cp/db";
import { churchQuerySchema, localeNames, locales } from "@cp/shared";
import { ChurchNearby } from "@/components/church-nearby";
import { FilterBar } from "@/components/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { Link } from "@/i18n/navigation";
import { loadPublicData } from "@/lib/public-catalog";

const localeCountryPrefs: Record<string, string[]> = {
  en: ["US", "GB"],
  mn: ["MN"],
  ru: ["RU", "UA", "BY", "KZ"],
  es: ["ES", "MX", "AR", "CO", "PE"],
  fr: ["FR", "BE", "CA", "SN", "CG"],
  ar: ["SA", "EG", "AE", "JO", "DZ", "MA"],
  pt: ["BR", "PT", "AO", "MZ"],
  tr: ["TR", "DE", "NL", "GB"],
  id: ["ID", "MY", "SG", "AU"],
  hi: ["IN", "NP", "LK", "BD"],
  zh: ["CN", "TW", "SG", "MY", "HK"],
};

const churchFallback = [
  { slug: "ulan-bator-grace-community", name: "Grace Community Church", city: "Ulaanbaatar", country: "Mongolia", countryCode: "MN", region: "Ulaanbaatar", address: "Peace Avenue 15, Ulaanbaatar", website: "https://www.google.com/maps/search/Grace+Community+Church+Ulaanbaatar+Mongolia", languages: ["Монгол", "English"], serviceTimes: "Sun 9:00, 11:00, 18:00", latitude: 47.9185, longitude: 106.9176 },
  { slug: "st-johns-cathedral-london", name: "St. John’s Cathedral", city: "London", country: "United Kingdom", countryCode: "GB", region: "England", address: "1 St John’s Square, London", website: "https://www.google.com/maps/search/St.+John's+Cathedral+London", languages: ["English", "Spanish"], serviceTimes: "Sun 9:00, 11:00, 18:00", latitude: 51.4797, longitude: -0.1251 },
  { slug: "central-baptist-chicago", name: "Central Baptist Church", city: "Chicago", country: "United States", countryCode: "US", region: "Illinois", address: "300 N Central Ave, Chicago, IL", website: "https://www.google.com/maps/search/Central+Baptist+Church+Chicago", languages: ["English", "Mandarin"], serviceTimes: "Sun 8:30, 10:30, 18:30", latitude: 41.8781, longitude: -87.6298 },
  { slug: "hope-fellowship-sydney", name: "Hope Fellowship", city: "Sydney", country: "Australia", countryCode: "AU", region: "New South Wales", address: "58 River St, Sydney", website: "https://www.google.com/maps/search/Hope+Fellowship+Sydney", languages: ["English"], serviceTimes: "Sun 9:00, 11:00", latitude: -33.8688, longitude: 151.2093 },
  { slug: "citylight-joao-pessoa", name: "Citylight Church", city: "João Pessoa", country: "Brazil", countryCode: "BR", region: "Paraíba", address: "Avenida Epitácio Pessoa, 2600", website: "https://www.google.com/maps/search/Citylight+Church+Joao+Pessoa", languages: ["Portuguese", "English"], serviceTimes: "Sun 9:00, 11:00, 18:00", latitude: -7.1195, longitude: -34.8450 },
  { slug: "grace-community-accra", name: "Grace Community Church", city: "Accra", country: "Ghana", countryCode: "GH", region: "Greater Accra", address: "Airport Residential Area, Accra", website: "https://www.google.com/maps/search/Grace+Community+Church+Accra", languages: ["English", "French"], serviceTimes: "Sun 8:00, 10:30, 17:30", latitude: 5.6037, longitude: -0.1870 },
  { slug: "harvest-center-kyiv", name: "Harvest Center", city: "Kyiv", country: "Ukraine", countryCode: "UA", region: "Kyiv Oblast", address: "Vasylkivska St 20, Kyiv", website: "https://www.google.com/maps/search/Harvest+Center+Kyiv", languages: ["Ukrainian", "English"], serviceTimes: "Sun 10:00, 12:00, 18:00", latitude: 50.4501, longitude: 30.5234 },
  { slug: "moscow-city-church", name: "Moscow City Church", city: "Moscow", country: "Russia", countryCode: "RU", region: "Moscow", address: "Leninsky Prospekt 22, Moscow", website: "https://www.google.com/maps/search/Moscow+City+Church+Moscow+Russia", languages: ["Русский", "English"], serviceTimes: "Sun 9:30, 11:30, 18:00", latitude: 55.7558, longitude: 37.6173 },
  { slug: "casa-de-fe-mexico-city", name: "Casa de Fe", city: "Mexico City", country: "Mexico", countryCode: "MX", region: "Mexico City", address: "Avenida Insurgentes 500, Mexico City", website: "https://www.google.com/maps/search/Casa+de+Fe+Mexico+City", languages: ["Español", "English"], serviceTimes: "Sun 9:00, 11:00, 18:00", latitude: 19.4326, longitude: -99.1332 },
  { slug: "eglise-de-la-lumiere-paris", name: "Église de la Lumière", city: "Paris", country: "France", countryCode: "FR", region: "Île-de-France", address: "Rue de la Paix 14, Paris", website: "https://www.google.com/maps/search/Eglise+de+la+Lumiere+Paris+France", languages: ["Français", "English"], serviceTimes: "Sun 10:00, 12:00, 18:30", latitude: 48.8566, longitude: 2.3522 },
  { slug: "al-noor-community-jeddah", name: "Al Noor Community", city: "Jeddah", country: "Saudi Arabia", countryCode: "SA", region: "Makkah", address: "King Abdullah Road, Jeddah", website: "https://www.google.com/maps/search/Al+Noor+Community+Jeddah+Saudi+Arabia", languages: ["العربية", "English"], serviceTimes: "Fri 13:00, Sun 9:00, 11:00", latitude: 21.4858, longitude: 39.1925 },
  { slug: "sao-paulo-praise-center", name: "São Paulo Praise Center", city: "São Paulo", country: "Brazil", countryCode: "BR", region: "São Paulo", address: "Avenida Paulista 1200, São Paulo", website: "https://www.google.com/maps/search/Sao+Paulo+Praise+Center+Brazil", languages: ["Português", "English"], serviceTimes: "Sun 8:30, 10:30, 18:30", latitude: -23.5505, longitude: -46.6333 },
  { slug: "hope-community-bali", name: "Hope Community Church", city: "Bali", country: "Indonesia", countryCode: "ID", region: "Bali", address: "Jl. Raya Kuta 80, Bali", website: "https://www.google.com/maps/search/Hope+Community+Church+Bali+Indonesia", languages: ["Bahasa Indonesia", "English"], serviceTimes: "Sun 9:00, 11:00, 18:00", latitude: -8.4095, longitude: 115.1889 },
  { slug: "new-delhi-hope-fellowship", name: "New Delhi Hope Fellowship", city: "New Delhi", country: "India", countryCode: "IN", region: "Delhi", address: "Connaught Place, New Delhi", website: "https://www.google.com/maps/search/New+Delhi+Hope+Fellowship+India", languages: ["हिन्दी", "English"], serviceTimes: "Sun 8:30, 10:30, 18:00", latitude: 28.6139, longitude: 77.2090 },
  { slug: "grace-city-shanghai", name: "Grace City Church", city: "Shanghai", country: "China", countryCode: "CN", region: "Shanghai", address: "Middle Xizang Road 120, Shanghai", website: "https://www.google.com/maps/search/Grace+City+Church+Shanghai+China", languages: ["中文", "English"], serviceTimes: "Sun 9:00, 11:00, 18:30", latitude: 31.2304, longitude: 121.4737 },
] as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: (await getTranslations({ locale, namespace: "churches" }))("title") };
}
export default async function ChurchesPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; country?: string; city?: string; language?: string }> }) {
  const { locale } = await params; const search = await searchParams; const t = await getTranslations({ locale });
  const parsed = churchQuerySchema.safeParse({ q: search.q, country: search.country || undefined, city: search.city || undefined, language: search.language || undefined });
  const filters = parsed.success ? parsed.data : null;
  const selectedLanguage = filters?.language ?? locale;
  const localeLanguageMap: Record<string, string[]> = {
    en: ["English"],
    mn: ["Монгол", "Mongolian"],
    ru: ["Русский", "Russian"],
    es: ["Español", "Spanish"],
    fr: ["Français", "French"],
    ar: ["العربية", "Arabic"],
    pt: ["Português", "Portuguese"],
    tr: ["Türkçe", "Turkish"],
    id: ["Bahasa Indonesia", "Indonesian"],
    hi: ["हिन्दी", "Hindi"],
    zh: ["中文", "Chinese"],
  };
  const languageMatches = localeLanguageMap[selectedLanguage] ?? [localeNames[selectedLanguage as keyof typeof localeNames] ?? selectedLanguage];
  const query = filters ? await loadPublicData(() => prisma.church.findMany({
    where: {
      status: "APPROVED",
      ...(filters.country ? { country: filters.country } : {}),
      ...(filters.city ? { city: { contains: filters.city, mode: "insensitive" } } : {}),
      ...(filters.language ? { languages: { hasSome: languageMatches } } : {}),
      ...(filters.q ? { OR: [{ name: { contains: filters.q, mode: "insensitive" } }, { city: { contains: filters.q, mode: "insensitive" } }, { address: { contains: filters.q, mode: "insensitive" } }] } : {}),
    }, orderBy: { name: "asc" }, take: 48,
  })) : { data: null, unavailable: false };
  const preferredCountries = localeCountryPrefs[locale] ?? [];
  const fallbackItems = churchFallback.filter((church) => {
    const q = filters?.q?.trim().toLowerCase();
    const matchesCountry = !preferredCountries.length || preferredCountries.includes(church.countryCode) || !filters?.country || church.countryCode === filters.country;
    const matchesLanguage = !filters?.language || church.languages.some((language) => languageMatches.some((name) => name.toLowerCase() === language.toLowerCase() || language.toLowerCase().includes(name.toLowerCase())));
    const matchesCity = !filters?.city || church.city.toLowerCase().includes(filters.city.toLowerCase());
    const matchesQuery = !q || [church.name, church.city, church.country, church.address].some((value) => value.toLowerCase().includes(q));
    return matchesCountry && matchesLanguage && matchesCity && matchesQuery;
  }).map((church) => ({
    id: church.slug,
    slug: church.slug,
    name: church.name,
    city: church.city,
    country: church.country,
    countryCode: church.countryCode,
    region: church.region,
    address: church.address,
    website: church.website,
    languages: church.languages,
    serviceTimes: church.serviceTimes,
    latitude: church.latitude,
    longitude: church.longitude,
    verified: true,
    status: "APPROVED" as const,
  }));
  const dbChurches = (query.data ?? []).map((church) => ({
    ...church,
    countryCode: church.country,
    verified: church.verified ?? true,
    status: church.status ?? "APPROVED",
  }));
  const mergedChurches = [...dbChurches, ...fallbackItems.filter((item) => !dbChurches.some((church) => church.slug === item.slug))];
  const churches = mergedChurches.filter((church) => !filters?.country || church.country === filters.country || church.countryCode === filters.country);
  const allCountries = Array.from(new Set([...churches.map((church) => church.country), ...dbChurches.map((church) => church.country), ...fallbackItems.map((church) => church.country)]))
    .filter(Boolean)
    .sort();
  const allCities = Array.from(new Set(churches.filter((church) => !filters?.country || church.country === filters.country || church.countryCode === filters.country).map((church) => church.city))).sort();
  return <><PageHeader title={t("churches.title")} subtitle={t("churches.subtitle")} /><div className="container-page py-12">
    <FilterBar
      languageOptions={locales.map((value) => ({ value, label: localeNames[value] }))}
      countryOptions={allCountries.map((value) => ({ value, label: value }))}
      cityOptions={allCities.map((value) => ({ value, label: value }))}
      currentLanguage={selectedLanguage}
      currentCountry={filters?.country}
      currentCity={filters?.city}
      searchValue={filters?.q}
      searchPlaceholder={t("churches.searchPlaceholder")}
    />
    {!parsed.success ? <p role="alert">{t("common.error")}</p> : query.unavailable ? <p role="alert" className="card p-6">{t("foundation.serviceUnavailable")}</p> : !churches.length ? <p className="card p-6 text-ink-muted">{t("churches.empty")}</p> : <>
      <ChurchNearby churches={churches.map((church) => ({
        id: church.id,
        slug: church.slug,
        name: church.name,
        city: church.city,
        country: church.country,
        address: church.address ?? "",
        website: church.website ?? `https://www.google.com/maps/search/${encodeURIComponent(`${church.name} ${church.city} ${church.country}`)}`,
        serviceTimes: church.serviceTimes ?? null,
        latitude: "latitude" in church ? church.latitude ?? null : null,
        longitude: "longitude" in church ? church.longitude ?? null : null,
      }))} />
      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{churches.map((church) => <li key={church.id} className="card p-6">
        {church.verified && <p className="eyebrow">{t("churches.verified")}</p>}
        <h2 className="mt-2 text-2xl font-semibold"><Link href={`/churches/${church.slug}`} className="hover:text-accent-ink">{church.name}</Link></h2>
        <p className="mt-2 text-sm text-ink-muted">{church.city}, {church.country}</p>
        {church.serviceTimes && <p className="mt-3 text-sm">{church.serviceTimes}</p>}
        <a href={church.website ?? `https://www.google.com/maps/search/${encodeURIComponent(`${church.name} ${church.city} ${church.country}`)}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-medium text-brand hover:text-brand-strong">Open in Google Maps</a>
      </li>)}</ul>
    </> }
  </div></>;
}
