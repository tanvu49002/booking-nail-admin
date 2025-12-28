import BookingCalendar from "@/components/BookingCalendar";
import axios from "axios";
import { StrapiBooking, EmployeeAPI } from "@/types";

async function getEmployees() {
  try {
    const response = await axios.get(
      "http://localhost:1337/api/employees?sort=employee_name:asc"
    );
    const data = response?.data?.data;

    return data.map((emp: EmployeeAPI) => ({
      label: emp?.employee_name,
      value: emp?.documentId,
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios Error:", error.message);
    } else {
      console.error("Unexpected Error:", error);
    }
    return [];
  }
}
async function getBookings() {
  try {
    const response = await axios.get(
      "http://localhost:1337/api/bookings?populate=*"
    );
    return response?.data?.data as StrapiBooking[];
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return [];
  }
}
export default async function Home() {
  const [employees, bookings] = await Promise.all([
    getEmployees(),
    getBookings(),
  ]);
  return (
    <div className="bg-white p-8 h-full">
      <BookingCalendar employees={employees} bookings={bookings} />
    </div>
  );
}
