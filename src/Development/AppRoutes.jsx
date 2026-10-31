/*
 * Role-Based Access Control (RBAC) Implementation
 *
 * User Types and Access Permissions:
 *
 * 1. ADMIN:
 *    - Full access to all modules
 *    - Admin panel (guest_list, room_list, staff_list, revenue, reports)
 *    - FrontDesk operations
 *    - Housekeeping operations
 *    - Reports, Lookups, Settings
 *
 * 2. FRONTDESK:
 *    - FrontDesk operations (bookings, check-in/out, room management)
 *    - Registrations
 *    - Guest History
 *    - Cashiering
 *    - Day End operations
 *    - Profile
 *
 * 3. HOUSEKEEPING:
 *    - Housekeeping operations (room status management)
 *    - Profile
 *
 * Access Control Implementation:
 * - ProtectedRoute: Ensures user is authenticated
 * - RoleBasedRoute: Checks user role and restricts access based on allowedRoles
 * - Unauthorized access redirects to appropriate dashboard based on user type
 */

import { Routes, Route, Navigate } from "react-router";
import Home1 from "./pages/Home1.jsx";
import Home2 from "./pages/Home2.jsx";
import AboutUs1 from "../Development/components/template1/AboutUs.jsx";
import AboutUs2 from "./pages/AboutUs.jsx";
import Login from "@/Development/pages/Auth/Login.jsx";
import LogOut from "@/Development/pages/Auth/Logout.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import FrontDeskLayout from "./layouts/FrontDeskLayout.jsx";
import RegistrationsLayout from "./layouts/RegistrationsLayout.jsx";
import RoomList from "./pages/Dashboard/FrontDesk/RoomList.jsx";
import AmendBooking from "./pages/Dashboard/FrontDesk/AmendBooking.jsx";
import CancelBooking from "./pages/Dashboard/FrontDesk/CancelBooking.jsx";
import FrontDesk from "./pages/Dashboard/FrontDesk/FrontDesk.jsx";
import AvailabilityForecaster from "./pages/Dashboard/FrontDesk/AvailabilityForecaster.jsx";
import NewBooking from "./pages/Dashboard/Registrations/NewBooking.jsx";
import AdminReports from "./pages/Dashboard/Admin/Reports.jsx";
import Registrations from "./pages/Dashboard/Registrations/Registrations.jsx";
import GuestHistory from "./pages/Dashboard/Guest History/GuestHistory.jsx";
import Cashiering from "./pages/Dashboard/Cashiering/Cashiering.jsx";
import Reports from "./pages/Dashboard/Reports/Reports.jsx";
import Report from "./pages/common/Report.jsx";
import ReportGenerator from "./pages/Dashboard/Reports/ReportGenerator.jsx";
import DayEnd from "./pages/Dashboard/DayEnd/DayEnd.jsx";
import Lookups from "./pages/Dashboard/Lookups/Lookups.jsx";
import HousekeepingLayout from "@/Development/layouts/HousekeepingLayout.jsx";
import RoomStatusList from "@/Development/pages/Dashboard/Housekeeping/RoomStatusList/index.jsx";
import AdminLayout from "@/Development/layouts/AdminLayout.jsx";
import Guests from "@/Development/pages/Dashboard/Admin/Guests.jsx";
import Rooms from "@/Development/pages/Dashboard/Admin/Rooms/index.jsx";
import Staffs from "@/Development/pages/Dashboard/Admin/Staffs.jsx";
import RatePlans from "@/Development/pages/Dashboard/Admin/RatePlans/index.jsx";
import Revenue from "@/Development/pages/Dashboard/Admin/Revenue.jsx";
import Profile from "./pages/Dashboard/Profile.jsx";
import Settings from "./pages/Dashboard/Settings.jsx";
import Bill from "./pages/Dashboard/Registrations/Bill.jsx";
import BillView from "./pages/Dashboard/Registrations/BillView.jsx";
import Contact1 from "../Development/components/template1/Contact.jsx";
import Contact2 from "./pages/Contact.jsx";
import Faq from "@/Development/pages/Faq.jsx";
import Legal from "@/Development/pages/Legal.jsx";
import Privacy from "@/Development/pages/Privacy.jsx";
import Services from "@/Development/pages/Services.jsx";
import Blogs from "@/Development/pages/Blogs.jsx";
import CheckOut from "./pages/Dashboard/Registrations/CheckOut.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RoleBasedRoute from "./components/RoleBasedRoute.jsx";
import { product } from "../Operation/data.json";
import Bookings from "./pages/Dashboard/Bookings.jsx";
import SubscribeNow from "./components/ui/SubscribeNow.jsx";
import HomeBooking from "./pages/HomeBooking.jsx";
import Company from "./pages/Dashboard/Company/index.jsx";
import CompanyTransactions from "@/Development/pages/Dashboard/Company/Transactions.jsx";
import Expenses from "./pages/Dashboard/Expenses/Expenses.jsx";
import CheckIn from "./pages/Dashboard/Registrations/checkin/index.jsx";
import LoadingDemo from "./pages/LoadingDemo.jsx";
import RoomsPage from "@/Development/pages/Rooms.jsx";
import Restaurant from "@/Development/pages/Restaurant.jsx";
import Store from "./pages/Dashboard/Store/Store.jsx";
import { template } from "../Operation/data.json";
import Accounting from "./pages/Dashboard/Accounting/Accounting.jsx";
import AccountingLayout from "./layouts/AccountingLayout.jsx";
import BillPosting from "./pages/Dashboard/Accounting/BillPosting.jsx";
import CashEntry from "./pages/Dashboard/Accounting/CashEntry.jsx";
import RevenuePosting from "./pages/Dashboard/Accounting/RevenuePosting.jsx";
import DailyRevenue from "./pages/Dashboard/Accounting/DailyRevenue.jsx";
import LaundryPage from "./pages/Dashboard/Laundry/index.jsx";
import { useAuthContext } from "@/Development/context/AuthContext.jsx";

const DashboardIndexRedirect = () => {
  const { userData } = useAuthContext();
  const userType = userData?.userType || "frontdesk";
  const routes = {
    admin: "/dashboard/admin/room_list",
    frontdesk: "/dashboard/frontdesk",
    housekeeping: "/dashboard/housekeeping/room_status_list",
    accountant: "/dashboard/accounting/cash-entry",
    laundry: "/dashboard/laundry",
    store: "/dashboard/store",
  };
  return <Navigate to={routes[userType] || "/dashboard/frontdesk"} replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={template === "template1" ? <Home1 /> : <Home2 />}
      />
      <Route
        path="/about"
        element={template === "template1" ? <AboutUs1 /> : <AboutUs2 />}
      />
      <Route path="/rooms" element={<RoomsPage />} />
      <Route path="/restaurant" element={<Restaurant />} />
      <Route path="/book-now" element={<HomeBooking />} />
      <Route path="/blogs" element={<Blogs />} />
      <Route
        path="/contact"
        element={template === "template1" ? <Contact1 /> : <Contact2 />}
      />
      <Route path="/faq" element={<Faq />} />
      <Route path="/legal" element={<Legal />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/services" element={<Services />} />
      <Route path="/loading-demo" element={<LoadingDemo />} />
      <Route path="/login" element={<Login />} />
      <Route path="/logout" element={<LogOut />} />
      <Route path="/bill" element={<BillView />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardIndexRedirect />} />
        <Route
          path="/dashboard/bookings"
          element={
            product === "booking" ? (
              <Bookings />
            ) : (
              <Navigate to="/dashboard/frontdesk" />
            )
          }
        />

        <Route
          path="/dashboard/frontdesk"
          element={
            <RoleBasedRoute allowedRoles={["frontdesk", "admin"]}>
              {product === "dashboard-booking" ? (
                <FrontDeskLayout />
              ) : (
                <SubscribeNow />
              )}
            </RoleBasedRoute>
          }
        >
          <Route path="/dashboard/frontdesk" element={<FrontDesk />} />
          <Route path="/dashboard/frontdesk/room_list" element={<RoomList />} />
          <Route
            path="/dashboard/frontdesk/new_booking"
            element={<NewBooking />}
          />
          <Route
            path="/dashboard/frontdesk/amend_booking"
            element={<AmendBooking />}
          />
          <Route
            path="/dashboard/frontdesk/cancel_booking"
            element={<CancelBooking />}
          />
          <Route path="/dashboard/frontdesk/check_in" element={<CheckIn />} />
          <Route path="/dashboard/frontdesk/check_out" element={<CheckOut />} />
          <Route path="/dashboard/frontdesk/bill" element={<Bill />} />
          <Route
            path="/dashboard/frontdesk/availability"
            element={<Navigate to="/dashboard/frontdesk/room_list" replace />}
          />
          <Route
            path="/dashboard/frontdesk/forecaster"
            element={<Navigate to="/dashboard/frontdesk/room_list" replace />}
          />
        </Route>

        {/* Registrations */}
        <Route
          path="/dashboard/registrations"
          element={
            <RoleBasedRoute allowedRoles={["frontdesk", "admin"]}>
              {product === "dashboard-booking" ? (
                <RegistrationsLayout />
              ) : (
                <SubscribeNow />
              )}
            </RoleBasedRoute>
          }
        >
          <Route path="/dashboard/registrations" element={<Registrations />} />
          <Route
            path="/dashboard/registrations/new_booking"
            element={<NewBooking />}
          />
          <Route
            path="/dashboard/registrations/check_in"
            element={<CheckIn />}
          />
          <Route
            path="/dashboard/registrations/check_out"
            element={<CheckOut />}
          />
          <Route path="/dashboard/registrations/bill" element={<Bill />} />
          <Route
            path="/dashboard/registrations/availability"
            element={<AvailabilityForecaster />}
          />
          <Route
            path="/dashboard/registrations/forecaster"
            element={<AvailabilityForecaster />}
          />
        </Route>

        {/* Guest History */}
        <Route
          path="/dashboard/guest_history"
          element={
            <RoleBasedRoute allowedRoles={["frontdesk", "admin"]}>
              {product === "dashboard-booking" ? (
                <GuestHistory />
              ) : (
                <SubscribeNow />
              )}
            </RoleBasedRoute>
          }
        />

        <Route
          path="/dashboard/accounting"
          element={
            <RoleBasedRoute allowedRoles={["admin", "accountant"]}>
              {product === "dashboard-booking" ? (
                <AccountingLayout />
              ) : (
                <SubscribeNow />
              )}
            </RoleBasedRoute>
          }
        >
          <Route index element={<Accounting />} />
          <Route path="cash-entry" element={<CashEntry />} />
          <Route path="revenue-posting" element={<RevenuePosting />} />
          <Route path="bill-posting" element={<BillPosting />} />

          <Route path="daily-revenue" element={<DailyRevenue />} />
        </Route>

        <Route
          path="/dashboard/company"
          element={
            <RoleBasedRoute allowedRoles={["frontdesk", "admin"]}>
              <Company />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/dashboard/company/:id"
          element={
            <RoleBasedRoute allowedRoles={["frontdesk", "admin"]}>
              <CompanyTransactions />
            </RoleBasedRoute>
          }
        />

        {/* Cashiering */}
        <Route
          path="/dashboard/cashiering"
          element={
            <RoleBasedRoute allowedRoles={["frontdesk", "admin"]}>
              {product === "dashboard-booking" ? (
                <Cashiering />
              ) : (
                <SubscribeNow />
              )}
            </RoleBasedRoute>
          }
        />

        {/* Cashiering */}
        <Route
          path="/dashboard/cashiering"
          element={
            <RoleBasedRoute allowedRoles={["frontdesk", "admin"]}>
              {product === "dashboard-booking" ? (
                <Cashiering />
              ) : (
                <SubscribeNow />
              )}
            </RoleBasedRoute>
          }
        />

        {/* Reports */}
        <Route
          path="/dashboard/reports"
          element={
            <RoleBasedRoute allowedRoles={["admin", "frontdesk", "laundry", "store"]}>
              {product === "dashboard-booking" ? (
                <ReportGenerator />
              ) : (
                <SubscribeNow />
              )}
            </RoleBasedRoute>
          }
        />

        {/* Expenses */}
        <Route
          path="/dashboard/expenses"
          element={
            <RoleBasedRoute allowedRoles={["admin", "frontdesk"]}>
              {product === "dashboard-booking" ? (
                <Expenses />
              ) : (
                <SubscribeNow />
              )}
            </RoleBasedRoute>
          }
        />

        {/* Store */}
        <Route
          path="/dashboard/store"
          element={
            <RoleBasedRoute allowedRoles={["admin", "frontdesk", "store"]}>
              {product === "dashboard-booking" ? <Store /> : <SubscribeNow />}
            </RoleBasedRoute>
          }
        />

        {/* Laundry Management & Granular Billing */}
        <Route
          path="/dashboard/laundry"
          element={
            <RoleBasedRoute allowedRoles={["laundry", "admin"]}>
              {product === "dashboard-booking" ? (
                <LaundryPage />
              ) : (
                <SubscribeNow />
              )}
            </RoleBasedRoute>
          }
        />

        {/* Report Generator - for exported data */}
        <Route
          path="/dashboard/report-generator"
          element={
            <RoleBasedRoute allowedRoles={["admin", "frontdesk"]}>
              {product === "dashboard-booking" ? <Report /> : <SubscribeNow />}
            </RoleBasedRoute>
          }
        />

        {/* Day end */}
        <Route
          path="/dashboard/dayend"
          element={
            <RoleBasedRoute allowedRoles={["frontdesk", "admin"]}>
              {product === "dashboard-booking" ? <DayEnd /> : <SubscribeNow />}
            </RoleBasedRoute>
          }
        />

        {/* Lookups */}

        <Route
          path="/dashboard/lookups"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              {product === "dashboard-booking" ? <Lookups /> : <SubscribeNow />}
            </RoleBasedRoute>
          }
        />

        <Route path="*" element={<h1>Page Not Found</h1>} />

        {/* Housekeeping */}
        <Route
          path="/dashboard/housekeeping"
          element={
            <RoleBasedRoute
              allowedRoles={["housekeeping", "admin", "frontdesk"]}
            >
              {product === "dashboard-booking" ? (
                <HousekeepingLayout />
              ) : (
                <SubscribeNow />
              )}
            </RoleBasedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard/housekeeping/room_status_list" replace />} />
          <Route
            path="/dashboard/housekeeping/room_status_list"
            element={<RoomStatusList />}
          />
        </Route>

        {/*Admin*/}
        <Route
          path="/dashboard/admin"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              {product === "dashboard-booking" ? (
                <AdminLayout />
              ) : (
                <SubscribeNow />
              )}
            </RoleBasedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard/admin/room_list" replace />} />
          <Route path="/dashboard/admin/guest_list" element={<Guests />} />
          <Route path="/dashboard/admin/room_list" element={<Rooms />} />
          <Route path="/dashboard/admin/staff_list" element={<Staffs />} />
          {/* <Route path="/dashboard/admin/revenue" element={<Revenue />} /> */}
          <Route path="/dashboard/admin/guest_list" element={<Guests />} />
          <Route path="/dashboard/admin/room_list" element={<Rooms />} />
          <Route path="/dashboard/admin/staff_list" element={<Staffs />} />
          <Route path="/dashboard/admin/rate_plans" element={<RatePlans />} />
          <Route path="/dashboard/admin/revenue" element={<AdminReports />} />
          <Route
            path="/dashboard/admin/reports"
            element={
              <RoleBasedRoute allowedRoles={["admin", "frontdesk"]}>
                {product === "dashboard-booking" ? (
                  <ReportGenerator />
                ) : (
                  <SubscribeNow />
                )}
              </RoleBasedRoute>
            }
          />
        </Route>

        <Route
          path="/dashboard/profile"
          element={
            <RoleBasedRoute
              allowedRoles={["frontdesk", "housekeeping", "admin"]}
            >
              <Profile />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/dashboard/settings"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              {product === "dashboard-booking" ? (
                <Settings />
              ) : (
                <SubscribeNow />
              )}
            </RoleBasedRoute>
          }
        />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
