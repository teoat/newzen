'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Shield, UserPlus, Trash2, ShieldCheck } from 'lucide-react';
import ForensicPageLayout from '@/app/components/ForensicPageLayout';
import { useProject } from '@/store/useProject';
import { API_URL } from '@/utils/constants';

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

export default function UserManagementPage() {
  const { activeProjectId } = useProject();
  const [projectUsers, setProjectUsers] = useState<ProjectUser[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const fetchUsers = useCallback(async () => {
    try {
      if (activeProjectId) {
        const res = await fetch(`${API_URL}/api/v1/admin/project/${activeProjectId}/users`);
        if (res.ok) setProjectUsers(await res.json());
      }
      const allRes = await fetch(`${API_URL}/api/v1/admin/users`);
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
      const res = await fetch(`${API_URL}/api/v1/admin/project/access`, {
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
      const res = await fetch(`${API_URL}/api/v1/admin/project/${activeProjectId}/user/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
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
                    <p className="text-[10px] text-slate-500 font-mono italic">Role: {pu.role.toUpperCase()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => revokeAccess(pu.user.id)}
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

          <div className="overflow-hidden rounded-2xl border depth-border-subtle bg-slate-900/50">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b depth-border-subtle bg-slate-950/50 text-[10px] uppercase font-black tracking-widest text-slate-500">
                  <th className="px-6 py-4">Agent Identification</th>
                  <th className="px-6 py-4">Global Rank</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y depth-border-subtle">
                {allUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-white">{user.full_name}</p>
                      <p className="text-[10px] text-slate-500">@{user.username}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-indigo-400 italic">
                      {user.role.toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      {!projectUsers.some(pu => pu.user.id === user.id) ? (
                        <button 
                          onClick={() => grantAccess(user.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          <UserPlus className="w-3 h-3" /> Authorize
                        </button>
                      ) : (
                        <span className="text-[10px] font-black text-emerald-500 tracking-widest italic opacity-50 flex items-center gap-2">
                           <ShieldCheck className="w-3 h-3" /> ACTIVE_CLEARANCE
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </ForensicPageLayout>
  );
}
