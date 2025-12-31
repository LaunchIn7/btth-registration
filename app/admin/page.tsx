'use client';

import { useEffect, useRef, useState } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  ColumnDef,
} from '@tanstack/react-table';
import { ArrowUpDown, Download, Eye, FileSpreadsheet, RefreshCcw, Search, Trash2 } from 'lucide-react';
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
import { downloadRegistrationReceipt } from '@/lib/registration-receipt';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import * as XLSX from 'xlsx';

const CACHE_TTL_MS = 60 * 1000;

type Registration = {
  _id: string;
  registrationId?: string;
  studentName: string;
  currentClass: string;
  schoolName: string;
  parentMobile: string;
  examDate: string;
  referralSource: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  paymentId?: string;
  razorpayPaymentId?: string;
  razorpay_payment_id?: string;
  orderId?: string;
  razorpay_order_id?: string;
  examType?: string;
  registrationAmount?: number;
};

type CacheEntry = {
  data: Registration[];
  expiry: number;
};

export default function AdminPage() {
  const { isLoaded, isSignedIn } = useUser();
  const { redirectToSignIn } = useClerk();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [previewRegistration, setPreviewRegistration] = useState<Registration | null>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ type: 'single' | 'bulk'; registration?: Registration } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      redirectToSignIn({ redirectUrl: '/admin' });
    }
  }, [isLoaded, isSignedIn, redirectToSignIn]);

  useEffect(() => {
    if (!isSignedIn) return;

    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(() => {
      fetchRegistrations();
    }, 500);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [isSignedIn, classFilter, dateFilter, statusFilter, globalFilter]);

  useEffect(() => {
    setSelectedRowIds((prev) => prev.filter((id) => registrations.some((reg) => reg._id === id)));
  }, [registrations]);

  const fetchRegistrations = async (useCache = true) => {
    try {
      const params = new URLSearchParams();
      const shouldApplyFilter = (value: string) => value && value !== 'all';

      if (shouldApplyFilter(classFilter)) params.append('class', classFilter);
      if (shouldApplyFilter(dateFilter)) params.append('examDate', dateFilter);
      if (shouldApplyFilter(statusFilter)) params.append('status', statusFilter);
      if (globalFilter) params.append('search', globalFilter);

      const cacheKey = params.toString() || '__all__';
      const cached = useCache ? cacheRef.current.get(cacheKey) : undefined;
      const now = Date.now();

      if (cached && cached.expiry > now) {
        setRegistrations(cached.data);
        setLoading(false);
        return;
      }

      if (!useCache) {
        cacheRef.current.delete(cacheKey);
      }

      setLoading(true);
      const response = await axiosInstance.get(`/registrations/list?${params.toString()}`);
      const registrationsData = response.data.data as Registration[];
      setRegistrations(registrationsData);
      cacheRef.current.set(cacheKey, {
        data: registrationsData,
        expiry: now + CACHE_TTL_MS,
      });
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = () => {
    cacheRef.current.clear();
    fetchRegistrations(false);
  };

  const handleViewReceipt = (registration: Registration) => {
    setPreviewRegistration(registration);
    setIsReceiptDialogOpen(true);
  };

  const handleDeleteRegistration = (registration: Registration) => {
    setPendingDelete({ type: 'single', registration });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    try {
      setLoading(true);
      setErrorMessage(null);

      if (pendingDelete.type === 'single' && pendingDelete.registration) {
        await axiosInstance.delete(`/registrations/${pendingDelete.registration._id}`);
        setSelectedRowIds((prev) => prev.filter((id) => id !== pendingDelete.registration!._id));
      } else if (pendingDelete.type === 'bulk') {
        const selectedRegistrations = registrations.filter((reg) => selectedRowIds.includes(reg._id));
        await Promise.all(
          selectedRegistrations.map((registration) =>
            axiosInstance.delete(`/registrations/${registration._id}`)
          )
        );
        setSelectedRowIds([]);
      }

      cacheRef.current.clear();
      fetchRegistrations(false);
      setDeleteDialogOpen(false);
      setPendingDelete(null);
    } catch (error) {
      console.error('Failed to delete registration(s):', error);
      setErrorMessage('Failed to delete. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = () => {
    const selectedRegistrations = registrations.filter((reg) => selectedRowIds.includes(reg._id));
    if (!selectedRegistrations.length) return;

    setPendingDelete({ type: 'bulk' });
    setDeleteDialogOpen(true);
  };

  const toggleRowSelection = (id: string, checked: boolean) => {
    setSelectedRowIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((rowId) => rowId !== id);
    });
  };

  const checkboxClass = 'h-4 w-4 rounded border border-zinc-300 accent-blue-600';
  const selectedCount = selectedRowIds.length;

  const columns: ColumnDef<Registration>[] = [
    {
      id: 'select',
      header: ({ table }) => {
        const visibleRowIds = table.getRowModel().rows.map((row) => row.original._id);
        const allVisibleSelected =
          visibleRowIds.length > 0 && visibleRowIds.every((id) => selectedRowIds.includes(id));
        const someSelected = visibleRowIds.some((id) => selectedRowIds.includes(id));

        return (
          <input
            type="checkbox"
            aria-label="Select all rows"
            className={checkboxClass}
            checked={allVisibleSelected}
            ref={(input) => {
              if (input) input.indeterminate = !allVisibleSelected && someSelected;
            }}
            onChange={(event) => {
              const checked = event.target.checked;
              setSelectedRowIds((prev) => {
                if (!checked) {
                  return prev.filter((id) => !visibleRowIds.includes(id));
                }
                return Array.from(new Set([...prev, ...visibleRowIds]));
              });
            }}
          />
        );
      },
      cell: ({ row }) => {
        const isChecked = selectedRowIds.includes(row.original._id);
        return (
          <input
            type="checkbox"
            aria-label={`Select ${row.original.studentName}`}
            className={checkboxClass}
            checked={isChecked}
            onChange={(event) => toggleRowSelection(row.original._id, event.target.checked)}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'registrationId',
      header: 'Reg ID',
      cell: ({ row }: any) => {
        const regId = row.getValue('registrationId');
        return regId ? (
          <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded whitespace-nowrap inline-block">
            {regId}
          </span>
        ) : (
          <span className="text-xs text-zinc-400 whitespace-nowrap">Not assigned</span>
        );
      },
    },
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
      accessorKey: 'createdAt',
      header: 'Registered On',
      cell: ({ row }: any) => {
        const date = new Date(row.getValue('createdAt'));
        return date.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      },
    },
    {
      accessorKey: 'currentClass',
      header: 'Class',
      cell: ({ row }: any) => `Class ${row.getValue('currentClass')}`,
    },
    {
      accessorKey: 'examType',
      header: 'Exam Type',
      cell: ({ row }: any) => {
        const examType = row.getValue('examType');
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${examType === 'foundation'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-blue-100 text-blue-800'
              }`}
          >
            {examType === 'foundation' ? 'Foundation' : 'comp28'}
          </span>
        );
      },
    },
    {
      accessorKey: 'registrationAmount',
      header: 'Fee',
      cell: ({ row }: any) => {
        const amount = row.getValue('registrationAmount');
        return <span className="font-semibold">₹{amount || 500}</span>;
      },
    },
    {
      accessorKey: 'schoolName',
      header: 'School',
    },
    {
      accessorKey: 'parentMobile',
      header: 'Contact',
      cell: ({ row }: any) => {
        const mobile = row.getValue('parentMobile');
        return (
          <a href={`tel:${mobile}`} className="font-semibold hover:underline">
            {mobile}
          </a>
        );
      },
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
      header: 'Payment Status',
      cell: ({ row }: any) => {
        const status = row.getValue('paymentStatus');
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${status === 'paid'
              ? 'bg-green-100 text-green-800'
              : status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
              }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const registration = row.original;
        const isPaid = registration.paymentStatus === 'paid';

        return (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon-sm"
              // disabled={!isPaid}
              // title={isPaid ? 'Preview receipt' : 'Available after payment'}
              title="Preview receipt"
              onClick={() => handleViewReceipt(registration)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              // disabled={!isPaid}
              // title={isPaid ? 'Download receipt' : 'Available after payment'}
              title="Download receipt"
              onClick={() => downloadRegistrationReceipt(registration)}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon-sm"
              title="Delete registration"
              onClick={() => handleDeleteRegistration(registration)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
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
    const headers = ['Reg ID', 'Student Name', 'Registered On', 'Class', 'Exam Type', 'School', 'Contact', 'Exam Date', 'Source', 'Status', 'Payment'];
    const rows = registrations.map((reg: any) => [
      reg.registrationId || 'N/A',
      reg.studentName,
      new Date(reg.createdAt).toLocaleString('en-IN'),
      `Class ${reg.currentClass}`,
      reg.examType === 'foundation' ? 'Foundation' : 'Comp28',
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

  const exportToExcel = () => {
    const headers = ['Reg ID', 'Student Name', 'Registered On', 'Class', 'Exam Type', 'School', 'Contact', 'Exam Date', 'Source', 'Status', 'Payment'];
    const rows = registrations.map((reg: any) => [
      reg.registrationId || 'N/A',
      reg.studentName,
      new Date(reg.createdAt).toLocaleString('en-IN'),
      `Class ${reg.currentClass}`,
      reg.examType === 'foundation' ? 'Foundation' : 'Comp28',
      reg.schoolName,
      reg.parentMobile,
      new Date(reg.examDate).toLocaleDateString('en-IN'),
      reg.referralSource,
      reg.status,
      reg.paymentStatus,
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

    const fileName = `btth-registrations-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-white to-blue-50">
      <div className="shrink-0 p-6 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 leading-tight" style={{ color: '#212529' }}>
            BTTH 2.0 Registrations
          </h1>
          <p className="text-sm sm:text-base text-zinc-600">
            Manage and view all student registrations
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6">
          <div className="flex flex-col md:flex-row md:flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1 min-w-[200px]">
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

            <Button onClick={exportToExcel} variant="outline" className="w-full md:w-auto min-h-[44px]">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export Excel
            </Button>

            <Button
              onClick={handleManualRefresh}
              variant="secondary"
              className="w-full md:w-auto min-h-[44px]"
              disabled={loading}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {selectedCount > 0 && (
            <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 pointer-events-none">
              <div className="pointer-events-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-blue-100 bg-white shadow-xl shadow-blue-300/40 text-blue-900 rounded-xl px-4 py-3 w-full max-w-3xl">
                <p className="text-sm font-semibold">
                  {selectedCount} registration{selectedCount > 1 ? 's' : ''} selected
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRowIds([])}
                    disabled={loading}
                  >
                    Clear Selection
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={!selectedCount || loading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            </div>
          )}

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

      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Registration Receipt Preview</DialogTitle>
            <DialogDescription>
              Review the key details before downloading or printing the official receipt.
            </DialogDescription>
          </DialogHeader>
          {previewRegistration ? (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-zinc-500">Registration ID</p>
                <p className="font-mono font-bold text-blue-700">{previewRegistration.registrationId || previewRegistration._id}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-zinc-500">Student Name</p>
                  <p className="font-semibold">{previewRegistration.studentName}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Class</p>
                  <p className="font-semibold">Class {previewRegistration.currentClass}</p>
                </div>
                <div>
                  <p className="text-zinc-500">School</p>
                  <p className="font-semibold">{previewRegistration.schoolName}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Parent Contact</p>
                  <p className="font-semibold">{previewRegistration.parentMobile}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Exam Date</p>
                  <p className="font-semibold">
                    {new Date(previewRegistration.examDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">Referral Source</p>
                  <p className="font-semibold">{previewRegistration.referralSource}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Payment Status</p>
                  <p className="font-semibold text-green-600">
                    {previewRegistration.paymentStatus?.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">Payment ID</p>
                  <p className="font-semibold">
                    {previewRegistration.paymentId ||
                      previewRegistration.razorpayPaymentId ||
                      previewRegistration.razorpay_payment_id ||
                      'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => {
                    if (previewRegistration) {
                      downloadRegistrationReceipt(previewRegistration);
                    }
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button variant="outline" onClick={() => setIsReceiptDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Select a registration to preview the receipt.</p>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDelete?.type === 'bulk'
                ? `Delete ${registrations.filter((reg) => selectedRowIds.includes(reg._id)).length} Registration(s)?`
                : 'Delete Registration?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.type === 'bulk' ? (
                <>
                  You are about to delete{' '}
                  <strong>{registrations.filter((reg) => selectedRowIds.includes(reg._id)).length} selected registration(s)</strong>.
                  This action cannot be undone.
                </>
              ) : (
                <>
                  You are about to delete the registration for{' '}
                  <strong>{pendingDelete?.registration?.studentName}</strong>. This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
            {errorMessage && (
              <p className="text-sm text-red-600 mt-2">{errorMessage}</p>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setPendingDelete(null);
              setErrorMessage(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
