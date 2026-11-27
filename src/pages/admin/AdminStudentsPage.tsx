import React, { useEffect, useState } from 'react';
import {
  Search,
  ShieldCheck,
} from 'lucide-react';
import { getAllUsers, updateUserRoleByAdmin } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { UserProfile, UserRole } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminStudentsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [roleError, setRoleError] = useState<string | null>(null);

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
    setRoleError(null);
    if (currentUser?.uid === uid && newRole !== 'admin') {
      setRoleError('You cannot remove University Administration access from your own active account.');
      return;
    }
    try {
      await updateUserRoleByAdmin(uid, newRole, currentUser);
      if (selectedUser && selectedUser.uid === uid) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
      await loadStudents();
    } catch (e) {
      setRoleError(e instanceof Error ? e.message : 'Unable to update role permissions.');
    }
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
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="jstu-page-title">Student &amp; Faculty Directory</h1>
        <p className="jstu-secondary">
          Browse registered university members and manage authorized platform permissions.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="jstu-surface p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, ID number, or email..."
            className="jstu-input pl-11"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex items-center gap-2.5">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="jstu-select md:w-60"
            aria-label="Filter by department"
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
            className="jstu-select md:w-44"
            aria-label="Filter by role"
          >
            <option value="All">All Roles</option>
            <option value="student">Students</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="jstu-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="jstu-table-th">Student / Member</th>
                <th className="jstu-table-th">Student ID</th>
                <th className="jstu-table-th">Department &amp; Batch</th>
                <th className="jstu-table-th">Role</th>
                <th className="jstu-table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {filtered.map((u) => (
                <tr
                  key={u.uid}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                >
                  <td className="jstu-table-td">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={
                          u.avatarUrl ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                            u.fullName
                          )}`
                        }
                        alt={u.fullName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {u.fullName}
                        </p>
                        <p className="jstu-meta truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="jstu-table-td font-mono font-semibold tabular-nums whitespace-nowrap">
                    {u.studentId}
                  </td>
                  <td className="jstu-table-td">
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {u.department}
                    </p>
                    <p className="jstu-meta">{u.batch}</p>
                  </td>
                  <td className="jstu-table-td">
                    <Badge variant={u.role === 'admin' ? 'purple' : 'primary'} size="sm">
                      {u.role.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="jstu-table-td text-right">
                    <button
                      onClick={() => setSelectedUser(u)}
                      className="jstu-btn-secondary min-h-[38px] px-4 py-1.5 text-sm"
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
            <div className="jstu-inset p-4 space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="jstu-meta">Student ID:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {selectedUser.studentId}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="jstu-meta">Email:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedUser.email}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="jstu-meta">Department:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedUser.department}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="jstu-meta">Batch:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedUser.batch}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="jstu-meta">Current Clearance:</span>
                <Badge variant={selectedUser.role === 'admin' ? 'purple' : 'primary'}>
                  {selectedUser.role.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Role assignment controls */}
            <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/50 space-y-3">
              <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>JSTU Campus Access Category</span>
              </h4>
              <p className="jstu-secondary">
                University Administration accounts manage official campus services, transportation routes, notices, schedules, and moderation. Only authorized administrators may update account clearance.
              </p>

              {roleError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-sm text-rose-700 dark:text-rose-300 font-medium">
                  {roleError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                {selectedUser.role === 'student' ? (
                  <button
                    onClick={() => handleRoleChange(selectedUser.uid, 'admin')}
                    className="inline-flex items-center justify-center min-h-[42px] px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[15px] font-semibold transition-colors"
                  >
                    Assign University Administration
                  </button>
                ) : (
                  <button
                    disabled={currentUser?.uid === selectedUser.uid}
                    onClick={() => handleRoleChange(selectedUser.uid, 'student')}
                    className="inline-flex items-center justify-center min-h-[42px] px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-[15px] font-semibold transition-colors"
                  >
                    Reassign to Student
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedUser(null)} className="jstu-btn-secondary">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
