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
      resume_versions: {
        Row: {
          id: string;
          resume_id: string;
          user_id: string;
          version_number: number;
          version_name: string | null;
          source_version_id: string | null;
          target_job_title: string | null;
          target_company: string | null;
          job_description: string;
          content: string;
          change_summary: Json;
          ats_score_original: number | null;
          ats_score_optimized: number | null;
          ats_score_delta: number | null;
          remaining_missing_keywords: Json;
          remaining_issues: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          resume_id: string;
          user_id: string;
          version_number: number;
          version_name?: string | null;
          source_version_id?: string | null;
          target_job_title?: string | null;
          target_company?: string | null;
          job_description: string;
          content: string;
          change_summary?: Json;
          ats_score_original?: number | null;
          ats_score_optimized?: number | null;
          ats_score_delta?: number | null;
          remaining_missing_keywords?: Json;
          remaining_issues?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          resume_id?: string;
          user_id?: string;
          version_number?: number;
          version_name?: string | null;
          source_version_id?: string | null;
          target_job_title?: string | null;
          target_company?: string | null;
          job_description?: string;
          content?: string;
          change_summary?: Json;
          ats_score_original?: number | null;
          ats_score_optimized?: number | null;
          ats_score_delta?: number | null;
          remaining_missing_keywords?: Json;
          remaining_issues?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "resume_versions_resume_id_fkey";
            columns: ["resume_id"];
            isOneToOne: false;
            referencedRelation: "resumes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "resume_versions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "resume_versions_source_version_id_fkey";
            columns: ["source_version_id"];
            isOneToOne: false;
            referencedRelation: "resume_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      cover_letters: {
        Row: {
          id: string;
          user_id: string;
          resume_id: string;
          resume_version_id: string | null;
          job_title: string;
          company: string | null;
          job_description: string;
          tone: "professional" | "concise" | "confident" | "friendly";
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resume_id: string;
          resume_version_id?: string | null;
          job_title: string;
          company?: string | null;
          job_description: string;
          tone?: "professional" | "concise" | "confident" | "friendly";
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          resume_id?: string;
          resume_version_id?: string | null;
          job_title?: string;
          company?: string | null;
          job_description?: string;
          tone?: "professional" | "concise" | "confident" | "friendly";
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cover_letters_resume_id_fkey";
            columns: ["resume_id"];
            isOneToOne: false;
            referencedRelation: "resumes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cover_letters_resume_version_id_fkey";
            columns: ["resume_version_id"];
            isOneToOne: false;
            referencedRelation: "resume_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cover_letters_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      jobs: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          company: string;
          url: string | null;
          location: string | null;
          description: string | null;
          salary: string | null;
          source: string;
          saved_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          company: string;
          url?: string | null;
          location?: string | null;
          description?: string | null;
          salary?: string | null;
          source?: string;
          saved_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          company?: string;
          url?: string | null;
          location?: string | null;
          description?: string | null;
          salary?: string | null;
          source?: string;
          saved_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "jobs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          job_id: string | null;
          job_title: string;
          company: string;
          job_url: string | null;
          location: string | null;
          salary: string | null;
          status: ApplicationStatus;
          source: string;
          resume_id: string | null;
          resume_version_id: string | null;
          cover_letter_id: string | null;
          notes: string | null;
          applied_at: string | null;
          follow_up_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_id?: string | null;
          job_title: string;
          company: string;
          job_url?: string | null;
          location?: string | null;
          salary?: string | null;
          status?: ApplicationStatus;
          source?: string;
          resume_id?: string | null;
          resume_version_id?: string | null;
          cover_letter_id?: string | null;
          notes?: string | null;
          applied_at?: string | null;
          follow_up_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_id?: string | null;
          job_title?: string;
          company?: string;
          job_url?: string | null;
          location?: string | null;
          salary?: string | null;
          status?: ApplicationStatus;
          source?: string;
          resume_id?: string | null;
          resume_version_id?: string | null;
          cover_letter_id?: string | null;
          notes?: string | null;
          applied_at?: string | null;
          follow_up_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "applications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_resume_id_fkey";
            columns: ["resume_id"];
            isOneToOne: false;
            referencedRelation: "resumes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_resume_version_id_fkey";
            columns: ["resume_version_id"];
            isOneToOne: false;
            referencedRelation: "resume_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_cover_letter_id_fkey";
            columns: ["cover_letter_id"];
            isOneToOne: false;
            referencedRelation: "cover_letters";
            referencedColumns: ["id"];
          },
        ];
      };
      extension_tokens: {
        Row: {
          id: string;
          user_id: string;
          token_hash: string;
          label: string;
          created_at: string;
          last_used_at: string | null;
          expires_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          token_hash: string;
          label?: string;
          created_at?: string;
          last_used_at?: string | null;
          expires_at: string;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          token_hash?: string;
          label?: string;
          created_at?: string;
          last_used_at?: string | null;
          expires_at?: string;
          revoked_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "extension_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      interview_sessions: {
        Row: {
          id: string;
          user_id: string;
          resume_id: string | null;
          resume_version_id: string | null;
          job_id: string | null;
          job_title: string;
          company: string | null;
          job_description: string;
          resume_snapshot: string;
          detected_skills: Json;
          mode: "behavioral" | "technical" | "mixed";
          status: "in_progress" | "completed";
          total_questions: number;
          overall_score: number | null;
          strengths: Json;
          weaknesses: Json;
          improvement_suggestions: Json;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          resume_id?: string | null;
          resume_version_id?: string | null;
          job_id?: string | null;
          job_title: string;
          company?: string | null;
          job_description?: string;
          resume_snapshot?: string;
          detected_skills?: Json;
          mode: "behavioral" | "technical" | "mixed";
          status?: "in_progress" | "completed";
          total_questions?: number;
          overall_score?: number | null;
          strengths?: Json;
          weaknesses?: Json;
          improvement_suggestions?: Json;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          resume_id?: string | null;
          resume_version_id?: string | null;
          job_id?: string | null;
          job_title?: string;
          company?: string | null;
          job_description?: string;
          resume_snapshot?: string;
          detected_skills?: Json;
          mode?: "behavioral" | "technical" | "mixed";
          status?: "in_progress" | "completed";
          total_questions?: number;
          overall_score?: number | null;
          strengths?: Json;
          weaknesses?: Json;
          improvement_suggestions?: Json;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "interview_sessions_resume_id_fkey";
            columns: ["resume_id"];
            isOneToOne: false;
            referencedRelation: "resumes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interview_sessions_resume_version_id_fkey";
            columns: ["resume_version_id"];
            isOneToOne: false;
            referencedRelation: "resume_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interview_sessions_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interview_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      interview_questions: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          question_number: number;
          category: "behavioral" | "technical";
          question_text: string;
          grounded_in: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          question_number: number;
          category: "behavioral" | "technical";
          question_text: string;
          grounded_in?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          question_number?: number;
          category?: "behavioral" | "technical";
          question_text?: string;
          grounded_in?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "interview_questions_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "interview_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interview_questions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      interview_answers: {
        Row: {
          id: string;
          question_id: string;
          session_id: string;
          user_id: string;
          answer_text: string;
          score: number | null;
          feedback: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          session_id: string;
          user_id: string;
          answer_text: string;
          score?: number | null;
          feedback?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          session_id?: string;
          user_id?: string;
          answer_text?: string;
          score?: number | null;
          feedback?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "interview_answers_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: true;
            referencedRelation: "interview_questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interview_answers_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "interview_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interview_answers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      career_assistant_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "career_assistant_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      career_assistant_messages: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          role?: "user" | "assistant";
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "career_assistant_messages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "career_assistant_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "career_assistant_messages_user_id_fkey";
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

export type ApplicationStatus =
  | "Saved"
  | "Preparing"
  | "Applied"
  | "Screening"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Withdrawn";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type ResumeRow = Database["public"]["Tables"]["resumes"]["Row"];
export type ResumeInsert = Database["public"]["Tables"]["resumes"]["Insert"];
export type ResumeUpdate = Database["public"]["Tables"]["resumes"]["Update"];

export type JobAnalysisRow = Database["public"]["Tables"]["job_analyses"]["Row"];
export type JobAnalysisInsert = Database["public"]["Tables"]["job_analyses"]["Insert"];
export type JobAnalysisUpdate = Database["public"]["Tables"]["job_analyses"]["Update"];

export type ResumeVersionRow = Database["public"]["Tables"]["resume_versions"]["Row"];
export type ResumeVersionInsert = Database["public"]["Tables"]["resume_versions"]["Insert"];
export type ResumeVersionUpdate = Database["public"]["Tables"]["resume_versions"]["Update"];

export type CoverLetterRow = Database["public"]["Tables"]["cover_letters"]["Row"];
export type CoverLetterInsert = Database["public"]["Tables"]["cover_letters"]["Insert"];
export type CoverLetterUpdate = Database["public"]["Tables"]["cover_letters"]["Update"];

export type JobRow = Database["public"]["Tables"]["jobs"]["Row"];
export type JobInsert = Database["public"]["Tables"]["jobs"]["Insert"];
export type JobUpdate = Database["public"]["Tables"]["jobs"]["Update"];

export type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];
export type ApplicationInsert = Database["public"]["Tables"]["applications"]["Insert"];
export type ApplicationUpdate = Database["public"]["Tables"]["applications"]["Update"];

export type ExtensionTokenRow = Database["public"]["Tables"]["extension_tokens"]["Row"];
export type ExtensionTokenInsert = Database["public"]["Tables"]["extension_tokens"]["Insert"];

export type InterviewSessionRow = Database["public"]["Tables"]["interview_sessions"]["Row"];
export type InterviewSessionInsert = Database["public"]["Tables"]["interview_sessions"]["Insert"];
export type InterviewSessionUpdate = Database["public"]["Tables"]["interview_sessions"]["Update"];

export type InterviewQuestionRow = Database["public"]["Tables"]["interview_questions"]["Row"];
export type InterviewQuestionInsert = Database["public"]["Tables"]["interview_questions"]["Insert"];

export type InterviewAnswerRow = Database["public"]["Tables"]["interview_answers"]["Row"];
export type InterviewAnswerInsert = Database["public"]["Tables"]["interview_answers"]["Insert"];
export type InterviewAnswerUpdate = Database["public"]["Tables"]["interview_answers"]["Update"];

export type CareerAssistantSessionRow = Database["public"]["Tables"]["career_assistant_sessions"]["Row"];
export type CareerAssistantSessionInsert = Database["public"]["Tables"]["career_assistant_sessions"]["Insert"];
export type CareerAssistantSessionUpdate = Database["public"]["Tables"]["career_assistant_sessions"]["Update"];

export type CareerAssistantMessageRow = Database["public"]["Tables"]["career_assistant_messages"]["Row"];
export type CareerAssistantMessageInsert = Database["public"]["Tables"]["career_assistant_messages"]["Insert"];
