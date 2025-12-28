"use client";
import { useState, useMemo } from "react";
import {
  Select,
  message,
  Modal,
  Descriptions,
  Tag,
  Button,
  TimePicker,
} from "antd";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import dayjs from "dayjs";
import "react-big-calendar/lib/css/react-big-calendar.css";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import minMax from "dayjs/plugin/minMax";
import { StrapiBooking, CalendarEvent } from "../types";
import { useRouter } from "next/navigation";
import axios from "axios";
interface BookingCalendarProps {
  employees: { label: string; value: string }[];
  bookings: StrapiBooking[];
}
dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(minMax);
const localizer = dayjsLocalizer(dayjs);
const UNASSIGNED_ID = "unassigned";
export default function BookingCalendar({
  employees,
  bookings,
}: BookingCalendarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<CalendarEvent | null>(
    null
  );

  const [editStatus, setEditStatus] = useState<string | undefined>(undefined);
  const [editEndTime, setEditEndTime] = useState<dayjs.Dayjs | null>(null);
  const [editEmployeeId, setEditEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const calendarResources = useMemo(() => {
    const anyStaffResource = {
      label: "Unassigned",
      value: UNASSIGNED_ID,
    };
    return [anyStaffResource, ...employees];
  }, [employees]);
  const handleSave = async () => {
    if (!selectedBooking || !selectedBooking.documentId) return;

    setLoading(true);
    try {
      const formattedEndTime = editEndTime
        ? editEndTime.format("HH:mm:ss")
        : null;
      const finalEmployeeId =
        editEmployeeId === UNASSIGNED_ID ? null : editEmployeeId;
      const payload = {
        data: {
          booking_status: editStatus,
          booking_end: formattedEndTime,
          employee: finalEmployeeId,
        },
      };

      await axios.put(
        `http://localhost:1337/api/bookings/${selectedBooking.documentId}`,
        payload
      );

      message.success("Update booking successfully!");

      setIsModalOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Update error:", error);
      message.error("Failed to update booking.");
    } finally {
      setLoading(false);
    }
  };
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedBooking(event);

    setEditStatus(event.extendedProps.status);
    setEditEndTime(dayjs(event.end));
    setEditEmployeeId(event.extendedProps.employeeId || UNASSIGNED_ID);

    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };
  const events = useMemo(() => {
    if (!bookings) return [];

    return bookings.map((booking) => ({
      documentId: booking.documentId,
      title: booking.name,
      start: dayjs(`${booking.booking_date}T${booking.booking_time}`).toDate(),
      end: dayjs(`${booking.booking_date}T${booking.booking_end}`).toDate(),
      resourceId: booking.employee?.documentId || UNASSIGNED_ID,
      extendedProps: {
        customerName: booking.name,
        phone: booking.phone,
        email: booking.email,
        note: booking.note,
        status: booking.booking_status,
        employeeName: booking.employee?.employee_name,
        employeeId: booking.employee?.documentId,
        bookingCode: booking.booking_code,
        services: booking.services,
        totalPrice: booking.total_price,
      },
    }));
  }, [bookings]);
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "success";
      case "waiting for approve":
        return "warning";
      case "reject":
        return "error";
      case "complete":
        return "processing";
      default:
        return "default";
    }
  };
  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.extendedProps.status?.toLowerCase();

    let backgroundColor = "#94a2ad9d";

    switch (status) {
      case "approved":
        backgroundColor = "#52c41a";
        break;
      case "waiting for approve":
        backgroundColor = "#faad14";
        break;
      case "reject":
        backgroundColor = "#ff4d4f";
        break;
      case "complete":
        backgroundColor = "#1890ff";
        break;
      default:
        backgroundColor = "#94a2ad9d";
    }

    return {
      style: {
        backgroundColor: backgroundColor,
        borderRadius: "6px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  };
  return (
    <>
      <div className="p-4 h-full">
        <Calendar
          eventPropGetter={eventStyleGetter}
          dayLayoutAlgorithm="no-overlap"
          localizer={localizer}
          events={events}
          defaultView="day"
          views={["day"]}
          resources={calendarResources}
          resourceIdAccessor="value"
          resourceTitleAccessor="label"
          step={30}
          timeslots={2}
          min={dayjs().set("hour", 7).set("minute", 0).toDate()}
          max={dayjs().set("hour", 22).set("minute", 0).toDate()}
          style={{ height: "800px" }}
          onSelectEvent={handleSelectEvent}
        />
      </div>
      {/* --- MODAL chi tiết booking --- */}
      <Modal
        title={
          <div className="flex justify-between items-center pr-8">
            <span className="text-lg">
              Booking Details for{" "}
              <span className="font-bold">
                #{selectedBooking?.extendedProps.bookingCode}
              </span>
            </span>
          </div>
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        width={850}
        centered
        footer={[
          <Button key="cancel" onClick={handleCloseModal}>
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={handleSave}
            className="bg-yellow-500 hover:bg-yellow-600 border-none"
            loading={loading}
          >
            Save Changes
          </Button>,
        ]}
      >
        {selectedBooking && (
          <div className="flex flex-col gap-6 py-4">
            <Descriptions
              bordered
              column={2}
              size="small"
              styles={{
                label: { width: "150px", fontWeight: 500 },
              }}
            >
              <Descriptions.Item label="Customer Name">
                <div className="flex items-center gap-2">
                  {selectedBooking.extendedProps.customerName}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {selectedBooking.extendedProps.phone}
              </Descriptions.Item>

              <Descriptions.Item label="Email">
                {selectedBooking.extendedProps.email || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Booking Date">
                {dayjs(selectedBooking.start).format("MMMM DD, YYYY")}
              </Descriptions.Item>

              <Descriptions.Item label="Start Time">
                {dayjs(selectedBooking.start).format("hh:mm A")}
              </Descriptions.Item>
              <Descriptions.Item label="End Time">
                {dayjs(selectedBooking.end).format("hh:mm A")}
              </Descriptions.Item>

              <Descriptions.Item label="Employee">
                {selectedBooking.extendedProps.employeeName}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag
                  color={getStatusColor(selectedBooking.extendedProps.status)}
                  className="px-3 rounded-full"
                >
                  {selectedBooking.extendedProps.status?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <hr className="border-gray-200" />

            <div>
              <h4 className="mb-3 pb-1 font-bold text-gray-700">Services</h4>
              <div className="flex flex-wrap gap-4">
                {selectedBooking.extendedProps.services?.map((service, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center bg-white shadow-sm p-3 border rounded-lg w-40"
                  >
                    <span className="font-semibold text-gray-800">
                      {service.service_name}
                    </span>
                    <span className="font-bold text-blue-500 text-lg">
                      ${service.service_price}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {service.working_time}min
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center bg-green-50 p-3 px-6 border border-green-200 rounded-md">
              <span className="font-bold text-gray-700">Total Price:</span>
              <span className="font-bold text-green-600 text-xl">
                ${selectedBooking.extendedProps.totalPrice}
              </span>
            </div>
            <hr className="border-gray-200" />
            <div className="gap-4 grid grid-cols-3 mt-2">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-500 text-xs">
                  Status
                </label>
                <Select
                  defaultValue={"Waiting for Approve"}
                  className="w-full"
                  value={editStatus}
                  onChange={(value) => {
                    setEditStatus(value);
                  }}
                  options={[
                    {
                      value: "waiting for approve",
                      label: "Waiting for Approve",
                    },
                    { value: "approved", label: "Approved" },
                    { value: "reject", label: "Reject" },
                    { value: "complete", label: "Complete" },
                  ]}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-500 text-xs">
                  End Time
                </label>
                <TimePicker
                  use12Hours
                  format="hh:mm a"
                  defaultValue={dayjs(selectedBooking.end)}
                  className="w-full"
                  value={editEndTime}
                  onChange={(time) => {
                    setEditEndTime(time);
                  }}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-500 text-xs">
                  Assigned Employee
                </label>
                <Select
                  className="w-full"
                  placeholder="Select employee"
                  defaultValue={selectedBooking.extendedProps.employeeName}
                  options={calendarResources}
                  value={editEmployeeId}
                  onChange={(value) => {
                    setEditEmployeeId(value || null);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
