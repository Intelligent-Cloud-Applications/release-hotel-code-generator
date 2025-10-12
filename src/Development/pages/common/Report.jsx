import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { Button } from '../../components/ui/button.js';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select.js';
import { Input } from '../../components/ui/input.js';
import { Label } from '../../components/ui/label.js';
import { DatePickerWithRange } from '../../components/ui/DateRangePicker.jsx';
import { 
  Download, 
  FileText, 
  Table, 
  Calendar, 
  Filter,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Users,
  Bed,
  CreditCard,
  Receipt
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Report = () => {
  const { 
    rooms, 
    bookings, 
    guests, 
    staffs, 
    payments, 
    bills, 
    fetchRooms,
    expenses,
    fetchBookings, 
    fetchGuests, 
    fetchStaffs, 
    fetchPayments, 
    listTotalBill,
    loading 
  } = useAppContext();
console.log("expenses ❤️❤️❤️❤️❤️❤️❤️❤️❤️",expenses);
  const [selectedReport, setSelectedReport] = useState('');
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [filters, setFilters] = useState({});
  const [reportData, setReportData] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportedData, setExportedData] = useState(null);

  // Check for exported data on component mount
  useEffect(() => {
    const storedData = sessionStorage.getItem('exportData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setExportedData(parsedData);
        setSelectedReport('exported');
        // Clear the stored data after using it
        sessionStorage.removeItem('exportData');
      } catch (error) {
        console.error('Error parsing exported data:', error);
      }
    }
  }, []);

  // Report configurations
  const reportConfigs = {
    rooms: {
      title: 'Room Report',
      icon: Bed,
      description: 'Room status, types, and occupancy details',
      dataSource: 'rooms',
      columns: [
        { key: 'room_number', label: 'Room Number', type: 'text' },
        { key: 'room_type', label: 'Room Type', type: 'text' },
        { key: 'status', label: 'Status', type: 'text' },
        { key: 'floor', label: 'Floor', type: 'number' },
        { key: 'rate', label: 'Rate', type: 'currency' },
        { key: 'description', label: 'Description', type: 'text' }
      ]
    },
    bookings: {
      title: 'Booking Report',
      icon: Calendar,
      description: 'Reservation details and booking information',
      dataSource: 'bookings',
      columns: [
        { key: 'booking_id', label: 'Booking ID', type: 'text' },
        { key: 'full_name', label: 'Guest Name', type: 'text' },
        { key: 'mobile', label: 'Mobile', type: 'text' },
        { key: 'checkin_date', label: 'Check-in', type: 'date' },
        { key: 'checkout_date', label: 'Check-out', type: 'date' },
        { key: 'room_type', label: 'Room Type', type: 'text' },
        { key: 'status', label: 'Status', type: 'text' },
        { key: 'total_amount', label: 'Amount', type: 'currency' }
      ]
    },
    guests: {
      title: 'Guest Report',
      icon: Users,
      description: 'Guest information and contact details',
      dataSource: 'guests',
      columns: [
        { key: 'guest_id', label: 'Guest ID', type: 'text' },
        { key: 'full_name', label: 'Full Name', type: 'text' },
        { key: 'mobile', label: 'Mobile', type: 'text' },
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'nationality', label: 'Nationality', type: 'text' },
        { key: 'gender', label: 'Gender', type: 'text' },
        { key: 'created_at', label: 'Created', type: 'date' }
      ]
    },
    staff: {
      title: 'Staff Report',
      icon: Users,
      description: 'Staff information and employment details',
      dataSource: 'staffs',
      columns: [
        { key: 'staff_id', label: 'Staff ID', type: 'text' },
        { key: 'full_name', label: 'Full Name', type: 'text' },
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'mobile', label: 'Mobile', type: 'text' },
        { key: 'position', label: 'Position', type: 'text' },
        { key: 'department', label: 'Department', type: 'text' },
        { key: 'is_active', label: 'Active', type: 'boolean' }
      ]
    },
    payments: {
      title: 'Payment Report',
      icon: CreditCard,
      description: 'Payment transactions and financial details',
      dataSource: 'payments',
      columns: [
        { key: 'payment_id', label: 'Payment ID', type: 'text' },
        { key: 'booking_id', label: 'Booking ID', type: 'text' },
        { key: 'amount', label: 'Amount', type: 'currency' },
        { key: 'payment_method', label: 'Method', type: 'text' },
        { key: 'status', label: 'Status', type: 'text' },
        { key: 'created_at', label: 'Date', type: 'date' }
      ]
    },
    revenue: {
      title: 'Revenue Report',
      icon: TrendingUp,
      description: 'Revenue analysis and financial summary',
      dataSource: 'bills',
      columns: [
        { key: 'booking_id', label: 'Booking ID', type: 'text' },
        { key: 'guest_name', label: 'Guest Name', type: 'text' },
        { key: 'room_charges', label: 'Room Charges', type: 'currency' },
        { key: 'service_charges', label: 'Service Charges', type: 'currency' },
        { key: 'tax_amount', label: 'Tax', type: 'currency' },
        { key: 'total_amount', label: 'Total', type: 'currency' },
        { key: 'created_at', label: 'Date', type: 'date' }
      ]
    },
    expenses: {
      title: 'Expenses Report',
      icon: CreditCard,
      description: 'Expense tracking and financial expenditure details',
      dataSource: 'expenses',
      columns: [
        { key: 'name', label: 'Expense Name', type: 'text' },
        { key: 'description', label: 'Description', type: 'text' },
        { key: 'amount', label: 'Amount', type: 'currency' },
        { key: 'date', label: 'Date', type: 'date' }
      ]
    },
    nightAudit: {
      title: 'Night Audit Summary',
      icon: BarChart3,
      description: 'Comprehensive night audit report with detailed breakdown',
      dataSource: 'nightAudit',
      columns: []
    }
  };

  // Debug: Log report configurations
  console.log('Available report configs:', Object.keys(reportConfigs));
  console.log('Expenses config:', reportConfigs.expenses);

  // Fetch data based on selected report
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedReport) return;

      try {
        switch (selectedReport) {
          case 'rooms':
            await fetchRooms();
            break;
          case 'bookings':
            await fetchBookings();
            break;
          case 'guests':
            await fetchGuests();
            break;
          case 'staff':
            await fetchStaffs();
            break;
          case 'payments':
            await fetchPayments();
            break;
          case 'revenue':
            await listTotalBill();
            break;
          case 'expenses':
            // Expenses are already loaded from AppContext
            break;
          default:
            break;
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch data');
      }
    };

    fetchData();
  }, [selectedReport]);

  // Process data based on selected report and filters
  useEffect(() => {
    if (!selectedReport) {
      setReportData([]);
      return;
    }

    let data = [];
    let config = reportConfigs[selectedReport];

    // Handle exported data

      switch (selectedReport) {
        case 'rooms':
          data = rooms || [];
          break;
        case 'bookings':
          data = bookings || [];
          break;
        case 'guests':
          data = guests || [];
          break;
        case 'staff':
          data = staffs || [];
          break;
        case 'payments':
          data = payments || [];
          break;
        case 'revenue':
          data = bills || [];
          break;
        case 'expenses':
          data = expenses || [];
          break;
        case 'nightAudit':
          // For night audit, we'll use exported data if available
          data = exportedData || [];
          break;
        default:
          data = [];
      }
  

    // Apply date filter if date range is selected
    if (dateRange.from && dateRange.to) {
      data = data.filter(item => {
        let itemDate;
        
        // Handle different date formats
        if (item.date && typeof item.date === 'string' && item.date.includes('/')) {
          // Handle DD/MM/YYYY format for expenses
          const [day, month, year] = item.date.split('/');
          itemDate = new Date(year, month - 1, day);
        } else {
          // Handle standard ISO date format
          itemDate = new Date(item.created_at || item.checkin_date || item.booking_date || item.date);
        }
        
        return itemDate >= dateRange.from && itemDate <= dateRange.to;
      });
    }

    // Apply additional filters
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        data = data.filter(item => 
          item[key] && item[key].toString().toLowerCase().includes(filters[key].toLowerCase())
        );
      }
    });

    setReportData(data);
  }, [selectedReport, rooms, bookings, guests, staffs, payments, bills, expenses, dateRange, filters, exportedData]);

  // Format data for export
  const formatDataForExport = (data, columns) => {
    return data.map(item => {
      const formattedItem = {};
      columns.forEach(column => {
        let value = item[column.key];
        
        // Format based on column type
        switch (column.type) {
          case 'date':
            if (value && typeof value === 'string' && value.includes('/')) {
              // Handle DD/MM/YYYY format for expenses
              const [day, month, year] = value.split('/');
              value = new Date(year, month - 1, day).toLocaleDateString();
            } else {
              value = value ? new Date(value).toLocaleDateString() : '';
            }
            break;
          case 'currency':
            value = value ? `$${parseFloat(value).toFixed(2)}` : '$0.00';
            break;
          case 'boolean':
            value = value ? 'Yes' : 'No';
            break;
          default:
            value = value || '';
        }
        
        formattedItem[column.label] = value;
      });
      return formattedItem;
    });
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!selectedReport) {
      toast.error('No report selected');
      return;
    }

    if (selectedReport === 'nightAudit' && !exportedData) {
      toast.error('No night audit data available');
      return;
    }

    if (selectedReport !== 'nightAudit' && reportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    setIsGenerating(true);
    try {
      let config = reportConfigs[selectedReport];
      let columns = config.columns;


      // Handle night audit data
      if (selectedReport === 'nightAudit' && exportedData) {
        config = {
          title: 'Night Audit Summary Report',
          description: 'Comprehensive night audit report with detailed breakdown'
        };
        
        // Create comprehensive data for night audit
        const nightAuditData = [];
        
        // Add summary data
        if (exportedData.summary) {
          nightAuditData.push({
            'Section': 'SUMMARY',
            'Metric': 'New Bookings',
            'Value': exportedData.summary.bookingCount || 0,
            'Amount': ''
          });
          nightAuditData.push({
            'Section': 'SUMMARY',
            'Metric': 'Check-ins',
            'Value': exportedData.summary.checkInCount || 0,
            'Amount': ''
          });
          nightAuditData.push({
            'Section': 'SUMMARY',
            'Metric': 'Check-outs',
            'Value': exportedData.summary.checkOutsCount || 0,
            'Amount': ''
          });
          nightAuditData.push({
            'Section': 'SUMMARY',
            'Metric': 'Occupied Rooms',
            'Value': exportedData.summary.occupiedRoomCount || 0,
            'Amount': ''
          });
          nightAuditData.push({
            'Section': 'SUMMARY',
            'Metric': 'Room Revenue',
            'Value': '',
            'Amount': `₹${(exportedData.summary.roomRevenue || 0).toLocaleString()}`
          });
          nightAuditData.push({
            'Section': 'SUMMARY',
            'Metric': 'Total Revenue',
            'Value': '',
            'Amount': `₹${(exportedData.summary.totalRevenue || 0).toLocaleString()}`
          });
        }

        // Add check-ins data
        if (exportedData.details?.checkIns) {
          nightAuditData.push({ 'Section': 'CHECK-INS DETAILS', 'Metric': '', 'Value': '', 'Amount': '' });
          exportedData.details.checkIns.forEach((checkin, index) => {
            nightAuditData.push({
              'Section': 'CHECK-INS DETAILS',
              'Metric': `Guest ${index + 1}`,
              'Value': `${checkin.guestName} - ${checkin.roomType} - ${checkin.roomNumbers}`,
              'Amount': `Check-out: ${checkin.checkOutDate}`
            });
          });
        }

        // Add check-outs data
        if (exportedData.details?.checkOuts) {
          nightAuditData.push({ 'Section': 'CHECK-OUTS DETAILS', 'Metric': '', 'Value': '', 'Amount': '' });
          exportedData.details.checkOuts.forEach((checkout, index) => {
            nightAuditData.push({
              'Section': 'CHECK-OUTS DETAILS',
              'Metric': `Guest ${index + 1}`,
              'Value': `${checkout.guestName} - ${checkout.roomType} - ${checkout.stayDuration} days`,
              'Amount': `₹${(checkout.billAmount || 0).toLocaleString()}`
            });
          });
        }

        // Add expenses data
        if (exportedData.expenses) {
          nightAuditData.push({ 'Section': 'EXPENSES DETAILS', 'Metric': '', 'Value': '', 'Amount': '' });
          exportedData.expenses.forEach((expense, index) => {
            nightAuditData.push({
              'Section': 'EXPENSES DETAILS',
              'Metric': expense.name,
              'Value': expense.description,
              'Amount': `₹${Number(expense.amount || 0).toLocaleString()}`
            });
          });
        }

        const ws = XLSX.utils.json_to_sheet(nightAuditData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, config.title);
        
        const fileName = `${config.title}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        toast.success('Night Audit Excel file downloaded successfully');
        setIsGenerating(false);
        return;
      }
      
      const formattedData = formatDataForExport(reportData, columns);
      
      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, config.title);
      
      const fileName = `${config.title}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export to Excel');
    } finally {
      setIsGenerating(false);
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!selectedReport) {
      toast.error('No report selected');
      return;
    }

    if (selectedReport === 'nightAudit' && !exportedData) {
      toast.error('No night audit data available');
      return;
    }

    if (selectedReport !== 'nightAudit' && reportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    setIsGenerating(true);
    try {
      let config = reportConfigs[selectedReport];
      let columns = config.columns;
      
      // Handle exported data
      if (selectedReport === 'exported' && exportedData) {
        config = {
          title: exportedData.title || 'Exported Data Report',
          description: exportedData.description || 'Data exported from another page'
        };
        columns = exportedData.columns || [];
      }

      // Handle night audit data
      if (selectedReport === 'nightAudit' && exportedData) {
        config = {
          title: 'Night Audit Summary Report',
          description: 'Comprehensive night audit report with detailed breakdown'
        };
        
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(20);
        doc.text(config.title, 14, 22);
        
        // Add date
        doc.setFontSize(10);
        doc.text(`Date: ${exportedData.date || 'N/A'}`, 14, 30);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 35);
        
        let yPosition = 50;
        
        // Add summary section
        if (exportedData.summary) {
          doc.setFontSize(14);
          doc.text('SUMMARY', 14, yPosition);
          yPosition += 10;
          
          const summaryData = [
            ['New Bookings', exportedData.summary.bookingCount || 0],
            ['Check-ins', exportedData.summary.checkInCount || 0],
            ['Check-outs', exportedData.summary.checkOutsCount || 0],
            ['Occupied Rooms', exportedData.summary.occupiedRoomCount || 0],
            ['Room Revenue', `₹${(exportedData.summary.roomRevenue || 0).toLocaleString()}`],
            ['Total Revenue', `₹${(exportedData.summary.totalRevenue || 0).toLocaleString()}`]
          ];
          
          doc.autoTable({
            head: [['Metric', 'Value']],
            body: summaryData,
            startY: yPosition,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [41, 128, 185] }
          });
          
          yPosition = doc.lastAutoTable.finalY + 20;
        }
        
        // Add check-ins section
        if (exportedData.details?.checkIns && exportedData.details.checkIns.length > 0) {
          doc.setFontSize(14);
          doc.text('CHECK-INS DETAILS', 14, yPosition);
          yPosition += 10;
          
          const checkInsData = exportedData.details.checkIns.map(checkin => [
            checkin.guestName,
            checkin.bookingId,
            checkin.roomType,
            checkin.roomNumbers,
            checkin.mobile,
            checkin.checkOutDate
          ]);
          
          doc.autoTable({
            head: [['Guest Name', 'Booking ID', 'Room Type', 'Room Number', 'Mobile', 'Check-out']],
            body: checkInsData,
            startY: yPosition,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] }
          });
          
          yPosition = doc.lastAutoTable.finalY + 20;
        }
        
        // Add check-outs section
        if (exportedData.details?.checkOuts && exportedData.details.checkOuts.length > 0) {
          doc.setFontSize(14);
          doc.text('CHECK-OUTS DETAILS', 14, yPosition);
          yPosition += 10;
          
          const checkOutsData = exportedData.details.checkOuts.map(checkout => [
            checkout.guestName,
            checkout.bookingId,
            checkout.roomType,
            `${checkout.stayDuration} days`,
            `₹${(checkout.roomRevenue || 0).toLocaleString()}`,
            `₹${(checkout.billAmount || 0).toLocaleString()}`
          ]);
          
          doc.autoTable({
            head: [['Guest Name', 'Booking ID', 'Room Type', 'Stay Duration', 'Room Revenue', 'Total Bill']],
            body: checkOutsData,
            startY: yPosition,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] }
          });
          
          yPosition = doc.lastAutoTable.finalY + 20;
        }
        
        // Add expenses section
        if (exportedData.expenses && exportedData.expenses.length > 0) {
          doc.setFontSize(14);
          doc.text('EXPENSES DETAILS', 14, yPosition);
          yPosition += 10;
          
          const expensesData = exportedData.expenses.map(expense => [
            expense.name,
            expense.description,
            `₹${Number(expense.amount || 0).toLocaleString()}`,
            expense.date
          ]);
          
          doc.autoTable({
            head: [['Expense Name', 'Description', 'Amount', 'Date']],
            body: expensesData,
            startY: yPosition,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] }
          });
        }
        
        const fileName = `${config.title}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        toast.success('Night Audit PDF file downloaded successfully');
        setIsGenerating(false);
        return;
      }
      
      const formattedData = formatDataForExport(reportData, columns);
      
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text(config.title, 14, 22);
      
      // Add date range if selected
      if (dateRange.from && dateRange.to) {
        doc.setFontSize(10);
        doc.text(`Date Range: ${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`, 14, 30);
      }
      
      // Add generation date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 35);
      
      // Prepare table data
      const tableData = formattedData.map(row => 
        columns.map(col => row[col.label])
      );
      
      // Add table
      doc.autoTable({
        head: [columns.map(col => col.label)],
        body: tableData,
        startY: 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
      
      const fileName = `${config.title}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast.success('PDF file downloaded successfully');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Failed to export to PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setDateRange({ from: null, to: null });
  };

  // Night Audit Report Component
  const NightAuditReport = ({ data }) => {
    if (!data || !data.summary) {
      return (
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No night audit data available</p>
          <p className="text-sm">Please export data from Day End process first</p>
        </div>
      );
    }

    const { summary, details, analytics, expenses } = data;
    const totalExpenses = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-600 mb-1">New Bookings</div>
            <div className="text-2xl font-bold text-blue-700">{summary.bookingCount || 0}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-600 mb-1">Check-ins</div>
            <div className="text-2xl font-bold text-green-700">{summary.checkInCount || 0}</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-sm text-orange-600 mb-1">Check-outs</div>
            <div className="text-2xl font-bold text-orange-700">{summary.checkOutsCount || 0}</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-sm text-purple-600 mb-1">Occupied Rooms</div>
            <div className="text-2xl font-bold text-purple-700">{summary.occupiedRoomCount || 0}</div>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="text-sm text-indigo-600 mb-1">Room Revenue</div>
            <div className="text-2xl font-bold text-indigo-700">₹{(summary.roomRevenue || 0).toLocaleString()}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-600 mb-1">Total Revenue</div>
            <div className="text-2xl font-bold text-green-700">₹{(summary.totalRevenue || 0).toLocaleString()}</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm text-red-600 mb-1">Total Expenses</div>
            <div className="text-2xl font-bold text-red-700">₹{totalExpenses.toLocaleString()}</div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-6">
          {/* Check-ins Details */}
          {details?.checkIns && details.checkIns.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                Check-ins Details ({details.checkIns.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Guest Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Room Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Room Number</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check-out</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {details.checkIns.map((checkin, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{checkin.guestName}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{checkin.bookingId}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{checkin.roomType}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{checkin.roomNumbers}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{checkin.mobile}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{checkin.checkOutDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Check-outs Details */}
          {details?.checkOuts && details.checkOuts.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                Check-outs Details ({details.checkOuts.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Guest Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Room Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stay Duration</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Room Revenue</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Bill</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {details.checkOuts.map((checkout, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{checkout.guestName}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{checkout.bookingId}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{checkout.roomType}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{checkout.stayDuration} days</td>
                        <td className="px-4 py-2 text-sm text-gray-900">₹{(checkout.roomRevenue || 0).toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">₹{(checkout.billAmount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Room Status Details */}
          {details?.roomStatus && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Bed className="h-5 w-5 text-purple-500" />
                Room Status Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(details.roomStatus).map(([status, rooms]) => (
                  <div key={status} className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600 capitalize">{status}</div>
                    <div className="text-xl font-bold text-gray-900">{rooms.length}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revenue Breakdown */}
          {details?.revenueBreakdown && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Revenue Breakdown
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(details.revenueBreakdown).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                    <div className="text-lg font-semibold text-gray-900">₹{Number(value || 0).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expenses Details */}
          {expenses && expenses.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-red-500" />
                Expenses Details ({expenses.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expense Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expenses.map((expense, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{expense.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{expense.description}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">₹{Number(expense.amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{expense.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics */}
          {analytics && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Analytics Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-blue-600">Occupancy Rate</div>
                  <div className="text-xl font-bold text-blue-700">{analytics.occupancyRate}%</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-green-600">Average Daily Rate</div>
                  <div className="text-xl font-bold text-green-700">₹{analytics.averageDailyRate}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-sm text-purple-600">RevPAR</div>
                  <div className="text-xl font-bold text-purple-700">₹{analytics.revenuePerAvailableRoom}</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="text-sm text-orange-600">Total Guests</div>
                  <div className="text-xl font-bold text-orange-700">{analytics.guestMetrics?.totalGuests || 0}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
          <p className="text-gray-600">Generate and export reports from different data sources</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Selection */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Report Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="report-type">Select Report Type</Label>
                  <Select value={selectedReport} onValueChange={setSelectedReport}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a report type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(reportConfigs).map(([key, config]) => {
                        console.log('Rendering report option:', key, config.title);
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <config.icon className="h-4 w-4" />
                              {config.title}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {selectedReport && (
                  <>
                    <div>
                      <Label>Date Range (Optional)</Label>
                      <DatePickerWithRange
                        date={dateRange}
                        onDateChange={setDateRange}
                      />
                    </div>

                    <div>
                      <Label>Search Filter</Label>
                      <Input
                        placeholder="Search in data..."
                        value={filters.search || ''}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={clearFilters}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        Clear Filters
                      </Button>
                      <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Report Preview and Export */}
          <div className="lg:col-span-2">
            {selectedReport ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {React.createElement(
                      selectedReport === 'exported' && exportedData 
                        ? Download 
                        : reportConfigs[selectedReport].icon, 
                      { className: "h-5 w-5" }
                    )}
                    <CardTitle>
                      {selectedReport === 'exported' && exportedData 
                        ? exportedData.title 
                        : reportConfigs[selectedReport].title
                      }
                    </CardTitle>
                  </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={exportToExcel}
                        disabled={isGenerating || (selectedReport === 'nightAudit' ? !exportedData : reportData.length === 0)}
                        className="flex items-center gap-2"
                      >
                        <Table className="h-4 w-4" />
                        Excel
                      </Button>
                      <Button
                        onClick={exportToPDF}
                        disabled={isGenerating || (selectedReport === 'nightAudit' ? !exportedData : reportData.length === 0)}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedReport === 'exported' && exportedData 
                      ? exportedData.description 
                      : reportConfigs[selectedReport].description
                    }
                  </p>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading data...</span>
                    </div>
                  ) : selectedReport === 'nightAudit' ? (
                    <NightAuditReport data={exportedData} />
                  ) : reportData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No data found</p>
                      <p className="text-sm">
                        {filters.search || dateRange.from ? 
                          'Try adjusting your filters' : 
                          'No data available for this report'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          Showing {reportData.length} records
                        </p>
                        {isGenerating && (
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Generating report...
                          </div>
                        )}
                      </div>

                      {/* Data Preview Table */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {(selectedReport === 'exported' && exportedData 
                                ? exportedData.columns 
                                : reportConfigs[selectedReport].columns
                              ).map((column) => (
                                <th
                                  key={column.key}
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {column.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {reportData.slice(0, 10).map((item, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                {(selectedReport === 'exported' && exportedData 
                                  ? exportedData.columns 
                                  : reportConfigs[selectedReport].columns
                                ).map((column) => {
                                  let value = item[column.key];
                                  
                                  // Format value based on type
                                  switch (column.type) {
                                    case 'date':
                                      if (value && typeof value === 'string' && value.includes('/')) {
                                        // Handle DD/MM/YYYY format for expenses
                                        const [day, month, year] = value.split('/');
                                        value = new Date(year, month - 1, day).toLocaleDateString();
                                      } else {
                                        value = value ? new Date(value).toLocaleDateString() : '-';
                                      }
                                      break;
                                    case 'currency':
                                      value = value ? `$${parseFloat(value).toFixed(2)}` : '$0.00';
                                      break;
                                    case 'boolean':
                                      value = value ? 'Yes' : 'No';
                                      break;
                                    default:
                                      value = value || '-';
                                  }
                                  
                                  return (
                                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {value}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {reportData.length > 10 && (
                        <p className="text-sm text-gray-500 text-center">
                          Showing first 10 records. Export to see all {reportData.length} records.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Report Type</h3>
                  <p className="text-gray-600">
                    Choose a report type from the sidebar to view and export data
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;
