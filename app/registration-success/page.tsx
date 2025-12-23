'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Download, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axiosInstance from '@/lib/axios';
import { jsPDF } from 'jspdf';

function RegistrationSuccessContent() {
  const searchParams = useSearchParams();
  const registrationId = searchParams.get('id');
  const paymentIdParam = searchParams.get('paymentId');
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const paymentId =
    registration?.paymentId ||
    registration?.razorpayPaymentId ||
    registration?.razorpay_payment_id ||
    paymentIdParam ||
    null;

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
    if (!registration) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header with brand color
    doc.setFillColor(33, 37, 41); // #212529
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('BTTH 2.0', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Registration Receipt', pageWidth / 2, 30, { align: 'center' });

    // Reset text color
    doc.setTextColor(0, 0, 0);
    yPos = 55;

    // Registration ID and Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Registration ID: ${registration._id}`, 20, yPos);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - 20, yPos, { align: 'right' });
    yPos += 15;

    // Student Details Section
    doc.setFillColor(79, 70, 229); // #4F46E5
    doc.rect(20, yPos, pageWidth - 40, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('STUDENT DETAILS', 25, yPos + 5.5);
    yPos += 13;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const studentDetails = [
      ['Student Name:', registration.studentName],
      ['Current Class:', `Class ${registration.currentClass}`],
      ['School Name:', registration.schoolName],
      ['Parent Mobile:', registration.parentMobile],
    ];

    studentDetails.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 70, yPos);
      yPos += 7;
    });

    yPos += 5;

    // Exam Details Section
    doc.setFillColor(79, 70, 229);
    doc.rect(20, yPos, pageWidth - 40, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('EXAM DETAILS', 25, yPos + 5.5);
    yPos += 13;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const examDetails = [
      ['Exam Date:', new Date(registration.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })],
      ['Venue:', 'Bakliwal Tutorials Navi Mumbai Centre'],
      ['Reporting Time:', '30 minutes before exam time'],
    ];

    examDetails.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 70, yPos);
      yPos += 7;
    });

    yPos += 5;

    // Payment Details Section
    doc.setFillColor(79, 70, 229);
    doc.rect(20, yPos, pageWidth - 40, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('PAYMENT DETAILS', 25, yPos + 5.5);
    yPos += 13;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const paymentId =
      registration.paymentId || registration.razorpayPaymentId || registration.razorpay_payment_id;
    const paymentDetails = [
      ['Registration Fee:', 'INR 500'],
      ['Payment Status:', registration.paymentStatus?.toUpperCase() || 'PAID'],
      ['Payment ID:', paymentId || 'N/A'],
      // ['Order ID:', registration.orderId || registration.razorpay_order_id || 'N/A'],
    ];

    paymentDetails.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 70, yPos);
      yPos += 7;
    });

    yPos += 10;

    // Important Instructions
    doc.setFillColor(254, 243, 199); // Light yellow
    doc.rect(20, yPos, pageWidth - 40, 45, 'F');
    doc.setFillColor(79, 70, 229);
    doc.rect(20, yPos, pageWidth - 40, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('IMPORTANT INSTRUCTIONS', 25, yPos + 5.5);
    yPos += 13;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const instructions = [
      '• Please arrive 30 minutes before the exam time',
      '• Bring a valid ID proof and this receipt (printed or digital)',
      '• Carry your own stationery (pen, pencil, eraser, ruler)',
      '• Mobile phones and electronic devices are not allowed in the exam hall',
      '• Follow all instructions given by the exam invigilators',
    ];

    instructions.forEach((instruction) => {
      doc.text(instruction, 25, yPos);
      yPos += 6;
    });

    // Footer
    yPos = doc.internal.pageSize.getHeight() - 30;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Bakliwal Tutorials Navi Mumbai', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.text('For queries: info@bakliwaltutorials.com', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for registering for BTTH 2.0!', pageWidth / 2, yPos, { align: 'center' });

    // Save the PDF
    doc.save(`BTTH-Receipt-${registration._id}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 py-6 sm:py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 md:p-12 text-center">
          <div className="mb-4 sm:mb-6">
            <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mx-auto" />
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 leading-tight" style={{ color: '#212529' }}>
            Registration Successful!
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 mb-6 sm:mb-8">
            Thank you for registering for BTTH 2.0. Your payment has been confirmed.
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
                  <span className="text-zinc-600">Exam Date:</span>
                  <span className="font-semibold">
                    {new Date(registration.examDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Contact:</span>
                  <span className="font-semibold">{registration.parentMobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Payment ID:</span>
                  <span className="font-semibold">
                    {paymentId || 'Processing...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">
            <div className="bg-yellow-50 rounded-lg p-3 sm:p-4">
              <p className="text-sm text-zinc-700">
                <strong>Important:</strong> You will receive a confirmation SMS and email with exam details shortly. Please arrive 30 minutes before the exam time.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto min-h-[48px]"
                onClick={downloadReceipt}
                disabled={!registration}
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
