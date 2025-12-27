'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Download, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axiosInstance from '@/lib/axios';
import { downloadRegistrationReceipt } from '@/lib/registration-receipt';

function RegistrationSuccessContent() {
  const searchParams = useSearchParams();
  const registrationId = searchParams.get('id');
  const paymentIdParam = searchParams.get('paymentId');
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (registrationId) {
      fetchRegistration();
    }
  }, [registrationId]);

  const fetchRegistration = async () => {
    try {
      const response = await axiosInstance.get(`/registrations/${registrationId}`);
      setRegistration(response.data);
    } catch (error) {
      console.error('Failed to fetch registration:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = () => {
    if (!registration || registration.paymentStatus !== 'paid') return;
    downloadRegistrationReceipt(registration);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-blue-50 py-6 sm:py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 md:p-12 text-center">
          <div className="mb-4 sm:mb-6">
            <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mx-auto" />
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 leading-tight" style={{ color: '#212529' }}>
            Registration Successful!
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 mb-6 sm:mb-8">
            {registration?.paymentStatus === 'paid'
              ? 'Thank you for your payment! Your registration for BTTH 2.0 is confirmed and we look forward to seeing you at the exam.'
              : 'Your application details have been saved. Please complete the payment to confirm your BTTH 2.0 registration.'}
          </p>

          {registration && (
            <div className="bg-blue-50 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 text-left">
              <h2 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4" style={{ color: '#212529' }}>
                Registration Details
              </h2>
              <div className="space-y-2 text-sm sm:text-base">
                <div className="flex justify-between">
                  <span className="text-zinc-600">Registration ID:</span>
                  <span className="font-semibold">{registration._id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Student Name:</span>
                  <span className="font-semibold">{registration.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Class:</span>
                  <span className="font-semibold">Class {registration.currentClass}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Exam Date & Time:</span>
                  <span className="font-semibold">
                    {new Date(registration.examDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}{' '}
                    · 12:00 PM
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Contact:</span>
                  <span className="font-semibold">{registration.parentMobile}</span>
                </div>
              </div>
              <div className={`mt-4 border-t pt-4 space-y-2 text-sm sm:text-base ${registration?.paymentStatus === 'paid' ? 'border-blue-100' : 'border-red-100'}`}>
                <p className="font-semibold text-[#212529]">Payment Details</p>
                {registration?.paymentStatus === 'paid' ? (
                  <>
                    <div className="flex justify-between text-[#212529]">
                      <span>Registration Fee{registration.examType === 'foundation' ? ' (Foundation)' : ''}</span>
                      <span>₹{registration.registrationAmount || 500}</span>
                    </div>
                    {paymentIdParam && (
                      <div className="flex justify-between text-[#212529]">
                        <span>Payment ID</span>
                        <span className="font-mono text-xs">{paymentIdParam}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-green-600">
                      <span>Status</span>
                      <span>Paid</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-[#212529]">
                      <span>Standard Fee{registration.examType === 'foundation' ? ' (Foundation)' : ''}</span>
                      <span>₹{registration.registrationAmount || 500}</span>
                    </div>
                      <div className="flex justify-between font-semibold text-red-600">
                        <span>Status</span>
                        <span>Payment Pending</span>
                      </div>
                    <p className="text-xs text-red-600">
                      Please complete the payment to confirm your registration. If the payment window was closed, return to the registration form and try again.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">
            {registration?.paymentStatus === 'paid' ? (
              <div className="bg-yellow-50 rounded-lg p-3 sm:p-4">
                <p className="text-sm text-zinc-700">
                  <strong>Important:</strong> You will receive a confirmation SMS and email with exam details shortly. Please arrive 30 minutes before the exam time.
                </p>
              </div>
            ) : (
              <div className="bg-red-50 rounded-lg p-3 sm:p-4">
                <p className="text-sm text-red-700">
                  <strong>Payment Pending:</strong> Your seat is not confirmed yet. Please complete the payment or contact support at info@bakliwaltutorials.com if the amount has been debited but the status has not updated.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto min-h-[48px]"
                onClick={downloadReceipt}
                disabled={!registration || registration.paymentStatus !== 'paid'}
                title={registration?.paymentStatus === 'paid' ? 'Download receipt' : 'Available after payment confirmation'}
              >
                <Download className="mr-2 h-5 w-5" />
                Download Receipt
              </Button>
              <Link href="/" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto min-h-[48px]" style={{ backgroundColor: '#4F46E5' }}>
                  <Home className="mr-2 h-5 w-5" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegistrationSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <RegistrationSuccessContent />
    </Suspense>
  );
}
