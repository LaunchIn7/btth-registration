'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { ArrowUpDown, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import axiosInstance from '@/lib/axios';

export default function AdminPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (isSignedIn) {
      fetchRegistrations();
    }
  }, [isSignedIn, classFilter, dateFilter, statusFilter, globalFilter]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (classFilter) params.append('class', classFilter);
      if (dateFilter) params.append('examDate', dateFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (globalFilter) params.append('search', globalFilter);

      const response = await axiosInstance.get(`/registrations/list?${params.toString()}`);
      setRegistrations(response.data.data);
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      accessorKey: 'studentName',
      header: ({ column }: any) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Student Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: 'currentClass',
      header: 'Class',
      cell: ({ row }: any) => `Class ${row.getValue('currentClass')}`,
    },
    {
      accessorKey: 'schoolName',
      header: 'School',
    },
    {
      accessorKey: 'parentMobile',
      header: 'Contact',
    },
    {
      accessorKey: 'examDate',
      header: 'Exam Date',
      cell: ({ row }: any) => {
        const date = new Date(row.getValue('examDate'));
        return date.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      },
    },
    {
      accessorKey: 'referralSource',
      header: 'Source',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.getValue('status');
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${status === 'completed'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
              }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Payment',
      cell: ({ row }: any) => {
        const status = row.getValue('paymentStatus');
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${status === 'paid'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
              }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Registered On',
      cell: ({ row }: any) => {
        const date = new Date(row.getValue('createdAt'));
        return date.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      },
    },
  ];

  const table = useReactTable({
    data: registrations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  const exportToCSV = () => {
    const headers = ['Student Name', 'Class', 'School', 'Contact', 'Exam Date', 'Source', 'Status', 'Payment'];
    const rows = registrations.map((reg: any) => [
      reg.studentName,
      `Class ${reg.currentClass}`,
      reg.schoolName,
      reg.parentMobile,
      new Date(reg.examDate).toLocaleDateString('en-IN'),
      reg.referralSource,
      reg.status,
      reg.paymentStatus,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `btth-registrations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 py-6 sm:py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 leading-tight" style={{ color: '#212529' }}>
            BTTH 2.0 Registrations
          </h1>
          <p className="text-sm sm:text-base text-zinc-600">
            Manage and view all student registrations
          </p>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, mobile, or school..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-10 h-11 sm:h-10 text-base"
                />
              </div>
            </div>

            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full md:w-[180px] h-11 sm:h-10">
                <SelectValue placeholder="Filter by Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="8">Class 8</SelectItem>
                <SelectItem value="9">Class 9</SelectItem>
                <SelectItem value="10">Class 10</SelectItem>
                <SelectItem value="11">Class 11</SelectItem>
                <SelectItem value="12">Class 12</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-[180px] h-11 sm:h-10">
                <SelectValue placeholder="Filter by Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="2026-01-11">11th Jan 2026</SelectItem>
                <SelectItem value="2026-01-18">18th Jan 2026</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px] h-11 sm:h-10">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={exportToCSV} variant="outline" className="w-full md:w-auto min-h-[44px]">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center"
                        >
                          No registrations found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 py-4">
                <div className="text-xs sm:text-sm text-zinc-600">
                  Showing {table.getRowModel().rows.length} of {registrations.length} registrations
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
