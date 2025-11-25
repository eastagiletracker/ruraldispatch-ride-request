'use client';
import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

const Toaster = ({ ...props }) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as 'light' | 'dark' | 'system'}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white dark:group-[.toaster]:bg-slate-950 group-[.toaster]:text-slate-950 dark:group-[.toaster]:text-slate-50 group-[.toaster]:border-slate-200 dark:group-[.toaster]:border-slate-800 group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-slate-500 dark:group-[.toast]:text-slate-400',
          actionButton: 'group-[.toast]:bg-slate-900 dark:group-[.toast]:bg-slate-50 group-[.toast]:text-slate-50 dark:group-[.toast]:text-slate-900',
          cancelButton: 'group-[.toast]:bg-slate-100 dark:group-[.toast]:bg-slate-800 group-[.toast]:text-slate-500 dark:group-[.toast]:text-slate-400',
          closeButton: '!absolute !-right-4 !top-0 !left-auto group-[.toast]:bg-white dark:group-[.toast]:bg-slate-950 group-[.toast]:text-slate-950 dark:group-[.toast]:text-slate-50 group-[.toast]:border-slate-200 dark:group-[.toast]:border-slate-800',
          success: 'group-[.toaster]:bg-green-50 dark:group-[.toaster]:bg-green-950 group-[.toaster]:text-green-900 dark:group-[.toaster]:text-green-50 group-[.toaster]:border-green-200 dark:group-[.toaster]:border-green-800',
          error: 'group-[.toaster]:bg-red-50 dark:group-[.toaster]:bg-red-950 group-[.toaster]:text-red-900 dark:group-[.toaster]:text-red-50 group-[.toaster]:border-red-200 dark:group-[.toaster]:border-red-800',
          warning: 'group-[.toaster]:bg-yellow-50 dark:group-[.toaster]:bg-yellow-950 group-[.toaster]:text-yellow-900 dark:group-[.toaster]:text-yellow-50 group-[.toaster]:border-yellow-200 dark:group-[.toaster]:border-yellow-800',
          info: 'group-[.toaster]:bg-blue-50 dark:group-[.toaster]:bg-blue-950 group-[.toaster]:text-blue-900 dark:group-[.toaster]:text-blue-50 group-[.toaster]:border-blue-200 dark:group-[.toaster]:border-blue-800',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
