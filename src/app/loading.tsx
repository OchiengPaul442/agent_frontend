import { AqLoading02 } from '@airqo/icons-react';

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <AqLoading02 className="text-primary h-8 w-8 animate-spin" />
    </div>
  );
}
