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
  Plus,
  Trello,
  GripVertical,
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

  // Tab state
  const [activeTab, setActiveTab] = useState<
    "TASKS" | "SPRINTS" | "EPICS" | "KANBAN"
  >("TASKS");

  // Kanban states
  const [taskStatuses, setTaskStatuses] = useState<any[]>([]);
  const [activeSprint, setActiveSprint] = useState<any | null>(null);
  const [kanbanTasks, setKanbanTasks] = useState<any[]>([]);
  const [isKanbanLoading, setIsKanbanLoading] = useState(false);

  // Sprint states
  const [sprints, setSprints] = useState<any[]>([]);
  const [isSprintLoading, setIsSprintLoading] = useState(false);
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);
  const [newSprint, setNewSprint] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });

  // Epic states
  const [epics, setEpics] = useState<any[]>([]);
  const [isEpicLoading, setIsEpicLoading] = useState(false);
  const [isCreateEpicOpen, setIsCreateEpicOpen] = useState(false);
  const [newEpic, setNewEpic] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  // Task states
  const [tasks, setTasks] = useState<any[]>([]);
  const [isTaskLoading, setIsTaskLoading] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    type: "TASK",
    dueDate: "",
    estimatedTime: 0,
    epicId: "",
  });

  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  const [assigningTask, setAssigningTask] = useState<any | null>(null);

  const [viewingTask, setViewingTask] = useState<any | null>(null);
  const [taskComments, setTaskComments] = useState<any[]>([]);
  const [taskActivityLogs, setTaskActivityLogs] = useState<any[]>([]);
  const [isTimeTracking, setIsTimeTracking] = useState(false);
  const [activeTimeTracking, setActiveTimeTracking] = useState<any | null>(
    null,
  );
  const [newComment, setNewComment] = useState("");
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [isAttachmentLoading, setIsAttachmentLoading] = useState(false);

  // Sprint assignment state
  const [sprintTaskToAssign, setSprintTaskToAssign] = useState<any | null>(
    null,
  );

  const navigate = useNavigate();

  const fetchTaskDetails = async (task: any) => {
    setViewingTask(task);
    try {
      // Fetch Comments
      const commentsRes = await api.get(`/comments/task/${task.id}`);
      setTaskComments(commentsRes.data.data || []);

      // Fetch Activity Logs
      const logsRes = await api.get(`/activity-logs/task/${task.id}`);
      setTaskActivityLogs(logsRes.data.data || []);

      // Fetch Active Time Tracking
      const activeTrackingRes = await api.get(
        `/time-tracking/active/task/${task.id}`,
      );
      if (activeTrackingRes.data.data) {
        setActiveTimeTracking(activeTrackingRes.data.data);
        setIsTimeTracking(true);
      } else {
        setActiveTimeTracking(null);
        setIsTimeTracking(false);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải chi tiết task:", err);
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !viewingTask) return;

    setIsCommentLoading(true);
    try {
      const response = await api.post("/comments", {
        taskId: viewingTask.id,
        content: newComment,
      });
      if (response.data.success) {
        setTaskComments((prev) => [...prev, response.data.data]);
        setNewComment("");
      }
    } catch (err: any) {
      alert("Không thể gửi bình luận.");
    } finally {
      setIsCommentLoading(false);
    }
  };

  const handleStartTimeTracking = async () => {
    if (!viewingTask) return;
    try {
      const response = await api.post("/time-tracking/start", {
        taskId: viewingTask.id,
      });
      if (response.data.success) {
        setActiveTimeTracking(response.data.data);
        setIsTimeTracking(true);
        alert("Đã bắt đầu theo dõi thời gian.");
      }
    } catch (err: any) {
      alert("Không thể bắt đầu theo dõi thời gian.");
    }
  };

  const handleStopTimeTracking = async () => {
    if (!viewingTask || !activeTimeTracking) return;
    try {
      const response = await api.post("/time-tracking/stop", {
        timeTrackingId: activeTimeTracking.id,
      });
      if (response.data.success) {
        setIsTimeTracking(false);
        setActiveTimeTracking(null);
        alert("Đã dừng theo dõi thời gian.");
      }
    } catch (err: any) {
      alert("Không thể dừng theo dõi thời gian.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !viewingTask) return;

    setIsAttachmentLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post(
        `/attachments/${viewingTask.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      if (response.data.success) {
        alert("Tải tệp lên thành công!");
        // Re-fetch logs
        const logsRes = await api.get(`/activity-logs/task/${viewingTask.id}`);
        setTaskActivityLogs(logsRes.data.data || []);
      }
    } catch (err: any) {
      alert("Không thể tải tệp lên.");
    } finally {
      setIsAttachmentLoading(false);
    }
  };

  const fetchProjectDetail = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data.data);
      fetchTasks();
      fetchSprints();
      fetchEpics();
      fetchKanbanData();
    } catch (err: any) {
      setError("Không thể tải thông tin chi tiết dự án.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKanbanData = async () => {
    try {
      // 1. Fetch Task Statuses
      const statusesRes = await api.get("/task-statuses");
      setTaskStatuses(statusesRes.data.data || []);

      // 2. Fetch Active Sprint
      const activeSprintRes = await api.get(`/sprints/project/${id}/active`);
      const currentActiveSprint = activeSprintRes.data.data;
      setActiveSprint(currentActiveSprint);

      // 3. Fetch Tasks if active sprint exists
      if (currentActiveSprint) {
        const tasksRes = await api.get(
          `/sprints/${currentActiveSprint.id}/tasks`,
        );
        setKanbanTasks(tasksRes.data.data || []);
      } else {
        setKanbanTasks([]);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải dữ liệu Kanban:", err);
    }
  };

  const handleTaskDrop = async (taskId: string, newStatusId: string) => {
    try {
      // Optimistic update
      setKanbanTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, statusId: newStatusId } : t,
        ),
      );

      await api.put(`/tasks/${taskId}`, {
        statusId: newStatusId,
      });

      // Refresh to ensure sync
      fetchKanbanData();
      fetchTasks();
    } catch (err: any) {
      alert("Không thể thay đổi trạng thái công việc.");
      fetchKanbanData(); // Revert on error
    }
  };

  const fetchTasks = async () => {
    setIsTaskLoading(true);
    try {
      const response = await api.get(`/tasks/project/${id}`);
      setTasks(response.data.data || []);
    } catch (err: any) {
      console.error("Không thể tải danh sách task");
    } finally {
      setIsTaskLoading(false);
    }
  };

  const fetchSprints = async () => {
    setIsSprintLoading(true);
    try {
      const response = await api.get(`/sprints/project/${id}`);
      setSprints(response.data.data || []);
    } catch (err: any) {
      console.error("Không thể tải danh sách sprint");
    } finally {
      setIsSprintLoading(false);
    }
  };

  const fetchEpics = async () => {
    setIsEpicLoading(true);
    try {
      const response = await api.get(`/epics/project/${id}`);
      setEpics(response.data.data || []);
    } catch (err: any) {
      console.error("Không thể tải danh sách epic");
    } finally {
      setIsEpicLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetail();
  }, [id]);

  const handleActivateSprint = async (sprintId: string) => {
    try {
      await api.post(`/sprints/${sprintId}/activate`);
      fetchSprints();
      fetchKanbanData();
      alert("Đã kích hoạt sprint!");
    } catch (err: any) {
      alert("Không thể kích hoạt sprint.");
    }
  };

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/sprints", {
        ...newSprint,
        projectId: id,
      });
      setIsCreateSprintOpen(false);
      setNewSprint({
        name: "",
        startDate: "",
        endDate: "",
      });
      fetchSprints();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Không thể tạo sprint.";
      alert(errorMsg);
    }
  };

  const handleCreateEpic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/epics", {
        ...newEpic,
        projectId: id,
      });
      setIsCreateEpicOpen(false);
      setNewEpic({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
      });
      fetchEpics();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Không thể tạo epic.";
      alert(errorMsg);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Ensure empty strings are sent as null for date and numeric fields
      const taskData = {
        ...newTask,
        projectId: id,
        dueDate: newTask.dueDate || null,
        estimatedTime: newTask.estimatedTime || 0,
        epicId: newTask.epicId || null,
      };

      await api.post("/tasks", taskData);
      setIsCreateTaskOpen(false);
      setNewTask({
        title: "",
        description: "",
        priority: "MEDIUM",
        type: "TASK",
        dueDate: "",
        estimatedTime: 0,
        epicId: "",
      });
      fetchTasks();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Không thể tạo task.";
      alert(errorMsg);
    }
  };

  const handleUpdateTask = async (taskId: string, updatedTask: any) => {
    setIsUpdatingTask(true);
    try {
      await api.put(`/tasks/${taskId}`, updatedTask);
      setEditingTask(null);
      fetchTasks();
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || "Không thể cập nhật task.";
      alert(errorMsg);
    } finally {
      setIsUpdatingTask(false);
    }
  };

  const handleAssignTask = async (taskId: string, userId: string) => {
    try {
      await api.post("/tasks/assign", { taskId, userId });
      setAssigningTask(null);
      fetchTasks();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Không thể giao việc.";
      alert(errorMsg);
    }
  };

  const handleAddTaskToSprint = async (sprintId: string, taskId: string) => {
    try {
      await api.post("/sprints/tasks", { sprintId, taskId });
      setSprintTaskToAssign(null);
      fetchTasks();
      alert("Đã thêm task vào sprint thành công!");
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || "Không thể thêm task vào sprint.";
      alert(errorMsg);
    }
  };

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

          {/* Modal Chỉnh sửa Task */}
          {editingTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-yellow-600 p-6 text-white flex justify-between items-center">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <FolderKanban size={24} />
                    Chỉnh sửa công việc
                  </h3>
                  <button
                    onClick={() => setEditingTask(null)}
                    className="text-white hover:bg-yellow-700 p-1 rounded-lg transition-colors"
                  >
                    <Trash2 size={24} />
                  </button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateTask(editingTask.id, editingTask);
                  }}
                  className="p-6 space-y-6"
                >
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Tiêu đề Task *
                    </label>
                    <input
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 outline-none"
                      placeholder="Nhập tên công việc..."
                      value={editingTask.title}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          title: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Mô tả
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 outline-none resize-none"
                      placeholder="Mô tả công việc này..."
                      value={editingTask.description}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Độ ưu tiên
                      </label>
                      <select
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 outline-none bg-white"
                        value={editingTask.priority}
                        onChange={(e) =>
                          setEditingTask({
                            ...editingTask,
                            priority: e.target.value,
                          })
                        }
                      >
                        <option value="LOW">Thấp</option>
                        <option value="MEDIUM">Trung bình</option>
                        <option value="HIGH">Cao</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Ngày hết hạn
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 outline-none"
                        value={
                          editingTask.dueDate
                            ? new Date(editingTask.dueDate)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          setEditingTask({
                            ...editingTask,
                            dueDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Thời gian dự kiến (giờ)
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 outline-none"
                      placeholder="Nhập số giờ..."
                      value={editingTask.estimatedTime}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          estimatedTime: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingTask(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-bold transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingTask}
                      className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-bold shadow-md active:scale-95 transition-all disabled:bg-yellow-400"
                    >
                      {isUpdatingTask ? (
                        <Loader2 className="animate-spin mx-auto" />
                      ) : (
                        "Lưu thay đổi"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Giao việc */}
          {assigningTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-green-600 p-6 text-white flex justify-between items-center">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <UserPlus size={24} />
                    Giao việc cho thành viên
                  </h3>
                  <button
                    onClick={() => setAssigningTask(null)}
                    className="text-white hover:bg-green-700 p-1 rounded-lg transition-colors"
                  >
                    <Trash2 size={24} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-600">
                    Chọn một thành viên để giao công việc{" "}
                    <span className="font-bold">{assigningTask.title}</span>.
                  </p>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {project?.members.map((member) => (
                      <div
                        key={member.userId}
                        onClick={() =>
                          handleAssignTask(assigningTask.id, member.userId)
                        }
                        className="p-3 hover:bg-gray-100 rounded-lg cursor-pointer flex items-center gap-3"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                          {member.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            {member.fullName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Thêm vào Sprint */}
          {sprintTaskToAssign && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Clock size={24} />
                    Thêm vào Sprint
                  </h3>
                  <button
                    onClick={() => setSprintTaskToAssign(null)}
                    className="text-white hover:bg-blue-700 p-1 rounded-lg transition-colors"
                  >
                    <Trash2 size={24} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-600">
                    Chọn Sprint cho công việc{" "}
                    <span className="font-bold">
                      {sprintTaskToAssign.title}
                    </span>
                    .
                  </p>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {sprints.length === 0 ? (
                      <p className="text-center text-gray-500 py-4 italic">
                        Chưa có sprint nào. Hãy tạo sprint trước!
                      </p>
                    ) : (
                      sprints.map((sprint) => (
                        <div
                          key={sprint.id}
                          onClick={() =>
                            handleAddTaskToSprint(
                              sprint.id,
                              sprintTaskToAssign.id,
                            )
                          }
                          className="p-3 hover:bg-gray-100 rounded-lg cursor-pointer flex items-center gap-3"
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold shadow-sm">
                            <Clock size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">
                              {sprint.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(sprint.startDate).toLocaleDateString(
                                "vi-VN",
                              )}{" "}
                              -{" "}
                              {new Date(sprint.endDate).toLocaleDateString(
                                "vi-VN",
                              )}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Xem chi tiết Task */}
          {viewingTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
                <div className="bg-blue-600 p-6 text-white flex justify-between items-center flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <FolderKanban size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{viewingTask.title}</h3>
                      <p className="text-sm text-blue-100 opacity-80">
                        Chi tiết công việc
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewingTask(null)}
                    className="text-white hover:bg-blue-700 p-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Info, Time Tracking, Attachments */}
                    <div className="lg:col-span-2 space-y-8">
                      {/* Description */}
                      <section>
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                          Mô tả
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-700 whitespace-pre-wrap">
                          {viewingTask.description ||
                            "Không có mô tả chi tiết."}
                        </div>
                      </section>

                      {/* Time Tracking Section */}
                      <section className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-blue-900 flex items-center gap-2">
                            <Clock size={20} /> Theo dõi thời gian
                          </h4>
                          {isTimeTracking ? (
                            <button
                              onClick={handleStopTimeTracking}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 shadow-md transition-all active:scale-95 flex items-center gap-2"
                            >
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                              Dừng ghi giờ
                            </button>
                          ) : (
                            <button
                              onClick={handleStartTimeTracking}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md transition-all active:scale-95 flex items-center gap-2"
                            >
                              <Clock size={16} /> Bắt đầu ghi giờ
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="px-3 py-1 bg-white rounded-lg border border-blue-100">
                            <span className="text-gray-500 mr-2">Dự kiến:</span>
                            <span className="font-bold text-blue-700">
                              {viewingTask.estimatedTime || 0} giờ
                            </span>
                          </div>
                          {isTimeTracking && (
                            <div className="text-blue-600 font-medium animate-pulse">
                              Đang ghi nhận thời gian làm việc...
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Attachments Section */}
                      <section>
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                          Tệp đính kèm
                        </h4>
                        <div className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
                            <Plus size={18} />
                            Tải tệp lên
                            <input
                              type="file"
                              className="hidden"
                              onChange={handleFileUpload}
                              disabled={isAttachmentLoading}
                            />
                          </label>
                          {isAttachmentLoading && (
                            <Loader2
                              className="animate-spin text-blue-600"
                              size={20}
                            />
                          )}
                          <p className="text-xs text-gray-400">
                            Tối đa 10MB. Chấp nhận các định dạng phổ biến.
                          </p>
                        </div>
                      </section>

                      {/* Comments Section */}
                      <section>
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                          Thảo luận ({taskComments.length})
                        </h4>
                        <form onSubmit={handleCreateComment} className="mb-6">
                          <textarea
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all shadow-sm"
                            placeholder="Viết bình luận của bạn..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                          />
                          <div className="flex justify-end mt-2">
                            <button
                              type="submit"
                              disabled={isCommentLoading || !newComment.trim()}
                              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 disabled:bg-gray-300 transition-all"
                            >
                              {isCommentLoading ? (
                                <Loader2 className="animate-spin" size={18} />
                              ) : (
                                "Gửi bình luận"
                              )}
                            </button>
                          </div>
                        </form>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                          {taskComments.length === 0 ? (
                            <p className="text-center text-gray-400 py-8 italic text-sm">
                              Chưa có bình luận nào.
                            </p>
                          ) : (
                            taskComments.map((comment) => (
                              <div key={comment.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0 overflow-hidden">
                                  {comment.user?.avatarUrl ? (
                                    <img
                                      src={comment.user.avatarUrl}
                                      alt={comment.user.fullName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    comment.user?.fullName?.charAt(0) || "U"
                                  )}
                                </div>
                                <div className="bg-gray-50 p-3 rounded-2xl flex-1 border border-gray-100">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-xs text-gray-900">
                                      {comment.user?.fullName || "Người dùng"}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                      {new Date(
                                        comment.createdAt,
                                      ).toLocaleString("vi-VN")}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700">
                                    {comment.content}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </section>
                    </div>

                    {/* Right Column: Meta Info & Activity Logs */}
                    <div className="space-y-8">
                      <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                          Thông tin bổ sung
                        </h4>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                              Độ ưu tiên
                            </span>
                            <span
                              className={`px-2 py-1 text-[10px] font-bold rounded-full border uppercase ${
                                viewingTask.priority === "HIGH"
                                  ? "bg-red-50 text-red-600 border-red-100"
                                  : viewingTask.priority === "MEDIUM"
                                    ? "bg-yellow-50 text-yellow-600 border-yellow-100"
                                    : "bg-green-50 text-green-600 border-green-100"
                              }`}
                            >
                              {viewingTask.priority}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                              Trạng thái
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              {viewingTask.statusName || "Chưa rõ"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                              Ngày hạn
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              {viewingTask.dueDate
                                ? new Date(
                                    viewingTask.dueDate,
                                  ).toLocaleDateString("vi-VN")
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      </section>

                      <section>
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                          Nhật ký hoạt động
                        </h4>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                          {taskActivityLogs.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">
                              Chưa có hoạt động nào.
                            </p>
                          ) : (
                            taskActivityLogs.map((log) => {
                              const dateStr = log.timestamp
                                ? new Date(log.timestamp).toLocaleString(
                                    "vi-VN",
                                  )
                                : "N/A";
                              return (
                                <div
                                  key={log.id}
                                  className="relative pl-6 pb-4 border-l-2 border-gray-100 last:pb-0"
                                >
                                  <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                  </div>
                                  <div className="text-xs text-gray-400 mb-1">
                                    {dateStr}
                                  </div>
                                  <p className="text-xs text-gray-700 leading-relaxed">
                                    <span className="font-bold">
                                      {log.userName || "Hệ thống"}
                                    </span>{" "}
                                    {log.action}
                                  </p>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
          {/* Main Content Area - Place for Tasks, Sprints, Epics */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[500px]">
              {/* Tabs */}
              <div className="flex border-b border-gray-100 mb-8">
                <button
                  onClick={() => setActiveTab("TASKS")}
                  className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${
                    activeTab === "TASKS"
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-400 border-transparent hover:text-gray-600"
                  }`}
                >
                  Công việc
                </button>
                <button
                  onClick={() => setActiveTab("SPRINTS")}
                  className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${
                    activeTab === "SPRINTS"
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-400 border-transparent hover:text-gray-600"
                  }`}
                >
                  Sprints (Agile)
                </button>
                <button
                  onClick={() => setActiveTab("EPICS")}
                  className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${
                    activeTab === "EPICS"
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-400 border-transparent hover:text-gray-600"
                  }`}
                >
                  Epics
                </button>
                <button
                  onClick={() => setActiveTab("KANBAN")}
                  className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${
                    activeTab === "KANBAN"
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-400 border-transparent hover:text-gray-600"
                  }`}
                >
                  Bảng Kanban
                </button>
              </div>

              {activeTab === "TASKS" && (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Layout size={24} className="text-blue-600" />
                      Danh sách công việc
                    </h2>
                    <button
                      onClick={() => setIsCreateTaskOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md active:scale-95 text-sm font-medium"
                    >
                      <UserPlus size={18} />
                      Thêm Task
                    </button>
                  </div>

                  {isTaskLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <Loader2
                        className="animate-spin text-blue-600"
                        size={32}
                      />
                      <p className="text-gray-500 text-sm">
                        Đang tải công việc...
                      </p>
                    </div>
                  ) : tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-4">
                        <FolderKanban size={32} />
                      </div>
                      <h3 className="text-gray-900 font-bold">
                        Chưa có công việc nào
                      </h3>
                      <p className="text-gray-500 text-sm mt-1 max-w-xs">
                        Hãy bắt đầu bằng cách tạo công việc đầu tiên cho dự án
                        này.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tasks.map((task: any) => (
                        <div
                          key={task.id}
                          className="group p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {task.title}
                              </h4>
                              <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                                {task.description || "Không có mô tả"}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-full border uppercase ${
                                  task.priority === "HIGH"
                                    ? "bg-red-50 text-red-600 border-red-100"
                                    : task.priority === "MEDIUM"
                                      ? "bg-yellow-50 text-yellow-600 border-yellow-100"
                                      : "bg-green-50 text-green-600 border-green-100"
                                }`}
                              >
                                {task.priority}
                              </span>
                              <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                                <Calendar size={12} />
                                {task.dueDate
                                  ? new Date(task.dueDate).toLocaleDateString(
                                      "vi-VN",
                                    )
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => fetchTaskDetails(task)}
                                className="text-xs font-bold text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"
                              >
                                Xem chi tiết
                              </button>
                              <button
                                onClick={() => setEditingTask(task)}
                                className="text-xs font-bold text-yellow-600 hover:underline"
                              >
                                Chỉnh sửa
                              </button>
                              <button
                                onClick={() => setAssigningTask(task)}
                                className="text-xs font-bold text-green-600 hover:underline"
                              >
                                Giao việc
                              </button>
                              <button
                                onClick={() => setSprintTaskToAssign(task)}
                                className="text-xs font-bold text-blue-600 hover:underline"
                              >
                                Thêm vào Sprint
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === "SPRINTS" && (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Clock size={24} className="text-blue-600" />
                      Danh sách Sprints
                    </h2>
                    <button
                      onClick={() => setIsCreateSprintOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md active:scale-95 text-sm font-medium"
                    >
                      <Plus size={18} />
                      Tạo Sprint
                    </button>
                  </div>

                  {isSprintLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <Loader2
                        className="animate-spin text-blue-600"
                        size={32}
                      />
                      <p className="text-gray-500 text-sm">
                        Đang tải sprints...
                      </p>
                    </div>
                  ) : sprints.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-4">
                        <Clock size={32} />
                      </div>
                      <h3 className="text-gray-900 font-bold">
                        Chưa có Sprint nào
                      </h3>
                      <p className="text-gray-500 text-sm mt-1">
                        Hãy tạo sprint mới để bắt đầu quy trình Agile.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sprints.map((sprint: any) => (
                        <div
                          key={sprint.id}
                          className="p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-blue-200 transition-all"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-bold text-gray-900">
                                {sprint.name}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(sprint.startDate).toLocaleDateString(
                                  "vi-VN",
                                )}{" "}
                                -{" "}
                                {new Date(sprint.endDate).toLocaleDateString(
                                  "vi-VN",
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              {sprint.status === "ACTIVE" ? (
                                <span className="px-3 py-1 bg-green-100 text-green-600 text-xs font-bold rounded-full">
                                  Đang hoạt động
                                </span>
                              ) : sprint.status === "COMPLETED" ? (
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
                                  Đã hoàn thành
                                </span>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleActivateSprint(sprint.id)
                                  }
                                  className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full hover:bg-blue-700 transition-colors"
                                >
                                  Kích hoạt
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === "EPICS" && (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Shield size={24} className="text-blue-600" />
                      Danh sách Epics
                    </h2>
                    <button
                      onClick={() => setIsCreateEpicOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md active:scale-95 text-sm font-medium"
                    >
                      <Plus size={18} />
                      Tạo Epic
                    </button>
                  </div>

                  {isEpicLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <Loader2
                        className="animate-spin text-blue-600"
                        size={32}
                      />
                      <p className="text-gray-500 text-sm">Đang tải epics...</p>
                    </div>
                  ) : epics.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-4">
                        <Shield size={32} />
                      </div>
                      <h3 className="text-gray-900 font-bold">
                        Chưa có Epic nào
                      </h3>
                      <p className="text-gray-500 text-sm mt-1">
                        Epics giúp phân loại các cụm tính năng lớn.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {epics.map((epic: any) => (
                        <div
                          key={epic.id}
                          className="p-4 bg-purple-50 border border-purple-100 rounded-xl hover:shadow-sm transition-all"
                        >
                          <h4 className="font-bold text-purple-900">
                            {epic.name}
                          </h4>
                          <p className="text-sm text-purple-700 mt-1 line-clamp-2">
                            {epic.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === "KANBAN" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Trello size={24} className="text-blue-600" />
                      Bảng Kanban
                      {activeSprint && (
                        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full ml-2">
                          Sprint: {activeSprint.name}
                        </span>
                      )}
                    </h2>
                  </div>

                  {!activeSprint ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                      <div className="w-16 h-16 bg-white text-gray-300 rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <Clock size={32} />
                      </div>
                      <h3 className="text-gray-900 font-bold">
                        Chưa có Sprint nào đang hoạt động
                      </h3>
                      <p className="text-gray-500 text-sm mt-1 mb-6 max-w-xs">
                        Vui lòng sang tab Sprints và kích hoạt một sprint để xem
                        bảng Kanban.
                      </p>
                      <button
                        onClick={() => setActiveTab("SPRINTS")}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
                      >
                        Đến Tab Sprints
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-6 overflow-x-auto pb-6 -mx-2 px-2 scrollbar-hide">
                      {taskStatuses.map((status) => (
                        <div
                          key={status.id}
                          className="flex-shrink-0 w-80 bg-gray-50/50 rounded-2xl p-4 border border-gray-100 flex flex-col min-h-[500px]"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            const taskId = e.dataTransfer.getData("taskId");
                            handleTaskDrop(taskId, status.id);
                          }}
                        >
                          <div className="flex items-center justify-between mb-4 px-1">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                              {status.name}
                              <span className="bg-white px-2 py-0.5 rounded-full text-xs text-gray-400 border border-gray-100 shadow-sm">
                                {
                                  kanbanTasks.filter(
                                    (t) => t.statusId === status.id,
                                  ).length
                                }
                              </span>
                            </h3>
                          </div>

                          <div className="space-y-3 flex-1">
                            {kanbanTasks
                              .filter((task) => task.statusId === status.id)
                              .map((task) => (
                                <div
                                  key={task.id}
                                  draggable
                                  onDragStart={(e) =>
                                    e.dataTransfer.setData("taskId", task.id)
                                  }
                                  className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-grab active:cursor-grabbing group"
                                >
                                  <div className="flex items-start justify-between gap-3 mb-2">
                                    <h4
                                      className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer"
                                      onClick={() => fetchTaskDetails(task)}
                                    >
                                      {task.title}
                                    </h4>
                                    <GripVertical
                                      size={14}
                                      className="text-gray-300 group-hover:text-gray-400"
                                    />
                                  </div>
                                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                                    {task.description || "Không có mô tả"}
                                  </p>
                                  <div className="flex items-center justify-between mt-auto">
                                    <span
                                      className={`px-2 py-0.5 text-[9px] font-bold rounded-full border uppercase ${
                                        task.priority === "HIGH"
                                          ? "bg-red-50 text-red-600 border-red-100"
                                          : task.priority === "MEDIUM"
                                            ? "bg-yellow-50 text-yellow-600 border-yellow-100"
                                            : "bg-green-50 text-green-600 border-green-100"
                                      }`}
                                    >
                                      {task.priority}
                                    </span>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                      <Calendar size={10} />
                                      {task.dueDate
                                        ? new Date(
                                            task.dueDate,
                                          ).toLocaleDateString("vi-VN")
                                        : "N/A"}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Modal Tạo Sprint mới */}
          {isCreateSprintOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Clock size={24} />
                    Tạo Sprint mới
                  </h3>
                  <button
                    onClick={() => setIsCreateSprintOpen(false)}
                    className="text-white hover:bg-blue-700 p-1 rounded-lg transition-colors"
                  >
                    <Trash2 size={24} />
                  </button>
                </div>
                <form onSubmit={handleCreateSprint} className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Tên Sprint *
                    </label>
                    <input
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Ví dụ: Sprint 1 - Core Features"
                      value={newSprint.name}
                      onChange={(e) =>
                        setNewSprint({ ...newSprint, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Ngày bắt đầu
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newSprint.startDate}
                        onChange={(e) =>
                          setNewSprint({
                            ...newSprint,
                            startDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Ngày kết thúc
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newSprint.endDate}
                        onChange={(e) =>
                          setNewSprint({
                            ...newSprint,
                            endDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCreateSprintOpen(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-bold transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md active:scale-95 transition-all"
                    >
                      Tạo Sprint
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Tạo Epic mới */}
          {isCreateEpicOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Shield size={24} />
                    Tạo Epic mới
                  </h3>
                  <button
                    onClick={() => setIsCreateEpicOpen(false)}
                    className="text-white hover:bg-blue-700 p-1 rounded-lg transition-colors"
                  >
                    <Trash2 size={24} />
                  </button>
                </div>
                <form onSubmit={handleCreateEpic} className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Tên Epic *
                    </label>
                    <input
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Ví dụ: Module Quản lý người dùng"
                      value={newEpic.name}
                      onChange={(e) =>
                        setNewEpic({ ...newEpic, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Mô tả
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder="Mô tả mục tiêu của Epic này..."
                      value={newEpic.description}
                      onChange={(e) =>
                        setNewEpic({ ...newEpic, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Ngày bắt đầu
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newEpic.startDate}
                        onChange={(e) =>
                          setNewEpic({ ...newEpic, startDate: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Ngày kết thúc
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newEpic.endDate}
                        onChange={(e) =>
                          setNewEpic({ ...newEpic, endDate: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCreateEpicOpen(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-bold transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md active:scale-95 transition-all"
                    >
                      Tạo Epic
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Tạo Task mới */}
          {isCreateTaskOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <FolderKanban size={24} />
                    Tạo công việc mới
                  </h3>
                  <button
                    onClick={() => setIsCreateTaskOpen(false)}
                    className="text-white hover:bg-blue-700 p-1 rounded-lg transition-colors"
                  >
                    <Trash2 size={24} />
                  </button>
                </div>
                <form onSubmit={handleCreateTask} className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Tiêu đề Task *
                    </label>
                    <input
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Nhập tên công việc..."
                      value={newTask.title}
                      onChange={(e) =>
                        setNewTask({ ...newTask, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Mô tả
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder="Mô tả công việc này..."
                      value={newTask.description}
                      onChange={(e) =>
                        setNewTask({ ...newTask, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Loại công việc
                      </label>
                      <select
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={newTask.type}
                        onChange={(e) =>
                          setNewTask({ ...newTask, type: e.target.value })
                        }
                      >
                        <option value="TASK">Công việc</option>
                        <option value="BUG">Lỗi (Bug)</option>
                        <option value="STORY">Câu chuyện (Story)</option>
                        <option value="EPIC">Epic</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Epic
                      </label>
                      <select
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={newTask.epicId}
                        onChange={(e) =>
                          setNewTask({ ...newTask, epicId: e.target.value })
                        }
                      >
                        <option value="">Không có Epic</option>
                        {epics.map((epic) => (
                          <option key={epic.id} value={epic.id}>
                            {epic.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Độ ưu tiên
                      </label>
                      <select
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={newTask.priority}
                        onChange={(e) =>
                          setNewTask({ ...newTask, priority: e.target.value })
                        }
                      >
                        <option value="LOW">Thấp</option>
                        <option value="MEDIUM">Trung bình</option>
                        <option value="HIGH">Cao</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Ngày hết hạn
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newTask.dueDate}
                        onChange={(e) =>
                          setNewTask({ ...newTask, dueDate: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Thời gian dự kiến (giờ)
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Nhập số giờ..."
                        value={newTask.estimatedTime}
                        onChange={(e) =>
                          setNewTask({
                            ...newTask,
                            estimatedTime: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCreateTaskOpen(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-bold transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md active:scale-95 transition-all"
                    >
                      Tạo Task
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

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
