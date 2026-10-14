"use client";

import { useMemo, useState } from "react";
import { churchDistanceKm } from "@cp/shared";

type ChurchNearbyItem = {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: string;
  address: string;
  website: string;
  serviceTimes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export function ChurchNearby({ churches }: { churches: ChurchNearbyItem[] }) {
  const [radiusKm, setRadiusKm] = useState(100);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "denied" | "unsupported">("idle");

  const nearbyChurches = useMemo(() => {
    if (!location) return [] as Array<ChurchNearbyItem & { distanceKm: number }>;

    return churches
      .map((church) => {
        const distanceKm = churchDistanceKm(
          { latitude: church.latitude ?? null, longitude: church.longitude ?? null },
          location,
        );

        if (distanceKm == null) return null;
        return { ...church, distanceKm };
      })
      .filter((church): church is ChurchNearbyItem & { distanceKm: number } => church !== null && church.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [churches, location, radiusKm]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus("unsupported");
      return;
    }

    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setStatus("ready");
      },
      () => {
        setStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 },
    );
  };

  return (
    <div className="card p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Nearby churches</p>
          <h3 className="mt-1 text-xl font-semibold">Find churches within {radiusKm} km</h3>
          <p className="mt-1 text-sm text-ink-muted">
            {location ? "Using your device location to sort churches nearby." : "Allow location access to see the closest churches near you."}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="label min-w-[120px]">
            <span>Radius</span>
            <select
              className="input mt-1"
              value={radiusKm}
              onChange={(event) => setRadiusKm(Number(event.target.value))}
            >
              {[25, 50, 100, 250, 500].map((value) => (
                <option key={value} value={value}>
                  {value} km
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={requestLocation}
            disabled={status === "loading"}
            className="rounded-xl border border-brand/70 bg-brand-strong px-4 py-2 text-sm font-medium text-white transition hover:bg-brand disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "loading" ? "Locating..." : location ? "Refresh" : "Use my location"}
          </button>
        </div>
      </div>

      {status === "denied" ? (
        <p className="mt-3 text-sm text-warning">Location access was denied. You can still search by country or city.</p>
      ) : null}

      {status === "unsupported" ? (
        <p className="mt-3 text-sm text-warning">This device does not support geolocation, so nearby search is unavailable.</p>
      ) : null}

      {location ? (
        nearbyChurches.length > 0 ? (
          <ul className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {nearbyChurches.slice(0, 6).map((church) => (
              <li key={church.id} className="rounded-2xl border border-border bg-surface-muted p-4">
                <p className="text-xs uppercase tracking-wide text-brand">{church.distanceKm.toFixed(1)} km away</p>
                <h4 className="mt-2 text-lg font-semibold">{church.name}</h4>
                <p className="mt-1 text-sm text-ink-muted">{church.city}, {church.country}</p>
                <p className="mt-2 text-sm">{church.address}</p>
                {church.serviceTimes ? <p className="mt-2 text-sm text-ink-muted">{church.serviceTimes}</p> : null}
                <a
                  href={church.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm font-medium text-brand hover:text-brand-strong"
                >
                  Open in Google Maps
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-ink-muted">No churches were found within {radiusKm} km of your current position. Try a larger radius.</p>
        )
      ) : (
        <p className="mt-4 text-sm text-ink-muted">We can show the nearest churches in your area once you enable location access.</p>
      )}
    </div>
  );
}
