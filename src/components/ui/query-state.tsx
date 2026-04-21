type QueryStateProps = {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  loadingText: string;
  errorTitle: string;
};

export function QueryState({
  isLoading,
  isError,
  error,
  loadingText,
  errorTitle,
}: QueryStateProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-white p-6">
        <p className="text-slate-600">{loadingText}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-700">{errorTitle}</p>
        <p className="mt-1 text-sm text-red-600">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  return null;
}