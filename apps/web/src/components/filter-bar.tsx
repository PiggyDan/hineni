"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

type Option = { value: string; label: string };

export function FilterBar({
  languageOptions,
  countryOptions,
  cityOptions,
  currentLanguage,
  currentCountry,
  currentCity,
  searchValue,
  searchPlaceholder,
}: {
  languageOptions: Option[];
  countryOptions?: Option[];
  cityOptions?: Option[];
  currentLanguage?: string;
  currentCountry?: string;
  currentCity?: string;
  searchValue?: string;
  searchPlaceholder?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const updateQuery = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }

    const queryString = params.toString();
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(nextUrl, { scroll: false });
  };

  const handleLanguageChange = (value: string) => {
    const segments = pathname.split("/").filter(Boolean);
    const nextSegments = [value, ...segments.slice(1)];
    const nextPath = `/${nextSegments.join("/")}`;
    const queryString = searchParams.toString();
    router.replace(queryString ? `${nextPath}?${queryString}` : nextPath, { scroll: false });
  };

  return (
    <div className="mb-8 grid gap-3 md:grid-cols-[1fr_repeat(2,minmax(0,0.7fr))_repeat(2,minmax(0,0.8fr))]">
      {searchPlaceholder ? (
        <label className="label">
          <span>{searchPlaceholder}</span>
          <input
            className="input mt-1"
            value={searchValue ?? ""}
            onChange={(event) => updateQuery({ q: event.target.value || undefined })}
            placeholder={searchPlaceholder}
          />
        </label>
      ) : null}

      <label className="label">
        <span>Language</span>
        <select
          className="input mt-1"
          value={currentLanguage ?? languageOptions[0]?.value ?? "en"}
          onChange={(event) => handleLanguageChange(event.target.value)}
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {countryOptions && countryOptions.length > 0 ? (
        <label className="label">
          <span>Country</span>
          <select
            className="input mt-1 uppercase"
            value={currentCountry ?? ""}
            onChange={(event) => updateQuery({ country: event.target.value || undefined })}
          >
            <option value="">All countries</option>
            {countryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {cityOptions && cityOptions.length > 0 ? (
        <label className="label">
          <span>City</span>
          <select
            className="input mt-1"
            value={currentCity ?? ""}
            onChange={(event) => updateQuery({ city: event.target.value || undefined })}
          >
            <option value="">All cities</option>
            {cityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}
