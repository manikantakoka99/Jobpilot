/**
 * Hand-written types describing the Supabase database schema.
 *
 * If you regenerate types from your live project with the Supabase CLI
 * (`supabase gen types typescript`), you can replace this file with the
 * generated output — the shape below is kept compatible with that format.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string;
          avatar_url: string | null;
          phone: string | null;
          location: string | null;
          linkedin_url: string | null;
          github_url: string | null;
          portfolio_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email: string;
          avatar_url?: string | null;
          phone?: string | null;
          location?: string | null;
          linkedin_url?: string | null;
          github_url?: string | null;
          portfolio_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string;
          avatar_url?: string | null;
          phone?: string | null;
          location?: string | null;
          linkedin_url?: string | null;
          github_url?: string | null;
          portfolio_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      resumes: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          file_path: string;
          file_type: "pdf" | "docx";
          file_size: number;
          extracted_text: string | null;
          text_extraction_status: "pending" | "success" | "no_text_layer" | "password_protected" | "failed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_name: string;
          file_path: string;
          file_type: "pdf" | "docx";
          file_size: number;
          extracted_text?: string | null;
          text_extraction_status?: "pending" | "success" | "no_text_layer" | "password_protected" | "failed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_name?: string;
          file_path?: string;
          file_type?: "pdf" | "docx";
          file_size?: number;
          extracted_text?: string | null;
          text_extraction_status?: "pending" | "success" | "no_text_layer" | "password_protected" | "failed";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "resumes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      job_analyses: {
        Row: {
          id: string;
          user_id: string;
          resume_id: string;
          job_title: string | null;
          job_description: string;
          ats_score: number;
          keyword_match_percentage: number;
          matched_keywords: Json;
          missing_keywords: Json;
          skills_found: Json;
          skills_missing: Json;
          structure_issues: Json;
          formatting_issues: Json;
          recommendations: Json;
          score_breakdown: Json;
          details: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resume_id: string;
          job_title?: string | null;
          job_description: string;
          ats_score: number;
          keyword_match_percentage: number;
          matched_keywords?: Json;
          missing_keywords?: Json;
          skills_found?: Json;
          skills_missing?: Json;
          structure_issues?: Json;
          formatting_issues?: Json;
          recommendations?: Json;
          score_breakdown?: Json;
          details?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          resume_id?: string;
          job_title?: string | null;
          job_description?: string;
          ats_score?: number;
          keyword_match_percentage?: number;
          matched_keywords?: Json;
          missing_keywords?: Json;
          skills_found?: Json;
          skills_missing?: Json;
          structure_issues?: Json;
          formatting_issues?: Json;
          recommendations?: Json;
          score_breakdown?: Json;
          details?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "job_analyses_resume_id_fkey";
            columns: ["resume_id"];
            isOneToOne: false;
            referencedRelation: "resumes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "job_analyses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type ResumeRow = Database["public"]["Tables"]["resumes"]["Row"];
export type ResumeInsert = Database["public"]["Tables"]["resumes"]["Insert"];
export type ResumeUpdate = Database["public"]["Tables"]["resumes"]["Update"];

export type JobAnalysisRow = Database["public"]["Tables"]["job_analyses"]["Row"];
export type JobAnalysisInsert = Database["public"]["Tables"]["job_analyses"]["Insert"];
export type JobAnalysisUpdate = Database["public"]["Tables"]["job_analyses"]["Update"];
