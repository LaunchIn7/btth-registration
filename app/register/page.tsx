'use client';

import { Suspense, useEffect, useState } from 'react';
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

const registrationSchema = z.object({
  studentName: z.string().min(2, 'Name must be at least 2 characters'),
  currentClass: z.enum(['8', '9', '10', '11', '12'], {
    message: 'Please select a class',
  }),
  schoolName: z.string().min(2, 'School name is required'),
  parentMobile: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'),
  examDate: z.enum(['2026-01-11', '2026-01-18'], {
    message: 'Please select an exam date',
  }),
  referralSource: z.string().min(1, 'Please select how you heard about us'),
  referralOther: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

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

  useEffect(() => {
    const examDateParam = searchParams.get('examDate');
    if (examDateParam && ['2026-01-11', '2026-01-18'].includes(examDateParam)) {
      setValue('examDate', examDateParam as '2026-01-11' | '2026-01-18');
    }
  }, [searchParams, setValue]);

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true);
    try {
      const draftResponse = await axiosInstance.post('/registrations/draft', data);
      const registrationId = draftResponse.data.registrationId;

      // Payment temporarily disabled — keeping the Razorpay flow for quick reactivation later.
      /*
      const orderResponse = await axiosInstance.post('/payment/create-order', {
        registrationId,
        amount: 50000,
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
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      */

      router.push(`/registration-success?id=${registrationId}`);
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f6fb] via-[#eceffc] to-[#e0e5f7] py-6 sm:py-8 md:py-12 text-[#1d243c]">
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
                  <SelectItem value="8">Class 8</SelectItem>
                  <SelectItem value="9">Class 9</SelectItem>
                  <SelectItem value="10">Class 10</SelectItem>
                </SelectContent>
              </Select>
              {errors.currentClass && (
                <p className="text-sm text-red-500">{errors.currentClass.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolName" className="text-sm sm:text-base text-[#1d243c]">School Name *</Label>
              <Input
                id="schoolName"
                {...register('schoolName')}
                placeholder="Enter school name"
                className={`h-11 sm:h-10 text-base ${errors.schoolName ? 'border-red-500' : ''}`}
              />
              {errors.schoolName && (
                <p className="text-sm text-red-500">{errors.schoolName.message}</p>
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
                <div className="relative">
                  <RadioGroupItem value="2026-01-11" id="date1" className="peer sr-only" />
                  <Label
                    htmlFor="date1"
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg border-2 border-[#e1e4f3] bg-white p-4 hover:bg-[#f5f6fb] peer-data-[state=checked]:border-[#333b62] peer-data-[state=checked]:bg-[#f0f2fb] cursor-pointer transition-all min-h-[80px]",
                      errors.examDate && "border-red-300"
                    )}
                  >
                    <span className="text-base sm:text-lg font-semibold text-[#1d243c]">11th January 2026</span>
                    <span className="text-xs sm:text-sm text-[#6c7394] mt-1">Saturday</span>
                    <span className="text-xs sm:text-sm text-[#107a48] font-medium mt-1">Exam at 12:00 PM</span>
                  </Label>
                </div>
                <div className="relative">
                  <RadioGroupItem value="2026-01-18" id="date2" className="peer sr-only" />
                  <Label
                    htmlFor="date2"
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg border-2 border-[#e1e4f3] bg-white p-4 hover:bg-[#f5f6fb] peer-data-[state=checked]:border-[#333b62] peer-data-[state=checked]:bg-[#f0f2fb] cursor-pointer transition-all min-h-[80px]",
                      errors.examDate && "border-red-300"
                    )}
                  >
                    <span className="text-base sm:text-lg font-semibold text-[#1d243c]">18th January 2026</span>
                    <span className="text-xs sm:text-sm text-[#6c7394] mt-1">Saturday</span>
                    <span className="text-xs sm:text-sm text-[#107a48] font-medium mt-1">Exam at 12:00 PM</span>
                  </Label>
                </div>
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

            <div className="bg-[#fef9ec] border border-[#fbe0a7] p-4 sm:p-6 rounded-lg space-y-3">
              <h3 className="text-base sm:text-lg font-semibold" style={{ color: '#1d243c' }}>
                Registration Fee Details
              </h3>
              <div className="space-y-1 text-sm sm:text-base">
                <div className="flex justify-between text-[#1d243c]">
                  <span>Standard Fee</span>
                  <span>₹500</span>
                </div>
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Limited-time Discount</span>
                  <span>-₹500</span>
                </div>
                <div className="flex justify-between font-semibold text-[#1d243c]">
                  <span>Amount Payable</span>
                  <span>₹0</span>
                </div>
              </div>
              <p className="text-sm text-[#4b5575]">
                Offer covers exam materials, evaluation, and a detailed performance report.
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full text-base sm:text-lg min-h-[48px] sm:min-h-[52px]"
              style={{ backgroundColor: '#333b62' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                  'Complete Registration'
              )}
            </Button>

            <p className="text-xs sm:text-sm text-center text-[#6c7394]">
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
