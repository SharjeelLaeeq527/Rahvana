"use client";

// Owner-facing "Invite your spouse" + collaborators panel.
// Mount on the case dashboard / settings, passing the current journeyId.
// Gated by plan: free owners see a locked state with an upgrade hint.
// Role assignment (petitioner/beneficiary) is available to EITHER spouse once
// both are in the case, with a confirmation modal on both choose and swap.

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { usePlan } from "@/app/context/PlanContext";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";

type CaseRole = "petitioner" | "beneficiary";
const opposite = (r: CaseRole): CaseRole => (r === "petitioner" ? "beneficiary" : "petitioner");

interface Collaborator {
  userId: string;
  membershipRole: "owner" | "partner";
  caseRole: "petitioner" | "beneficiary" | null;
  email: string | null;
  isYou: boolean;
}

interface PendingInvite {
  invited_email: string;
  expires_at: string;
}

interface PanelData {
  collaborators: Collaborator[];
  isOwner: boolean;
  pendingInvite: PendingInvite | null;
}

export default function CollaboratorsPanel({ journeyId }: { journeyId: string }) {
  const { tier, isLoading: planLoading } = usePlan();
  const isFree = tier === "free";

  const [data, setData] = useState<PanelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // When the invite email can't be delivered, we surface the raw link here so the
  // owner can copy it and send it to their spouse manually.
  const [manualLink, setManualLink] = useState<string | null>(null);
  // Confirmation modal for choosing OR swapping a role. `role` is the role the
  // current user would take; the spouse automatically gets the opposite.
  const [confirm, setConfirm] = useState<{ kind: "assign" | "swap"; role: CaseRole } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/case/collaborators?journeyId=${journeyId}`);
      const json = await res.json();
      if (res.ok) {
        setData(json.data);
        setError(null);
      } else {
        setError(json?.error?.message || "Could not load your case members.");
      }
    } catch {
      setError("Could not load your case members.");
    } finally {
      setLoading(false);
    }
  }, [journeyId]);

  useEffect(() => {
    load();
  }, [load]);

  const sendInvite = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/case/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journeyId, email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message || "Could not send invite.");
      } else {
        setEmail("");
        if (json.data.emailSent) {
          setNotice(`Invite sent to ${json.data.invitedEmail}.`);
          setManualLink(null);
        } else {
          setNotice(
            `Invite created, but the email couldn't be sent${
              json.data.emailError ? ` (${json.data.emailError})` : ""
            }. Copy this link and send it to your spouse:`
          );
          setManualLink(json.data.inviteLink ?? null);
        }
        load();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const removePartner = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/case/collaborators", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journeyId }),
      });
      if (res.ok) {
        setNotice("Partner removed.");
        load();
      } else {
        setError("Could not remove partner.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // Assign / swap who is petitioner vs beneficiary. The caller declares THEIR
  // OWN role; the server gives the spouse the opposite (atomic, swap-safe).
  const assignRole = async (role: CaseRole) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/case/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journeyId, role }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message || "Could not update roles.");
      } else {
        setNotice("Roles updated.");
        setConfirm(null);
        load();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (loading || planLoading) {
    return (
      <div className="rounded-xl border border-slate-200 p-5 text-sm text-slate-500">
        Loading collaborators…
      </div>
    );
  }

  const partner = data?.collaborators.find((c) => c.membershipRole === "partner");
  const isOwner = data?.isOwner;

  // Role assignment is available to EITHER spouse, but only once both are in the
  // case (two active members).
  const me = data?.collaborators.find((c) => c.isYou);
  const other = data?.collaborators.find((c) => !c.isYou);
  const bothPresent = (data?.collaborators.length ?? 0) === 2;
  const rolesAssigned = bothPresent && !!me?.caseRole && !!other?.caseRole;

  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <h3 className="text-lg font-semibold text-[#0d7377] mb-1">Your spouse</h3>
      <p className="text-sm text-slate-500 mb-4">
        Invite your spouse to work on this case together — each from your own account.
      </p>

      {/* Current members */}
      <ul className="space-y-2 mb-4">
        {data?.collaborators.map((c) => (
          <li
            key={c.userId}
            className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
          >
            <span className="text-slate-700">
              {c.email || "Member"} {c.isYou && <span className="text-slate-400">(you)</span>}
            </span>
            <span className="text-xs uppercase tracking-wide text-slate-400">
              {c.membershipRole}
              {c.caseRole ? ` · ${c.caseRole}` : ""}
            </span>
          </li>
        ))}
      </ul>

      {/* Role assignment — EITHER spouse, once both are in the case */}
      {bothPresent && (
        <div className="mb-4">
          {!rolesAssigned ? (
            <div className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-sm font-medium text-slate-700 mb-1">Who is who?</p>
              <p className="text-xs text-slate-500 mb-3">
                Pick your role — your spouse is automatically given the other.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirm({ kind: "assign", role: "petitioner" })}
                  disabled={busy}
                  className="flex-1 rounded-lg border border-[#0d7377] px-3 py-2 text-sm font-semibold text-[#0d7377] hover:bg-[#0d7377] hover:text-white disabled:opacity-50"
                >
                  I&apos;m the petitioner
                </button>
                <button
                  onClick={() => setConfirm({ kind: "assign", role: "beneficiary" })}
                  disabled={busy}
                  className="flex-1 rounded-lg border border-[#0d7377] px-3 py-2 text-sm font-semibold text-[#0d7377] hover:bg-[#0d7377] hover:text-white disabled:opacity-50"
                >
                  I&apos;m the beneficiary
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-700">
                You: <span className="font-semibold capitalize">{me?.caseRole}</span> · Spouse:{" "}
                <span className="font-semibold capitalize">{other?.caseRole}</span>
              </p>
              <button
                onClick={() =>
                  me?.caseRole &&
                  setConfirm({ kind: "swap", role: opposite(me.caseRole as CaseRole) })
                }
                className="mt-2 text-xs font-medium text-[#0d7377] hover:underline"
              >
                Swap roles
              </button>
            </div>
          )}
        </div>
      )}

      {/* Owner-only management */}
      {isOwner && !partner && (
        <>
          {isFree ? (
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Upgrade to a paid plan to invite your spouse.
            </div>
          ) : data?.pendingInvite ? (
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className="text-slate-600">
                Invite sent to{" "}
                <span className="font-medium">{data.pendingInvite.invited_email}</span>
              </span>
              <button
                onClick={removePartner}
                disabled={busy}
                className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
              >
                Revoke
              </button>
            </div>
          ) : (
            <form onSubmit={sendInvite} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="spouse@email.com"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0d7377] focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-[#0d7377] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? "Sending…" : "Send invite"}
              </button>
            </form>
          )}
        </>
      )}

      {isOwner && partner && (
        <button
          onClick={removePartner}
          disabled={busy}
          className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
        >
          Remove partner
        </button>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {notice && <p className="mt-3 text-sm text-emerald-600">{notice}</p>}
      {manualLink && (
        <div className="mt-2 flex gap-2">
          <input
            readOnly
            value={manualLink}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600"
          />
          <button
            onClick={() => navigator.clipboard?.writeText(manualLink)}
            className="rounded-lg border border-[#0d7377] px-3 py-2 text-xs font-semibold text-[#0d7377] hover:bg-[#0d7377] hover:text-white"
          >
            Copy
          </button>
        </div>
      )}

      {/* Shared confirmation modal — used for BOTH choosing and swapping a role,
          so the user is sure before committing (and to avoid needless swaps). */}
      {confirm && (
        <ConfirmationModal
          open
          onOpenChange={(o) => {
            if (!o) setConfirm(null);
          }}
          title={confirm.kind === "swap" ? "Swap roles?" : "Confirm your role"}
          description={
            confirm.kind === "swap"
              ? `You'll become the ${confirm.role} and your spouse the ${opposite(
                  confirm.role
                )}. Documents and answers you've already saved were sorted by the current roles — they are NOT moved automatically, so please review them after swapping.`
              : `You'll be the ${confirm.role} and your spouse will automatically be the ${opposite(
                  confirm.role
                )}. You can change this later, but any saved info would then need review — so make sure this is correct now.`
          }
          confirmText={confirm.kind === "swap" ? "Yes, swap" : `Yes, I'm the ${confirm.role}`}
          confirmVariant={confirm.kind === "swap" ? "danger" : "primary"}
          loading={busy}
          onConfirm={() => assignRole(confirm.role)}
        />
      )}
    </div>
  );
}
