// src/types/index.ts

// Interface cho Nhân viên (dùng cho cả API và Select option)
export interface EmployeeAPI {
  documentId: string;
  employee_name: string;
  employee_email: string;
  employee_phone: string;
  employee_avatar: string;
}

// Interface cho Service
export interface StrapiService {
  service_name: string;
  service_price: number;
  working_time: number;
}

// Interface cho Booking (Response từ Strapi)
export interface StrapiBooking {
  documentId: string;
  name: string;
  phone: string;
  email: string;
  note?: string;
  booking_date: string;
  booking_time: string;
  booking_end: string;
  booking_status: string;
  booking_code: string;
  total_price: number;
  employee?: {
    documentId: string;
    employee_name: string;
  };
  services: StrapiService[];
}

export interface ResourceType {
  label: string;
  value: string;
}
export interface CalendarEvent {
  documentId?: string;
  title: string;
  start: Date;
  end: Date;
  resourceId?: string;
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
export interface MyCalendarProps {
  employees: ResourceType[];
}
