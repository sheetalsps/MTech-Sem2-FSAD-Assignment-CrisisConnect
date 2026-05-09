/**
 * Shared layout for search + dropdown filters above CRUD lists.
 * Uses global classes from App.css (equipment-filters, etc.).
 */
export default function CrudListFilters({ children, meta }) {
  return (
    <div className="crud-filter-toolbar">
      <div className="equipment-filters">{children}</div>
      {meta != null && meta !== '' && (
        <p className="equipment-results-meta" role="status">
          {meta}
        </p>
      )}
    </div>
  );
}
