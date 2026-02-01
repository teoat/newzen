import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'elevated', 'outlined'],
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: (
      <div className="p-4">
        <p className="text-slate-600">Default card content</p>
      </div>
    ),
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: (
      <div className="p-4">
        <p className="text-slate-600">Elevated card with shadow</p>
      </div>
    ),
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: (
      <div className="p-4">
        <p className="text-slate-600">Outlined card with border</p>
      </div>
    ),
  },
};

export const WithHeader: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600">
          This is the main content of the card. You can add any content here.
        </p>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-slate-500">Footer content</p>
      </CardFooter>
    </Card>
  ),
};

export const UserCard: Story = {
  render: () => (
    <Card className="w-80">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
            JD
          </div>
          <div>
            <p className="font-semibold text-slate-900">John Doe</p>
            <p className="text-sm text-slate-500">Software Engineer</p>
          </div>
        </div>
        <p className="mt-4 text-slate-600 text-sm">
          Passionate about building great products and writing clean code.
        </p>
      </CardContent>
    </Card>
  ),
};

export const StatsCard: Story = {
  render: () => (
    <Card className="w-64">
      <CardContent className="pt-6">
        <p className="text-sm text-slate-500 uppercase tracking-wide">Total Revenue</p>
        <p className="text-3xl font-bold text-slate-900 mt-1">$48,294</p>
        <p className="text-sm text-emerald-600 mt-2">+12.5% from last month</p>
      </CardContent>
    </Card>
  ),
};
