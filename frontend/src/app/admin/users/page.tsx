'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Shield, UserPlus, Trash2, ShieldCheck, Edit2, Check, X } from 'lucide-react';
import ForensicPageLayout from '../../components/ForensicPageLayout';
import { useProject } from '../../../store/useProject';
import { API_URL } from '../../../lib/constants';
import { authenticatedFetch } from '../../../lib/api';
import { RoleGuard } from '../../../components/auth/RoleGuard';

interface User {
  id: string;
  username: string;
  full_name: string;
  role: string;
}

interface ProjectUser {
  user: User;
  role: string;
}

const AVAILABLE_ROLES = ['ADMIN', 'ANALYST', 'INVESTIGATOR', 'VIEWER', 'AUDITOR'];

export default function UserManagementPage() {
  const { activeProjectId } = useProject();
  const [projectUsers, setProjectUsers] = useState<ProjectUser[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');

  const fetchUsers = useCallback(async () => {
    try {
      if (activeProjectId) {
        const res = await authenticatedFetch(`${API_URL}/api/v1/admin/project/${activeProjectId}/users`);
        if (res.ok) setProjectUsers(await res.json());
      }
      const allRes = await authenticatedFetch(`${API_URL}/api/v1/admin/users`);
      if (allRes.ok) setAllUsers(await allRes.json());
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  }, [activeProjectId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUsers();
  }, [fetchUsers]);

  const grantAccess = async (userId: string) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/api/v1/admin/project/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          project_id: activeProjectId,
          role: 'viewer'
        })
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const revokeAccess = async (userId: string) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/api/v1/admin/project/${activeProjectId}/user/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/api/v1/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      
      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err) {
      console.error("Failed to update user role", err);
    }
  };

  const startEditing = (user: User) => {
    setEditingUser(user.id);
    setSelectedRole(user.role);
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setSelectedRole('');
  };

  return (
    <RoleGuard allowedRoles={['admin', 'super_admin']}>
      <ForensicPageLayout
        title="Access Control Center"
        subtitle="Identity & Access Management (IAM)"
        icon={Shield}
      >
        <div className="p-10 space-y-10">
          {/* Project Access Section */}
          <section className="tactical-card depth-layer-1 p-8 rounded-3xl border depth-border-medium">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
                <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Authorized Personnel for Current Project</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectUsers.map((pu) => (
                <div key={pu.user.id} className="depth-layer-2 p-6 rounded-2xl border depth-border-subtle flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white uppercase text-sm">{pu.user.full_name}</p>
                      <p className="text-[11px] text-slate-500 font-mono italic">Role: {pu.role.toUpperCase()}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => revokeAccess(pu.user.id)}
                    title="Revoke Access"
                    className="p-2 hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* System Users Section */}
          <section className="tactical-card depth-layer-1 p-8 rounded-3xl border depth-border-medium">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Users className="w-6 h-6 text-indigo-500" />
                <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Global Registry</h2>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center px-6 py-4 text-[11px] uppercase font-black tracking-widest text-slate-500 border-b border-white/5">
                <div className="flex-1">Agent Identification</div>
                <div className="flex-1">Global Rank</div>
                <div className="flex-1">Actions</div>
              </div>
              
              <div className="space-y-2">
                  {allUsers.map((user) => (
                    <div key={user.id} className="group flex items-center px-6 py-4 bg-slate-900/40 border border-white/5 rounded-2xl hover:bg-white/5 hover:border-indigo-500/20 transition-all">
                      <div className="flex-1">
                        <p className="font-bold text-white group-hover:text-indigo-400 transition-colors">{user.full_name}</p>
                        <p className="text-[11px] text-slate-500 font-mono tracking-wider">@{user.username}</p>
                      </div>
                      
                      <div className="flex-1 text-xs font-mono text-indigo-400 italic">
                        {editingUser === user.id ? (
                          <div className="flex items-center gap-2">
                            <select
                               title="Select User Role"
                               value={selectedRole}
                               onChange={(e) => setSelectedRole(e.target.value)}
                               className="bg-slate-950 border border-indigo-500/50 rounded-lg px-2 py-1 text-[11px] font-black uppercase text-white outline-none"
                            >
                              {AVAILABLE_ROLES.map(role => (
                                <option key={role} value={role}>{role.toUpperCase()}</option>
                              ))}
                            </select>
                            <button 
                              onClick={() => updateUserRole(user.id, selectedRole)}
                              title="Confirm Role Change"
                              className="p-1.5 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={cancelEditing}
                              title="Cancel Editing"
                              className="p-1.5 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group/role cursor-pointer" onClick={() => startEditing(user)}>
                            <span className="font-black tracking-widest">{user.role.toUpperCase()}</span>
                            <Edit2 className="w-3 h-3 text-slate-600 opacity-0 group-hover/role:opacity-100 group-hover/role:text-indigo-400 transition-all" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        {!projectUsers.some(pu => pu.user.id === user.id) ? (
                          <button 
                            onClick={() => grantAccess(user.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-indigo-500/20 hover:border-transparent active:scale-95"
                          >
                            <UserPlus className="w-3 h-3" /> Authorize
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                             <ShieldCheck className="w-3 h-3 text-emerald-500" /> 
                             <span className="text-[10px] font-black text-emerald-400 tracking-widest opacity-80">CLEARED</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </section>
        </div>
      </ForensicPageLayout>
    </RoleGuard>
  );
}
