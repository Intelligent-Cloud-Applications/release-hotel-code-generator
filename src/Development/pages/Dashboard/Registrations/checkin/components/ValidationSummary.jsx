import { AlertCircle } from "lucide-react";

const ValidationSummary = ({ validationErrors }) => {
  if (!validationErrors || Object.keys(validationErrors).length === 0) {
    return null;
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2 text-red-800 font-semibold">
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
        <span>Please fill all required star (*) marked fields:</span>
      </div>
      <ul className="list-disc list-inside text-sm text-red-700 space-y-1 ml-7">
        {Object.entries(validationErrors).map(([field, error]) => (
          <li key={field}>{String(error)}</li>
        ))}
      </ul>
    </div>
  );
};

export default ValidationSummary; 