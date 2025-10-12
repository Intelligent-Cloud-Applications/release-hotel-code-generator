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
import Home from "./pages/Home.jsx";
import AboutUs from "./pages/AboutUs.jsx";
import Login from "@/Development/pages/Auth/Login.jsx";
import LogOut from "@/Development/pages/Auth/Logout.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import FrontDeskLayout from "./layouts/FrontDeskLayout.jsx";
import RegistrationsLayout from "./layouts/RegistrationsLayout.jsx";
import RoomList from "./pages/Dashboard/FrontDesk/RoomList.jsx";
import AmendBooking from "./pages/Dashboard/FrontDesk/AmendBooking.jsx";
import CancelBooking from "./pages/Dashboard/FrontDesk/CancelBooking.jsx";
import FrontDesk from "./pages/Dashboard/FrontDesk/FrontDesk.jsx";
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
import Revenue from "@/Development/pages/Dashboard/Admin/Revenue.jsx";
import Profile from "./pages/Dashboard/Profile.jsx";
import Settings from "./pages/Dashboard/Settings.jsx";
import Bill from "./pages/Dashboard/Registrations/Bill.jsx";
import BillView from "./pages/Dashboard/Registrations/BillView.jsx";
import Contact from "./pages/Contact.jsx";
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

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/rooms" element={<RoomsPage />} />
      <Route path="/restaurant" element={<Restaurant />} />
      <Route path="/book-now" element={<HomeBooking />} />
      <Route path="/blogs" element={<Blogs />} />
      <Route path="/contact" element={<Contact />} />
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
            <RoleBasedRoute allowedRoles={["admin", "frontdesk"]}>
              {product === "dashboard-booking" ? <ReportGenerator /> : <SubscribeNow />}
            </RoleBasedRoute>
          }
        />

        {/* Expenses */}
        <Route
          path="/dashboard/expenses"
          element={
            <RoleBasedRoute allowedRoles={["admin", "frontdesk"]}>
              {product === "dashboard-booking" ? <Expenses /> : <SubscribeNow />}
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
            <RoleBasedRoute allowedRoles={["housekeeping", "admin", "frontdesk"]}>
              {product === "dashboard-booking" ? (
                <HousekeepingLayout />
              ) : (
                <SubscribeNow />
              )}
            </RoleBasedRoute>
          }
        >
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
          <Route path="/dashboard/admin/guest_list" element={<Guests />} />
          <Route path="/dashboard/admin/room_list" element={<Rooms />} />
          <Route path="/dashboard/admin/staff_list" element={<Staffs />} />
          {/* <Route path="/dashboard/admin/revenue" element={<Revenue />} /> */}
          <Route path="/dashboard/admin/guest_list" element={<Guests />} />
          <Route path="/dashboard/admin/room_list" element={<Rooms />} />
          <Route path="/dashboard/admin/staff_list" element={<Staffs />} />
          <Route path="/dashboard/admin/revenue" element={<AdminReports />} />
          <Route
          path="/dashboard/admin/reports"
          element={
            <RoleBasedRoute allowedRoles={["admin", "frontdesk"]}>
              {product === "dashboard-booking" ? <ReportGenerator /> : <SubscribeNow />}
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
