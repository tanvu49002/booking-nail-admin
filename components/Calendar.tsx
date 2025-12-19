"use client";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useState, useEffect, useCallback } from "react";
// import { ReloadOutlined } from "@ant-design/icons";
import {
  Select,
  Space,
  message,
  Modal,
  Descriptions,
  Tag,
  Button,
  TimePicker,
} from "antd";
import axios from "axios";
import { EventContentArg, EventClickArg } from "@fullcalendar/core";
import dayjs, { Dayjs } from "dayjs";
// import viLocale from "@fullcalendar/core/locales/vi";
interface BookingUpdatePayload {
  data: {
    booking_status?: string;
    booking_end?: string | null;
    employee?: string | null;
  };
}
interface Service {
  documentId: string;
  service_name: string;
  service_price: number;
  working_time: number;
}
interface SelectOption {
  label: string;
  value: string;
}
interface CalendarEvent {
  documentId?: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    customerName: string;
    phone?: string;
    email?: string;
    note?: string;
    status?: string;
    employeeName?: string;
    employeeId?: string;
    bookingCode?: string;

    services?: Array<{
      service_name: string;
      service_price: number;
      working_time: number;
    }>;
    totalPrice?: number;
  };
}
interface EmployeeProps {
  employees: SelectOption[];
}
export default function Calendar({ employees }: EmployeeProps) {
  const ALL_EMPLOYEES_OPTION = "All Staffs";
  const [selectedEmpId, setSelectedEmpId] = useState(ALL_EMPLOYEES_OPTION);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<CalendarEvent | null>(
    null
  );
  const [editStatus, setEditStatus] = useState<string | undefined>(undefined);
  const [editEndTime, setEditEndTime] = useState<Dayjs | null>(null);
  const [editEmployeeId, setEditEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchBookings = useCallback(async () => {
    try {
      const params: Record<string, string | string[]> = {
        populate: "*",
      };
      if (selectedEmpId !== ALL_EMPLOYEES_OPTION) {
        params["filters[employee][documentId][$eq]"] = selectedEmpId;
      }
      const res = await axios.get("http://localhost:1337/api/bookings", {
        params,
      });

      const rawData = res?.data?.data;
      if (rawData && Array.isArray(rawData)) {
        const mappedEvents = rawData.map((item) => {
          const status = item.booking_status;
          const eventColor = getStatusColor(status);
          return {
            id: item.documentId,
            title: item.name,
            start: `${item.booking_date}T${item.booking_time}`,
            end: `${item.booking_date}T${item.booking_end}`,
            color: eventColor,
            extendedProps: {
              documentId: item.documentId,
              customerName: item.name,
              phone: item.phone,
              email: item.email,
              note: item.note,
              status: item.booking_status,
              employeeName: item.employee?.employee_name || "Not assigned",
              employeeId: item.employee?.documentId || null,
              totalPrice: item.total_price,
              bookingCode: item.booking_code,
              services: item.services.map((service: Service) => ({
                service_name: service.service_name,
                service_price: service.service_price,
                working_time: service.working_time,
              })),
            },
          };
        });
        console.log("mappedEvents:", mappedEvents);
        setEvents(mappedEvents);
      }
    } catch (error) {
      console.error("error: ", error);
      message.error("Load booking failed !");
    }
  }, [selectedEmpId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (selectedBooking) {
      setEditStatus(selectedBooking.extendedProps.status);
      setEditEndTime(dayjs(selectedBooking.end));
      setEditEmployeeId(selectedBooking.extendedProps.employeeId || null);
    }
  }, [selectedBooking]);
  const options = [
    { label: "All Staffs", value: ALL_EMPLOYEES_OPTION },
    ...employees,
  ];
  const handleChange = (newValues: string) => {
    setSelectedEmpId(newValues);
  };
  const handleEventClick = (info: EventClickArg) => {
    // Lấy thông tin từ sự kiện được click
    const clickedEvent = {
      documentId: info.event.extendedProps.documentId,
      title: info.event.title,
      start: info.event.startStr,
      end: info.event.endStr,
      bookingCode: info.event.extendedProps.bookingCode,
      extendedProps: info.event.extendedProps as CalendarEvent["extendedProps"],
    };

    setSelectedBooking(clickedEvent);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
    setEditStatus(undefined);
    setEditEndTime(null);
    setEditEmployeeId(null);
  };
  const handleSave = async () => {
    if (!selectedBooking) return;
    setLoading(true);
    try {
      const payload: BookingUpdatePayload = {
        data: {},
      };
      const formattedEndTime = editEndTime
        ? editEndTime.format("HH:mm:ss")
        : null;
      payload.data.booking_status = editStatus;
      payload.data.booking_end = formattedEndTime;
      payload.data.employee = editEmployeeId ? editEmployeeId : null;

      await axios.put(
        `http://localhost:1337/api/bookings/${selectedBooking.documentId}`,
        payload
      );
      message.success("Update booking successfully!");
      await fetchBookings();
      handleCloseModal();
    } catch (error) {
      console.error("Update error:", error);
      message.error("Failed to update booking.");
    } finally {
      setLoading(false);
    }
  };
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "waiting for approve":
        return "#faad14";
      case "approved":
        return "#52c41a";
      case "reject":
        return "#f5222d";
      case "complete":
        return "#1890ff";
      default:
        return "#d9d9d9";
    }
  };
  const renderEventContent = (eventInfo: EventContentArg) => {
    return (
      <div
        className="flex flex-row justify-center items-center p-1 border-0 w-full h-full overflow-hidden select-none"
        style={{ backgroundColor: eventInfo.backgroundColor }}
        tabIndex={-1}
      >
        <div className="flex-shrink-0 font-semibold text-white text-xs whitespace-nowrap">
          {eventInfo.timeText}
        </div>
        <div className="font-semibold text-white text-xs truncate">
          - {eventInfo.event.extendedProps.customerName}
        </div>
      </div>
    );
  };
  return (
    <>
      <div className="flex justify-between items-center py-4">
        <h1 className="font-bold text-2xl">Booking Calendar</h1>
        <Space vertical style={{ width: "200px" }}>
          <Select
            style={{ width: "100%" }}
            placeholder="Chọn nhân viên..."
            options={options}
            value={selectedEmpId}
            onChange={handleChange}
          />
        </Space>
      </div>
      <FullCalendar
        // locale={viLocale}
        plugins={[timeGridPlugin]}
        initialView="timeGridWeek"
        allDaySlot={false}
        slotMinTime="07:30:00"
        height="auto"
        headerToolbar={{
          left: "today prev,next",
          center: "",
          right: "title",
        }}
        events={events}
        eventContent={renderEventContent}
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          meridiem: "short",
        }}
        eventClick={handleEventClick}
      />
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
            className="bg-yellow-500 hover:bg-yellow-600 border-none"
            onClick={handleSave}
            loading={loading}
          >
            Save Changes
          </Button>,
        ]}
      >
        {selectedBooking && (
          <div className="flex flex-col gap-6 py-4">
            {/* 1. thông tin booking */}
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
                  {/* <ReloadOutlined className="text-blue-500 cursor-pointer" /> */}
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

            {/* 2. dịch vụ đã book */}
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

            {/* 3. tổng tiền */}
            <div className="flex justify-between items-center bg-green-50 p-3 px-6 border border-green-200 rounded-md">
              <span className="font-bold text-gray-700">Total Price:</span>
              <span className="font-bold text-green-600 text-xl">
                ${selectedBooking.extendedProps.totalPrice}
              </span>
            </div>
            <hr className="border-gray-200" />
            {/* 4. ACTION FORM (Status, End Time, Employee) */}
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
                    console.log("time changed:", time);
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
                  options={employees}
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
