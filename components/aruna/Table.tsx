import type { TableColumn, TableProps, TableRowProps } from "@/types/aruna";

function gridTemplate(columns: TableColumn[]) {
  return columns.map((column) => column.width ?? "1fr").join(" ");
}

export function Table({ columns, children }: TableProps) {
  return (
    <div className="rounded-card border border-border bg-surface overflow-hidden">
      <div
        className="grid px-[20px] py-[14px] border-b border-border text-[11px] tracking-[0.07em] uppercase text-foreground-muted"
        style={{ gridTemplateColumns: gridTemplate(columns) }}
      >
        {columns.map((column) => (
          <div key={column.key}>{column.header}</div>
        ))}
      </div>
      {children}
    </div>
  );
}

export function TableRow({ columns, cells, highlighted = false }: TableRowProps) {
  return (
    <div
      className={[
        "grid items-center px-[20px] py-[14px] border-b border-border-subtle last:border-b-0",
        highlighted ? "bg-surface-row" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ gridTemplateColumns: gridTemplate(columns) }}
    >
      {columns.map((column, index) => (
        <div key={column.key}>{cells[index]}</div>
      ))}
    </div>
  );
}
