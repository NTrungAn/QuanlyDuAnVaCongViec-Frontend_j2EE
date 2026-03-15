import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Layout,
  Calendar,
  ChevronLeft,
  Loader2,
  Users,
  UserPlus,
  UserMinus,
  Shield,
  Mail,
  Trash2,
  Clock,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import api from "../api/axiosConfig";

interface ProjectMember {
  userId: string;
  fullName: string;
  email: string;
  role: string;
}

interface ProjectDetail {
  id: string;
  name: string;
  description: string;
  owner: {
    id: string;
    fullName: string;
    email: string;
  };
  startDate: string;
  endDate: string;
  isArchived: boolean;
  members: ProjectMember[];
}

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Member management states
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("MEMBER");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState("");

  const navigate = useNavigate();

  const fetchProjectDetail = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data.data);
    } catch (err: any) {
      setError("Không thể tải thông tin chi tiết dự án.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetail();
  }, [id]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    setIsAddingMember(true);
    setAddMemberError("");

    try {
      // 1. Tìm user theo email
      const userRes = await api.get(`/users/search?email=${newMemberEmail}`);
      const user = userRes.data;

      if (!user || !user.id) {
        throw new Error("Không tìm thấy người dùng với email này.");
      }

      // 2. Thêm thành viên vào dự án bằng userId
      // Sử dụng URLSearchParams để đảm bảo tham số được mã hóa đúng
      const params = new URLSearchParams();
      params.append("userId", user.id);
      params.append("role", newMemberRole);

      await api.post(`/projects/${id}/members?${params.toString()}`);

      // 3. Thành công: Clear form và reload dữ liệu
      setNewMemberEmail("");
      fetchProjectDetail();
    } catch (err: any) {
      setAddMemberError(
        err.response?.data?.message ||
          err.message ||
          "Có lỗi xảy ra khi thêm thành viên.",
      );
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thành viên này khỏi dự án?"))
      return;

    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      fetchProjectDetail(); // Tải lại danh sách
    } catch (err: any) {
      alert(err.response?.data?.message || "Không thể xóa thành viên.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <AlertTriangle className="text-yellow-500 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Dự án không tồn tại
        </h2>
        <Link
          to="/projects"
          className="text-blue-600 font-medium hover:underline"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <Link
          to="/projects"
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-8 font-medium transition-colors"
        >
          <ChevronLeft size={20} />
          Quay lại dự án
        </Link>

        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4">
            {project.isArchived ? (
              <span className="px-4 py-1.5 bg-gray-100 text-gray-500 text-sm font-bold rounded-full border border-gray-200 uppercase tracking-wider">
                Đã lưu trữ
              </span>
            ) : (
              <span className="px-4 py-1.5 bg-green-100 text-green-600 text-sm font-bold rounded-full border border-green-200 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 size={16} /> Đang hoạt động
              </span>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-blue-600 rounded-xl text-white">
                  <FolderKanban size={32} />
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {project.name}
                </h1>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed max-w-3xl mb-6">
                {project.description ||
                  "Không có mô tả chi tiết cho dự án này."}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 font-medium">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <Clock size={18} className="text-blue-500" />
                  <span>
                    Bắt đầu:{" "}
                    {new Date(project.startDate).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <Calendar size={18} className="text-red-500" />
                  <span>
                    Kết thúc:{" "}
                    {new Date(project.endDate).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <Shield size={18} className="text-yellow-500" />
                  <span>
                    Chủ sở hữu:{" "}
                    <span className="text-gray-900 font-bold ml-1">
                      {project.owner.fullName}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area - Place for Tasks, Timeline etc. later */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 h-full min-h-[400px] flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mb-4">
                <Layout size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Bảng công việc dự án
              </h3>
              <p className="text-gray-500">
                Chức năng quản lý Task đang được phát triển.
              </p>
            </div>
          </div>

          {/* Sidebar - Member Management */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Users size={24} className="text-blue-600" />
                  Thành viên
                </h2>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100">
                  {project.members?.length || 0} thành viên
                </span>
              </div>

              {/* Add Member Form */}
              <form
                onSubmit={handleAddMember}
                className="mb-8 space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100"
              >
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                  />
                  <input
                    type="email"
                    placeholder="Nhập email thành viên..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    className="flex-1 px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                  >
                    <option value="MEMBER">Thành viên</option>
                    <option value="ADMIN">Quản trị viên</option>
                    <option value="VIEWER">Người xem</option>
                  </select>
                  <button
                    type="submit"
                    disabled={isAddingMember}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:bg-blue-400"
                  >
                    {isAddingMember ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <UserPlus size={20} />
                    )}
                  </button>
                </div>
                {addMemberError && (
                  <p className="text-xs text-red-600 font-medium italic">
                    {addMemberError}
                  </p>
                )}
              </form>

              {/* Members List */}
              <div className="space-y-4">
                {project.members?.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between group p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                        {member.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {member.fullName}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">
                          {member.role}
                        </p>
                      </div>
                    </div>
                    {member.userId !== project.owner.id && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Xóa khỏi dự án"
                      >
                        <UserMinus size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
