"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_EXAM_CONFIG = void 0;
exports.DEFAULT_EXAM_CONFIG = {
    examDates: [
        {
            id: 'slot-1',
            value: '2026-01-11',
            label: 'Slot 1',
            displayDate: '11 January 2026',
            dayOfWeek: 'Sunday',
            time: '12:00 PM',
            reportingTime: '11:30 AM',
            enabled: true,
        },
        {
            id: 'slot-2',
            value: '2026-01-18',
            label: 'Slot 2',
            displayDate: '18 January 2026',
            dayOfWeek: 'Sunday',
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
