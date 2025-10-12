import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../../context/AppContext.jsx';
import { Button } from '../../../components/ui/button.js';
import { Input } from '../../../components/ui/input.js';
import { Label } from '../../../components/ui/label.js';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select.js';
import { Badge } from '../../../components/ui/badge.js';
import { Separator } from '../../../components/ui/separator.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../components/ui/dialog.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs.js';
import { 
  CreditCard, 
  Receipt, 
  DollarSign, 
  Search, 
  Plus, 
  Eye,
  Printer,
  Banknote,
  Wallet,
  TrendingUp,
  Calendar,
  Users,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

const Cashiering = () => {
  const { bookings, guests, fetchBookings, fetchGuests } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (fetchBookings) await fetchBookings();
      if (fetchGuests) await fetchGuests();
    };
    fetchData();
  }, []);

  // Get guest details for a booking
  const getGuestDetails = (booking) => {
    // For offline bookings, guest data is embedded in the booking record
    if (booking.source === 'offline' || booking.full_name) {
      return {
        full_name: booking.full_name,
        mobile: booking.mobile,
        email: booking.email,
        gender: booking.gender,
        nationality: booking.nationality,
        id_proof_type: booking.id_proof_type,
        id_proof_number: booking.id_proof_number,
        address: booking.address,
        city: booking.city,
        state: booking.state,
        pincode: booking.pincode,
        country: booking.country,
        guest_category: booking.guest_category,
        gst_no: booking.gst_no,
        company_name: booking.company_name
      };
    }
    
    // For online bookings, look up guest details from guests array
    return guests?.find(guest => 
      guest.guest_id === booking.guest_id || 
      guest.id === booking.guest_id || 
      guest._id === booking.guest_id
    ) || {};
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    const date = new Date(dateValue);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate total charges for a booking
  const calculateTotalCharges = (booking) => {
    let total = 0;
    
    // Calculate service charges
    if (booking.services) {
      Object.keys(booking.services).forEach(date => {
        if (Array.isArray(booking.services[date])) {
          booking.services[date].forEach(service => {
            total += (service.food_charges || 0) +
                    (service.minibar_charges || 0) +
                    (service.laundry_charges || 0) +
                    (service.extra_bed_charges || 0) +
                    (service.manual_charges || 0);
          });
        }
      });
    }
    
    return total;
  };

  // Get pending payment bookings (checked-in with outstanding balance)
  const pendingPaymentBookings = bookings?.filter(booking => 
    booking.status === 'Checked-in' || booking.status === 'checked-in'
  ) || [];

  // Filter bookings based on search
  const filteredBookings = pendingPaymentBookings.filter(booking => {
    const guest = getGuestDetails(booking);
    const guestName = guest.full_name || guest.name || guest.guest_name || '';
    const searchLower = searchTerm.toLowerCase();
    
    return (
      (booking.booking_id && booking.booking_id.toString().toLowerCase().includes(searchLower)) ||
      guestName.toLowerCase().includes(searchLower) ||
      (booking.room_id && booking.room_id.toString().toLowerCase().includes(searchLower)) ||
      (booking.room_type && booking.room_type.toLowerCase().includes(searchLower))
    );
  });

  // Handle payment processing
  const processPayment = async () => {
    if (!selectedBooking || !paymentAmount) {
      toast.error('Please select a booking and enter payment amount');
      return;
    }

    setLoading(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add transaction record
      const newTransaction = {
        id: Date.now(),
        booking_id: selectedBooking.booking_id,
        guest_name: getGuestDetails(selectedBooking).full_name || 'Guest',
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        timestamp: new Date(),
        type: 'payment'
      };
      
      setTransactions(prev => [newTransaction, ...prev]);
      
      toast.success(`Payment of ${formatCurrency(paymentAmount)} processed successfully`);
      setShowPaymentDialog(false);
      setSelectedBooking(null);
      setPaymentAmount('');
    } catch (error) {
      toast.error('Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  // Calculate today's stats
  const todayTransactions = transactions.filter(t => {
    const today = new Date().toDateString();
    return new Date(t.timestamp).toDateString() === today;
  });

  const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cashiering</h1>
        <p className="text-gray-600">Manage payments and financial transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(todayRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Receipt className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Transactions Today</p>
                <p className="text-2xl font-bold text-gray-900">{todayTransactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900">{pendingPaymentBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Average Transaction</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(todayTransactions.length > 0 ? todayRevenue / todayTransactions.length : 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Process Payments</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        </TabsList>

        {/* Process Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Guest/Booking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by booking ID, guest name, or room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Bookings List */}
          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No Pending Payments</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'No bookings match your search' : 'All payments are up to date'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredBookings.map((booking) => {
                const guest = getGuestDetails(booking);
                const serviceCharges = calculateTotalCharges(booking);
                const partialPayment = booking.partial_payment_amount || 0;

                return (
                  <Card key={booking.booking_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {guest.full_name || guest.name || guest.guest_name || 'Guest Name'}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Booking ID: {booking.booking_id}
                              </p>
                            </div>
                            <Badge variant="outline">
                              Room {booking.room_id || booking.room_number}
                            </Badge>
                            <Badge variant="secondary">
                              {booking.room_type}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                            <div>
                              <p className="text-gray-600">Check-in</p>
                              <p className="font-medium">{formatDate(booking.checkin_date)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Service Charges</p>
                              <p className="font-medium">{formatCurrency(serviceCharges)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Partial Payment</p>
                              <p className="font-medium">{formatCurrency(partialPayment)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Outstanding</p>
                              <p className="font-medium text-red-600">
                                {formatCurrency(serviceCharges - partialPayment)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Dialog open={showPaymentDialog && selectedBooking?.booking_id === booking.booking_id} 
                                  onOpenChange={setShowPaymentDialog}>
                            <DialogTrigger asChild>
                              <Button 
                                onClick={() => setSelectedBooking(booking)}
                                className="w-full"
                              >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Process Payment
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Process Payment</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Guest Name</Label>
                                  <Input 
                                    value={guest.full_name || guest.name || 'Guest'} 
                                    disabled 
                                  />
                                </div>
                                <div>
                                  <Label>Room</Label>
                                  <Input 
                                    value={`${booking.room_id || booking.room_number} - ${booking.room_type}`} 
                                    disabled 
                                  />
                                </div>
                                <div>
                                  <Label>Payment Method</Label>
                                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="cash">Cash</SelectItem>
                                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                                      <SelectItem value="upi">UPI</SelectItem>
                                      <SelectItem value="netbanking">Net Banking</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Payment Amount</Label>
                                  <Input
                                    type="number"
                                    placeholder="Enter amount"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                  />
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                  <p className="text-sm text-gray-600">Outstanding: {formatCurrency(serviceCharges - partialPayment)}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={processPayment} 
                                    disabled={loading}
                                    className="flex-1"
                                  >
                                    {loading ? 'Processing...' : 'Process Payment'}
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setShowPaymentDialog(false)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Transaction History Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No Transactions Yet</h3>
                  <p className="text-gray-600">Process your first payment to see transaction history</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-green-100 rounded-full">
                          {transaction.method === 'cash' ? <Banknote className="h-4 w-4 text-green-600" /> :
                           transaction.method === 'card' ? <CreditCard className="h-4 w-4 text-green-600" /> :
                           <Wallet className="h-4 w-4 text-green-600" />}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.guest_name}</p>
                          <p className="text-sm text-gray-600">
                            Booking: {transaction.booking_id} • {transaction.method.toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(transaction.amount)}</p>
                        <Button variant="ghost" size="sm">
                          <Printer className="h-4 w-4 mr-1" />
                          Print
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Cashiering;