import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, UserPlus, Shield, Trash2, Edit3, X, Check } from 'lucide-react';
import { api } from '../services/api';

export default function UsersList() {
  const { activeOrg, currentUser } = useOutletContext();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [email, setEmail] = useState('');
  const [roleName, setRoleName] = useState('student');
  const [submitting, setSubmitting] = useState(false);

  // Edit role states
  const [editingMember, setEditingMember] = useState(null);
  const [editRoleName, setEditRoleName] = useState('student');

  useEffect(() => {
    if (activeOrg) {
      fetchMembers();
    }
  }, [activeOrg]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.getOrgMembers(activeOrg.organization_uuid);
      setMembers(res.data.members || []);
    } catch (err) {
      setError('Failed to fetch organization members');
    } finally {
      setLoading(false);
    }
  };

  const clearAlerts = () => {
    setError('');
    setSuccess('');
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!email || !roleName) return;
    setSubmitting(true);
    clearAlerts();

    try {
      await api.addOrgMember(email, activeOrg._id, roleName);
      setSuccess(`User "${email}" added to organization successfully!`);
      setEmail('');
      setRoleName('student');
      setShowAddForm(false);
      await fetchMembers();
    } catch (err) {
      setError(err.message || 'Failed to add user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!editingMember || !editRoleName) return;
    setSubmitting(true);
    clearAlerts();

    try {
      await api.updateOrgMemberRole(activeOrg.organization_uuid, editingMember._id, editRoleName);
      setSuccess(`Role updated successfully!`);
      setEditingMember(null);
      await fetchMembers();
    } catch (err) {
      setError(err.message || 'Failed to update member role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId, memberEmail) => {
    if (userId === currentUser.id) {
      setError("You cannot remove yourself from the organization.");
      return;
    }
    if (!window.confirm(`Are you sure you want to remove ${memberEmail} from this organization?`)) return;
    clearAlerts();

    try {
      await api.removeOrgMember(activeOrg.organization_uuid, userId);
      setSuccess(`Successfully removed user from organization.`);
      await fetchMembers();
    } catch (err) {
      setError(err.message || 'Failed to remove user');
    }
  };

  return (
    <div className="users-container">
      <div className="content-header">
        <div>
          <h2>User Management</h2>
          <p>Configure access control and permissions for organization members</p>
        </div>
        {!showAddForm && !editingMember && (
          <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
            <UserPlus size={18} /> Add Member
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Add Member Form */}
      {showAddForm && (
        <div className="form-card">
          <div className="form-card-header">
            <h3>Add New Member</h3>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEmail('');
                setRoleName('student');
              }}
              className="btn-close"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleAddMember}>
            <div className="form-group">
              <label htmlFor="userEmail">Email Address</label>
              <input
                id="userEmail"
                type="email"
                placeholder="developer@campusos.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="userRole">Assigned Role</label>
              <select
                id="userRole"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                required
              >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="maintainer">Maintainer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEmail('');
                  setRoleName('student');
                }}
                className="btn btn-outline"
                disabled={submitting}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Role Form */}
      {editingMember && (
        <div className="form-card">
          <div className="form-card-header">
            <h3>Edit Role for {editingMember.email}</h3>
            <button
              onClick={() => {
                setEditingMember(null);
              }}
              className="btn-close"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleUpdateRole}>
            <div className="form-group">
              <label htmlFor="editRole">Select Role</label>
              <select
                id="editRole"
                value={editRoleName}
                onChange={(e) => setEditRoleName(e.target.value)}
                required
              >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="maintainer">Maintainer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  setEditingMember(null);
                }}
                className="btn btn-outline"
                disabled={submitting}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Updating...' : 'Update Role'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member Email</th>
                <th>Role</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="table-empty">
                    <Users size={32} />
                    <p>No members found in this organization.</p>
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member._id}>
                    <td>
                      <div className="member-cell-info">
                        <strong>{member.email}</strong>
                        {member._id === currentUser.id && <span className="badge badge-accent">YOU</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-role-${member.role}`}>
                        {member.role ? member.role.toUpperCase() : 'NONE'}
                      </span>
                    </td>
                    <td>
                      {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <div className="btn-actions-group">
                        <button
                          onClick={() => {
                            setEditingMember(member);
                            setEditRoleName(member.role || 'student');
                          }}
                          className="btn-action"
                          title="Change Role"
                          disabled={member._id === currentUser.id}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleRemoveMember(member._id, member.email)}
                          className="btn-action btn-action-danger"
                          title="Remove Member"
                          disabled={member._id === currentUser.id}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
