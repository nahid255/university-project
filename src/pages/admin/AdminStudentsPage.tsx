import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  UserCheck,
  Mail,
  Building2,
  Calendar,
  IdCard,
} from 'lucide-react';
import { getAllUsers, updateUserRoleByAdmin } from '../../services/adminService';
import { UserProfile, UserRole } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminStudentsPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');

  // Selected User Modal for detail view / role toggle
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch (e) {
      console.error('Failed to load users', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    await updateUserRoleByAdmin(uid, newRole);
    if (selectedUser && selectedUser.uid === uid) {
      setSelectedUser({ ...selectedUser, role: newRole });
    }
    await loadStudents();
  };

  if (loading) {
    return <LoadingSpinner label="Loading student directory..." />;
  }

  const departments = Array.from(new Set(users.map((u) => u.department)));

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.studentId.toLowerCase().includes(search.toLowerCase());

    const matchesDept = deptFilter === 'All' || u.department === deptFilter;
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;

    return matchesSearch && matchesDept && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>Student & Faculty Directory</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse registered university members and manage authorized platform permissions
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#111C32] rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, ID number, or email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
          >
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
          >
            <option value="All">All Roles</option>
            <option value="student">Students</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* Directory Table / Cards */}
      <div className="bg-white dark:bg-[#111C32] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Student / Member</th>
                <th className="py-3.5 px-4">Student ID</th>
                <th className="py-3.5 px-4">Department & Batch</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((u) => (
                <tr
                  key={u.uid}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                >
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          u.avatarUrl ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                            u.fullName
                          )}`
                        }
                        alt={u.fullName}
                        className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                      />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {u.fullName}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                    {u.studentId}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {u.department}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {u.batch}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={u.role === 'admin' ? 'purple' : 'primary'} size="sm">
                      {u.role.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedUser(u)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 dark:bg-slate-800 dark:hover:bg-purple-950/60 dark:text-slate-300 dark:hover:text-purple-300 font-bold transition-colors"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Manage Modal */}
      {selectedUser && (
        <Modal
          isOpen={Boolean(selectedUser)}
          onClose={() => setSelectedUser(null)}
          title="Student Record & Permissions"
          description={`Manage account details and administrative clearance for ${selectedUser.fullName}`}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Student ID:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {selectedUser.studentId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedUser.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Department:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedUser.department}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Batch:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedUser.batch}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Clearance:</span>
                <Badge variant={selectedUser.role === 'admin' ? 'purple' : 'primary'}>
                  {selectedUser.role.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Role elevation controls */}
            <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 space-y-3">
              <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Privilege Assignment</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Administrative privileges grant full rights to publish campus notices, manage academic schedules, and moderate student posts.
              </p>

              <div className="flex items-center gap-2 pt-1">
                {selectedUser.role === 'student' ? (
                  <button
                    onClick={() => handleRoleChange(selectedUser.uid, 'admin')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    Promote to Campus Administrator
                  </button>
                ) : (
                  <button
                    onClick={() => handleRoleChange(selectedUser.uid, 'student')}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    Demote to Regular Student
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
