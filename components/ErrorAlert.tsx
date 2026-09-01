type ErrorAlertProps = {
  message: string;
};

export default function ErrorAlert({ message }: ErrorAlertProps) {
  // Do not display anything until there is an actual error.
  if (!message.trim()) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
    >
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold"
        aria-hidden="true"
      >
        !
      </span>

      <div>
        <p className="font-semibold">Unable to complete analysis</p>

        <p className="mt-1 text-xs font-normal text-red-600">
          {message}
        </p>
      </div>
    </div>
  );
}