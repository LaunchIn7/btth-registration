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
  PaginationState,
} from '@tanstack/react-table';
import { ArrowUpDown, Download, Eye, FileSpreadsheet, Pencil, RefreshCcw, Search, Trash2, CheckCircle, Hourglass } from 'lucide-react';
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
  DialogFooter,
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
  receiptNo?: string;
  studentName: string;
  currentClass: string;
  schoolName: string;
  parentMobile: string;
  email?: string;
  examDate: string;
  referralSource: string;
  referralOther?: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  paymentId?: string;
  razorpayPaymentId?: string;
  razorpay_payment_id?: string;
  orderId?: string;
  razorpay_order_id?: string;
  razorpaySignature?: string;
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
  const [reconciling, setReconciling] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [classFilter, setClassFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [availableExamDates, setAvailableExamDates] = useState<string[]>([]);
  const [previewRegistration, setPreviewRegistration] = useState<Registration | null>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [editRegistration, setEditRegistration] = useState<Registration | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Registration> & { razorpaySignature?: string }>({});
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
  }, [isSignedIn, classFilter, dateFilter, statusFilter, globalFilter, pagination.pageIndex, pagination.pageSize, sorting]);

  useEffect(() => {
    if (!isSignedIn) return;

    const fetchExamDates = async () => {
      try {
        const response = await axiosInstance.get('/registrations/exam-dates');
        const dates = (response.data?.data || []) as string[];
        setAvailableExamDates(Array.isArray(dates) ? dates : []);
      } catch (error) {
        console.error('Failed to fetch available exam dates:', error);
        setAvailableExamDates([]);
      }
    };

    fetchExamDates();
  }, [isSignedIn]);

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

      // Add pagination parameters
      params.append('page', String(pagination.pageIndex + 1));
      params.append('limit', String(pagination.pageSize));

      // Add sorting parameters
      if (sorting.length > 0) {
        const sort = sorting[0];
        params.append('sortBy', sort.id);
        params.append('sortOrder', sort.desc ? 'desc' : 'asc');
      }

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
      const paginationData = response.data.pagination;

      setRegistrations(registrationsData);
      setTotalCount(paginationData.total);

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

  const reconcilePayment = async () => {
    if (!editRegistration) return;

    try {
      setReconciling(true);
      setErrorMessage(null);

      await axiosInstance.post('/payment/reconcile', {
        registrationId: editRegistration._id,
      });

      const refreshed = await axiosInstance.get(`/registrations/${editRegistration._id}`);
      const refreshedRegistration = refreshed.data as Registration;

      setEditRegistration(refreshedRegistration);
      setEditForm((prev) => ({
        ...prev,
        status: refreshedRegistration.status,
        paymentStatus: refreshedRegistration.paymentStatus,
        paymentId:
          refreshedRegistration.paymentId ||
          refreshedRegistration.razorpayPaymentId ||
          refreshedRegistration.razorpay_payment_id,
        orderId: refreshedRegistration.orderId || refreshedRegistration.razorpay_order_id,
      }));

      cacheRef.current.clear();
      await fetchRegistrations(false);
    } catch (error) {
      console.error('Failed to reconcile payment:', error);
      setErrorMessage('Failed to reconcile payment. Please try again.');
    } finally {
      setReconciling(false);
    }
  };

  const handleManualRefresh = () => {
    cacheRef.current.clear();
    fetchRegistrations(false);

    axiosInstance
      .get('/registrations/exam-dates')
      .then((response) => {
        const dates = (response.data?.data || []) as string[];
        setAvailableExamDates(Array.isArray(dates) ? dates : []);
      })
      .catch((error) => {
        console.error('Failed to refresh available exam dates:', error);
      });
  };

  const formatExamDateOption = (value: string) => {
    try {
      return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (_error) {
      return value;
    }
  };

  const handleViewReceipt = (registration: Registration) => {
    setPreviewRegistration(registration);
    setIsReceiptDialogOpen(true);
  };

  const handleEditRegistration = (registration: Registration) => {
    setEditRegistration(registration);
    setEditForm({
      studentName: registration.studentName,
      currentClass: registration.currentClass,
      schoolName: registration.schoolName,
      parentMobile: registration.parentMobile,
      email: registration.email,
      examDate: registration.examDate,
      referralSource: registration.referralSource,
      referralOther: registration.referralOther,
      status: registration.status,
      paymentStatus: registration.paymentStatus,
      paymentId:
        registration.paymentId ||
        registration.razorpayPaymentId ||
        registration.razorpay_payment_id,
      orderId: registration.orderId || registration.razorpay_order_id,
      razorpaySignature: registration.razorpaySignature,
      examType: registration.examType,
      registrationAmount: registration.registrationAmount,
    });
    setIsEditDialogOpen(true);
  };

  const saveRegistrationEdits = async () => {
    if (!editRegistration) return;

    try {
      setLoading(true);
      setErrorMessage(null);
      await axiosInstance.patch(`/registrations/${editRegistration._id}`, editForm);
      cacheRef.current.clear();
      await fetchRegistrations(false);
      setIsEditDialogOpen(false);
      setEditRegistration(null);
      setEditForm({});
    } catch (error) {
      console.error('Failed to update registration:', error);
      setErrorMessage('Failed to update registration. Please try again.');
    } finally {
      setLoading(false);
    }
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
          <span className="font-mono text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded whitespace-nowrap inline-block">
            {regId}
          </span>
        ) : (
            <span className="text-[10px] text-zinc-400 whitespace-nowrap">N/A</span>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }: any) => {
        const email = row.getValue('email');
        return email ? (
          <a href={`mailto:${email}`} className="text-[11px] text-zinc-700 hover:underline whitespace-nowrap leading-tight">
            {email}
          </a>
        ) : (
          <span className="text-[11px] text-zinc-400 whitespace-nowrap">N/A</span>
        );
      },
    },
    {
      accessorKey: 'studentName',
      header: ({ column }: any) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Student Name
            <ArrowUpDown className="ml-1.5 h-3 w-3" />
          </Button>
        );
      },
      cell: ({ row }: any) => (
        <span className="text-xs font-medium leading-none">{row.getValue('studentName')}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Registered On',
      cell: ({ row }: any) => {
        const date = new Date(row.getValue('createdAt'));
        return (
          <span className="text-xs text-zinc-600 whitespace-nowrap">
            {date.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        );
      },
    },
    {
      accessorKey: 'currentClass',
      header: 'Class',
      cell: ({ row }: any) => (
        <span className="text-xs font-medium leading-none">Class {row.getValue('currentClass')}</span>
      ),
    },
    {
      accessorKey: 'examType',
      header: 'Exam Type',
      cell: ({ row }: any) => {
        const examType = row.getValue('examType');
        return (
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${examType === 'foundation'
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
        return <span className="text-xs font-semibold leading-none">₹{amount || 500}</span>;
      },
    },
    {
      accessorKey: 'schoolName',
      header: 'School',
      cell: ({ row }: any) => (
        <span className="text-[11px] text-zinc-700 leading-tight">{row.getValue('schoolName')}</span>
      ),
    },
    {
      accessorKey: 'parentMobile',
      header: 'Contact',
      cell: ({ row }: any) => {
        const mobile = row.getValue('parentMobile');
        return (
          <a href={`tel:${mobile}`} className="text-xs font-medium hover:underline whitespace-nowrap leading-none">
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
        return (
          <span className="text-[11px] text-zinc-600 whitespace-nowrap leading-tight">
            {date.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        );
      },
    },
    {
      accessorKey: 'referralSource',
      header: 'Source',
      cell: ({ row }: any) => (
        <span className="text-[11px] text-zinc-600 leading-tight">{row.getValue('referralSource')}</span>
      ),
    },
    {
      accessorKey: 'receiptNo',
      header: 'Receipt No',
      cell: ({ row }: any) => {
        const receiptNo = row.getValue('receiptNo');
        return receiptNo ? (
          <span className="font-mono text-[10px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded whitespace-nowrap inline-block">
            {receiptNo}
          </span>
        ) : (
          <span className="text-[10px] text-zinc-400 whitespace-nowrap">N/A</span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.getValue('status');
        const isCompleted = status === 'completed';
        return (
          <div className="flex items-center justify-center group relative">
            <div className="relative">
              {isCompleted ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Hourglass className="h-4 w-4 text-yellow-600" />
              )}
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
              {status}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Payment Status',
      cell: ({ row }: any) => {
        const status = row.getValue('paymentStatus');
        const isPaid = status === 'paid';
        return (
          <div className="flex items-center justify-center group relative">
            <div className="relative">
              <CheckCircle
                className={`h-4 w-4 ${isPaid ? 'text-green-600' : 'text-gray-400'}`}
              />
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
              {status}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          </div>
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
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-6 w-6 p-0"
              title="Preview receipt"
              onClick={() => handleViewReceipt(registration)}
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-6 w-6 p-0"
              title="Edit registration"
              onClick={() => handleEditRegistration(registration)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-6 w-6 p-0"
              title="Download receipt"
              onClick={() => downloadRegistrationReceipt(registration)}
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-6 w-6 p-0"
              title="Delete registration"
              onClick={() => handleDeleteRegistration(registration)}
            >
              <Trash2 className="h-3 w-3" />
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
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
  });

  const exportToCSV = async () => {
    try {
      const params = new URLSearchParams();
      const shouldApplyFilter = (value: string) => value && value !== 'all';

      if (shouldApplyFilter(classFilter)) params.append('class', classFilter);
      if (shouldApplyFilter(dateFilter)) params.append('examDate', dateFilter);
      if (shouldApplyFilter(statusFilter)) params.append('status', statusFilter);
      if (globalFilter) params.append('search', globalFilter);

      // Fetch all data for export
      params.append('page', '1');
      params.append('limit', '10000'); // Large number to get all records

      if (sorting.length > 0) {
        const sort = sorting[0];
        params.append('sortBy', sort.id);
        params.append('sortOrder', sort.desc ? 'desc' : 'asc');
      }

      const response = await axiosInstance.get(`/registrations/list?${params.toString()}`);
      const allRegistrations = response.data.data as Registration[];

      const headers = ['Reg ID', 'Student Name', 'Registered On', 'Class', 'Exam Type', 'School', 'Contact', 'Email', 'Exam Date', 'Source', 'Receipt No', 'Status', 'Payment'];
      const rows = allRegistrations.map((reg: any) => [
        reg.registrationId || 'N/A',
        reg.studentName,
        new Date(reg.createdAt).toLocaleString('en-IN'),
        `Class ${reg.currentClass}`,
        reg.examType === 'foundation' ? 'Foundation' : 'Comp28',
        reg.schoolName,
        reg.parentMobile,
        reg.email || '',
        new Date(reg.examDate).toLocaleDateString('en-IN'),
        reg.referralSource,
        reg.receiptNo || 'N/A',
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
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  const exportToExcel = async () => {
    try {
      const params = new URLSearchParams();
      const shouldApplyFilter = (value: string) => value && value !== 'all';

      if (shouldApplyFilter(classFilter)) params.append('class', classFilter);
      if (shouldApplyFilter(dateFilter)) params.append('examDate', dateFilter);
      if (shouldApplyFilter(statusFilter)) params.append('status', statusFilter);
      if (globalFilter) params.append('search', globalFilter);

      // Fetch all data for export
      params.append('page', '1');
      params.append('limit', '10000'); // Large number to get all records

      if (sorting.length > 0) {
        const sort = sorting[0];
        params.append('sortBy', sort.id);
        params.append('sortOrder', sort.desc ? 'desc' : 'asc');
      }

      const response = await axiosInstance.get(`/registrations/list?${params.toString()}`);
      const allRegistrations = response.data.data as Registration[];

      const headers = ['Reg ID', 'Student Name', 'Registered On', 'Class', 'Exam Type', 'School', 'Contact', 'Email', 'Exam Date', 'Source', 'Receipt No', 'Status', 'Payment'];
      const rows = allRegistrations.map((reg: any) => [
        reg.registrationId || 'N/A',
        reg.studentName,
        new Date(reg.createdAt).toLocaleString('en-IN'),
        `Class ${reg.currentClass}`,
        reg.examType === 'foundation' ? 'Foundation' : 'Comp28',
        reg.schoolName,
        reg.parentMobile,
        reg.email || '',
        new Date(reg.examDate).toLocaleDateString('en-IN'),
        reg.referralSource,
        reg.receiptNo || 'N/A',
        reg.status,
        reg.paymentStatus,
    ]);

      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

      const fileName = `btth-registrations-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Failed to export Excel:', error);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-linear-to-b from-white to-blue-50">
      <div className="shrink-0 px-6 pt-4 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-1 leading-tight" style={{ color: '#212529' }}>
            BTTH 2.0 Registrations
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600">
            Manage and view all student registrations
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex flex-col md:flex-row md:flex-wrap gap-2 mb-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, mobile, email, or school..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-10 h-9 text-sm"
                />
              </div>
            </div>

            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full md:w-[160px] h-9 text-sm">
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
              <SelectTrigger className="w-full md:w-[160px] h-9 text-sm">
                <SelectValue placeholder="Filter by Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                {availableExamDates.map((date) => (
                  <SelectItem key={date} value={date}>
                    {formatExamDateOption(date)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[160px] h-9 text-sm">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={exportToCSV} variant="outline" size="sm" className="w-full md:w-auto h-9">
              <Download className="mr-1.5 h-3.5 w-3.5" />
              CSV
            </Button>

            <Button onClick={exportToExcel} variant="outline" size="sm" className="w-full md:w-auto h-9">
              <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
              Excel
            </Button>

            <Button
              onClick={handleManualRefresh}
              variant="secondary"
              size="sm"
              className="w-full md:w-auto h-9"
              disabled={loading}
            >
              <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
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
          {selectedRowIds.length > 0 && (
            <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-md mb-3">
              <span className="text-sm text-blue-800 font-medium">
                {selectedRowIds.length} row{selectedRowIds.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allFilteredRowIds = table.getFilteredRowModel().rows.map(row => row.original._id);
                    setSelectedRowIds(allFilteredRowIds);
                  }}
                  className="h-7 text-xs"
                >
                  Select All ({table.getFilteredRowModel().rows.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRowIds([])}
                  className="h-7 text-xs"
                >
                  Clear Selection
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={!selectedRowIds.length || loading}
                  className="h-7 text-xs"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Delete
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
                <div className="rounded-md border overflow-hidden" style={{ minHeight: 'calc(100vh - 300px)', maxHeight: 'calc(100vh - 300px)', height: 'calc(100vh - 300px)' }}>
                  <Table containerClassName="h-full" className="min-w-max">
                    {/* Fixed Header */}
                    <TableHeader className="bg-white">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id} className="sticky top-0 z-30 bg-white shadow-sm">
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

                    {/* Scrollable Body */}
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
                          <TableCell colSpan={columns.length} className="h-24 text-center">
                            No registrations found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3">
                  <div className="text-xs text-zinc-600">
                    Showing {pagination.pageIndex * pagination.pageSize + 1} to{' '}
                    {Math.min(
                      (pagination.pageIndex + 1) * pagination.pageSize,
                      totalCount
                    )}{' '}
                    of {totalCount} entries
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Select
                      value={`${pagination.pageSize}`}
                      onValueChange={(value) => {
                        setPagination((prev) => ({ ...prev, pageSize: Number(value), pageIndex: 0 }));
                      }}
                    >
                      <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={pagination.pageSize} />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {[10, 20, 30, 40, 50].map((pageSize) => (
                          <SelectItem key={pageSize} value={`${pageSize}`}>
                            {pageSize}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination((prev) => ({ ...prev, pageIndex: 0 }))}
                        disabled={pagination.pageIndex === 0}
                        className="h-8 w-8 p-0"
                      >
                        {'<<'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex - 1 }))}
                        disabled={pagination.pageIndex === 0}
                        className="h-8 w-8 p-0"
                      >
                        {'<'}
                      </Button>
                      <div className="flex items-center justify-center text-sm font-medium min-w-[80px]">
                        Page {pagination.pageIndex + 1} of {Math.ceil(totalCount / pagination.pageSize)}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex + 1 }))}
                        disabled={pagination.pageIndex >= Math.ceil(totalCount / pagination.pageSize) - 1}
                        className="h-8 w-8 p-0"
                      >
                        {'>'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination((prev) => ({ ...prev, pageIndex: Math.ceil(totalCount / pagination.pageSize) - 1 }))}
                        disabled={pagination.pageIndex >= Math.ceil(totalCount / pagination.pageSize) - 1}
                        className="h-8 w-8 p-0"
                      >
                        {'>>'}
                      </Button>
                    </div>
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
              {previewRegistration.receiptNo && (
                <div>
                  <p className="text-sm text-zinc-500">Receipt No</p>
                  <p className="font-mono font-bold text-green-700">{previewRegistration.receiptNo}</p>
                </div>
              )}
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
                  <p className="text-zinc-500">Email</p>
                  <p className="font-semibold">{previewRegistration.email || 'N/A'}</p>
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Registration</DialogTitle>
            <DialogDescription>
              Update student details and reconcile payment fields if needed.
            </DialogDescription>
          </DialogHeader>

          {editRegistration ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs text-zinc-500">Student Name</p>
                <Input
                  value={editForm.studentName || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, studentName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-zinc-500">Class</p>
                <Input
                  value={editForm.currentClass || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, currentClass: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-zinc-500">School Name</p>
                <Input
                  value={editForm.schoolName || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, schoolName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-zinc-500">Parent Mobile</p>
                <Input
                  value={editForm.parentMobile || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, parentMobile: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-zinc-500">Email</p>
                <Input
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-zinc-500">Exam Date (ISO)</p>
                <Input
                  value={editForm.examDate || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, examDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs text-zinc-500">Status</p>
                <Select
                  value={(editForm.status as string) || ''}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">draft</SelectItem>
                    <SelectItem value="completed">completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-zinc-500">Payment Status</p>
                <Select
                  value={(editForm.paymentStatus as string) || ''}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, paymentStatus: value }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">pending</SelectItem>
                    <SelectItem value="paid">paid</SelectItem>
                    <SelectItem value="failed">failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-zinc-500">Razorpay Payment ID</p>
                <Input
                  value={(editForm.paymentId as string) || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, paymentId: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-zinc-500">Razorpay Order ID</p>
                <Input
                  value={(editForm.orderId as string) || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, orderId: e.target.value }))}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <p className="text-xs text-zinc-500">Razorpay Signature</p>
                <Input
                  value={(editForm.razorpaySignature as string) || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, razorpaySignature: e.target.value }))}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Select a registration to edit.</p>
          )}

          <DialogFooter>
            {errorMessage && (
              <p className="text-sm text-red-600 mr-auto">{errorMessage}</p>
            )}
            {editRegistration && editForm.paymentStatus !== 'paid' && (editForm.orderId || editRegistration.orderId) && (
              <Button
                variant="secondary"
                onClick={reconcilePayment}
                disabled={loading || reconciling}
              >
                {reconciling ? 'Reconciling...' : 'Reconcile Payment'}
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={saveRegistrationEdits} disabled={loading || !editRegistration}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
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
