import clientPromise from './mongodb';
import { ModifyResult, ReturnDocument } from 'mongodb';

/**
 * Registration ID Format: BTNM-{ExamType}-{Status}-{Number}
 * 
 * ExamType:
 * - F: Foundation (Classes 7-9)
 * - C: Comp28 (Classes 10-11)
 * 
 * Status:
 * - D: Draft
 * - C: Completed
 * 
 * Number: 5-digit auto-incremented number (00001, 00002, etc.)
 * 
 * Examples:
 * - BTNM-F-D-00001 (Foundation, Draft, #1)
 * - BTNM-C-C-00019 (Comp28, Completed, #19)
 */

export type ExamType = 'foundation' | 'regular';
export type RegistrationStatus = 'draft' | 'completed';

/**
 * Get exam type identifier
 */
function getExamTypeCode(examType: ExamType): string {
  return examType === 'foundation' ? 'F' : 'C';
}

/**
 * Get status identifier
 */
function getStatusCode(status: RegistrationStatus): string {
  return status === 'draft' ? 'D' : 'C';
}

/**
 * Get the next sequence number from MongoDB counter collection
 */
async function getNextSequence(): Promise<number> {
  const client = await clientPromise;
  const db = client.db('btth_registration');
  const countersCollection = db.collection<{ _id: string; sequence: number }>('counters');

  const result: ModifyResult<{ _id: string; sequence: number }> = await countersCollection.findOneAndUpdate(
    { _id: 'registrationId' },
    {
      $setOnInsert: { sequence: 0 },
      $inc: { sequence: 1 },
    },
    { upsert: true, returnDocument: ReturnDocument.AFTER, includeResultMetadata: true }
  );

  return (result?.value?.sequence ?? 1);
}

/**
 * Generate a new registration ID
 */
export async function generateRegistrationId(
  examType: ExamType,
  status: RegistrationStatus
): Promise<string> {
  const sequence = await getNextSequence();
  const examTypeCode = getExamTypeCode(examType);
  const statusCode = getStatusCode(status);
  const paddedNumber = sequence.toString().padStart(5, '0');

  return `BTNM-${examTypeCode}-${statusCode}-${paddedNumber}`;
}

/**
 * Update registration ID status (when moving from draft to completed)
 */
export function updateRegistrationIdStatus(
  currentId: string,
  newStatus: RegistrationStatus
): string {
  const parts = currentId.split('-');
  if (parts.length !== 4 || parts[0] !== 'BTNM') {
    throw new Error('Invalid registration ID format');
  }

  const [prefix, examType, , number] = parts;
  const newStatusCode = getStatusCode(newStatus);

  return `${prefix}-${examType}-${newStatusCode}-${number}`;
}

/**
 * Parse registration ID to extract components
 */
export function parseRegistrationId(registrationId: string): {
  examType: ExamType;
  status: RegistrationStatus;
  sequence: number;
} {
  const parts = registrationId.split('-');
  if (parts.length !== 4 || parts[0] !== 'BTNM') {
    throw new Error('Invalid registration ID format');
  }

  const [, examTypeCode, statusCode, numberStr] = parts;

  const examType: ExamType = examTypeCode === 'F' ? 'foundation' : 'regular';
  const status: RegistrationStatus = statusCode === 'D' ? 'draft' : 'completed';
  const sequence = parseInt(numberStr, 10);

  return { examType, status, sequence };
}
