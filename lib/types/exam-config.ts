export interface ExamDate {
  id: string;
  value: string;           // ISO date format: "2026-01-11"
  label: string;           // "Slot 1", "Slot 2"
  time: string;            // "12:00 PM"
  reportingTime?: string;  // "11:30 AM"
  enabled: boolean;
  maxCapacity?: number;
  // Auto-calculated fields (computed from value)
  displayDate?: string;    // "11 January 2026" - computed
  dayOfWeek?: string;      // "Sunday" - computed
}

export interface PricingConfig {
  foundation: number;      // Price for Classes 7-9
  regular: number;         // Price for Classes 10-12
}

export interface ExamConfiguration {
  _id?: any;  // MongoDB ObjectId or string
  examDates: ExamDate[];
  pricing: PricingConfig;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const DEFAULT_EXAM_CONFIG: Omit<ExamConfiguration, '_id' | 'createdAt' | 'updatedAt'> = {
  examDates: [
    {
      id: 'slot-1',
      value: '2026-01-11',
      label: 'Slot 1',
      time: '12:00 PM',
      reportingTime: '11:30 AM',
      enabled: true,
    },
    {
      id: 'slot-2',
      value: '2026-01-18',
      label: 'Slot 2',
      time: '12:00 PM',
      reportingTime: '11:30 AM',
      enabled: true,
    },
  ],
  pricing: {
    foundation: 200,
    regular: 500,
  },
  isActive: true,
};
