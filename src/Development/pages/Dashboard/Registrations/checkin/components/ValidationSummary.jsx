const ValidationSummary = ({ validationErrors }) => {
  if (Object.keys(validationErrors).length === 0) {
    return null;
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <h3 className="font-semibold text-red-800 mb-2">
        Please fix the following errors:
      </h3>
      <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
        {Object.entries(validationErrors).map(([field, error]) => (
          <li key={field}>{error}</li>
        ))}
      </ul>
    </div>
  );
};

export default ValidationSummary; 