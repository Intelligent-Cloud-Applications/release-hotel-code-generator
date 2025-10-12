import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '@/Development/context/AppContext.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '@/Development/components/ui/card.js';
import { Button } from '@/Development/components/ui/button.js';
import { Input } from '@/Development/components/ui/input.js';
import { Download, IndianRupee, TrendingUp, Percent } from 'lucide-react';

// Currency formatter (₹ integer, no decimals)
const fmt = (n = 0) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0);

const Reports = () => {
  const { bills, listTotalBill } = useAppContext();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!bills || bills.length === 0) {
        setLoading(true);
        try { await listTotalBill(); } finally { setLoading(false); }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!Array.isArray(bills)) return [];
    const q = query.toLowerCase();
    if (!q) return bills;
    return bills.filter(b => (b.bill?.billHeader?.billDate ? new Date(b.bill.billHeader.billDate).toLocaleDateString() : '').toLowerCase().includes(q));
  }, [bills, query]);

  const aggr = useMemo(() => {
    if (!filtered.length) return { total: 0, room: 0, avg: 0, occ: 0 };
    let total = 0, room = 0, occSum = 0, occDays = 0;
    filtered.forEach(billWrapper => {
      const bw = billWrapper.bill || {}; // inner bill object
      const summary = bw.billingSummary || {};
      const booking = bw.bookingDetails || {};
      total += summary.totalRoomServices || 0; // using totalRoomServices as gross before tax? or totalAmount? choose finalSummary.totalAmount
      // Prefer finalSummary.totalAmount if present for total
      if (bw.finalSummary?.totalAmount) total += 0; // already included above? We'll override below
      // We'll treat room revenue as roomCharges (roomCharges or totalRoomServices minus service components)
      // Provided structure: billingSummary.totalRoomServices seems to be total room related revenue prior to taxes/discount adjustments.
      // Use billingSummary.totalRoomServices for room; total use finalSummary.totalAmount.
      room += summary.totalRoomServices || 0;
      // Occupancy approximation: count each bill as one occupied room-night if numberOfNights >0.
      if (booking.numberOfNights) {
        occSum += 100; // occupied for that date entry (simplistic)
        occDays++;
      }
    });
    // Replace total with sum of finalSummary.totalAmount for accuracy
    const totalFinal = filtered.reduce((acc, b) => acc + (b.bill?.finalSummary?.totalAmount || 0), 0);
    return { total: totalFinal, room, avg: totalFinal / filtered.length, occ: occDays ? occSum / occDays : 0 };
  }, [filtered]);

  const exportCsv = () => {
    if (!filtered.length) return;
    const header = ['Date','Bill #','Guest','Room','Total','RoomRevenue','Nights'];
    const rows = filtered.map(bw => {
      const b = bw.bill || {};
      const headerInfo = b.billHeader || {};
      const summary = b.billingSummary || {};
      const booking = b.bookingDetails || {};
      const dateStr = headerInfo.billDate ? new Date(headerInfo.billDate).toLocaleDateString() : '';
      return [
        dateStr,
        headerInfo.bookingRef || headerInfo.billNumber || '',
        b.guestDetails?.guestName || '',
        booking.roomNumber || '',
        b.finalSummary?.totalAmount || summary.balanceDue || 0,
        summary.totalRoomServices || 0,
        booking.numberOfNights || 1
      ].join(',');
    });
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'revenue.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Revenue</h1>
          <p className="text-sm text-gray-600">Simplified daily revenue overview</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Filter by date (e.g. 6/10/2025)"
            className="sm:w-64"
          />
          <Button variant="outline" disabled={!filtered.length} onClick={exportCsv}>
            <Download className="h-4 w-4 mr-2" />Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-1"><CardTitle className="text-sm flex items-center gap-2"><IndianRupee className="h-4 w-4"/>Total</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{fmt(aggr.total)}</CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4"/>Avg / Day</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{fmt(aggr.avg)}</CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-sm flex items-center gap-2"><IndianRupee className="h-4 w-4"/>Room</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{fmt(aggr.room)}</CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-sm flex items-center gap-2"><Percent className="h-4 w-4"/>Avg Occ</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{aggr.occ.toFixed(1)}%</CardContent></Card>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b flex justify-between text-sm">
          <span>Bill Revenue ({filtered.length})</span>
          {loading && <span className="text-xs text-gray-500 animate-pulse">Loading...</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Date</th>
                <th className="px-3 py-2 text-right font-semibold">Total</th>
                <th className="px-3 py-2 text-right font-semibold">Room</th>
                <th className="px-3 py-2 text-right font-semibold">Occ %</th>
                <th className="px-3 py-2 text-right font-semibold">Check-ins</th>
                <th className="px-3 py-2 text-right font-semibold">Check-outs</th>
              </tr>
            </thead>
            <tbody>
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">No data</td>
                </tr>
              )}
              {filtered.map(bw => {
                const b = bw.bill || {};
                const headerInfo = b.billHeader || {};
                const summary = b.billingSummary || {};
                const booking = b.bookingDetails || {};
                const dateStr = headerInfo.billDate ? new Date(headerInfo.billDate).toLocaleDateString() : '';
                return (
                  <tr key={headerInfo.bookingRef || dateStr} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap">{dateStr}</td>
                    <td className="px-3 py-2 text-right">{fmt(b.finalSummary?.totalAmount || summary.balanceDue || 0)}</td>
                    <td className="px-3 py-2 text-right">{fmt(summary.totalRoomServices || 0)}</td>
                    <td className="px-3 py-2 text-right">{booking.numberOfNights || 1}</td>
                    <td className="px-3 py-2 text-right">{booking.no_of_adults || 0}</td>
                    <td className="px-3 py-2 text-right">{booking.no_of_children || 0}</td>
                  </tr>
                );
              })}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td className="px-3 py-2 text-right">Totals:</td>
                  <td className="px-3 py-2 text-right">{fmt(aggr.total)}</td>
                  <td className="px-3 py-2 text-right">{fmt(aggr.room)}</td>
                  <td className="px-3 py-2 text-right">{aggr.occ.toFixed(1)}%</td>
                  <td className="px-3 py-2 text-right" colSpan={2}>Days: {filtered.length}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;