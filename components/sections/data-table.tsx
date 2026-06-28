import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type DataTableRow = {
  id: string;
  cells: ReactNode[];
};

type DataTableProps = {
  eyebrow: string;
  title: string;
  description: string;
  columns: string[];
  rows: DataTableRow[];
};

export function DataTable({
  eyebrow,
  title,
  description,
  columns,
  rows,
}: DataTableProps) {
  return (
    <Card className="section-border rounded-[36px] p-0">
      <div className="border-b border-white/10 p-6 sm:p-8">
        <Badge className="max-w-full">{eyebrow}</Badge>
        <h2 className="mt-5 text-wrap-safe font-display text-2xl uppercase tracking-[0.12em] text-pearl sm:text-3xl">
          {title}
        </h2>
        <p className="text-wrap-safe mt-3 max-w-3xl text-sm leading-7 text-silver sm:text-base">
          {description}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[960px] w-full divide-y divide-white/10">
          <thead>
            <tr className="text-left">
              {columns.map((column) => (
                <th
                  key={column}
                  className="whitespace-nowrap px-6 py-4 text-[0.68rem] uppercase tracking-[0.2em] text-silver sm:px-8"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((row) => (
              <tr
                key={row.id}
                className="align-top transition hover:bg-white/[0.03]"
              >
                {row.cells.map((cell, index) => (
                  <td
                    key={`${row.id}-${index}`}
                    className="max-w-[18rem] break-words px-6 py-4 text-sm leading-6 text-silver sm:px-8"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
