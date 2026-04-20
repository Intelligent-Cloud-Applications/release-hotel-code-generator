import { createContext, useContext, useEffect, useState, useRef } from "react";
import { get, post, patch, put, del } from "aws-amplify/api";
import { useAuthContext } from "./AuthContext.jsx";
import { institutionId, product, template } from "../../Operation/data.json";

const AppContext = createContext({});

export const useAppContext = () => {
  return useContext(AppContext);
};

export const AppContextProvider = ({ children }) => {
  const { userData } = useAuthContext();
  const [rooms, setRooms] = useState([]);
  const [ratePlans, setRatePlans] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [guests, setGuests] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [bills, setBills] = useState([]);
  const [institutionData, setInstitutionData] = useState(null);
  const [orders, setOrders] = useState({
    food: [],
    laundry: [],
    minibar: [],
    manual: [],
    extra_bed: [],
  });
  const [notifications, setNotifications] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [restaurantOrders, setRestaurantOrders] = useState([]);

  // Store notification timeouts to clear them if needed
  const notificationTimeoutsRef = useRef([]);

  async function fetchInstitutionData() {
    setLoading(true);
    setError(null);

    try {
      const response = await get({
        apiName: "common",
        path: `/any/${institutionId}/get-institution-data`,
      }).response;

      console.log("Response received:", response);

      const data = await response.body.json();
      console.log("Institution data fetched:", data);
      if (template === "template1") {
        setInstitutionData(data.template1);
      } else if (template === "template2") {
        setInstitutionData(data.template2);
      }
    } catch (error) {
      console.log("Error fetching institution data:", error);
      console.error("Full error details:", error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }

  async function updateInstitutionData() {
    try {
      console.log("Updating institution data:", institutionData);
      const restOperation = await put({
        apiName: "common",
        path: `/any/${institutionId}/update-institution-data`,
        options: {
          body: institutionData,
        },
      });
      const response = await restOperation.response;
      const data = await response.body.json();
      console.log("API Response (Institution):", data);
      setInstitutionData(data);
      setError(null);
    } catch (error) {
      console.error("Error updating institution data:", error);
      setError("Failed to update institution data");
    }
  }

  async function handleDailyEnd() {
    try {
      const { body } = await post({
        apiName: "common",
        path: `/report/daily-end`,
        options: {
          body: {
            date: new Date().toISOString(),
            institutionId: institutionId,
          },
        },
      }).response;
      const data = await body.json();
      console.log("Daily end processed:", data);
    } catch (error) {
      console.error("Error handling daily end:", error);
      setError("Failed to handle daily end");
    }
  }

  // Rooms Section
  async function fetchRooms() {
    setLoading(true);
    setError(null);
    try {
      const { body } = await get({
        apiName: "common",
        path: `/rooms?institutionId=${institutionId}`,
      }).response;
      const data = await body.json();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setError("Failed to fetch rooms");
    } finally {
      setLoading(false);
    }
  }

  async function getRoom(roomId) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await get({
        apiName: "common",
        path: `/rooms/${roomId}`,
        options: {
          queryParams: { institutionId: institutionId },
        },
      }).response;
      const data = await body.json();
      return { success: true, data: data.room };
    } catch (error) {
      console.error("Error fetching room:", error);
      setError("Failed to fetch room");
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }

  async function createRoom(roomData) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await post({
        apiName: "common",
        path: "/rooms",
        options: {
          queryParams: { institutionId: institutionId },
          body: {
            ...roomData,
            tariff: Number(roomData.tariff) || 0,
          },
        },
      }).response;
      const data = await body.json();
      setRooms([...rooms, data.room]);
    } catch (error) {
      console.error("Error creating room:", error);
      setError("Failed to create room");
    } finally {
      setLoading(false);
    }
  }

  async function updateRoom(roomData) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await put({
        apiName: "common",
        path: "/rooms/" + roomData.room_id,
        options: {
          queryParams: { institutionId: institutionId },
          body: {
            ...roomData,
            room_id: undefined,
            tariff: Number(roomData.tariff) || 0,
          },
        },
      }).response;
      const data = await body.json();
      setRooms(
        rooms.map((room) =>
          room.room_id === roomData.room_id ? { ...room, ...data.room } : room
        )
      );
    } catch (error) {
      console.error("Error updating room:", error);
      setError("Failed to update room");
    } finally {
      setLoading(false);
    }
  }

  async function updateRoomStatus(roomId, status) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await patch({
        apiName: "common",
        path: `/rooms/${roomId}/status`,
        options: {
          body: { status },
          queryParams: { institutionId: institutionId },
        },
      }).response;
      const data = await body.json();

      // Update local state
      setRooms(
        rooms.map((room) =>
          room.room_id === roomId ? { ...room, status } : room
        )
      );

      return { success: true, data };
    } catch (error) {
      console.error("Error updating room status:", error);
      setError("Failed to update room status");
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }

  async function updatePaymentMethod({bill_id, paymentMethod}) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await put({
        apiName: "frontdesk",
        path: `/resettlement/${bill_id}`,
        options: {
          queryParams: {
            institutionId: institutionId,
            paymentMethod: paymentMethod,
          },
        },
      }).response;
    } catch (error) {
      console.error("Error updating payment method:", error);
      setError("Failed to update payment method");
    } finally {
      setLoading(false);
    }
  }

  async function deleteRoom(roomId) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await del({
        apiName: "common",
        path: `/rooms/${roomId}`,
        options: {
          queryParams: { institutionId: institutionId },
        },
      }).response;
      await body.json();
      setRooms(rooms.filter((room) => room.room_id !== roomId));
    } catch (error) {
      console.error("Error deleting room:", error);
      setError("Failed to delete room");
    } finally {
      setLoading(false);
    }
  }

  // Rate Plans Sections
  async function fetchRatePlans() {
    setLoading(true);
    setError(null);
    try {
      const { body } = await get({
        apiName: "common",
        path: `/rate-plans?institutionId=${institutionId}`,
      }).response;
      const data = await body.json();
      setRatePlans(data.ratePlans || []);
    } catch (error) {
      console.error("Error fetching rate plans:", error);
      setError("Failed to fetch rate plans");
    } finally {
      setLoading(false);
    }
  }

  async function createRatePlan(ratePlanData) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await post({
        apiName: "common",
        path: "/rate-plans",
        options: {
          queryParams: { institutionId: institutionId },
          body: {
            ...ratePlanData,
            base_tariff: Number(ratePlanData.base_tariff) || 0,
            tariff_variation: Number(ratePlanData.tariff_variation) || 0,
          },
        },
      }).response;
      const data = await body.json();
      setRatePlans([...ratePlans, data.ratePlan]);
    } catch (error) {
      console.error("Error creating rate plan:", error);
      setError("Failed to create rate plan");
    } finally {
      setLoading(false);
    }
  }

  async function updateRatePlan(ratePlanData) {
    setLoading(true);
    setError(null);
    try {
      const { plan_id, ...updateData } = ratePlanData;
      const { body } = await put({
        apiName: "common",
        path: "/rate-plans/" + plan_id,
        options: {
          queryParams: { institutionId: institutionId },
          body: {
            ...updateData,
            ...(updateData.base_tariff !== undefined && { base_tariff: Number(updateData.base_tariff) }),
            ...(updateData.tariff_variation !== undefined && { tariff_variation: Number(updateData.tariff_variation) }),
          },
        },
      }).response;
      const data = await body.json();
      setRatePlans(
        ratePlans.map((plan) =>
          plan.plan_id === plan_id ? { ...plan, ...data.ratePlan } : plan
        )
      );
    } catch (error) {
      console.error("Error updating rate plan:", error);
      setError("Failed to update rate plan");
    } finally {
      setLoading(false);
    }
  }

  async function deleteRatePlan(ratePlanId) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await del({
        apiName: "common",
        path: `/rate-plans/${ratePlanId}`,
        options: {
          queryParams: { institutionId: institutionId },
        },
      }).response;
      await body.json();
      setRatePlans(ratePlans.filter((plan) => plan.plan_id !== ratePlanId));
    } catch (error) {
      console.error("Error deleting rate plan:", error);
      setError("Failed to delete rate plan");
    } finally {
      setLoading(false);
    }
  }

  async function checkInGuest({ checkInData }) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await post({
        apiName: "frontdesk",
        path: "/checkin",
        options: {
          body: {
            ...checkInData,
            institutionId: institutionId,
          },
          queryParams: {
            institutionId: institutionId,
          },
        },
      }).response;
      let data;
      try {
        data = await body.json();
      } catch (e) {
        // If parsing fails, just return (assume success)
        return;
      }
      // Accept either top-level guest_id or booking_id or success as success
      if (data && (data.guest_id || data.booking_id || data.success)) {
        return data.guest_id || data.booking_id || data.success;
      }
      // If no expected property, just return (assume success)
      return;
    } catch (error) {
      console.error("Error checking in guest:", error);
      setError("Failed to check in guest");
      throw error;
    } finally {
      fetchGuests(); // Refresh guests after check-in
      fetchBookings(); // Refresh bookings after check-in
      setLoading(false);
    }
  }

  async function amendBooking({ bookingId, bookingData, guestData }) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await put({
        apiName: "frontdesk",
        path: `/offline/amend-booking/${bookingId}`,
        options: {
          body: {
            bookingData,
            guestData,
            institutionId: institutionId,
          },
          queryParams: {
            institutionId: institutionId,
          },
        },
      }).response;
      const data = await body.json();
      return data.booking.booking_id; // Return the amended booking ID
    } catch (error) {
      console.error("Error amending booking:", error);
      setError("Failed to amend booking");
      throw error; // Re-throw error to be handled by caller
    } finally {
      fetchBookings(); // Refresh bookings after amendment
      setLoading(false);
    }
  }

  // Bookings Sections
  async function fetchBookings() {
    setLoading(true);
    setError(null);
    try {
      const { body } = await get({
        apiName: "frontdesk",
        path: `/reservations`,
        options: {
          queryParams: { institutionId: institutionId },
        },
      }).response;
      const data = await body.json();
      setBookings(data.reservations || []);
      return data.reservations || [];
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setError("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  }

  async function updateBooking({
    bookingData,
    guestData,
    bookingId,
    versionHistory,
  }) {
    setLoading(true);
    setError(null);

    console.log("Updating booking:", bookingId, bookingData);

    try {
      const { body } = await put({
        apiName: "frontdesk",
        path: `/reservations/${bookingId}?institutionId=${institutionId}`,
        options: {
          body: {
            bookingData,
            guestData,
            institutionId: institutionId,
            versionHistory,
          },
          queryParams: {
            institutionId: institutionId,
          },
        },
      }).response;
      const data = await body.json();
      setBookings((prev) =>
        prev.map((booking) =>
          booking.booking_id === data.booking.booking_id
            ? data.booking
            : booking
        )
      );
      return { success: true, data };
    } catch (error) {
      console.error("Error updating booking:", error);
      setError("Failed to update booking");
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }

  async function updateBookingServices(booking_id, services) {
    setLoading(true);
    setError(null);
    try {
      // If the payload passed in is already the final object (with booking_id, institutionId, services), use as is
      let payload;
      if (
        services &&
        typeof services === "object" &&
        "services" in services &&
        "booking_id" in services &&
        "institutionId" in services
      ) {
        // Remove booking_id and institutionId from inside services if present
        const cleanedServices = { ...services.services };
        delete cleanedServices.booking_id;
        delete cleanedServices.institutionId;
        payload = {
          booking_id: services.booking_id,
          institutionId: services.institutionId,
          services: cleanedServices,
        };
      } else {
        // Old usage: just pass the room/date structure as 'services'
        payload = {
          institutionId: institutionId,
          booking_id,
          services,
        };
      }
      payload.complementary = services.complementary;
      const { body } = await patch({
        apiName: "housekeeping",
        path: `/bookings/services`,
        options: {
          body: payload,
          queryParams: { institutionId: institutionId },
        },
      }).response;
      const data = await body.json();
      setBookings(
        bookings.map((b) => (b.booking_id === booking_id ? data.booking : b))
      );
      return { success: true, data };
    } catch (error) {
      console.error("Error updating booking services:", error);
      setError("Failed to update booking services");
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }

  async function freeHold(booking_id) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await put({
        apiName: "housekeeping",
        path: `/bookings/free-hold`,
        options: {
          queryParams: { institutionId, booking_id },
        },
      }).response;
      const data = await body.json();

      // Update local bookings data - set hold to false for the specific booking
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.booking_id === booking_id
            ? { ...booking, hold: false }
            : booking
        )
      );

      return { success: true, data };
    } catch (error) {
      console.error("Error updating booking:", error);
      setError("Failed to get free hold services");
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }

  async function updateComplementaryServices(booking_id, complementary) {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        institutionId,
        booking_id,
        complementary,
      };
      const { body } = await put({
        apiName: "housekeeping",
        path: `/bookings/complementary`,
        options: {
          body: payload,
          queryParams: { institutionId: institutionId },
        },
      }).response;
      const data = await body.json();
      return { success: true, data };
    } catch (error) {
      console.error("Error updating complementary services:", error);
      setError("Failed to update complementary services");
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }

  // Guest Section
  async function fetchGuests() {
    setLoading(true);
    setError(null);
    try {
      const { body } = await get({
        apiName: "frontdesk",
        path: `/guests`,
        options: {
          queryParams: { institutionId: institutionId },
        },
      }).response;
      const data = await body.json();
      setGuests(data.guests || []);
    } catch (error) {
      console.error("Error fetching guests:", error);
      setError("Failed to fetch guests");
    } finally {
      setLoading(false);
    }
  }

  async function updateGuest(guestData) {
    setLoading(true);
    setError(null);

    try {
      // Ensure updated_at is always a number and comes last to avoid being overridden
      const { updated_at, ...restGuestData } = guestData;
      const updatedGuestData = {
        ...restGuestData,
        institutionId: institutionId,
        id: guestData.guest_id,
        updated_at: Date.now(),
      };

      const { body } = await put({
        apiName: "frontdesk",
        path: `/guests/${guestData.guest_id}?institutionId=${institutionId}`,
        options: {
          body: updatedGuestData,
        },
      }).response;
      const data = await body.json();
      setGuests((prevGuests) =>
        prevGuests.map((guest) =>
          guest.guest_id === guestData.guest_id ? data.guest : guest
        )
      );
    } catch (error) {
      console.error("Error updating guest:", error);
      setError("Failed to update guest");
    } finally {
      setLoading(false);
    }
  }

  async function createGuest({ guestData }) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await post({
        apiName: "frontdesk",
        path: "/guests?institutionId=" + institutionId,
        options: {
          body: {
            ...guestData,
            institutionId: institutionId,
          },
        },
      }).response;
      const data = await body.json();
      return data.guest.guest_id; // Return the created guest ID
    } catch (error) {
      console.error("Error creating guest:", error);
      setError("Failed to create guest");
    } finally {
      setLoading(false);
    }
  }

  async function fetchStaffs() {
    setLoading(true);
    setError(null);
    try {
      const { body } = await get({
        apiName: "admin",
        path: `/staff`,
        options: {
          queryParams: { institutionId: institutionId },
        },
      }).response;
      const data = await body.json();
      setStaffs(data.staffs || []);
    } catch (error) {
      console.error("Error fetching staffs:", error);
      setError("Failed to fetch staffs");
    } finally {
      setLoading(false);
    }
  }

  async function createStaff(staffData) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await post({
        apiName: "admin",
        path: "/staff",
        options: {
          queryParams: { institutionId: institutionId },
          body: {
            is_active: true,
            ...staffData,
          },
        },
      }).response;
      const data = await body.json();
      setStaffs([...staffs, data.staff]);
      return { success: true, data: data.staff };
    } catch (error) {
      console.error("Error creating staff:", error);
      setError("Failed to create staff");
    } finally {
      setLoading(false);
    }
  }

  async function updateStaff(staffData) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await put({
        apiName: "admin",
        path: "/staff/" + staffData.staff_id,
        options: {
          queryParams: { institutionId: institutionId },
          body: {
            ...staffData,
            staff_id: undefined,
          },
        },
      }).response;
      const data = await body.json();
      setStaffs(
        staffs.map((staff) =>
          staff.staff_id === staffData.staff_id
            ? { ...staff, ...staffData }
            : staff
        )
      );
    } catch (error) {
      console.error("Error updating staff:", error);
      setError("Failed to update staff");
    } finally {
      setLoading(false);
    }
  }

  async function deleteStaff(staffId) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await del({
        apiName: "admin",
        path: `/staff/${staffId}`,
        options: {
          queryParams: { institutionId: institutionId },
        },
      }).response;
      await body.json();
      setStaffs(staffs.filter((staff) => staff.staff_id !== staffId));
      return { success: true };
    } catch (error) {
      console.error("Error deleting staff:", error);
      setError("Failed to delete staff");
    } finally {
      setLoading(false);
    }
  }

  async function fetchPayments() {
    setLoading(true);
    setError(null);
    try {
      const { body } = await get({
        apiName: "common",
        path: `/payments/list`,
        options: {
          queryParams: { institutionId: institutionId },
        },
      }).response;
      const data = await body.json();
      setPayments(data.payments || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
      setError("Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  }

  async function createBooking({ bookingData }) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await post({
        apiName: "frontdesk",
        path: "/reservations",
        options: {
          body: {
            ...bookingData,
            institutionId: institutionId,
          },
          queryParams: {
            institutionId: institutionId,
          },
        },
      }).response;
      const data = await body.json();
      return data.booking.booking_id; // Return the created reservation ID
    } catch (error) {
      console.error("Error creating booking:", error);
      setError("Failed to create booking");
    } finally {
      setLoading(false);
    }
  }

  async function cancelGuestBooking({ bookingId, cancellationData = {} }) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await patch({
        apiName: "frontdesk",
        path: `/reservations/${bookingId}/cancel`,
        options: {
          body: {
            ...cancellationData,
            institutionId: institutionId,
          },
          queryParams: {
            institutionId: institutionId,
          },
        },
      }).response;
      const data = await body.json();

      // Refresh bookings after cancellation
      await fetchBookings();
      return { success: true, data };
    } catch (error) {
      console.error("Error canceling booking:", error);
      setError("Failed to cancel booking");
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }

  async function fetchTotalBill(bookingId) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await get({
        apiName: "common",
        path: `/total-bill/${bookingId}`,
        options: {
          queryParams: { institutionId: institutionId },
        },
      }).response;
      const data = await body.json();
      console.log("data", data);
      return data.bill;
    } catch (error) {
      console.error("Error fetching total bill:", error);
      setError("Failed to fetch total bills");
    } finally {
      setLoading(false);
    }
  }

  async function listTotalBill() {
    setLoading(true);
    setError(null);
    try {
      const { body } = await get({
        apiName: "common",
        path: `/total-bill`,
        options: {
          queryParams: { institutionId: institutionId },
        },
      }).response;
      const data = await body.json();
      setBills(data.bills);
      setOrders(data.orders);
      return data.bills;
    } catch (error) {
      console.error("Error fetching total bill:", error);
      setError("Failed to fetch total bills");
    } finally {
      setLoading(false);
    }
  }

  async function calculateTotalBill({ bookingDetails }) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await post({
        apiName: "frontdesk",
        path: "/billing/calculate-total?institutionId=" + institutionId,
        options: {
          body: {
            ...bookingDetails,
          },
        },
      }).response;
      const data = await body.json();
      return data; // Return the calculated total bill
    } catch (error) {
      console.error("Error calculating total bill:", error);
      setError("Failed to calculate total bill");
    } finally {
      setLoading(false);
    }
  }

  async function updateBill(payload) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await patch({
        apiName: "frontdesk",
        path: "/billing",
        options: {
          body: { ...payload, institutionId },
        },
      }).response;
      const data = await body.json();
    } catch (error) {
      console.error("Error fetching total bill:", error);
      setError("Failed to update total bills");
    } finally {
      setLoading(false);
    }
  }

  async function checkoutGuest({ bookingDetails }) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await post({
        apiName: "frontdesk",
        path: "/checkout",
        options: {
          body: {
            ...bookingDetails,
            bill_url:
              window.location.origin +
              "/bill?bill_id=" +
              bookingDetails.booking_id,
            institutionId: institutionId,
          },
          queryParams: {
            institutionId: institutionId,
          },
        },
      }).response;
      const data = await body.json();
      listTotalBill();
      setBookings((prev) => [...prev]);
      return data.reservation_id; // Return the checked-out reservation ID
    } catch (error) {
      console.error("Error checking out guest:", error);
      setError("Failed to check out guest");
    } finally {
      setLoading(false);
      fetchBookings(); // Refresh bookings after checkout
    }
  }

  async function processdayEnd(payload) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await post({
        apiName: "frontdesk",
        path: "/report",
        options: {
          body: {
            institutionId,
            ...payload,
          },
        },
      }).response;
      const data = await body.json();
      return data.reservation_id; // Return the checked-out reservation ID
    } catch (error) {
      console.error("failed Day end success:", error);
      setError("faild Day end success");
    } finally {
      setLoading(false);
      fetchBookings(); // Refresh bookings after checkout
    }
  }

  async function updateTaxinformation({ taxData }) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await put({
        apiName: "admin",
        path: "/tax-settings",
        options: {
          body: {
            ...taxData,
          },
        },
      }).response;
      const data = await body.json();
    } catch (error) {
      console.error("Error updating tax information:", error);
      setError("Failed to update tax information");
    } finally {
      setLoading(false);
    }
  }

  // Fetch all reports
  async function fetchAllReports() {
    setLoading(true);
    setError(null);
    try {
      const { body } = await get({
        apiName: "common",
        path: "/report",
        options: {
          queryParams: { institutionId: institutionId },
        },
      }).response;
      const data = await body.json();
      setReports(data.data.list);
      return { success: true, data };
    } catch (error) {
      console.error("Error fetching all reports:", error);
      setError("Failed to fetch all reports");
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }

  async function addExpense({ expense, received }) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await post({
        apiName: "frontdesk",
        path: `/report/${institutionId}/expense`,
        options: {
          body: {
            ...(expense && { expense }),
            ...(received && { received }),
          },
        },
      }).response;
      const data = await body.json();
      return data.totalExpenses;
    } catch (error) {
      console.error("Error adding expense:", error);
      setError("Failed to add expense");
    } finally {
      setLoading(false);
    }
  }

  async function deleteExpense({ expenseId, receivedId, date }) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await put({
        apiName: "frontdesk",
        path: `/report/${institutionId}/expense/del`,
        options: {
          body: {
            date,
            ...(expenseId && { expenseId }),
            ...(receivedId && { receivedId }),
          },
        },
      }).response;
      const data = await body.json();
      await listExpenses();
      return data;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      setError("Failed to delete transaction");
    } finally {
      setLoading(false);
    }
  }

  async function updateExpense({ expenseId, date, expense }) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await put({
        apiName: "frontdesk",
        path: `/report/${institutionId}/expense`,
        options: {
          body: {
            date,
            expense,
            expenseId,
          },
        },
      }).response;
      const data = await body.json();
      await listExpenses();
      return data.totalExpenses;
    } catch (error) {
      console.error("Error updating expense:", error);
      setError("Failed to update expense");
    } finally {
      setLoading(false);
    }
  }

  async function listExpenses() {
    setLoading(true);
    setError(null);
    try {
      const { body } = await get({
        apiName: "frontdesk",
        path: `/report/${institutionId}/expense`,
        options: {},
      }).response;
      const data = await body.json();
      setExpenses(data);
    } catch (error) {
      console.error("Error listing expenses:", error);
      setError("Failed to list expenses");
    } finally {
      setLoading(false);
    }
  }

  async function updateOpeningBalance({ openingBalance, date }) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await put({
        apiName: "frontdesk",
        path: `/report/${institutionId}/opening-cash-draw`,
        options: {
          body: {
            openingBalance,
            date,
          },
        },
      }).response;
      const data = await body.json();
      return data.openingBalance;
    } catch (error) {
      console.error("Error updating opening balance:", error);
      setError("Failed to update opening balance");
    } finally {
      setLoading(false);
    }
  }

  async function updateClosingBalance({ closingBalance, date }) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await put({
        apiName: "frontdesk",
        path: `/report/${institutionId}/closing-cash-draw`,
        options: {
          body: {
            closingBalance,
            date,
          },
        },
      }).response;
      const data = await body.json();
      return data.closingBalance;
    } catch (error) {
      console.error("Error updating closing balance:", error);
      setError("Failed to update closing balance");
    } finally {
      setLoading(false);
    }
  }

  // Fetch report by date
  async function fetchReportByDate(date) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await get({
        apiName: "common",
        path: `/reports/${date}`,
        options: {
          queryParams: { institutionId: institutionId },
        },
      }).response;
      const data = await body.json();
      return { success: true, data };
    } catch (error) {
      console.error("Error fetching report by date:", error);
      setError("Failed to fetch report by date");
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }

  async function fetchCompanies() {
    setLoading(true);
    setError(null);
    try {
      const { body } = await get({
        apiName: "frontdesk",
        path: "/company/" + institutionId,
        options: {},
      }).response;
      const data = await body.json();
      setCompanies(data.companies);
      return data.companies;
    } catch (error) {
      console.log(error);
      setError("Failed to get companies");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function createCompany(payload) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await post({
        apiName: "frontdesk",
        path: "/company",
        options: {
          body: { ...payload, institutionId },
        },
      }).response;
      const data = await body.json();
      setCompanies([...companies, data.company]);
      return data.company;
    } catch (error) {
      console.log(error);
      setError("Failed to create company");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function updateCompany(payload) {
    setLoading(true);
    setError(null);
    try {
      const { body } = await patch({
        apiName: "frontdesk",
        path: "/company",
        options: {
          body: { ...payload, institutionId },
        },
      }).response;
      const data = await body.json();
      setCompanies(
        companies.map((c) =>
          c.company_id === payload.company_id ? data.company : c
        )
      );
      return data.company;
    } catch (error) {
      console.log(error);
      setError("Failed to update company");
      return null;
    } finally {
      setLoading(false);
    }
  }

  // Restaurant Orders Section
  async function fetchRestaurantOrders() {
    setLoading(true);
    setError(null);
    try {
      const { body } = await get({
        apiName: "restaurant",
        path: `/admin/list-orders/${institutionId}?type=cafe`,
        options: {},
      }).response;
      const data = await body.json();
      setRestaurantOrders(data || []);
      return data || [];
    } catch (error) {
      console.error("Error fetching restaurant orders:", error);
      setError("Failed to fetch restaurant orders");
      return [];
    } finally {
      setLoading(false);
    }
  }

  // Client-side notification system
  useEffect(() => {
    // Clear any existing notification timeouts when bookings change
    notificationTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    notificationTimeoutsRef.current = [];

    if (!bookings || bookings.length === 0) return;

    // Filter for active bookings (checked-in)
    const activeBookings = bookings.filter(
      (booking) => booking.status === "Checked-in"
    );

    const currentTime = Date.now();
    const newNotifications = [];

    activeBookings.forEach((booking) => {
      if (!booking.checkout_date) return;

      // Create notification for each active booking
      const notification = {
        notification_id: booking.booking_id,
        message: `Checkout time for ${Object.keys(
          booking.room_charges || {}
        ).join(", ")} has arrived`,
        show_time: booking.checkout_date,
        expire_time: booking.checkout_date + 90 * 60 * 1000, // 90 minutes after checkout time
        booking_id: booking.booking_id,
        room_numbers: Object.keys(booking.room_charges || {}),
        created: currentTime,
      };

      newNotifications.push(notification);

      // Set timeout for future notifications
      if (notification.show_time > currentTime) {
        const delay = notification.show_time - currentTime;

        const timeoutId = setTimeout(() => {
          alert(notification.message || "You have a notification");
          // Update notifications state to trigger re-render
          setNotifications((prev) => [...prev]);
        }, delay);

        notificationTimeoutsRef.current.push(timeoutId);
      }
    });

    // Update notifications state with newly generated notifications
    setNotifications(newNotifications);

    // Cleanup function to clear timeouts when component unmounts or bookings change
    return () => {
      notificationTimeoutsRef.current.forEach((timeout) =>
        clearTimeout(timeout)
      );
      notificationTimeoutsRef.current = [];
    };
  }, [bookings]);

  useEffect(() => {
    // Always fetch institution data for website display
    fetchInstitutionData();

    if (userData && userData.cognitoId && product === "dashboard-booking") {
      fetchRooms();
      fetchRatePlans();
      fetchBookings();
      fetchGuests();
      fetchStaffs();
      fetchPayments();
      fetchCompanies();
      listExpenses();
      fetchAllReports();
    }
    listTotalBill();
  }, [userData]);

  return (
    <AppContext.Provider
      value={{
        institutionData,
        setInstitutionData,
        fetchInstitutionData,
        updateInstitutionData,
        loading,
        setLoading,
        error,
        setError,
        ratePlans,
        fetchRatePlans,
        createRatePlan,
        updateRatePlan,
        deleteRatePlan,
        rooms,
        fetchRooms,
        getRoom,
        createRoom,
        updateRoom,
        updateRoomStatus,
        deleteRoom,
        bookings,
        updateBooking,
        updateBookingServices,
        freeHold,
        updateComplementaryServices,
        guests,
        fetchGuests,
        createGuest,
        updateGuest,
        staffs,
        fetchStaffs,
        createStaff,
        updateStaff,
        deleteStaff,
        payments,
        createBooking,
        cancelGuestBooking,
        fetchBookings,
        checkInGuest,
        fetchTotalBill,
        listTotalBill,
        calculateTotalBill,
        updateBill,
        checkoutGuest,
        amendBooking,
        processdayEnd,
        updateTaxinformation,
        // Reports API
        reports,
        fetchAllReports,
        fetchReportByDate,
        bills,
        orders,
        notifications,
        setNotifications,
        companies,
        setCompanies,
        fetchCompanies,
        createCompany,
        updateCompany,
        addExpense,
        listExpenses,
        setExpenses,
        expenses,
        deleteExpense,
        updateExpense,
        updateOpeningBalance,
        updateClosingBalance,
        restaurantOrders,
        fetchRestaurantOrders,
        handleDailyEnd,
        updatePaymentMethod
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
