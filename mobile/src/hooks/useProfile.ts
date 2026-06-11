import { useEffect, useState } from "react";

export default function useProfile() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState("");

  const getProfile = async () => {
    try {
      setLoading(true);

      // Mock Data
      const data = {
        name: "Nguyễn Văn A",
        email: "vana@gmail.com",
        avatar: "https://i.pravatar.cc/300",
        bio: "Student",
      };

      setProfile(data);
    } catch (err) {
      setError("Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProfile();
  }, []);

  return {
    profile,
    loading,
    error,
  };
}
