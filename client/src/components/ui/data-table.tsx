import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DataTableProps<T> {
  data: T[];
  columns: {
    id: string;
    header: string;
    cell: (item: T) => React.ReactNode;
    sortable?: boolean;
  }[];
  onRowClick?: (item: T) => void;
  selectable?: boolean;
  onSelectedItemsChange?: (items: T[]) => void;
  filters?: {
    id: string;
    label: string;
    options: { label: string; value: string }[];
    value: string;
    onChange: (value: string) => void;
  }[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
  searchable?: boolean;
  onSearch?: (term: string) => void;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  selectable = false,
  onSelectedItemsChange,
  filters,
  pagination,
  searchable = false,
  onSearch,
}: DataTableProps<T>) {
  const [selectedItems, setSelectedItems] = useState<T[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelectAll = () => {
    if (selectedItems.length === data.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems([...data]);
    }
  };

  const handleSelectItem = (item: T) => {
    const isSelected = selectedItems.some((i) => i === item);
    if (isSelected) {
      setSelectedItems(selectedItems.filter((i) => i !== item));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (onSearch) {
      onSearch(term);
    }
  };

  useEffect(() => {
    if (onSelectedItemsChange) {
      onSelectedItemsChange(selectedItems);
    }
  }, [selectedItems, onSelectedItemsChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {searchable && (
          <div className="relative ml-4">
            <Input
              type="text"
              placeholder="Search products..."
              className="py-2 pl-10 pr-4 w-64 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-beer-gold focus:border-transparent"
              value={searchTerm}
              onChange={handleSearch}
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        )}

        {filters && filters.length > 0 && (
          <div className="flex items-center space-x-2 px-4 py-4">
            {filters.map(filter => (
              <div key={filter.id} className="relative">
                <Select value={filter.value} onValueChange={filter.onChange}>
                  <SelectTrigger className="h-10 w-[180px]">
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All {filter.label}</SelectItem>
                    {filter.options.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={selectedItems.length === data.length && data.length > 0} 
                    onCheckedChange={handleSelectAll}
                    className="text-beer-gold"
                  />
                </TableHead>
              )}
              {columns.map(column => (
                <TableHead key={column.id} className="px-6 py-3">
                  {column.sortable ? (
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort(column.id)}
                    >
                      <span>{column.header}</span>
                      {sortColumn === column.id ? (
                        <svg
                          className="ml-1 h-4 w-4 text-gray-400"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          {sortDirection === 'asc' ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 15l7-7 7 7"
                            />
                          ) : (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          )}
                        </svg>
                      ) : (
                        <svg
                          className="ml-1 h-4 w-4 text-gray-400"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                      )}
                    </div>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, i) => (
                <TableRow
                  key={i}
                  className={onRowClick ? "cursor-pointer hover:bg-amber-50" : ""}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {selectable && (
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.includes(item)}
                        onCheckedChange={() => handleSelectItem(item)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-beer-gold"
                      />
                    </TableCell>
                  )}
                  {columns.map(column => (
                    <TableCell key={column.id} className="px-6 py-4">
                      {column.cell(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Showing{" "}
            <span className="font-medium">
              {(pagination.currentPage - 1) * pagination.pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(
                pagination.currentPage * pagination.pageSize,
                pagination.totalItems
              )}
            </span>{" "}
            of <span className="font-medium">{pagination.totalItems}</span> results
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="border-gray-300 text-gray-700"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="border-gray-300 text-gray-700"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
