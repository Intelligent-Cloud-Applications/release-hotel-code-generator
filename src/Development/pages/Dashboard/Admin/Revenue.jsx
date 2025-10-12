import {
  BookIcon,
  DollarSign,
  LucideBadgeDollarSign,
  X,
  CircleArrowDown,
  CircleArrowUp,
  IndianRupee,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, AreaChart, Area } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/Development/components/ui/card.js";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/Development/components/ui/chart.js";
import { useAppContext } from "@/Development/context/AppContext.jsx";
import { useEffect, useMemo } from "react";

const Revenue = () => {
  // const { bookings, fetchBookings } = useAppContext();
  const { payments } = useAppContext();

  // useEffect(() => {
  //   fetchBookings();
  // }, []);

  // Helper function to format chart data from bookings
  const formatChartData = useMemo(() => {
    if (!payments || payments.length === 0) {
      return {
        revenueData: [],
        satisfactionData: [],
        reservationData: [],
        totalRevenue: 0,
        totalBookings: 0,
        totalCancellations: 0,
        totalProfit: 0,
      };
    }

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // Initialize monthly data
    const monthlyData = {};
    monthNames.forEach((month) => {
      monthlyData[month] = {
        online: 0,
        offline: 0,
        checkIn: 0,
        checkOut: 0,
        revenue: 0,
      };
    });

    let totalRevenue = 0;
    let totalBookings = payments.length;
    let totalCancellations = 0;

    // Process bookings data
    payments.forEach((payment) => {
      const bookingDate = new Date(payment.updated_at);
      const monthName = monthNames[bookingDate.getMonth()];
      const amount = parseFloat(payment.amount) || 0;

      // Revenue calculation
      totalRevenue += amount;
      monthlyData[monthName].revenue += amount;

      // Online vs Offline bookings
      if (payment.payment_type === 'online') {
        monthlyData[monthName].online += amount;
      } else {
        monthlyData[monthName].offline += amount;
      }

      // // Check-in data
      // if (booking.checkInDate) {
      //   const checkInDate = new Date(booking.checkInDate);
      //   const checkInMonth = monthNames[checkInDate.getMonth()];
      //   monthlyData[checkInMonth].checkIn += 1;
      // }
      //
      // // Check-out data
      // if (booking.checkOutDate) {
      //   const checkOutDate = new Date(booking.checkOutDate);
      //   const checkOutMonth = monthNames[checkOutDate.getMonth()];
      //   monthlyData[checkOutMonth].checkOut += 1;
      // }
      //
      // // Count cancellations (assuming status 'cancelled' or similar)
      // if (booking.status === "cancelled") {
      //   totalCancellations += 1;
      // }
    });

    // Convert to chart format
    const revenueData = monthNames.map((month) => ({
      month,
      online: monthlyData[month].online,
      offline: monthlyData[month].offline,
    }));

    const satisfactionData = monthNames.map((month) => ({
      month,
      lastMonth: Math.floor(Math.random() * 300) + 50, // Placeholder for satisfaction data
      currentMonth: Math.floor(Math.random() * 250) + 80,
    }));

    const reservationData = monthNames.map((month) => ({
      month,
      checkIn: monthlyData[month].checkIn,
      checkOut: monthlyData[month].checkOut,
    }));

    return {
      revenueData,
      satisfactionData,
      reservationData,
      totalRevenue,
      totalBookings,
      totalCancellations,
      totalProfit: totalRevenue * 0.3, // Assuming 30% profit margin
    };
  }, [payments]);
  const revenueChartData = formatChartData.revenueData;

  const customerSatisfactionData = formatChartData.satisfactionData;

  const reservationData = formatChartData.reservationData;

  const revenueChartConfig = {
    online: {
      label: "Online",
      color: "hsl(var(--primary)",
    },
    offline: {
      label: "Offline",
      color: "hsl(var(--secondary)",
    },
  };

  const customerSatisfactionConfig = {
    lastMonth: {
      label: "Last Month",
      color: "hsl(var(--primary)",
    },
    currentMonth: {
      label: "Current Month",
      color: "hsl(var(--secondary)",
    },
  };

  const reservationConfig = {
    checkIn: {
      label: "Check In",
      color: "hsl(var(--primary)",
    },
    checkOut: {
      label: "Check Out",
      color: "hsl(var(--secondary)",
    },
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Today's Insights Panel */}
      <div className="bg-white p-6 rounded-lg">
        <div className="mb-4">
          <h1 className="font-semibold text-lg">Today's Insights</h1>
          <p className="text-sm text-gray-600">Sales Summary</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {" "}
          <div className="bg-gray-50 p-4 rounded border-l-4 border-green-500 flex flex-row items-center justify-between">
            <div className="flex flex-col">
              <h2 className="font-semibold">Total Revenue</h2>
              <p className="text-xl font-bold mt-1">
                ₹{formatChartData.totalRevenue.toFixed(2)}
              </p>
            </div>
            <IndianRupee className="text-gray-400" strokeWidth={1.3} />
          </div>
          <div className="bg-gray-50 p-4 rounded border-l-4 border-green-500 flex flex-row items-center justify-between">
            <div className="flex flex-col">
              <h2 className="font-semibold">Total Payments</h2>
              <p className="text-xl font-bold mt-1">
                {formatChartData.totalBookings}
              </p>
            </div>
            <BookIcon className="text-gray-400" strokeWidth={1.3} />
          </div>
          {/*<div className="bg-gray-50 p-4 rounded border-l-4 border-red-500 flex flex-row items-center justify-between">*/}
          {/*  <div className="flex flex-col">*/}
          {/*    <h2 className="font-semibold">Total Cancellations</h2>*/}
          {/*    <p className="text-xl font-bold mt-1">*/}
          {/*      {formatChartData.totalCancellations}*/}
          {/*    </p>*/}
          {/*  </div>*/}
          {/*  <X className="text-gray-400" strokeWidth={1.3} />*/}
          {/*</div>*/}
          <div className="bg-gray-50 p-4 rounded border-l-4 border-yellow-500 flex flex-row items-center justify-between">
            <div className="flex flex-col">
              <h2 className="font-semibold">Total Profit</h2>
              <p className="text-xl font-bold mt-1">
                ₹{formatChartData.totalProfit.toFixed(2)}
              </p>
            </div>
            <LucideBadgeDollarSign
              className="text-gray-400"
              strokeWidth={1.3}
            />
          </div>
        </div>
      </div>

      {/* Room Type Revenue Panel */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="col-span-2 shadow-none border-0">
          <CardHeader>
            <CardTitle className="font-semibold text-lg mb-4">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={revenueChartConfig}
              className="h-[15rem] w-full"
            >
              <BarChart accessibilityLayer data={revenueChartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dashed" />}
                />
                <Bar dataKey="online" fill="#5147e4" radius={4} />
                <Bar dataKey="offline" fill="#828cf7" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex flex-row items-center justify-center gap-4 text-sm">
            <div className="flex flex-row items-center">
              <span className="h-2 w-2 bg-primary rounded-full"></span>
              <span className="ml-2">Online</span>
            </div>
            <div className="flex flex-row items-center">
              <span className="h-2 w-2 bg-secondary rounded-full"></span>
              <span className="ml-2">Offline</span>
            </div>
          </CardFooter>
        </Card>

      {/*  <div className="col-span-3 grid grid-cols-2 gap-4">*/}
      {/*    <Card className="col-span-1 shadow-none border-0">*/}
      {/*      <CardHeader>*/}
      {/*        <CardTitle className="font-semibold text-lg mb-4">*/}
      {/*          Customer Satisfaction*/}
      {/*        </CardTitle>*/}
      {/*      </CardHeader>*/}
      {/*      <CardContent>*/}
      {/*        <ChartContainer*/}
      {/*          config={customerSatisfactionConfig}*/}
      {/*          className="h-[15rem] w-full"*/}
      {/*        >*/}
      {/*          <AreaChart*/}
      {/*            accessibilityLayer*/}
      {/*            data={customerSatisfactionData}*/}
      {/*            margin={{*/}
      {/*              top: 0,*/}
      {/*              right: 15,*/}
      {/*              left: 15,*/}
      {/*              bottom: 0,*/}
      {/*            }}*/}
      {/*          >*/}
      {/*            <CartesianGrid vertical={false} />*/}
      {/*            <XAxis*/}
      {/*              dataKey="month"*/}
      {/*              tickLine={false}*/}
      {/*              axisLine={false}*/}
      {/*              tickMargin={8}*/}
      {/*              tickFormatter={(value) => value.slice(0, 3)}*/}
      {/*            />*/}
      {/*            <ChartTooltip*/}
      {/*              cursor={false}*/}
      {/*              content={<ChartTooltipContent indicator="dot" />}*/}
      {/*            />*/}
      {/*            <Area*/}
      {/*              dataKey="lastMonth"*/}
      {/*              type="natural"*/}
      {/*              fill="var(--primary)"*/}
      {/*              fillOpacity={0.4}*/}
      {/*              stroke="var(--primary)"*/}
      {/*              stackId="a"*/}
      {/*            />*/}
      {/*            <Area*/}
      {/*              dataKey="currentMonth"*/}
      {/*              type="natural"*/}
      {/*              fill="var(--secondary)"*/}
      {/*              fillOpacity={0.4}*/}
      {/*              stroke="var(--secondary)"*/}
      {/*              stackId="a"*/}
      {/*            />*/}
      {/*          </AreaChart>*/}
      {/*        </ChartContainer>*/}
      {/*      </CardContent>{" "}*/}
      {/*      <CardFooter className="flex flex-row items-center justify-center gap-6 text-sm">*/}
      {/*        <div className="flex flex-row items-center gap-4">*/}
      {/*          <span className="h-1 w-4 bg-primary rounded-full"></span>*/}
      {/*          <div className="flex flex-col ">*/}
      {/*            <span className="">Last Month</span>*/}
      {/*            <span className="text-primary font-semibold">*/}
      {/*              {customerSatisfactionData.length > 0*/}
      {/*                ? customerSatisfactionData[*/}
      {/*              customerSatisfactionData.length - 2*/}
      {/*                ]?.lastMonth || 0*/}
      {/*                : 0}*/}
      {/*            </span>*/}
      {/*          </div>*/}
      {/*        </div>*/}

      {/*        <div className="flex flex-row items-center gap-4">*/}
      {/*          <span className="h-1 w-4 bg-secondary rounded-full"></span>*/}
      {/*          <div className="flex flex-col">*/}
      {/*            <span className="">Current Month</span>*/}
      {/*            <span className="text-secondary font-semibold">*/}
      {/*              {customerSatisfactionData.length > 0*/}
      {/*                ? customerSatisfactionData[*/}
      {/*              customerSatisfactionData.length - 1*/}
      {/*                ]?.currentMonth || 0*/}
      {/*                : 0}*/}
      {/*            </span>*/}
      {/*          </div>*/}
      {/*        </div>*/}
      {/*      </CardFooter>*/}
      {/*    </Card>*/}
      {/*    <Card className="col-span-1 shadow-none border-0">*/}
      {/*      <CardHeader>*/}
      {/*        <CardTitle className="font-semibold text-lg mb-4">*/}
      {/*          Reservation Stats*/}
      {/*        </CardTitle>*/}
      {/*      </CardHeader>*/}
      {/*      <CardContent>*/}
      {/*        <ChartContainer*/}
      {/*          config={reservationConfig}*/}
      {/*          className="h-[10rem] w-full"*/}
      {/*        >*/}
      {/*          <BarChart accessibilityLayer data={reservationData}>*/}
      {/*            <CartesianGrid vertical={false} />*/}
      {/*            <XAxis*/}
      {/*              dataKey="month"*/}
      {/*              tickLine={false}*/}
      {/*              tickMargin={10}*/}
      {/*              axisLine={false}*/}
      {/*              tickFormatter={(value) => value.slice(0, 3)}*/}
      {/*            />*/}
      {/*            <ChartTooltip*/}
      {/*              cursor={false}*/}
      {/*              content={<ChartTooltipContent indicator="dashed" />}*/}
      {/*            />*/}
      {/*            <Bar dataKey="checkIn" fill="var(--primary)" radius={4} />*/}
      {/*            <Bar dataKey="checkOut" fill="var(--secondary)" radius={4} />*/}
      {/*          </BarChart>*/}
      {/*        </ChartContainer>*/}
      {/*      </CardContent>{" "}*/}
      {/*      <CardFooter className="flex flex-col items-start justify-start gap-4 text-sm">*/}
      {/*        <div className="flex flex-row items-center gap-4">*/}
      {/*          <span className="h-10 w-10 bg-primary/20 rounded-lg flex items-center justify-center">*/}
      {/*            <CircleArrowUp stroke="var(--primary)" />*/}
      {/*          </span>*/}
      {/*          <div className="w-[10rem]">*/}
      {/*            <h2 className="font-semibold">Check In</h2>*/}
      {/*            <p className="text-[12px] text-gray-600">Total Average</p>*/}
      {/*          </div>*/}
      {/*          <span className="text-primary font-semibold">*/}
      {/*            {reservationData.reduce((acc, data) => acc + data.checkIn, 0)}*/}
      {/*          </span>*/}
      {/*        </div>*/}
      {/*        <div className="flex flex-row items-center gap-4">*/}
      {/*          <span className="h-10 w-10 bg-secondary/20 rounded-lg flex items-center justify-center">*/}
      {/*            <CircleArrowDown className="stroke-secondary" />*/}
      {/*          </span>*/}
      {/*          <div className="w-[10rem]">*/}
      {/*            <h2 className="font-semibold">Check Out</h2>*/}
      {/*            <p className="text-[12px] text-gray-600">Total Average</p>*/}
      {/*          </div>*/}
      {/*          <span className="text-secondary font-semibold">*/}
      {/*            {reservationData.reduce(*/}
      {/*              (acc, data) => acc + data.checkOut,*/}
      {/*              0*/}
      {/*            )}*/}
      {/*          </span>*/}
      {/*        </div>*/}
      {/*      </CardFooter>*/}
      {/*    </Card>*/}
      {/*  </div>*/}
      </div>

      {/* <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="font-semibold text-lg mb-4">Revenue Trends</h2>
        <div className="grid grid-cols-1 h-64">

          <div className="bg-gray-50 flex items-center justify-center">
            <p className="text-gray-500">
              Revenue trends chart will be displayed here
            </p>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default Revenue;