import Calendar from "@/components/Calendar";
import axios from "axios";
interface EmployeeAPI {
  documentId: string;
  employee_name: string;
  employee_email: string;
  employee_phone: string;
  employee_avatar: string;
}
async function getEmployees() {
  try {
    const response = await axios.get("http://localhost:1337/api/employees");
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
export default async function Home() {
  const employees = await getEmployees();
  return (
    <div className="bg-white p-8">
      <Calendar employees={employees} />
    </div>
  );
}
