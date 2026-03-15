import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout, Calendar, ChevronLeft, Loader2, Save, FileText, Briefcase } from 'lucide-react';
import api from '../api/axiosConfig';

const CreateProjectPage: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await api.post('/projects', { 
        name, 
        description, 
        startDate, 
        endDate 
      });
      navigate('/projects'); // Chuyển hướng về danh sách dự án sau khi tạo thành công
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo dự án. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb / Back button */}
        <Link 
          to="/projects" 
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 font-medium transition-colors group"
        >
          <ChevronLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
          Quay lại danh sách dự án
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-blue-600 p-8 text-white">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Layout size={32} />
              Tạo dự án mới
            </h1>
            <p className="mt-2 text-blue-100 opacity-90">Bắt đầu một không gian làm việc mới cho nhóm của bạn</p>
          </div>

          <form className="p-8 space-y-8" onSubmit={handleCreateProject}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded text-red-700 font-medium text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Project Name */}
              <div>
                <label htmlFor="project-name" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Briefcase size={16} className="text-blue-600" />
                  Tên dự án *
                </label>
                <input
                  id="project-name"
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900"
                  placeholder="Ví dụ: Website bán hàng 2024"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText size={16} className="text-blue-600" />
                  Mô tả chi tiết
                </label>
                <textarea
                  id="description"
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 resize-none"
                  placeholder="Mô tả mục tiêu, phạm vi của dự án này..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="start-date" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar size={16} className="text-blue-600" />
                    Ngày bắt đầu
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar size={16} className="text-blue-600" />
                    Ngày kết thúc dự kiến
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg transition-all ${
                  isLoading ? 'bg-blue-400 cursor-not-allowed' : 'hover:bg-blue-700 hover:shadow-xl active:scale-95'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Save size={20} />
                )}
                Tạo dự án ngay
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectPage;
