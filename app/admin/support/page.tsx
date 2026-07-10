/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { requireRole } from "@/lib/auth/roles";
import { getAdminSupportTickets } from "@/lib/support/read-admin-support-tickets";
export default async function AdminSupportPage(){await requireRole(["ADMIN"],"/admin/support");const result=await getAdminSupportTickets();return <main className="mx-auto max-w-6xl space-y-6 p-8"><h1 className="font-display text-3xl uppercase">Support operations</h1><p className="text-silver">Admin-only buyer support queue. Replies are buyer-visible; no internal-note channel exists.</p>{!result.backendReady?<p>Support database is not connected.</p>:result.tickets.length===0?<p>No support tickets.</p>:<div className="space-y-3">{result.tickets.map((t:any)=><Link className="block rounded-xl border border-white/10 p-4" href={"/admin/support/"+t.id} key={t.id}><div className="flex justify-between"><span>{t.subject}</span><span>{t.status}</span></div><p className="text-sm text-silver">{t.category} · {t.priority} · {new Date(t.created_at).toLocaleString()}</p></Link>)}</div>}</main>;}

