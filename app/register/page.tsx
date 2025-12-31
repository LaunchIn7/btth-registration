'use client';

import { Suspense, useEffect, useState, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import axiosInstance from '@/lib/axios';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExamConfig, getRegistrationFee, getExamType } from '@/lib/hooks/use-exam-config';

const createRegistrationSchema = (examDateValues: string[]) => z.object({
  studentName: z.string().min(2, 'Name must be at least 2 characters'),
  currentClass: z.enum(['7', '8', '9', '10', '11', '12'], {
    message: 'Please select a class',
  }),
  schoolName: z.string().min(2, 'School name is required'),
  parentMobile: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'),
  examDate: examDateValues.length > 0 ? z.enum(examDateValues as [string, ...string[]], {
    message: 'Please select an exam date',
  }) : z.string().min(1, 'Please select an exam date'),
  referralSource: z.string().min(1, 'Please select how you heard about us'),
  referralOther: z.string().optional(),
});

type RegistrationFormData = {
  studentName: string;
  currentClass: '7' | '8' | '9' | '10' | '11' | '12';
  schoolName: string;
  parentMobile: string;
  examDate: string;
  referralSource: string;
  referralOther?: string;
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const { config, loading: configLoading } = useExamConfig();

  // Memoize examDateValues to prevent infinite loop
  const examDateValues = useMemo(() =>
    config?.examDates.map(d => d.value) || [],
    [config?.examDates]
  );

  const registrationSchema = useMemo(() =>
    createRegistrationSchema(examDateValues),
    [examDateValues]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  const referralSource = watch('referralSource');
  const selectedExamDate = watch('examDate');
  const currentClass = watch('currentClass');
  const schoolNameValue = watch('schoolName');

  // Calculate registration fee based on class
  const registrationFee = currentClass && config ? getRegistrationFee(currentClass, config.pricing) : 500;
  const feeInPaise = registrationFee * 100;
  const examType = currentClass ? getExamType(currentClass) : 'regular';

  const [schoolSuggestions, setSchoolSuggestions] = useState<string[]>([]);
  const [isSchoolLookupLoading, setIsSchoolLookupLoading] = useState(false);
  const [isSchoolInputFocused, setIsSchoolInputFocused] = useState(false);
  const suggestionContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionContainerRef.current &&
        !suggestionContainerRef.current.contains(event.target as Node)
      ) {
        setIsSchoolInputFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!schoolNameValue || schoolNameValue.trim().length < 2) {
      setSchoolSuggestions([]);
      setIsSchoolLookupLoading(false);
      return;
    }

    setIsSchoolLookupLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/schools/search?q=${encodeURIComponent(schoolNameValue.trim())}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          throw new Error('Failed to fetch schools');
        }
        const data = await response.json();
        setSchoolSuggestions(Array.isArray(data.results) ? data.results : []);
      } catch (error) {
        if ((error as DOMException)?.name !== 'AbortError') {
          console.error('School lookup failed:', error);
          setSchoolSuggestions([]);
        }
      } finally {
        setIsSchoolLookupLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [schoolNameValue]);

  useEffect(() => {
    const examDateParam = searchParams.get('examDate');
    if (examDateParam && examDateValues.length > 0 && examDateValues.includes(examDateParam)) {
      setValue('examDate', examDateParam as any);
    }
  }, [searchParams, examDateValues, setValue]);

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true);
    try {
      const draftResponse = await axiosInstance.post('/registrations/draft', {
        ...data,
        examType,
        registrationAmount: registrationFee,
      });
      const registrationId = draftResponse.data.registrationId;

      const orderResponse = await axiosInstance.post('/payment/create-order', {
        registrationId,
        amount: feeInPaise,
      });

      const { orderId, amount, currency } = orderResponse.data;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: 'Bakliwal Tutorials',
        description: 'BTTH 2.0 Registration Fee',
        order_id: orderId,
        handler: async function (response: any) {
          try {
            await axiosInstance.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              registrationId,
            });
            const successParams = new URLSearchParams({
              id: registrationId,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
            });
            router.push(`/registration-success?${successParams.toString()}`);
          } catch (error) {
            console.error('Payment verification failed:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: data.studentName,
          contact: data.parentMobile,
        },
        theme: {
          color: '#4F46E5',
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
            alert('Payment was cancelled. Please try again or contact support if you need assistance.');
          },
          onhidden: function () {
            setIsSubmitting(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        setIsSubmitting(false);
        console.error('Payment failed:', response.error);
        alert(`Payment failed: ${response.error.description || 'Unknown error'}. Please try again or contact support.`);
      });
      razorpay.open();
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-[#f5f6fb] via-[#eceffc] to-[#e0e5f7] text-[#1d243c]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#333b62]" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-[#f5f6fb] via-[#eceffc] to-[#e0e5f7] text-[#1d243c]">
        <div className="text-center">
          <p className="text-lg text-red-600">Unable to load exam configuration. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-[#f5f6fb] via-[#eceffc] to-[#e0e5f7] py-6 sm:py-8 md:py-12 text-[#1d243c]">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link href="/" className="inline-flex items-center text-[#333b62] hover:text-[#272d4e] mb-4 sm:mb-6 min-h-[44px] -ml-2 pl-2 font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl shadow-[#333b62]/10 border border-[#e2e6f5] p-6 sm:p-8 md:p-12">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 leading-tight" style={{ color: '#333b62' }}>
              Register for BTTH 2.0
            </h1>
            <p className="text-sm sm:text-base text-[#4b5575]">
              Fill in your details to register for the scholarship exam
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="studentName" className="text-sm sm:text-base text-[#1d243c]">Student Name *</Label>
              <Input
                id="studentName"
                {...register('studentName')}
                placeholder="Enter student's full name"
                className={`h-11 sm:h-10 text-base ${errors.studentName ? 'border-red-500' : ''}`}
              />
              {errors.studentName && (
                <p className="text-sm text-red-500">{errors.studentName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentClass" className="text-sm sm:text-base text-[#1d243c]">Current Class *</Label>
              <Select onValueChange={(value) => setValue('currentClass', value as any)}>
                <SelectTrigger className={cn("w-full border-[#d9def2] focus:ring-1 focus:ring-[#333b62]", errors.currentClass ? 'border-red-500' : '')}>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Class 7 (Foundation)</SelectItem>
                  <SelectItem value="8">Class 8 (Foundation)</SelectItem>
                  <SelectItem value="9">Class 9 (Foundation)</SelectItem>
                  <SelectItem value="10">Class 10</SelectItem>
                  <SelectItem value="11">Class 11</SelectItem>
                </SelectContent>
              </Select>
              {errors.currentClass && (
                <p className="text-sm text-red-500">{errors.currentClass.message}</p>
              )}
            </div>

            <div className="space-y-2 relative" ref={suggestionContainerRef}>
              <Label htmlFor="schoolName" className="text-sm sm:text-base text-[#1d243c]">School Name *</Label>
              <Input
                id="schoolName"
                {...register('schoolName')}
                placeholder="Enter school name"
                autoComplete="off"
                className={`h-11 sm:h-10 text-base ${errors.schoolName ? 'border-red-500' : ''}`}
                onFocus={() => setIsSchoolInputFocused(true)}
                onBlur={() => setTimeout(() => setIsSchoolInputFocused(false), 150)}
              />
              {errors.schoolName && (
                <p className="text-sm text-red-500">{errors.schoolName.message}</p>
              )}
              {isSchoolInputFocused && (isSchoolLookupLoading || schoolSuggestions.length > 0) && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-[#e2e6f5] rounded-xl shadow-lg shadow-[#333b62]/10 z-30 overflow-hidden">
                  {isSchoolLookupLoading && (
                    <div className="flex items-center gap-2 px-4 py-3 text-sm text-[#4b5575]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching schools...
                    </div>
                  )}
                  {!isSchoolLookupLoading && schoolSuggestions.map((name) => (
                    <button
                      type="button"
                      key={name}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#f5f6fb] focus-visible:outline-none focus-visible:bg-[#eef1ff]"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        setValue('schoolName', name, { shouldValidate: true, shouldDirty: true });
                        setIsSchoolInputFocused(false);
                        setSchoolSuggestions([]);
                      }}
                    >
                      {name}
                    </button>
                  ))}
                  {!isSchoolLookupLoading && schoolSuggestions.length === 0 && (
                    <div className="px-4 py-3 text-sm text-[#6c7394]">
                      Keep typing to search for your school name.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentMobile" className="text-sm sm:text-base text-[#1d243c]">Parent's Mobile Number *</Label>
              <Input
                id="parentMobile"
                {...register('parentMobile')}
                placeholder="Enter 10-digit mobile number"
                maxLength={10}
                className={`h-11 sm:h-10 text-base ${errors.parentMobile ? 'border-red-500' : ''}`}
              />
              {errors.parentMobile && (
                <p className="text-sm text-red-500">{errors.parentMobile.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm sm:text-base text-[#1d243c]">Preferred Exam Date *</Label>
              <RadioGroup
                value={selectedExamDate}
                onValueChange={(value) => setValue('examDate', value as any)}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {config.examDates.map((examDate, index) => (
                  <div key={examDate.id} className="relative">
                    <RadioGroupItem value={examDate.value} id={`date${index + 1}`} className="peer sr-only" />
                    <Label
                      htmlFor={`date${index + 1}`}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-lg border-2 border-[#e1e4f3] bg-white p-4 hover:bg-[#f5f6fb] peer-data-[state=checked]:border-[#333b62] peer-data-[state=checked]:bg-[#f0f2fb] cursor-pointer transition-all min-h-[80px]",
                        errors.examDate && "border-red-300"
                      )}
                    >
                      <span className="text-base sm:text-lg font-semibold text-[#1d243c]">{examDate.displayDate}</span>
                      <span className="text-xs sm:text-sm text-[#6c7394] mt-1">{examDate.dayOfWeek}</span>
                      <span className="text-xs sm:text-sm text-[#107a48] font-medium mt-1">Exam at {examDate.time}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {errors.examDate && (
                <p className="text-sm text-red-500">{errors.examDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="referralSource" className="text-sm sm:text-base text-[#1d243c]">How did you hear about BTTH? *</Label>
              <Select
                onValueChange={(value) => {
                  setValue('referralSource', value);
                  setShowOtherInput(value === 'Other');
                }}
              >
                <SelectTrigger className={cn("w-full border-[#d9def2] focus:ring-1 focus:ring-[#333b62]", errors.referralSource ? 'border-red-500' : '')}>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Digital Ad (Instagram, Whatsapp, FB)">
                    Digital Ad (Instagram, Whatsapp, FB)
                  </SelectItem>
                  <SelectItem value="School Recommendation">School Recommendation</SelectItem>
                  <SelectItem value="Print Ad (Leaflet)">Print Ad (Leaflet)</SelectItem>
                  <SelectItem value="From parent of existing BT student">
                    From parent of existing BT student
                  </SelectItem>
                  <SelectItem value="Walk in Enquiry">Walk in Enquiry</SelectItem>
                  <SelectItem value="Other">Other (Please Specify)</SelectItem>
                </SelectContent>
              </Select>
              {errors.referralSource && (
                <p className="text-sm text-red-500">{errors.referralSource.message}</p>
              )}
            </div>

            {showOtherInput && (
              <div className="space-y-2">
                <Label htmlFor="referralOther" className="text-sm sm:text-base text-[#1d243c]">Please specify</Label>
                <Input
                  id="referralOther"
                  className="h-11 sm:h-10 text-base border-[#d9def2] focus-visible:ring-[#333b62]"
                  {...register('referralOther')}
                  placeholder="Please specify how you heard about us"
                />
              </div>
            )}

            <div className="bg-blue-50 p-4 sm:p-6 rounded-lg">
              {currentClass ? (
                <>
                  <h3 className="text-base sm:text-lg font-semibold mb-2" style={{ color: '#212529' }}>
                    Registration Fee: ₹{registrationFee}
                  </h3>
                  {['7', '8', '9'].includes(currentClass) && (
                    <p className="text-xs sm:text-sm text-[#4b5575] mt-1">
                      Foundation Course Exam Fee
                    </p>
                  )}
                  {['10', '11', '12'].includes(currentClass) && (
                    <p className="text-xs sm:text-sm text-[#4b5575] mt-1">
                      Regular Course Exam Fee
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <h3 className="text-base sm:text-lg font-semibold mb-2" style={{ color: '#212529' }}>
                    Registration Fee
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4b5575]">
                    Please select your current class to see the registration fee
                  </p>
                  <div className="mt-3 text-xs text-[#6b7280]">
                    <p>• Classes 7-9: ₹{config?.pricing.foundation || 200}</p>
                    <p>• Classes 10-12: ₹{config?.pricing.regular || 500}</p>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full text-base sm:text-lg min-h-[48px] sm:min-h-[52px]"
              style={{ backgroundColor: '#4F46E5' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                  'Proceed to Payment'
              )}
            </Button>

            <p className="text-xs sm:text-sm text-center text-zinc-500">
              By registering, you agree to our terms and conditions. Your data will be securely stored.
            </p>
          </form>
        </div>
      </div>

    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-[#f5f6fb] via-[#eceffc] to-[#e0e5f7] text-[#1d243c]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#333b62]" />
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
