"use client";

import { ChevronDown } from "lucide-react";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { cn } from "~/lib/utils";

type RecipeDetailSectionCardProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function RecipeDetailSectionCard({
  title,
  children,
  className,
}: RecipeDetailSectionCardProps) {
  return (
    <Collapsible defaultOpen className={cn("group", className)}>
      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-0 [.border-b]:pb-0">
          <CollapsibleTrigger
            type="button"
            className="grid w-full cursor-pointer grid-cols-[1fr_auto] items-center gap-2 rounded-t-xl py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <CardTitle className="col-start-1 row-start-1">{title}</CardTitle>
            <CardAction className="col-start-2 row-start-1">
              <ChevronDown
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[open]:rotate-180"
              />
            </CardAction>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-4 pb-4">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
