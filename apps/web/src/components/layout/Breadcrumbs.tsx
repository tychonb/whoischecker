import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500">
      {items.map((item, index) => {
        const lastItem = index === items.length - 1;

        return (
          <div key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.href && !lastItem ? (
              <Link className="transition hover:text-slate-900" to={item.href}>
                {item.label}
              </Link>
            ) : (
              <span className={lastItem ? "font-medium text-slate-900" : ""}>{item.label}</span>
            )}
            {!lastItem ? <ChevronRight className="h-4 w-4 text-slate-300" /> : null}
          </div>
        );
      })}
    </nav>
  );
}
