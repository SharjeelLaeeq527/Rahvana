import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
    req: Request,
    context: { params: Promise<{ portalType: string }> }
  ) {
    try {
      const supabase = await createClient();
  
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
  
      if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const { portalType } = await context.params;
  
      if (!portalType) {
        return NextResponse.json(
          { error: "portalType is required" },
          { status: 400 }
        );
      }
  
      // First fetch credential to get ID
      const { data: credential, error: fetchError } = await supabase
        .from("portal_wallet_credentials")
        .select("id")
        .eq("user_id", user.id)
        .eq("portal_type", portalType)
        .single();
  
      if (fetchError || !credential) {
        return NextResponse.json(
          { error: "Credential not found" },
          { status: 404 }
        );
      }
  
      // Delete security questions first
      const { error: questionDeleteError } = await supabase
        .from("portal_wallet_security_questions")
        .delete()
        .eq("credential_id", credential.id);
  
      if (questionDeleteError) {
        console.error("Error deleting questions:", questionDeleteError);
      }
  
      // Delete credential
      const { error: deleteError } = await supabase
        .from("portal_wallet_credentials")
        .delete()
        .eq("id", credential.id);
  
      if (deleteError) {
        console.error("Error deleting credential:", deleteError);
  
        return NextResponse.json(
          { error: "Failed to delete credential" },
          { status: 500 }
        );
      }
  
      return NextResponse.json({
        success: true,
        message: "Credential deleted successfully",
      });
    } catch (error) {
      console.error("Unexpected error deleting credential:", error);
  
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }