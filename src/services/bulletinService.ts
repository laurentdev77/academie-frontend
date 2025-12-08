import axios from "axios";

export interface Bulletin {
  id: string;
  studentName: string;
  moyenne: number;
  annee: string;
}

// fetchBulletins accepte un mot-clé de recherche et le token
export const fetchBulletins = async (search: string = "", token: string): Promise<Bulletin[]> => {
  const response = await axios.get("http://localhost:5000/api/bulletins", {
    params: { search },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data; // Assure-toi que le backend renvoie déjà studentName et moyenne
};
