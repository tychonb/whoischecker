import { Construction } from "lucide-react";

import { Button, EmptyState, PageHeader } from "@/components";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Start", href: "/dashboard" }, { label: title }]}
        description={description}
        title={title}
      />
      <EmptyState
        action={<Button variant="secondary">Plan next iteration</Button>}
        description="Deze module is als route en shell-sectie voorbereid zodat verdere backend-integratie direct kan aansluiten."
        icon={<Construction className="h-5 w-5" />}
        title="Voorbereid voor de volgende implementatiefase"
      />
    </div>
  );
}
