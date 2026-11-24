"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { UpgradePrompt } from "@/components/ui/UpgradePrompt";
import { useAuth } from "@/context/AuthContext";
import {
  inviteAgent,
  listTeam,
  removeAgent,
  updateAgent,
} from "@/lib/api/services";
import { PLAN_RANK } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils";
import type { Role, TeamMember } from "@/types";
import { UserPlus, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const inviteSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  role: z.enum(["owner", "agent"]),
});

type InviteForm = z.infer<typeof inviteSchema>;

function statusTone(status: TeamMember["status"]): "green" | "yellow" | "gray" {
  if (status === "active") return "green";
  if (status === "invited") return "yellow";
  return "gray";
}

export default function TeamPage() {
  const { user } = useAuth();
  const locked = !user || PLAN_RANK[user.plan] < PLAN_RANK.professional;

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { name: "", email: "", role: "agent" },
  });

  const load = useCallback(async () => {
    if (locked) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setTeam(await listTeam());
    } finally {
      setLoading(false);
    }
  }, [locked]);

  useEffect(() => {
    load();
  }, [load]);

  const onInvite = handleSubmit(async (values) => {
    try {
      const member = await inviteAgent({
        name: values.name,
        email: values.email,
        role: values.role as Role,
      });
      setTeam((prev) => [member, ...prev]);
      toast.success(`Invite sent to ${values.email}`);
      reset({ name: "", email: "", role: "agent" });
      setInviteOpen(false);
    } catch {
      toast.error("Could not invite agent");
    }
  });

  const toggleStatus = async (member: TeamMember) => {
    if (member.role === "owner") {
      toast.error("Owner status cannot be changed");
      return;
    }
    setBusyId(member.id);
    try {
      const nextStatus = member.status === "active" ? "inactive" : "active";
      const next = await updateAgent(member.id, { status: nextStatus });
      setTeam((prev) => prev.map((m) => (m.id === next.id ? next : m)));
      toast.success(`${member.name} marked ${nextStatus}`);
    } catch {
      toast.error("Could not update member");
    } finally {
      setBusyId(null);
    }
  };

  const onRemove = async (member: TeamMember) => {
    if (member.role === "owner") {
      toast.error("Owner cannot be removed");
      return;
    }
    setBusyId(member.id);
    try {
      await removeAgent(member.id);
      setTeam((prev) => prev.filter((m) => m.id !== member.id));
      toast.success(`${member.name} removed`);
    } catch {
      toast.error("Could not remove member");
    } finally {
      setBusyId(null);
    }
  };

  if (!user) return null;

  if (locked) {
    return (
      <div className="space-y-5 animate-fade-in">
        <DemoBanner feature="team" />
        <div>
          <h2 className="text-2xl font-semibold text-ink">Team members</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Invite agents and assign WhatsApp conversations.
          </p>
        </div>
        <UpgradePrompt feature="Team Members" requiredPlan="Professional" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <DemoBanner feature="team" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Team members</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Manage owners and agents who can handle the inbox.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Invite agent
        </Button>
      </div>

      <Card>
        <CardHeader title="Active roster" description={`${team.length} members`} />
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : team.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No team members yet"
            description="Invite your first agent to start collaborating."
            action={
              <Button onClick={() => setInviteOpen(true)}>Invite agent</Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-3 py-2 font-semibold">Member</th>
                  <th className="px-3 py-2 font-semibold">Role</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Assigned</th>
                  <th className="px-3 py-2 font-semibold">Last active</th>
                  <th className="px-3 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {team.map((member) => (
                  <tr key={member.id} className="border-b border-line/70">
                    <td className="px-3 py-3">
                      <div className="font-medium text-ink">{member.name}</div>
                      <div className="text-xs text-ink-muted">{member.email}</div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={member.role === "owner" ? "navy" : "blue"}>
                        {member.role}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={statusTone(member.status)}>{member.status}</Badge>
                    </td>
                    <td className="px-3 py-3">{member.assignedConversations}</td>
                    <td className="px-3 py-3 text-ink-muted">
                      {member.lastActiveAt
                        ? formatRelativeTime(member.lastActiveAt)
                        : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          loading={busyId === member.id}
                          disabled={member.role === "owner"}
                          onClick={() => toggleStatus(member)}
                        >
                          {member.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="danger"
                          loading={busyId === member.id}
                          disabled={member.role === "owner"}
                          onClick={() => onRemove(member)}
                        >
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite team member"
      >
        <form className="space-y-4" onSubmit={onInvite}>
          <Input
            label="Full name"
            placeholder="Agent name"
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label="Email"
            type="email"
            placeholder="agent@business.pk"
            error={errors.email?.message}
            {...register("email")}
          />
          <div>
            <label className="label" htmlFor="role">
              Role
            </label>
            <select id="role" className="input-field" {...register("role")}>
              <option value="agent">Agent</option>
              <option value="owner">Owner</option>
            </select>
            {errors.role?.message && (
              <p className="mt-1 text-xs text-danger">{errors.role.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Send invite
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
