import axios from "axios";

const API_URL = "http://localhost:5000/api/users";

export const fetchTeachers = async (token: string) => {
  const res = await axios.get(`${API_URL}?role=teacher`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
