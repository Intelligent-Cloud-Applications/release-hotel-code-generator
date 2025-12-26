import React, { useState } from 'react';
import {
  DollarSign,
  CreditCard,
  Wallet,
  Building2,
  UtensilsCrossed,
  TrendingUp,
  Calendar,
  Download,
  RefreshCw,
} from 'lucide-react';

const RevenuePosting = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Sample data - replace with actual data from API
  const revenueData = {
    cash: {
      frontdesk: {
        amount: 15750.0,
        transactions: 12,
        details: [
          { time: '09:30 AM', room: '201', guest: 'John Doe', amount: 1500 },
          { time: '11:45 AM', room: '305', guest: 'Jane Smith', amount: 2800 },
          { time: '02:15 PM', room: '104', guest: 'Mike Johnson', amount: 1950 },
        ],
      },
      restaurant: {
        amount: 8420.0,
        transactions: 28,
        details: [
          { time: '01:20 PM', table: 'T-05', bill: '#R1234', amount: 850 },
          { time: '07:45 PM', table: 'T-12', bill: '#R1235', amount: 1200 },
          { time: '08:30 PM', table: 'T-08', bill: '#R1236', amount: 670 },
        ],
      },
    },
    online: {
      frontdesk: {
        amount: 24500.0,
        transactions: 18,
        details: [
          { time: '10:00 AM', room: '402', guest: 'Sarah Wilson', amount: 3500, method: 'Card' },
          { time: '03:30 PM', room: '208', guest: 'Robert Brown', amount: 2200, method: 'UPI' },
          { time: '05:15 PM', room: '501', guest: 'Emily Davis', amount: 4800, method: 'Card' },
        ],
      },
      restaurant: {
        amount: 12850.0,
        transactions: 35,
        details: [
          { time: '12:40 PM', table: 'T-03', bill: '#R1240', amount: 1450, method: 'Card' },
          { time: '06:20 PM', table: 'T-15', bill: '#R1241', amount: 980, method: 'UPI' },
          { time: '09:00 PM', table: 'T-07', bill: '#R1242', amount: 1120, method: 'Card' },
        ],
      },
    },
  };

  const totalCash =
    revenueData.cash.frontdesk.amount + revenueData.cash.restaurant.amount;
  const totalOnline =
    revenueData.online.frontdesk.amount + revenueData.online.restaurant.amount;
  const grandTotal = totalCash + totalOnline;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-blue-600" />
                Revenue Posting
              </h1>
              <p className="text-gray-600 mt-1">
                Daily collection summary from all departments
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                <Calendar className="w-5 h-5 text-gray-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border-none outline-none text-gray-700 font-medium"
                />
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Grand Total Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
              <p className="text-4xl font-bold mt-1">{formatCurrency(grandTotal)}</p>
              <p className="text-blue-100 mt-2">
                {revenueData.cash.frontdesk.transactions +
                  revenueData.cash.restaurant.transactions +
                  revenueData.online.frontdesk.transactions +
                  revenueData.online.restaurant.transactions}{' '}
                transactions today
              </p>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-blue-100 text-sm">Cash</p>
                <p className="text-2xl font-bold">{formatCurrency(totalCash)}</p>
              </div>
              <div className="text-center">
                <p className="text-blue-100 text-sm">Online</p>
                <p className="text-2xl font-bold">{formatCurrency(totalOnline)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cash Collection Summary */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-green-600" />
            Cash Collection Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Frontdesk Cash */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-green-50 border-b border-green-100 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-600 p-2 rounded-lg">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Front Desk</h3>
                      <p className="text-sm text-gray-600">
                        {revenueData.cash.frontdesk.transactions} transactions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(revenueData.cash.frontdesk.amount)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {revenueData.cash.frontdesk.details.map((detail, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{detail.guest}</p>
                        <p className="text-sm text-gray-600">
                          Room {detail.room} • {detail.time}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-800">
                        {formatCurrency(detail.amount)}
                      </p>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm py-2">
                  View All Transactions →
                </button>
              </div>
            </div>

            {/* Restaurant Cash */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-orange-50 border-b border-orange-100 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-600 p-2 rounded-lg">
                      <UtensilsCrossed className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Restaurant</h3>
                      <p className="text-sm text-gray-600">
                        {revenueData.cash.restaurant.transactions} transactions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(revenueData.cash.restaurant.amount)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {revenueData.cash.restaurant.details.map((detail, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{detail.bill}</p>
                        <p className="text-sm text-gray-600">
                          {detail.table} • {detail.time}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-800">
                        {formatCurrency(detail.amount)}
                      </p>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm py-2">
                  View All Transactions →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Online Collection Summary */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600" />
            Online Collection Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Frontdesk Online */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-blue-50 border-b border-blue-100 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Front Desk</h3>
                      <p className="text-sm text-gray-600">
                        {revenueData.online.frontdesk.transactions} transactions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(revenueData.online.frontdesk.amount)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {revenueData.online.frontdesk.details.map((detail, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{detail.guest}</p>
                        <p className="text-sm text-gray-600">
                          Room {detail.room} • {detail.time} • {detail.method}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-800">
                        {formatCurrency(detail.amount)}
                      </p>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm py-2">
                  View All Transactions →
                </button>
              </div>
            </div>

            {/* Restaurant Online */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-purple-50 border-b border-purple-100 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-600 p-2 rounded-lg">
                      <UtensilsCrossed className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Restaurant</h3>
                      <p className="text-sm text-gray-600">
                        {revenueData.online.restaurant.transactions} transactions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(revenueData.online.restaurant.amount)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {revenueData.online.restaurant.details.map((detail, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{detail.bill}</p>
                        <p className="text-sm text-gray-600">
                          {detail.table} • {detail.time} • {detail.method}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-800">
                        {formatCurrency(detail.amount)}
                      </p>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm py-2">
                  View All Transactions →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenuePosting;