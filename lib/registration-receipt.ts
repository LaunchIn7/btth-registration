import { jsPDF } from 'jspdf';

export type RegistrationReceiptData = {
  _id: string;
  registrationId?: string;
  receiptNo?: string;
  studentName: string;
  currentClass: string;
  schoolName: string;
  parentMobile: string;
  email?: string;
  examDate: string;
  createdAt?: string;
  paymentStatus?: string;
  paymentId?: string;
  razorpayPaymentId?: string;
  razorpay_payment_id?: string;
  orderId?: string;
  razorpay_order_id?: string;
  examType?: string;
  registrationAmount?: number;
};

const formatExamDate = (value: string) => {
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });
  } catch (_error) {
    return value;
  }
};

export const downloadRegistrationReceipt = (
  registration: RegistrationReceiptData,
  filename?: string
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  doc.setFillColor(51, 59, 98);
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Add header text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Bakliwal Tutorials Pvt Ltd', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('BTTH 2.0 Registration Receipt', pageWidth / 2, 35, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  yPos = 65;

  doc.setFontSize(10);
  doc.text(`Reg Id: ${registration.registrationId || registration._id}`, 20, yPos);
  doc.text(
    `Date: ${registration.createdAt ? new Date(registration.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    }) : new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    })}`,
    pageWidth - 20,
    yPos,
    { align: 'right' }
  );
  yPos += 10;

  if (registration.receiptNo) {
    doc.text(`Receipt No: ${registration.receiptNo}`, 20, yPos);
    yPos += 10;
  } else {
    yPos += 5;
  }

  doc.setFillColor(51, 59, 98);
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
    ['Email:', registration.email || 'N/A'],
  ];

  studentDetails.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 70, yPos);
    yPos += 7;
  });

  yPos += 5;

  doc.setFillColor(51, 59, 98);
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
    ['Exam Date:', formatExamDate(registration.examDate)],
    ['Exam Time:', '12:00 PM'],
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

  doc.setFillColor(51, 59, 98);
  doc.rect(20, yPos, pageWidth - 40, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PAYMENT DETAILS', 25, yPos + 5.5);
  yPos += 13;

  const paymentBoxTop = yPos;
  const isPaid = registration.paymentStatus === 'paid';
  const paymentId = registration.razorpay_payment_id || registration.razorpayPaymentId || registration.paymentId;

  // Use saved registration amount and exam type from database
  const feeAmount = registration.registrationAmount || 500;
  const isFoundation = registration.examType === 'foundation';
  const feeLabel = isFoundation ? 'Registration Fee (Foundation)' : 'Registration Fee';
  const standardFeeLabel = isFoundation ? 'Standard Fee (Foundation)' : 'Standard Fee';

  const paymentDetails = isPaid
    ? [
      { label: feeLabel, value: `INR ${feeAmount}` },
      ...(paymentId ? [{ label: 'Payment ID', value: paymentId }] : []),
    ]
    : [
      { label: standardFeeLabel, value: `INR ${feeAmount}` },
      { label: 'Limited-time Discount', value: `- INR ${feeAmount}`, valueColor: [16, 122, 72] as [number, number, number] },
    ];

  const paymentBoxHeight = paymentDetails.length * 9 + 30;

  doc.setDrawColor(211, 215, 234);
  doc.setFillColor(245, 246, 251);
  doc.roundedRect(20, paymentBoxTop, pageWidth - 40, paymentBoxHeight, 4, 4, 'FD');

  yPos += 12;
  doc.setFontSize(10);

  paymentDetails.forEach(({ label, value, valueColor }) => {
    doc.setTextColor(51, 59, 98);
    doc.setFont('helvetica', 'bold');
    doc.text(label, 28, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(valueColor ? valueColor[0] : 29, valueColor ? valueColor[1] : 36, valueColor ? valueColor[2] : 65);
    doc.text(value, pageWidth - 32, yPos, { align: 'right' });
    yPos += 9;
    doc.setTextColor(51, 59, 98);
  });

  const separatorY = yPos + 2;
  doc.setDrawColor(226, 232, 240);
  doc.line(28, separatorY, pageWidth - 28, separatorY);
  yPos = separatorY + 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(51, 59, 98);
  if (isPaid) {
    doc.text('Payment Status', 28, yPos);
    doc.setTextColor(16, 122, 72);
    doc.text('PAID', pageWidth - 32, yPos, { align: 'right' });
  } else {
    doc.text('Amount Payable', 28, yPos);
    doc.setFontSize(12);
    doc.setTextColor(51, 59, 98);
    doc.text('INR 0', pageWidth - 32, yPos, { align: 'right' });
  }

  yPos = paymentBoxTop + paymentBoxHeight + 10;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  doc.setFillColor(254, 243, 199);
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

  doc.save(filename ?? `BTTH-Receipt-${registration._id}.pdf`);
};
