"use client";

import { TopBar } from "@/components/layout/top-bar";
import { LocationList } from "@/features/locations/components/location-list";

export default function LocationsPage() {
  return (
    <>
      <TopBar title="Locations" description="Manage your office locations" />
      <div className="px-8 py-6">
        <LocationList />
      </div>
    </>
  );
}
