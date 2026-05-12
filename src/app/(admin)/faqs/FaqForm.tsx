'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PublishStatus } from '@/types/cms';
import { usePortfolios } from '@/hooks/use-portfolios';
import { usePortfolio } from '@/providers/PortfolioProvider';
import { Save } from 'lucide-react';

interface FaqFormProps {
  initialData?: {
    question: string;
    answer: string;
    portfolio: string;
    status: string;
    order: number;
    group?: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void;
  isLoading: boolean;
  submitText: string;
}

export function FaqForm({
  initialData,
  onSubmit,
  isLoading,
  submitText,
}: FaqFormProps) {
  const { activePortfolio } = usePortfolio();
  const { data: portfolios = [] } = usePortfolios();

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    portfolio: '',
    status: PublishStatus.PUBLISHED,
    order: 0,
    group: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        question: initialData.question || '',
        answer: initialData.answer || '',
        portfolio: initialData.portfolio || '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: (initialData.status as any) || PublishStatus.PUBLISHED,
        order: initialData.order || 0,
        group: initialData.group || '',
      });
    } else if (activePortfolio) {
      setFormData((prev) => ({ ...prev, portfolio: activePortfolio }));
    }
  }, [initialData, activePortfolio]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'order' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-8 lg:grid-cols-3"
    >
      {/* Main Content */}
      <div className="space-y-6 lg:col-span-2">
        <div className="border-2 border-border bg-card p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="question">Question</Label>
              <Input
                id="question"
                name="question"
                value={formData.question}
                onChange={handleChange}
                placeholder="Enter the question"
                required
              />
            </div>

            <div>
              <Label htmlFor="answer">Answer</Label>
              <Textarea
                id="answer"
                name="answer"
                value={formData.answer}
                onChange={handleChange}
                placeholder="Enter the answer"
                rows={6}
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Settings */}
      <div className="space-y-6">
        <div className="border-2 border-border bg-card p-6">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider">
            Settings
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="portfolio">Portfolio</Label>
              <Select
                id="portfolio"
                name="portfolio"
                value={formData.portfolio}
                onChange={handleChange}
                required
              >
                <option value="">Select Portfolio</option>
                {portfolios.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                {Object.values(PublishStatus).map((stat) => (
                  <option key={stat} value={stat}>
                    {stat.toUpperCase()}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="group">Group / Category</Label>
              <Input
                id="group"
                name="group"
                value={formData.group}
                onChange={handleChange}
                placeholder="e.g., General, Pricing"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                Used to group FAQs on the website.
              </p>
            </div>

            <div>
              <Label htmlFor="order">Display Order</Label>
              <Input
                id="order"
                name="order"
                type="number"
                value={formData.order}
                onChange={handleChange}
                placeholder="0"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                Lower numbers appear first.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {submitText}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
