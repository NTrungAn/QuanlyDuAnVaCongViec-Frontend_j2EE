import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Layout, Calendar, ChevronRight, Loader2, FolderOpen } from 'lucide-react';
import api from '../api/axiosConfig';

interface Project {
  id: string;
  name: string;
  description: string;
  owner: {
    fullName: string;
    email: string;
  };
  startDate: string;
  endDate: string;
  isArchived: boolean;
}

const ProjectListPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.data);
    } catch (err: any) {
      setError('Không thể tải danh sách dự án. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="text-gray-600 font-medium">Đang tải danh sách dự án...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Layout className="text-blue-600" />
              Dự án của tôi
            </h1>
            <p className="mt-1 text-gray-500">Quản lý và theo dõi tiến độ các dự án bạn tham gia</p>
          </div>
          <Link
            to="/projects/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-medium"
          >
            <Plus size={20} />
            Tạo dự án mới
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8 rounded text-red-700">
            {error}
          </div>
        )}

        {/* Project Grid */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border-2 border-dashed border-gray-200">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <FolderOpen size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có dự án nào</h3>
            <p className="text-gray-500 mb-6">Bắt đầu bằng cách tạo dự án đầu tiên của bạn để quản lý công việc hiệu quả hơn.</p>
            <Link
              to="/projects/new"
              className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:underline"
            >
              Tạo dự án ngay <ChevronRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="group bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 p-6 transition-all hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {project.name}
                  </h3>
                  {project.isArchived && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded">Đã lưu trữ</span>
                  )}
                </div>
                
                <p className="text-gray-600 text-sm mb-6 line-clamp-2 h-10">
                  {project.description || 'Không có mô tả dự án.'}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{new Date(project.startDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>• Chủ sở hữu:</span>
                    <span className="font-medium text-gray-700">{project.owner.fullName}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectListPage;
