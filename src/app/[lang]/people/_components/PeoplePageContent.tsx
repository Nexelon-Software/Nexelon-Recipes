"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import useTranslation from "~/language/useTranslation";
import { api } from "~/trpc/react";

import { PersonRow } from "./PersonRow";

function PersonRowSkeleton() {
  return (
    <div className="border-border flex items-center gap-3 rounded-lg border p-3">
      <div className="bg-muted size-10 shrink-0 animate-pulse rounded-full" />
      <div className="bg-muted h-4 flex-1 animate-pulse rounded" />
      <div className="bg-muted h-8 w-20 animate-pulse rounded" />
    </div>
  );
}

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number | undefined;
  loading: boolean;
}) {
  return (
    <Card className="flex-1">
      <CardContent className="p-4">
        <p className="text-muted-foreground text-sm">{label}</p>
        {loading ? (
          <div className="bg-muted mt-1 h-8 w-12 animate-pulse rounded" />
        ) : (
          <p className="text-2xl font-semibold">{value ?? 0}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function PeoplePageContent() {
  const { t, lang } = useTranslation();
  const [search, setSearch] = useState("");
  const [querySearch, setQuerySearch] = useState<string | undefined>();

  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed.length < 3) {
      setQuerySearch(undefined);
      return;
    }

    const timer = setTimeout(() => setQuerySearch(trimmed), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: counts, isLoading: countsLoading } =
    api.follow.getCounts.useQuery();

  const { data: people = [], isLoading: peopleLoading } =
    api.follow.searchPeople.useQuery(
      { search: querySearch },
      { placeholderData: keepPreviousData },
    );

  return (
    <div className="container mx-auto px-3 py-6 sm:px-4">
      <h1 className="mb-6 text-2xl font-semibold">{t(lang.people.title)}</h1>

      <div className="mb-6 flex gap-3">
        <StatCard
          label={t(lang.people.followingCount)}
          value={counts?.following}
          loading={countsLoading}
        />
        <StatCard
          label={t(lang.people.followersCount)}
          value={counts?.followers}
          loading={countsLoading}
        />
      </div>

      <div className="mb-6">
        <Label htmlFor="people-search">{t(lang.people.searchLabel)}</Label>
        <Input
          id="people-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t(lang.people.searchPlaceholder)}
          className="mt-1.5"
        />
      </div>

      <div className="flex flex-col gap-2">
        {peopleLoading ? (
          Array.from({ length: 4 }, (_, index) => (
            <PersonRowSkeleton key={index} />
          ))
        ) : people.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            {t(lang.people.noResults)}
          </p>
        ) : (
          people.map((person) => (
            <PersonRow
              key={person.id}
              id={person.id}
              name={person.name}
              image={person.image}
              isFollowing={person.isFollowing}
            />
          ))
        )}
      </div>
    </div>
  );
}
