import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAppContext } from '@/Development/context/AppContext.jsx';
import BillReport from './BillReport.jsx';
import { Button } from '@/Development/components/ui/button.js';
import { Input } from '@/Development/components/ui/input.js';

// Helper to parse query params
function useQuery(){
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const BillView = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const { bills } = useAppContext();

  const billIdParam = query.get('bill_id') || '';

  const targetBill = useMemo(() => {
    if(!billIdParam) return null;
    // bill structure in GuestHistory uses bill.billHeader.bookingRef as Bill ID (displayed) so try multiple keys
    return bills.find(b => {
      const bookingRef = b?.bill?.billHeader?.bookingRef;
      const billId = b?.bill?.billHeader?.billId || b?.bill?.billHeader?.id;
      return bookingRef === billIdParam || billId === billIdParam || b?.bill_id === billIdParam;
    }) || null;
  }, [bills, billIdParam]);

  const handleSearchChange = (e) => {
    navigate({ pathname: '/dashboard/registrations/bill-view', search: `?bill_id=${encodeURIComponent(e.target.value)}` });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-6 inter">
      <div className="max-w-6xl mx-auto">
        {!billIdParam && (
          <div className="p-8 bg-white border rounded-md text-center text-gray-600">Enter a bill_id in the search box to view a bill.</div>
        )}
        {billIdParam && !targetBill && (
          <div className="p-8 bg-white border rounded-md text-center text-red-600">No bill found for ID: {billIdParam}</div>
        )}
        {targetBill && targetBill.bill && (
          <div className="bg-white border rounded-md overflow-hidden">
            <BillReport billData={targetBill.bill} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BillView;