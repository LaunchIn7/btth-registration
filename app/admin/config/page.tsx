'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Loader2, Plus, Trash2, Save, Calendar as CalendarIcon, DollarSign } from 'lucide-react';
import { ExamDate, PricingConfig, ExamConfiguration } from '@/lib/types/exam-config';
import axiosInstance from '@/lib/axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ConfigPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [examDates, setExamDates] = useState<ExamDate[]>([]);
  const [pricing, setPricing] = useState<PricingConfig>({ foundation: 200, regular: 500 });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const parseDateValue = (value?: string | null) => {
    if (!value) return undefined;
    return new Date(`${value}T00:00:00`);
  };

  const formatDisplayDate = (value?: string | null) => {
    const parsed = parseDateValue(value || undefined);
    return parsed ? format(parsed, 'dd MMM yyyy') : '';
  };

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/admin');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (isSignedIn) {
      fetchConfig();
    }
  }, [isSignedIn]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/admin/config');
      if (response.data.success && response.data.data) {
        const config: ExamConfiguration = response.data.data;
        setExamDates(config.examDates);
        setPricing(config.pricing);
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
      setMessage({ type: 'error', text: 'Failed to load configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await axiosInstance.put('/admin/config', {
        examDates,
        pricing,
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Configuration saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      setMessage({ type: 'error', text: 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const addExamDate = () => {
    setExamDates([...examDates, {
      id: `slot-${Date.now()}`,
      value: '',
      label: `Slot ${examDates.length + 1}`,
      time: '12:00 PM',
      reportingTime: '11:30 AM',
      enabled: true,
    }]);
  };

  const updateExamDate = (index: number, field: keyof ExamDate, value: any) => {
    const updated = [...examDates];
    updated[index] = { ...updated[index], [field]: value };
    setExamDates(updated);
  };

  const removeExamDate = (index: number) => {
    setExamDates(examDates.filter((_, i) => i !== index));
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-228px)] max-h-[calc(100vh-228px)] md:min-h-[calc(100vh-64px)] md:max-h-[calc(100vh-64px)] overflow-y-scroll bg-linear-to-b from-white to-blue-50 py-6 sm:py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <Link href="/admin" className="inline-flex items-center text-[#333b62] hover:text-[#272d4e] mb-4 sm:mb-6 min-h-[44px] -ml-2 pl-2 font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Registrations
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#212529' }}>
            Exam Configuration
          </h1>
          <p className="text-zinc-600">
            Manage exam dates, pricing, and registration settings
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
              }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                  Exam Dates
                </CardTitle>
                <CardDescription>
                  Configure available exam dates and slots for registration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {examDates.map((date, index) => (
                  <div key={date.id} className="border rounded-lg p-4 space-y-3 bg-white">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">Exam Date {index + 1}</h3>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeExamDate(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`label-${index}`}>Label</Label>
                        <Input
                          id={`label-${index}`}
                          value={date.label}
                          onChange={(e) => updateExamDate(index, 'label', e.target.value)}
                          className='mt-2'
                          placeholder="Slot 1"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`value-${index}`}>Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id={`value-${index}`}
                              variant="outline"
                              className="mt-2 w-full justify-start text-left font-normal"
                              disabled={saving}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 text-zinc-500" />
                              {date.value ? formatDisplayDate(date.value) : 'Pick a date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={parseDateValue(date.value)}
                              onSelect={(value) => {
                                if (!value) return;
                                const y = value.getFullYear();
                                const m = `${value.getMonth() + 1}`.padStart(2, '0');
                                const d = `${value.getDate()}`.padStart(2, '0');
                                updateExamDate(index, 'value', `${y}-${m}-${d}`);
                              }}
                              disabled={saving}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div>
                        <Label htmlFor={`time-${index}`}>Exam Time</Label>
                        <Input
                          id={`time-${index}`}
                          value={date.time}
                          onChange={(e) => updateExamDate(index, 'time', e.target.value)}
                          className='mt-2'
                          placeholder="12:00 PM"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`reportingTime-${index}`}>Reporting Time (Optional)</Label>
                        <Input
                          id={`reportingTime-${index}`}
                          value={date.reportingTime || ''}
                          onChange={(e) => updateExamDate(index, 'reportingTime', e.target.value)}
                          className='mt-2'
                          placeholder="11:30 AM"
                        />
                      </div>
                    </div>

                    {date.displayDate && date.dayOfWeek && (
                      <div className="text-sm text-zinc-600 bg-zinc-50 p-3 rounded-md">
                        <span className="font-medium">Preview:</span> {date.displayDate} ({date.dayOfWeek})
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`enabled-${index}`}
                        checked={date.enabled}
                        onChange={(e) => updateExamDate(index, 'enabled', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor={`enabled-${index}`} className="cursor-pointer">
                        Enable this exam date
                      </Label>
                    </div>
                  </div>
                ))}

                <Button onClick={addExamDate} variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exam Date
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    ₹
                  Pricing Configuration
                </CardTitle>
                <CardDescription>
                  Set registration fees for different class tiers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="foundation-price">Foundation Tier (Classes 7-9)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                      <Input
                        id="foundation-price"
                        type="number"
                        value={pricing.foundation}
                        onChange={(e) => setPricing({ ...pricing, foundation: Number(e.target.value) })}
                          className="pl-8 mt-2"
                        min="0"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Registration fee for students in classes 7, 8, and 9
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="regular-price">Regular Tier (Classes 10-12)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                      <Input
                        id="regular-price"
                        type="number"
                        value={pricing.regular}
                        onChange={(e) => setPricing({ ...pricing, regular: Number(e.target.value) })}
                          className="pl-8 mt-2"
                        min="0"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Registration fee for students in classes 10, 11, and 12
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/admin')}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Configuration
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
