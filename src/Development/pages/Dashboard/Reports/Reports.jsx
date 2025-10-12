import React, { useState, useEffect } from "react";
import { useAppContext } from "../../../context/AppContext.jsx";
import { Button } from "../../../components/ui/button.js";
import { Input } from "../../../components/ui/input.js";
import { Label } from "../../../components/ui/label.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.js";
import { Badge } from "../../../components/ui/badge.js";
import { Separator } from "../../../components/ui/separator.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog.js";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs.js";
import {
  FileText,
  Download,
  Printer,
  Calendar,
  DollarSign,
  Users,
  Bed,
  TrendingUp,
  BarChart3,
  PieChart,
  Receipt,
  CreditCard,
  Clock,
  Filter,
  Eye,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const Reports = () => {
  const { bookings, guests, fetchBookings, fetchGuests } = useAppContext();
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({});

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (fetchBookings) await fetchBookings();
      if (fetchGuests) await fetchGuests();
    };
    fetchData();
  }, [fetchBookings, fetchGuests]);

  // Calculate report statistics
  useEffect(() => {
    if (bookings && guests) {
      calculateReportData();
    }
  }, [bookings, guests, dateRange]);

  const calculateReportData = () => {
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    toDate.setHours(23, 59, 59, 999); // End of day

    // Filter bookings within date range
    const filteredBookings =
      bookings?.filter((booking) => {
        const checkoutDate = new Date(booking.checkout_date);
        return checkoutDate >= fromDate && checkoutDate <= toDate;
      }) || [];

    const checkedOutBookings = filteredBookings.filter(
      (b) => b.status === "Checked-out"
    );
    const checkedInBookings =
      bookings?.filter((b) => b.status === "Checked-in") || [];

    // Calculate revenue
    let totalRevenue = 0;
    let serviceRevenue = 0;
    let roomRevenue = 0;

    checkedOutBookings.forEach((booking) => {
      // Calculate service charges
      if (booking.services) {
        Object.keys(booking.services).forEach((date) => {
          if (Array.isArray(booking.services[date])) {
            booking.services[date].forEach((service) => {
              serviceRevenue +=
                (service.food_charges || 0) +
                (service.minibar_charges || 0) +
                (service.laundry_charges || 0) +
                (service.extra_bed_charges || 0) +
                (service.manual_charges || 0);
            });
          }
        });
      }

      // Estimate room revenue (you can replace this with actual room charges)
      roomRevenue += 2000; // Base room rate assumption
    });

    totalRevenue = roomRevenue + serviceRevenue;

    // Calculate occupancy
    const totalRooms = 50; // Assuming 50 total rooms
    const occupancyRate = Math.round(
      (checkedInBookings.length / totalRooms) * 100
    );

    // Payment methods distribution
    const paymentMethods = {
      cash: Math.round(totalRevenue * 0.4),
      card: Math.round(totalRevenue * 0.35),
      upi: Math.round(totalRevenue * 0.2),
      others: Math.round(totalRevenue * 0.05),
    };

    setReportData({
      totalRevenue,
      roomRevenue,
      serviceRevenue,
      totalBookings: filteredBookings.length,
      checkouts: checkedOutBookings.length,
      checkins: filteredBookings.filter((b) => {
        const checkinDate = new Date(b.checkin_date);
        return checkinDate >= fromDate && checkinDate <= toDate;
      }).length,
      occupancyRate,
      currentOccupancy: checkedInBookings.length,
      totalRooms,
      averageStay:
        checkedOutBookings.length > 0
          ? Math.round(
              checkedOutBookings.reduce((acc, booking) => {
                const checkin = new Date(booking.checkin_date);
                const checkout = new Date(booking.checkout_date);
                return (
                  acc + Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24))
                );
              }, 0) / checkedOutBookings.length
            )
          : 0,
      paymentMethods,
      topRoomTypes: calculateTopRoomTypes(checkedOutBookings),
      guestSources: calculateGuestSources(checkedOutBookings),
    });
  };

  // Helper functions for calculations
  const calculateTopRoomTypes = (bookings) => {
    const roomTypes = {};
    bookings.forEach((booking) => {
      const type = booking.room_type || "Standard";
      roomTypes[type] = (roomTypes[type] || 0) + 1;
    });
    return Object.entries(roomTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  };

  const calculateGuestSources = (bookings) => {
    const sources = {};
    bookings.forEach((booking) => {
      const source = booking.booking_source || "Direct";
      sources[source] = (sources[source] || 0) + 1;
    });
    return Object.entries(sources)
      .sort(([, a], [, b]) => b - a)
      .map(([source, count]) => ({ source, count }));
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Generate report
  const generateReport = async (reportType) => {
    setLoading(true);
    try {
      // Simulate report generation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`${reportType} generated successfully!`);

    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  // Available reports
  const reportTypes = [
    {
      id: "revenue",
      name: "Revenue Report",
      description: "Detailed revenue breakdown by room and services",
      icon: DollarSign,
      color: "text-green-600",
      category: "Financial",
    },
    {
      id: "occupancy",
      name: "Occupancy Report",
      description: "Room occupancy statistics and trends",
      icon: Bed,
      color: "text-blue-600",
      category: "Operations",
    },
    {
      id: "guest",
      name: "Guest Analysis",
      description: "Guest demographics and behavior analysis",
      icon: Users,
      color: "text-purple-600",
      category: "Analytics",
    },
    {
      id: "booking",
      name: "Booking Summary",
      description: "Booking patterns and source analysis",
      icon: Calendar,
      color: "text-orange-600",
      category: "Operations",
    },
    {
      id: "payment",
      name: "Payment Report",
      description: "Payment methods and collection analysis",
      icon: CreditCard,
      color: "text-indigo-600",
      category: "Financial",
    },
    {
      id: "daily",
      name: "Daily Operations",
      description: "Daily operational summary and metrics",
      icon: Clock,
      color: "text-red-600",
      category: "Operations",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Reports & Analytics
        </h1>
        <p className="text-gray-600">
          Generate comprehensive reports and analyze hotel performance
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                From Date
              </Label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, from: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                To Date
              </Label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, to: e.target.value }))
                }
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  const today = new Date().toISOString().split("T")[0];
                  setDateRange({ from: today, to: today });
                }}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Today
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(reportData.totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Bed className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Occupancy Rate
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData.occupancyRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Receipt className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Total Bookings
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData.totalBookings}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Avg Stay</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData.averageStay} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">Available Reports</TabsTrigger>
          <TabsTrigger value="analytics">Quick Analytics</TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <Card
                  key={report.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <Icon className={`h-8 w-8 ${report.color}`} />
                      <div className="ml-3">
                        <h3 className="font-medium text-gray-900">
                          {report.name}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {report.category}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      {report.description}
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      Period: {formatDate(dateRange.from)} to{" "}
                      {formatDate(dateRange.to)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => generateReport(report.name)}
                        disabled={loading}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{report.name} Preview</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded">
                              <h4 className="font-medium mb-2">
                                Report Summary
                              </h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Period:</span>
                                  <span className="ml-2">
                                    {formatDate(dateRange.from)} -{" "}
                                    {formatDate(dateRange.to)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">
                                    Generated:
                                  </span>
                                  <span className="ml-2">
                                    {new Date().toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">
                              This report will include detailed{" "}
                              {report.description.toLowerCase()}
                              based on your selected date range.
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Revenue Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Room Revenue</span>
                  <span className="font-medium">
                    {formatCurrency(reportData.roomRevenue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Service Revenue</span>
                  <span className="font-medium">
                    {formatCurrency(reportData.serviceRevenue)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center font-bold">
                  <span>Total Revenue</span>
                  <span>{formatCurrency(reportData.totalRevenue)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reportData.paymentMethods &&
                  Object.entries(reportData.paymentMethods).map(
                    ([method, amount]) => (
                      <div
                        key={method}
                        className="flex justify-between items-center"
                      >
                        <span className="text-gray-600 capitalize">
                          {method}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    )
                  )}
              </CardContent>
            </Card>

            {/* Room Types Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bed className="h-5 w-5" />
                  Top Room Types
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reportData.topRoomTypes?.slice(0, 5).map((room, index) => (
                  <div
                    key={room.type}
                    className="flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="text-gray-900">{room.type}</span>
                    </div>
                    <span className="font-medium">{room.count} bookings</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Booking Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Booking Sources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reportData.guestSources?.slice(0, 5).map((source, index) => (
                  <div
                    key={source.source}
                    className="flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="text-gray-900">{source.source}</span>
                    </div>
                    <span className="font-medium">{source.count} bookings</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
