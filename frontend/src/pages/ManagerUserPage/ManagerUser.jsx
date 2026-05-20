import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUserRole, deleteUser } from '@services/userService';
import { FiEye, FiEyeOff } from "react-icons/fi";
import { HiPencilAlt, HiPlus, HiSearch } from 'react-icons/hi';
import { HiTrash } from 'react-icons/hi2';

export default function ManagerUser() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [editRole, setEditRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers(page, limit, searchTerm);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to Get users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users when page, limit, or search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, searchTerm ? 500 : 0); // Debounce search by 500ms

    return () => clearTimeout(timer);
  }, [page, limit, searchTerm]);

  // Handle create user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.username.length < 3 || formData.username.length > 50) {
      setError('Username must be between 3 and 50 characters');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      await createUser(formData.username, formData.password);
      setSuccess('User created successfully');
      setShowCreateModal(false);
      setFormData({ username: '', password: '' });
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to create user');
    }
  };

  // Handle update user role
  const handleUpdateRole = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await updateUserRole(selectedUser.username, editRole);
      setSuccess('User role updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user role');
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    setError(null);
    setSuccess(null);

    try {
      await deleteUser(selectedUser.username);
      setSuccess('User deleted successfully');
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  // Open edit modal
  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Calculate total pages
  const totalPages = Math.ceil(total / limit);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-page p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">User Management</h1>
            <p className="text-secondary">Manage your team members and their roles</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex flex-row items-center justify-center md:w-auto px-6 py-3 btn-primary"
          >
            <HiPlus className="w-5 h-5 mr-2" />
            Add New User
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Search Bar */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <HiSearch className="w-5 h-5 text-secondary" />
            <input
              type="text"
              placeholder="Search users by username..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1); // Reset to first page on search
              }}
              className="flex-1 bg-transparent border-none text-primary placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-20 text-secondary">
                No users found
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-black/5 dark:bg-white/5 border-b border-border-color">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-accent uppercase tracking-wider">Username</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-accent uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-accent uppercase tracking-wider hidden md:table-cell">Created At</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-accent uppercase tracking-wider hidden lg:table-cell">Updated At</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-accent uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color">
                  {users.map((user) => (
                    <tr key={user.username} className="hover:bg-black/5 dark:hover:bg-white/5 transition duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-500 to-black flex items-center justify-center text-white font-semibold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-primary">{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${user.role === 'admin'
                          ? 'bg-purple-500/10 text-yellow-600 dark:text-yellow-300 border border-yellow-500/20'
                          : user.role === 'supervisor'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20'
                            : 'bg-green-500/10 text-green-600 dark:text-green-300 border border-green-500/20'
                          }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary hidden md:table-cell">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary hidden lg:table-cell">
                        {formatDate(user.updated_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition duration-150"
                            title="Edit role"
                          >
                            <HiPencilAlt className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(user)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition duration-150"
                            title="Delete user"
                          >
                            <HiTrash className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 bg-black/5 dark:bg-white/5 border-t border-border-color flex items-center justify-between">
            <div className="text-sm text-secondary">
              Showing <span className="font-semibold text-primary">{users.length}</span> of <span className="font-semibold text-primary">{total}</span> users
              {totalPages > 0 && <span className="hidden sm:inline"> (Page {page} of {totalPages})</span>}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-black/5 dark:bg-white/10 text-primary rounded-lg hover:bg-black/10 dark:hover:bg-white/20 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 bg-black/5 dark:bg-white/10 text-primary rounded-lg hover:bg-black/10 dark:hover:bg-white/20 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-primary mb-4">Create New User</h2>
            <form onSubmit={handleCreateUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2 glass-input rounded-lg"
                    placeholder="Enter username (3-50 characters)"
                    required
                    minLength={3}
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2 glass-input rounded-lg"
                      placeholder="Enter password (min 8 characters)"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-black transition-colors"
                    >
                      {showPassword ? (
                        <FiEyeOff size={20} />
                      ) : (
                        <FiEye size={20} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ username: '', password: '' });
                  }}
                  className="px-4 py-2 bg-black/5 dark:bg-white/10 text-primary rounded-lg hover:bg-black/10 dark:hover:bg-white/20 transition duration-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 btn-primary"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-primary mb-4">Update User Role</h2>
            <p className="text-secondary mb-4">User: <span className="text-primary font-semibold">{selectedUser.username}</span></p>
            <form onSubmit={handleUpdateRole}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-4 py-2 glass-input rounded-lg"
                    required
                  >
                    <option value="admin" className="text-black">Admin</option>
                    <option value="supervisor" className="text-black">Supervisor</option>
                    <option value="operator" className="text-black">Operator</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 bg-black/5 dark:bg-white/10 text-primary rounded-lg hover:bg-black/10 dark:hover:bg-white/20 transition duration-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 btn-primary"
                >
                  Update Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-primary mb-4">Delete User</h2>
            <p className="text-secondary mb-6">
              Are you sure you want to delete user <span className="text-primary font-semibold">{selectedUser.username}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 bg-black/5 dark:bg-white/10 text-primary rounded-lg hover:bg-black/10 dark:hover:bg-white/20 transition duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-150"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
