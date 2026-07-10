"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUserRole } from "@/lib/auth/roles";
const transitions: Record<string, string[]> = { OPEN: ["IN_REVIEW","WAITING_FOR_CUSTOMER","RESOLVED","CLOSED"], IN_REVIEW: ["WAITING_FOR_CUSTOMER","RESOLVED","CLOSED"], WAITING_FOR_CUSTOMER: ["IN_REVIEW","RESOLVED","CLOSED"], RESOLVED: ["CLOSED"], CLOSED: [] };
export async function adminUpdateSupportTicketStatus(input: { ticketId: string; nextStatus: string }) {
 if (!input || typeof input.ticketId !== "string" || typeof input.nextStatus !== "string") return {ok:false,code:"VALIDATION_FAILED" as const};
 if (await getCurrentUserRole() !== "ADMIN") return {ok:false,code:"FORBIDDEN" as const};
 const db=await createClient(); const {data:current}=await db.from("support_tickets").select("id,status").eq("id",input.ticketId).maybeSingle();
 if (!current || !transitions[current.status]?.includes(input.nextStatus)) return {ok:false,code:"INVALID_TRANSITION" as const};
 const {error}=await supabaseAdmin.from("support_tickets").update({status:input.nextStatus}).eq("id",input.ticketId).eq("status",current.status); if(error)return {ok:false,code:"DB_ERROR" as const};
 revalidatePath("/admin/support"); revalidatePath("/admin/support/"+input.ticketId); return {ok:true as const};
}
export async function adminAddSupportReply(input: { ticketId: string; message: string }) {
 if (!input || typeof input.ticketId !== "string" || typeof input.message !== "string" || !input.message.trim() || input.message.length>4000)return {ok:false,code:"VALIDATION_FAILED" as const};
 if (await getCurrentUserRole() !== "ADMIN")return {ok:false,code:"FORBIDDEN" as const};
 const db=await createClient(); const {data:ticket}=await db.from("support_tickets").select("id,status").eq("id",input.ticketId).maybeSingle(); const user=(await db.auth.getUser()).data.user;
 if(!ticket||!user||ticket.status==="CLOSED")return {ok:false,code:"NOT_ALLOWED" as const};
 const {error}=await supabaseAdmin.from("support_ticket_messages").insert({ticket_id:ticket.id,sender_id:user.id,sender_role:"ADMIN",message:input.message.trim()}); if(error)return {ok:false,code:"DB_ERROR" as const};
 revalidatePath("/admin/support/"+input.ticketId); return {ok:true as const};
}
